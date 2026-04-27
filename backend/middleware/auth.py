"""
JWT authentication middleware for PitchReady.

Verifies RS256 tokens issued by Neon Auth.
JWKS are fetched from NEON_JWKS_URL and cached in-process for 1 hour.
On every request the decoded user claims are injected into request.state.user.
"""

from __future__ import annotations

import os
import time
import logging
from typing import Any, Optional

import jwt
from jwt import PyJWKClient
from jwt.exceptions import ExpiredSignatureError, PyJWTError
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from services.auth import decode_access_token

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Paths that do NOT require authentication
# ---------------------------------------------------------------------------

_PUBLIC_PREFIXES = ("/docs", "/openapi", "/redoc", "/health", "/auth")


def _is_public(path: str) -> bool:
    """Return True for routes that must not require a JWT."""
    return any(path.startswith(p) for p in _PUBLIC_PREFIXES)


# ---------------------------------------------------------------------------
# Token extraction helper
# ---------------------------------------------------------------------------

def _extract_bearer(authorization: Optional[str]) -> str:
    """
    Parse the raw Authorization header value and return the bare token string.

    Raises ValueError for missing or malformed headers.
    """
    if not authorization:
        raise ValueError("Missing Authorization header.")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise ValueError("Authorization header must be 'Bearer <token>'.")
    return parts[1]


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

class JWTAuthMiddleware(BaseHTTPMiddleware):
    """
    Starlette middleware that validates custom JWTs on every non-public route.

    On success, injects request.state.user with::

        {
            "user_id": str,   # 'sub' claim
            "email":   str,   # 'email' claim
            "claims":  dict,  # full decoded payload
        }

    Returns JSON 401 for any auth failure.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Validate JWT; pass request through on success, return 401 on failure."""
        if _is_public(request.url.path):
            return await call_next(request)

        raw_auth: Optional[str] = request.headers.get("Authorization")

        try:
            token = _extract_bearer(raw_auth)
        except ValueError as exc:
            logger.error(f"Auth header extraction failed: {exc} | Raw header: {raw_auth}")
            return JSONResponse(status_code=401, content={"detail": str(exc)})

        claims = decode_access_token(token)
        if not claims:
            logger.error("JWT verification failed: Invalid or expired token")
            return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

        request.state.user = {
            "user_id": claims.get("sub", ""),
            "email": claims.get("email", ""),
            "claims": claims,
        }

        return await call_next(request)
