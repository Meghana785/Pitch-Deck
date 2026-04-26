"""
PitchReady LangGraph Worker.

Polls Upstash Redis for jobs, downloads pitch files from DO Spaces,
extracts text, runs the 4-agent pipeline, and persists results to Neon Postgres.

Run directly:
    python worker.py
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
import traceback
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Any

import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from upstash_redis.asyncio import Redis

from pipeline.graph import pipeline
from pipeline.state import PipelineState
from services.extractor import extract_text
from services.r2 import download_file

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("pitchready.worker")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

QUEUE_KEY = "pitchready:jobs"
PROGRESS_KEY_PREFIX = "pitchready:progress:"
PROGRESS_TTL = 3600  # 1 hour

# Map LangGraph node names → agent numbers
_NODE_TO_AGENT: dict[str, int] = {
    "extractor":    1,
    "mapper":       2,
    "interrogator": 3,
    "synthesizer":  4,
}

# Claude Sonnet pricing (USD per 1 M tokens, as of Mar 2025)
_INPUT_PRICE_PER_M  = 3.0
_OUTPUT_PRICE_PER_M = 15.0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_redis() -> Redis:
    """Initialise Upstash Redis client from environment variables."""
    url   = os.environ.get("UPSTASH_REDIS_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")
    token = os.environ.get("UPSTASH_REDIS_TOKEN") or os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    if not url or not token:
        raise ValueError("Upstash Redis credentials missing (UPSTASH_REDIS_URL / UPSTASH_REDIS_TOKEN)")
    return Redis(url=url, token=token)


def _load_verticals() -> dict[str, str]:
    """
    Load all vertical KB markdown files from worker/verticals/ into memory.

    Returns a dict mapping vertical slug → file content.
    """
    verticals_dir = Path(__file__).parent / "verticals"
    kb: dict[str, str] = {}
    if verticals_dir.is_dir():
        for md_file in verticals_dir.glob("*.md"):
            slug = md_file.stem
            content = md_file.read_text(encoding="utf-8").strip()
            if content:
                kb[slug] = content
                logger.info("Loaded vertical KB: %s (%d chars)", slug, len(content))
    return kb


async def _publish_progress(
    redis: Redis, run_id: str, payload: dict[str, Any]
) -> None:
    """Store a progress event in Redis under the run's progress key (1 h TTL)."""
    key = f"{PROGRESS_KEY_PREFIX}{run_id}"
    await redis.setex(name=key, time=PROGRESS_TTL, value=json.dumps(payload))


async def _mark_failed(
    db: AsyncIOMotorDatabase,
    redis: Redis,
    run_id: str,
    error_message: str,
) -> None:
    """
    Set an analysis_run's status to 'failed' and publish a failed progress event.
    """
    try:
        now = datetime.datetime.now(datetime.timezone.utc)
        await db.analysis_runs.update_one(
            {"_id": run_id},
            {
                "$set": {
                    "status": "failed",
                    "error_message": error_message[:2000],
                    "completed_at": now
                }
            }
        )
    except Exception as db_exc:
        logger.error("Could not mark run %s failed in DB: %s", run_id, db_exc)

    await _publish_progress(
        redis, run_id, {"event": "failed", "message": error_message}
    )


# ---------------------------------------------------------------------------
# Job processor
# ---------------------------------------------------------------------------

async def _process_job(
    payload: dict[str, Any],
    db: AsyncIOMotorDatabase,
    redis: Redis,
) -> None:
    """
    Execute a single analysis job end-to-end:
    """
    run_id  = payload["run_id"]
    job_id  = payload["job_id"]
    user_id = payload["user_id"]
    vertical = payload["vertical"]
    object_key = payload["object_key"]

    logger.info("Processing job %s for run %s", job_id, run_id)

    # Mark running
    await db.analysis_runs.update_one(
        {"_id": run_id},
        {"$set": {"status": "running"}}
    )

    await _publish_progress(
        redis, run_id,
        {"event": "started", "agent": 0, "message": "Pipeline started"},
    )

    # ------------------------------------------------------------------
    # STEP A — Download file
    # ------------------------------------------------------------------
    try:
        file_bytes, filename = await download_file(object_key)
    except Exception as exc:
        logger.error("Job %s — download failed: %s", job_id, exc)
        await _mark_failed(db, redis, run_id, f"File download failed: {exc}")
        return

    # ------------------------------------------------------------------
    # STEP B — Extract text
    # ------------------------------------------------------------------
    try:
        extracted_text = extract_text(file_bytes, filename)
        logger.info("Job %s — extracted %d chars from '%s'", job_id, len(extracted_text), filename)
    except Exception as exc:
        logger.error("Job %s — text extraction failed: %s", job_id, exc)
        await _mark_failed(db, redis, run_id, f"Text extraction failed: {exc}")
        return

    # ------------------------------------------------------------------
    # STEP C — Run LangGraph pipeline
    # ------------------------------------------------------------------
    initial_state: PipelineState = {
        "raw_text":       extracted_text,
        "vertical":       vertical,
        "run_id":         run_id,
        "user_id":        user_id,
        "structured":     {},
        "assumptions":    [],
        "hard_questions": [],
        "report":         {},
        "token_counts":   {},
        "latencies_ms":   {},
    }

    try:
        final_state: PipelineState = initial_state
        async for event in pipeline.astream(initial_state):
            node_name = next(iter(event))  # LangGraph emits {node_name: state_update}
            updated   = event[node_name]
            final_state = {**final_state, **updated}

            agent_num  = _NODE_TO_AGENT.get(node_name, 0)
            latency_ms = (final_state.get("latencies_ms") or {}).get(f"agent_{agent_num}", 0)
            await _publish_progress(
                redis, run_id,
                {
                    "event":      "agent_complete",
                    "agent":      agent_num,
                    "latency_ms": latency_ms,
                    "message":    f"Agent {agent_num} complete",
                },
            )
            logger.info("Job %s — agent %d complete (%d ms)", job_id, agent_num, latency_ms)

    except Exception as exc:
        logger.error("Job %s — pipeline failed: %s\n%s", job_id, exc, traceback.format_exc())
        await _mark_failed(db, redis, run_id, f"Pipeline error: {exc}")
        return

    # ------------------------------------------------------------------
    # STEP D — Save results
    # ------------------------------------------------------------------
    try:
        token_counts: dict[str, int] = final_state.get("token_counts") or {}
        latencies_ms: dict[str, int] = final_state.get("latencies_ms") or {}
        report_data:  dict[str, Any] = final_state.get("report") or {}

        total_tokens     = sum(token_counts.values())
        input_tokens     = total_tokens // 2
        output_tokens    = total_tokens - input_tokens
        total_ms         = sum(latencies_ms.values())

        cost_usd = Decimal(str(
            (input_tokens  / 1_000_000 * _INPUT_PRICE_PER_M) +
            (output_tokens / 1_000_000 * _OUTPUT_PRICE_PER_M)
        )).quantize(Decimal("0.0001"))

        # Persist report
        report_id = str(uuid.uuid4())
        now = datetime.datetime.now(datetime.timezone.utc)
        
        report_doc = {
            "_id": report_id,
            "run_id": run_id,
            "user_id": user_id,
            "vertical": vertical,
            "assumption_map": report_data.get("assumption_map", []),
            "blind_spots": report_data.get("blind_spots", []),
            "sharpening": report_data.get("sharpening_prompts", []),
            "raw_output": report_data,
            "created_at": now
        }
        await db.reports.insert_one(report_doc)

        # Update analysis_run with telemetry and mark done
        await db.analysis_runs.update_one(
            {"_id": run_id},
            {
                "$set": {
                    "status": "done",
                    "agent_1_ms": latencies_ms.get("agent_1"),
                    "agent_2_ms": latencies_ms.get("agent_2"),
                    "agent_3_ms": latencies_ms.get("agent_3"),
                    "agent_4_ms": latencies_ms.get("agent_4"),
                    "total_ms": total_ms,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "cost_usd": float(cost_usd), # MongoDB handles floats better than Decimal in some drivers
                    "completed_at": now
                }
            }
        )

        await _publish_progress(
            redis, run_id,
            {
                "event":     "done",
                "report_id": report_id,
                "message":   "Analysis complete",
            },
        )
        logger.info(
            "Job %s done — report %s saved. cost=$%s total_ms=%d",
            job_id, report_id, cost_usd, total_ms,
        )

    except Exception as exc:
        logger.error("Job %s — save failed: %s\n%s", job_id, exc, traceback.format_exc())
        await _mark_failed(db, redis, run_id, f"Result save failed: {exc}")


# ---------------------------------------------------------------------------
# Main worker loop
# ---------------------------------------------------------------------------

async def run_worker() -> None:
    """
    Main async worker loop.

    Initialises all resources, polls Redis infinitely for jobs with BRPOP,
    and dispatches each to _process_job(). Handles SIGTERM/SIGINT for
    graceful shutdown.
    """
    # ------------------------------------------------------------------
    # Startup
    # ------------------------------------------------------------------
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(os.environ["MONGODB_URI"])
    # Extract DB name from URI or use default 'pitchready'
    db_name = client.get_database().name or "pitchready"
    db = client[db_name]

    redis = _get_redis()
    verticals = _load_verticals()

    logger.info("PitchReady worker started (MongoDB). Verticals loaded: %s", list(verticals.keys()))

    # ------------------------------------------------------------------
    # Shutdown handling
    # ------------------------------------------------------------------
    shutdown_event = asyncio.Event()

    def _request_shutdown(sig: int, *_: Any) -> None:
        logger.info("Received signal %d — requesting graceful shutdown", sig)
        shutdown_event.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, _request_shutdown)

    # ------------------------------------------------------------------
    # Main loop
    # ------------------------------------------------------------------
    try:
        while not shutdown_event.is_set():
            try:
                # Use RPOP (non-blocking) and wait manually since Upstash Redis (HTTP) doesn't support BRPOP
                result = await redis.rpop(QUEUE_KEY)
                if not result:
                    await asyncio.sleep(2)
                    continue
            except Exception as redis_exc:
                logger.error("Redis RPOP error: %s — retrying in 3s", redis_exc)
                await asyncio.sleep(3)
                continue

            # Timeout — no jobs available; loop again
            if result is None:
                continue

            # Upstash RPOP result format: value (JSON string or dict depending on client)
            raw_job = result
            try:
                job_payload: dict[str, Any] = json.loads(raw_job)
            except json.JSONDecodeError as exc:
                logger.error("Malformed job payload (not JSON): %s — %s", raw_job, exc)
                continue

            # Process the job; all internal errors are caught and logged inside
            try:
                await _process_job(job_payload, db, redis)
            except Exception as exc:
                logger.error(
                    "Unhandled exception in job %s: %s\n%s",
                    job_payload.get("job_id", "?"),
                    exc,
                    traceback.format_exc(),
                )
                # Best-effort failure marking — run_id may be missing
                run_id = job_payload.get("run_id", "")
                if run_id:
                    await _mark_failed(db, redis, run_id, f"Unhandled worker error: {exc}")

    finally:
        logger.info("Worker shutting down gracefully")
        client.close()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    asyncio.run(run_worker())
