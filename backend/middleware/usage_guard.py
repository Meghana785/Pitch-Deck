"""
Usage guard dependency for PitchReady.

Enforces free-tier run limits before POST /analyze is processed.
Skips enforcement for /auth/*, /reports/*, /admin/* routes.
"""

from __future__ import annotations

import logging
from typing import Optional

import asyncpg
from fastapi import Depends, HTTPException, Request

logger = logging.getLogger(__name__)

# Routes where usage enforcement is intentionally skipped
_EXEMPT_PREFIXES = ("/auth", "/reports", "/admin")


def _is_exempt(path: str) -> bool:
    """Return True for routes that must bypass usage enforcement."""
    return any(path.startswith(p) for p in _EXEMPT_PREFIXES)


async def check_usage_limit(request: Request) -> None:
    """
    FastAPI dependency — raises HTTP 402 when a free user has exhausted their run quota.

    Must be used as a dependency on the POST /analyze endpoint (or similar).
    Silently passes for exempt routes and for pro-plan users.

    Expects:
    - request.state.user  set by JWTAuthMiddleware ({"user_id": str, ...})
    - request.app.state.pool  asyncpg Pool stored at app startup
    """
    if _is_exempt(request.url.path):
        return

    user_state: Optional[dict] = getattr(request.state, "user", None)
    if user_state is None:
        # Auth middleware already handles missing tokens; nothing to check here.
        return

    db = request.app.state.db
    neon_user_id: str = user_state["user_id"]

    user_doc = await db.users.find_one(
        {"neon_user_id": neon_user_id},
        {"plan": 1, "runs_used": 1, "runs_limit": 1}
    )

    if user_doc is None:
        # User not yet in DB — first sync will create them; allow the request.
        logger.warning("Usage check: user %s not found in DB.", neon_user_id)
        return

    plan: str = user_doc["plan"]
    runs_used: int = user_doc["runs_used"]
    runs_limit: int = user_doc["runs_limit"]

    logger.debug(
        "Usage check for %s: plan=%s runs_used=%d runs_limit=%d",
        neon_user_id,
        plan,
        runs_used,
        runs_limit,
    )

    if plan == "free" and runs_used >= runs_limit:
        raise HTTPException(
            status_code=402,
            detail="Free tier limit reached. Upgrade to Pro.",
        )
