"""
Admin router for PitchReady.

All routes are protected by _require_admin(), which checks request.state.user
against the ADMIN_USER_IDS environment variable (comma-separated UUIDs).
Returns HTTP 403 for any user not on the list.
"""

from __future__ import annotations

import os
import logging
from typing import Any

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


# ---------------------------------------------------------------------------
# Guard
# ---------------------------------------------------------------------------

def _get_admin_ids() -> set[str]:
    """
    Return the set of admin user_id strings sourced from ADMIN_USER_IDS.

    The env var is a comma-separated list of UUIDs, e.g.::

        ADMIN_USER_IDS=uuid-a,uuid-b
    """
    raw = os.environ.get("ADMIN_USER_IDS", "")
    return {uid.strip() for uid in raw.split(",") if uid.strip()}


async def _require_admin(request: Request) -> dict[str, Any]:
    """
    FastAPI dependency — raises HTTP 403 unless request.state.user is in ADMIN_USER_IDS.

    Returns the user dict so downstream endpoints can use it directly.
    """
    user: dict[str, Any] | None = getattr(request.state, "user", None)
    if user is None:
        # Should never reach here (auth middleware runs first), but be safe.
        raise HTTPException(status_code=401, detail="Not authenticated.")

    user_id: str = user.get("user_id", "")
    admin_ids = _get_admin_ids()

    if not admin_ids:
        logger.warning(
            "ADMIN_USER_IDS is empty — all admin routes are locked down."
        )
        raise HTTPException(status_code=403, detail="Admin access is not configured.")

    if user_id not in admin_ids:
        raise HTTPException(status_code=403, detail="Forbidden: admin access required.")

    return user


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/stats")
async def get_stats(
    request: Request,
    _user: dict[str, Any] = Depends(_require_admin),
) -> dict[str, Any]:
    """
    Return aggregate platform statistics.

    Includes total users, total runs by status, and total reports.
    """
    pool: asyncpg.Pool = request.app.state.pool

    async with pool.acquire() as conn:
        total_users: int = await conn.fetchval("SELECT COUNT(*) FROM users")
        total_reports: int = await conn.fetchval("SELECT COUNT(*) FROM reports")
        run_rows = await conn.fetch(
            "SELECT status, COUNT(*) AS cnt FROM analysis_runs GROUP BY status"
        )

    runs_by_status = {row["status"]: row["cnt"] for row in run_rows}

    return {
        "total_users": total_users,
        "total_reports": total_reports,
        "runs_by_status": runs_by_status,
    }


@router.get("/runs")
async def get_runs(
    request: Request,
    limit: int = 50,
    offset: int = 0,
    _user: dict[str, Any] = Depends(_require_admin),
) -> dict[str, Any]:
    """
    Return a paginated list of analysis runs, newest first.

    Query params:
    - limit  (default 50, max 200)
    - offset (default 0)
    """
    limit = min(limit, 200)
    pool: asyncpg.Pool = request.app.state.pool

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT ar.id,
                   ar.user_id,
                   u.email,
                   ar.vertical,
                   ar.status,
                   ar.total_ms,
                   ar.cost_usd,
                   ar.error_message,
                   ar.created_at,
                   ar.completed_at
              FROM analysis_runs ar
              LEFT JOIN users u ON u.id = ar.user_id
             ORDER BY ar.created_at DESC
             LIMIT $1 OFFSET $2
            """,
            limit,
            offset,
        )
        total: int = await conn.fetchval("SELECT COUNT(*) FROM analysis_runs")

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "runs": [dict(r) for r in rows],
    }
