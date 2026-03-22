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

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# JWKS Client (PyJWT handles caching natively)
# ---------------------------------------------------------------------------

_jwks_client: Optional[PyJWKClient] = None

def get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        url = os.environ.get("NEON_JWKS_URL", "").strip()
        if not url:
            raise RuntimeError("NEON_JWKS_URL environment variable is not set or is empty.")
        # PyJWKClient caches keys automatically. cache_keys=True is default.
        _jwks_client = PyJWKClient(url)
    return _jwks_client


# ---------------------------------------------------------------------------
# Paths that do NOT require authentication
# ---------------------------------------------------------------------------

_PUBLIC_PREFIXES = ("/docs", "/openapi", "/redoc", "/health")


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
# JWT decode helper
# ---------------------------------------------------------------------------

async def _verify_token(token: str) -> dict[str, Any]:
    """
    Verify *token* against Neon's JWKS and return the decoded claims.

    Raises jwt.PyJWTError on invalid/expired tokens, RuntimeError on JWKS failures.
    """
    try:
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
    except Exception as exc:
        raise RuntimeError(f"Failed to fetch or find signing key: {exc}") from exc

    try:
        claims: dict[str, Any] = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256", "EdDSA"],
            options={"verify_aud": False},  # Neon tokens may omit aud
        )
    except ExpiredSignatureError as exc:
        raise PyJWTError("Token has expired.") from exc
    except PyJWTError:
        raise

    return claims


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

class JWTAuthMiddleware(BaseHTTPMiddleware):
    """
    Starlette middleware that validates Neon Auth JWTs on every non-public route.

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

        try:
            claims = await _verify_token(token)
        except RuntimeError as exc:
            # JWKS fetch failure — treat as upstream auth service error
            logger.error("JWKS fetch error: %s", exc)
            return JSONResponse(
                status_code=401,
                content={"detail": f"Auth service unavailable: {exc}"},
            )
        except PyJWTError as exc:
            logger.error(f"JWT verification failed: {exc}")
            return JSONResponse(status_code=401, content={"detail": str(exc)})

        request.state.user = {
            "user_id": claims.get("sub", ""),
            "email": claims.get("email", ""),
            "claims": claims,
        }

        return await call_next(request)
