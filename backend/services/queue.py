"""
Queue service for PitchReady using Upstash Redis.

Provides functions to enqueue jobs, get job status from PostgreSQL,
and update job progress via Redis SSE-cache.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict

import asyncpg
from upstash_redis.asyncio import Redis

logger = logging.getLogger(__name__)


def get_redis_client() -> Redis:
    """
    Returns a configured Upstash Redis client.
    Requires UPSTASH_REDIS_URL and UPSTASH_REDIS_REST_TOKEN environment variables.
    """
    # Note: Upstash python SDK reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN by default via Redis.from_env(),
    # but PitchReady specs mention UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN.
    url = os.environ.get("UPSTASH_REDIS_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")
    token = os.environ.get("UPSTASH_REDIS_TOKEN") or os.environ.get("UPSTASH_REDIS_REST_TOKEN")

    if not url or not token:
        raise ValueError("Upstash Redis credentials are not configured in the environment.")

    return Redis(url=url, token=token)


async def enqueue_job(job: Dict[str, Any]) -> str:
    """
    Serializes a job payload to JSON and pushes it to the 'pitchready:jobs' list.

    Args:
        job: Dictionary matching the job payload schema.

    Returns:
        The job_id (str) associated with the enqueued job.
    """
    client = get_redis_client()
    job_id = str(job["job_id"])
    job_json = json.dumps(job)

    try:
        await client.lpush("pitchready:jobs", job_json)
        logger.info("Enqueued job %s for run %s", job_id, job.get("run_id"))
    except Exception as exc:
        logger.error("Failed to enqueue job: %s", exc)
        raise RuntimeError("Could not push job to Redis") from exc

    return job_id


async def get_job_status(run_id: str, pool: asyncpg.Pool) -> Dict[str, Any]:
    """
    Queries the PostgreSQL analysis_runs table for the run status.

    Args:
        run_id: The UUID string of the analysis run.
        pool: asyncpg connection pool.

    Returns:
        A dict containing run_id, status, created_at, completed_at, and error_message.
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id AS run_id, status, created_at, completed_at, error_message
              FROM analysis_runs
             WHERE id = $1
            """,
            run_id,
        )

    if not row:
        raise ValueError(f"Run {run_id} not found")

    return dict(row)


async def update_job_progress(run_id: str, event: str, data: Dict[str, Any], pool: asyncpg.Pool) -> None:
    """
    Updates the analysis_runs status and stores the latest progress event in Redis.

    - The database is updated directly with the provided 'event' string (if it represents a valid status).
    - Redis caches the latest event under key "pitchready:progress:{run_id}" with a 1-hour TTL.

    Args:
        run_id: The UUID string of the analysis run.
        event: The name of the progress event (e.g., 'extracting', 'done', 'failed').
        data: Additional dictionary data about the event.
        pool: asyncpg connection pool.
    """
    # Valid core DB statuses: 'queued', 'running', 'done', 'failed'
    # We map 'event' roughly to 'status' if we intend to write it to DB
    # or just keep it simple and update DB if the event maps to a main state.
    db_status_map = {
        "queued": "queued",
        "running": "running",
        "extracting": "running",
        "mapping": "running",
        "interrogating": "running",
        "synthesizing": "running",
        "done": "done",
        "failed": "failed",
    }
    
    status = db_status_map.get(event, "running")

    # Update database status (completed_at is handled by update_run_status wrapper or trigger usually,
    # but here we just execute an update directly handling status)
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE analysis_runs
               SET status = $2,
                   completed_at = CASE WHEN $2 IN ('done', 'failed') THEN NOW() ELSE completed_at END
             WHERE id = $1
            """,
            run_id,
            status,
        )

    # Cache progress in Redis, 3600 second TTL
    client = get_redis_client()
    redis_key = f"pitchready:progress:{run_id}"
    payload = {
        "event": event,
        "data": data,
        "run_id": run_id
    }
    await client.setex(name=redis_key, time=3600, value=json.dumps(payload))
    logger.debug("Updated job progress for run %s: %s", run_id, event)
