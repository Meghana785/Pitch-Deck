"""
Upload router for PitchReady.

Accepts file uploads as multipart/form-data and streams them directly to R2
server-side, avoiding any CORS issues with direct browser-to-R2 uploads.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from db.models import create_run
from services.r2 import ALLOWED_CONTENT_TYPES, upload_file_to_r2

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["upload"])


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/file")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    vertical: str = Form(default="auto"),
) -> Any:
    """
    Accept a pitch file upload and proxy it directly to R2.

    The file is received as multipart/form-data, validated, streamed to R2
    server-side (no CORS issues), and a new analysis_run is provisioned.
    Returns object_key and run_id for the subsequent /analyze call.
    """
    # 1. Auth check
    user_state = getattr(request.state, "user", None)
    if not user_state:
        raise HTTPException(status_code=401, detail="Authentication required")

    user_id_str: str = user_state["user_id"]

    # 2. Validate content type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: PDF, PPTX"
        )

    expected_ext = ALLOWED_CONTENT_TYPES[content_type]
    filename = file.filename or "upload"
    if not filename.lower().endswith(expected_ext):
        raise HTTPException(
            status_code=400,
            detail=f"File must be a {expected_ext.upper()} for type {content_type}"
        )

    # 3. Generate IDs
    run_id = uuid.uuid4()
    object_key = f"uploads/{user_id_str}/{run_id}_{filename}"
    db = request.app.state.db

    # 4. Read file bytes and upload to R2
    try:
        file_bytes = await file.read()
        upload_file_to_r2(
            file_bytes=file_bytes,
            object_key=object_key,
            content_type=content_type,
        )
    except Exception as exc:
        logger.error("R2 upload failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"File upload to storage failed: {exc}")

    # 5. Provision analysis run in DB
    try:
        await create_run(
            db=db,
            user_id=user_id_str,
            vertical=vertical,
            storage_object_key=object_key,
            run_id=run_id,
        )
    except Exception as exc:
        logger.error("DB create_run failed: %s", exc)
        raise HTTPException(status_code=500, detail="Database insertion failed")

    logger.info("Uploaded %s → R2 key %s (run %s)", filename, object_key, run_id)

    return {
        "object_key": object_key,
        "run_id": str(run_id),
    }
