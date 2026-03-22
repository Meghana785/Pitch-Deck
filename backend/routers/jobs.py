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

import asyncpg
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from upstash_redis.asyncio import Redis

from services.queue import get_job_status, get_redis_client

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

async def _verify_ownership(pool: asyncpg.Pool, run_id: uuid.UUID, user_id: uuid.UUID) -> dict[str, Any]:
    """
    Verify that the run exists and belongs to the authenticated user.
    Returns the run row if valid.
    Raises 404 if not found or not owned by user.
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, user_id, status, created_at, completed_at, error_message
              FROM analysis_runs
             WHERE id = $1
            """,
            run_id,
        )

    if not row or row["user_id"] != user_id:
        raise HTTPException(
            status_code=404, detail="Analysis run not found or access denied."
        )

    return dict(row)


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

    pool: asyncpg.Pool = request.app.state.pool

    # Verify ownership (raises 404 if invalid)
    row = await _verify_ownership(pool, run_id, user_uuid)

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

    pool: asyncpg.Pool = request.app.state.pool

    # Verify ownership up front
    row = await _verify_ownership(pool, run_id, user_uuid)
    initial_status = row["status"]

    async def event_generator() -> AsyncGenerator[str, None]:
        redis: Redis = get_redis_client()
        redis_key = f"pitchready:progress:{run_id}"

        # 2. Check current status from DB
        # If already done/failed, we just emit the final state and close
        if initial_status == "done":
            # Attempt to fetch the last progress event so we can return the report_id
            last_raw = await redis.get(redis_key)
            report_id = None
            if last_raw:
                try:
                    last_event = json.loads(last_raw)
                    if last_event.get("event") == "done":
                        report_id = last_event.get("report_id")
                except json.JSONDecodeError:
                    pass
            
            yield _format_sse(None, {"event": "done", "report_id": report_id})
            return

        if initial_status == "failed":
            yield _format_sse(None, {"event": "failed", "message": row["error_message"] or "Job failed"})
            return

        # 3. Polling loop setup
        # If queued or running, we poll Redis every 500ms
        poll_interval = 0.5
        keepalive_interval = 15.0
        timeout_total = 300.0  # 5 minutes

        last_emitted_event_raw: str | None = None
        time_elapsed: float = 0.0
        time_since_keepalive: float = 0.0

        try:
            while time_elapsed < timeout_total:
                # Disconnect check
                if await request.is_disconnected():
                    logger.info("Client disconnected from SSE stream for run %s", run_id)
                    break

                # Read from Redis
                current_raw = await redis.get(redis_key)
                
                # If changed, emit and update tracked state
                if current_raw and current_raw != last_emitted_event_raw:
                    last_emitted_event_raw = current_raw
                    try:
                        current_event_dict = json.loads(current_raw)
                        # The client expects data to be the whole JSON object containing the 'event' key
                        yield _format_sse(None, current_event_dict)

                        # 4/5. Terminal states from Redis
                        event_type = current_event_dict.get("event")
                        if event_type in ("done", "failed"):
                            return  # close stream cleanly
                    except json.JSONDecodeError:
                        logger.warning("Malformed JSON in Redis for run %s", run_id)

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
            # 6. Graceful cleanup on client disconnect
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
