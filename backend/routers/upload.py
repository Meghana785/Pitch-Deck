"""
Upload router for PitchReady.

Generates presigned URLs for direct-to-Spaces uploads and provisions
a new 'queued' analysis_run row in the database.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from db.models import create_run, create_user
from services.r2 import ALLOWED_CONTENT_TYPES, generate_presigned_put

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["upload"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class PresignRequest(BaseModel):
    """Request payload for POST /upload/presign."""
    filename: str = Field(..., max_length=200, description="Name of the file to upload.")
    content_type: str = Field(..., description="MIME type of the file.")
    vertical: str = Field(..., description="The pitch vertical (e.g. B2B SaaS).")

    model_config = ConfigDict(extra="forbid")


class PresignResponse(BaseModel):
    """Response payload for POST /upload/presign."""
    presigned_url: str
    object_key: str
    run_id: uuid.UUID
    expires_in: int


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/presign", response_model=PresignResponse)
async def generate_presign(request: Request, payload: PresignRequest) -> Any:
    """
    Generate a presigned URL for secure S3/Spaces direct upload.
    
    Validates file type against ALLOWED_CONTENT_TYPES and provisions a new
    analysis_runs database row with status 'queued'.
    """
    # 1. Auth check
    user_state = getattr(request.state, "user", None)
    if not user_state:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id_str: str = user_state["user_id"]

    # 2. Input validation
    if payload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid content_type. Allowed: {list(ALLOWED_CONTENT_TYPES.keys())}"
        )

    expected_ext = ALLOWED_CONTENT_TYPES[payload.content_type]
    if not payload.filename.lower().endswith(expected_ext):
        raise HTTPException(
            status_code=400,
            detail=f"Filename must end with {expected_ext} for content type {payload.content_type}"
        )

    # 3. Generate run provisioning parameters
    run_id = uuid.uuid4()
    expires_in = 900

    # 3. Ensure user exists in local DB and get their internal ID
    db = request.app.state.db
    try:
        # Sync user (upsert)
        db_user = await create_user(
            db=db,
            neon_user_id=user_id_str,
            email=user_state.get("email", "unknown@example.com")
        )
        internal_user_id = db_user["_id"]
    except Exception as exc:
        logger.error("User sync failed: %s", exc)
        raise HTTPException(status_code=500, detail="User synchronization failed")

    # 4. Generate run provisioning parameters
    run_id = uuid.uuid4()
    expires_in = 900

    # 5. Generate the presigned URL via R2 service using the internal_user_id
    try:
        r2_data = generate_presigned_put(
            user_id=internal_user_id,
            run_id=run_id,
            filename=payload.filename,
            content_type=payload.content_type,
            expires=expires_in,
        )
    except Exception as exc:
        logger.error("R2 presign generation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")

    # 6. Insert queued run into database using the internal_user_id
    try:
        await create_run(
            db=db,
            user_id=internal_user_id,
            vertical=payload.vertical,
            storage_object_key=r2_data["object_key"],
        )
    except Exception as exc:
        logger.error("DB create_run failed: %s", exc)
        raise HTTPException(status_code=500, detail="Database insertion failed")

    return {
        "presigned_url": r2_data["presigned_url"],
        "object_key": r2_data["object_key"],
        "run_id": run_id,
        "expires_in": expires_in,
    }
