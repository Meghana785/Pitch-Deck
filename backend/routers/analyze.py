"""
Analyze router for PitchReady.

Validates an uploaded pitch, deducts usage credits, creates a new queue job payload,
and dispatches it via Upstash Redis.
"""

from __future__ import annotations

import datetime
import logging
import uuid
from typing import Any

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from middleware.usage_guard import check_usage_limit


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["analyze"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    """Payload for POST /analyze."""
    object_key: str = Field(
        ...,
        description="The Cloudflare R2 key containing the pitch (must begin with 'uploads/')."
    )
    vertical: str = Field(
        default="auto",
        description="The vertical to analyze against. Pass 'auto' to let the AI detect it from the pitch content."
    )

    model_config = ConfigDict(extra="forbid")


class AnalyzeResponse(BaseModel):
    """Response payload for POST /analyze."""
    job_id: uuid.UUID
    run_id: uuid.UUID
    status: str


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("", response_model=AnalyzeResponse, dependencies=[Depends(check_usage_limit)])
async def start_analysis(request: Request, payload: AnalyzeRequest) -> Any:
    """
    Trigger the analysis pipeline for a newly uploaded pitch deck.

    - Requires authentication.
    - Requires usage_guard pass (free tier limits).
    - Validates formatting and ownership.
    - Deducts one 'runs_used' credit from the user.
    - Vertical is auto-detected by the AI worker if not provided.
    """
    # 1. Auth check
    user_state = getattr(request.state, "user", None)
    if not user_state:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id_str: str = user_state["user_id"]
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID format in token")

    # 2. Input validation - Prefix
    if not payload.object_key.startswith("uploads/"):
        raise HTTPException(
            status_code=400,
            detail="Invalid object_key format. Must begin with 'uploads/'"
        )

    # 4. Extract run_id from object_key
    # Format: uploads/{user_id}/{run_id}_{filename}
    parts = payload.object_key.split("/")
    if len(parts) < 3:
        raise HTTPException(status_code=400, detail="Malformed object_key path")
    
    filename_part = parts[2]
    run_id_str = filename_part.split("_")[0]

    try:
        run_uuid = uuid.UUID(run_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Could not parse run_id from object_key")

    db = request.app.state.db

    # 5. Fetch User Preferences and Verify Ownership
    user_doc = await db.users.find_one({"_id": str(user_uuid)})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    skeptic_level = user_doc.get("skeptic_level", "high")
    focus_area = user_doc.get("focus_area", "general")

    run_doc = await db.analysis_runs.find_one(
        {"_id": str(run_uuid), "user_id": str(user_uuid)},
        {"_id": 1}
    )
    if not run_doc:
        raise HTTPException(
            status_code=404,
            detail="Analysis run not found or does not belong to the user"
        )

    # 6. Update user usage count (runs_used) and run status
    try:
        # Note: We can use a transaction here if needed, but sequential updates are usually fine for this context.
        await db.analysis_runs.update_one(
            {"_id": str(run_uuid)},
            {"$set": {
                "status": "queued",
                "skeptic_level": skeptic_level,
                "focus_area": focus_area
            }}
        )
        await db.users.update_one(
            {"_id": str(user_uuid)},
            {"$inc": {"runs_used": 1}}
        )
    except Exception as exc:
        logger.error("DB update failed for run %s: %s", run_uuid, exc)
        raise HTTPException(status_code=500, detail="Database update failed")

    # 7. Build Job Payload
    job_uuid = uuid.uuid4()
    job_payload = {
        "job_id": str(job_uuid),
        "run_id": str(run_uuid),
        "user_id": str(user_uuid),
        "object_key": payload.object_key,
        "vertical": payload.vertical,
        "skeptic_level": skeptic_level,
        "focus_area": focus_area,
        "enqueued_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    # 8. Dispatch to queue (Now handled by MongoDB polling)
    # The worker will pick up any job with status 'queued'
    logger.info("Job %s for run %s is now queued in MongoDB", job_uuid, run_uuid)

    # 9. Return Response
    return {
        "job_id": job_uuid,
        "run_id": run_uuid,
        "status": "queued"
    }
