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
from services.queue import enqueue_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analyze", tags=["analyze"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    """Payload for POST /analyze."""
    object_key: str = Field(
        ...,
        description="The DigitalOcean Spaces key containing the pitch (must begin with 'uploads/')."
    )
    vertical: str = Field(
        ...,
        description="The vertical template to use (must be e.g. 'logistics_saas')."
    )

    model_config = ConfigDict(extra="forbid")


class AnalyzeResponse(BaseModel):
    """Response payload for POST /analyze."""
    job_id: uuid.UUID
    run_id: uuid.UUID
    status: str


# ---------------------------------------------------------------------------
# Allowed configurations
# ---------------------------------------------------------------------------

# Future: load these from DB or configuration mapping
ALLOWED_VERTICALS = {"logistics_saas"}


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
    - Enqueues the job payload to Redis.
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
    
    # 3. Input validation - Vertical
    if payload.vertical not in ALLOWED_VERTICALS:
        raise HTTPException(
            status_code=400,
            detail=f"Vertical '{payload.vertical}' is not supported. Allowed: {list(ALLOWED_VERTICALS)}"
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

    pool: asyncpg.Pool = request.app.state.pool

    # 5. Verify the analysis_run exists and is owned by the user
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id FROM analysis_runs 
             WHERE id = $1 AND user_id = $2
            """,
            run_uuid,
            user_uuid,
        )
        if not row:
            raise HTTPException(
                status_code=404,
                detail="Analysis run not found or does not belong to the user"
            )

        # 6. Update user usage count (runs_used) and run status transactionally
        async with conn.transaction():
            await conn.execute(
                """
                UPDATE analysis_runs 
                   SET status = 'queued' 
                 WHERE id = $1
                """,
                run_uuid
            )

            await conn.execute(
                """
                UPDATE users 
                   SET runs_used = runs_used + 1 
                 WHERE id = $1
                """,
                user_uuid
            )

    # 7. Build Job Payload
    job_uuid = uuid.uuid4()
    job_payload = {
        "job_id": str(job_uuid),
        "run_id": str(run_uuid),
        "user_id": str(user_uuid),
        "object_key": payload.object_key,
        "vertical": payload.vertical,
        "enqueued_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    # 8. Dispatch to queue
    try:
        await enqueue_job(job_payload)
    except Exception as exc:
        logger.error("Failed to dispatcher job %s: %s", job_uuid, exc)
        raise HTTPException(status_code=500, detail="Failed to enqueue analysis job")

    # 9. Return Response
    return {
        "job_id": job_uuid,
        "run_id": run_uuid,
        "status": "queued"
    }
