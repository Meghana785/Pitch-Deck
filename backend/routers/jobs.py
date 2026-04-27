"""
Jobs router for PitchReady.

Provides synchronous status checks and real-time Server-Sent Events (SSE)
progress streaming for LangGraph analysis jobs.
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Any, AsyncGenerator

from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel



logger = logging.getLogger(__name__)

router = APIRouter(prefix="/jobs", tags=["jobs"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class JobStatusResponse(BaseModel):
    """Response payload for GET /jobs/{run_id}/status."""
    run_id: uuid.UUID
    status: str
    created_at: Any
    completed_at: Any | None = None
    error_message: str | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _verify_ownership(db: AsyncIOMotorDatabase, run_id: uuid.UUID, user_id: uuid.UUID) -> dict[str, Any]:
    """
    Verify that the run exists and belongs to the authenticated user.
    Returns the run document if valid.
    """
    run_doc = await db.analysis_runs.find_one(
        {"_id": str(run_id)},
        {"_id": 1, "user_id": 1, "status": 1, "created_at": 1, "completed_at": 1, "error_message": 1}
    )

    if not run_doc or run_doc["user_id"] != str(user_id):
        raise HTTPException(
            status_code=404, detail="Analysis run not found or access denied."
        )

    # Convert _id to id for compatibility with the rest of the router if needed,
    # though we mainly use the keys in the dict.
    run_doc["id"] = run_doc["_id"]
    return run_doc


def _format_sse(event_name: str | None, data: dict[str, Any] | str) -> str:
    """Format an SSE message."""
    payload = data if isinstance(data, str) else json.dumps(data)
    if event_name:
        return f"event: {event_name}\ndata: {payload}\n\n"
    return f"data: {payload}\n\n"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/{run_id}/status", response_model=JobStatusResponse)
async def get_status(request: Request, run_id: uuid.UUID) -> Any:
    """
    Synchronous fallback to fetch the current run status from the database.
    """
    user_state = getattr(request.state, "user", None)
    if not user_state:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        user_uuid = uuid.UUID(user_state["user_id"])
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID format in token")

    db = request.app.state.db

    # Verify ownership (raises 404 if invalid)
    row = await _verify_ownership(db, run_id, user_uuid)

    return {
        "run_id": row["id"],
        "status": row["status"],
        "created_at": row["created_at"],
        "completed_at": row["completed_at"],
        "error_message": row["error_message"],
    }


@router.get("/{run_id}/stream")
async def stream_progress(request: Request, run_id: uuid.UUID) -> StreamingResponse:
    """
    Server-Sent Events (SSE) endpoint for real-time analysis progress.

    Streams updates from Upstash Redis until the job completes, fails, or times out.
    """
    # 1. Auth check
    user_state = getattr(request.state, "user", None)
    if not user_state:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        user_uuid = uuid.UUID(user_state["user_id"])
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID format in token")

    db = request.app.state.db

    # Verify ownership up front
    row = await _verify_ownership(db, run_id, user_uuid)
    initial_status = row["status"]

    async def event_generator() -> AsyncGenerator[str, None]:
        # 2. Polling loop setup
        poll_interval = 0.5
        keepalive_interval = 15.0
        timeout_total = 600.0  # 10 minutes for AI processing

        last_emitted_event_id: str | None = None
        time_elapsed: float = 0.0
        time_since_keepalive: float = 0.0

        try:
            while time_elapsed < timeout_total:
                # Disconnect check
                if await request.is_disconnected():
                    logger.info("Client disconnected from SSE stream for run %s", run_id)
                    break

                # Read current run state from MongoDB
                current_run = await db.analysis_runs.find_one(
                    {"_id": str(run_id)},
                    {"status": 1, "last_event": 1, "error_message": 1}
                )

                if not current_run:
                    yield _format_sse(None, {"event": "failed", "message": "Run not found during streaming"})
                    break

                current_event = current_run.get("last_event")
                
                # We use the JSON string of the event to detect changes (since we don't have a specific event_id)
                current_event_json = json.dumps(current_event) if current_event else None
                
                if current_event and current_event_json != last_emitted_event_id:
                    last_emitted_event_id = current_event_json
                    yield _format_sse(None, current_event)

                    # Terminal states
                    if current_event.get("event") in ("done", "failed"):
                        return

                # Check status as a fallback
                if current_run["status"] == "failed" and (not current_event or current_event.get("event") != "failed"):
                    yield _format_sse(None, {"event": "failed", "message": current_run.get("error_message") or "Job failed"})
                    return

                # Keepalive logic
                if time_since_keepalive >= keepalive_interval:
                    yield ": keepalive\n\n"
                    time_since_keepalive = 0.0

                # Wait for next tick
                await asyncio.sleep(poll_interval)
                time_elapsed += poll_interval
                time_since_keepalive += poll_interval

            # Timed out
            if time_elapsed >= timeout_total:
                yield _format_sse(None, {"event": "timeout", "message": "Stream timed out"})

        except asyncio.CancelledError:
            logger.info("SSE stream cancelled for run %s", run_id)
            raise
        except GeneratorExit:
            logger.info("SSE generator exited for run %s", run_id)
        except Exception as exc:
            logger.error("SSE stream error for run %s: %s", run_id, exc)
            yield _format_sse(None, {"event": "failed", "message": "Internal stream error"})

    # Return StreamingResponse with SSE headers
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
