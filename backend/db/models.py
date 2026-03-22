"""
Neon Postgres — schema DDL + asyncpg query helpers.
No ORM; raw asyncpg throughout.
"""

from __future__ import annotations

import os
import json
import uuid
from typing import Any, Optional

import asyncpg

# ---------------------------------------------------------------------------
# DDL
# ---------------------------------------------------------------------------

_CREATE_EXTENSION = "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

_CREATE_USERS = """
CREATE TABLE IF NOT EXISTS users (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    neon_user_id TEXT        UNIQUE NOT NULL,
    email        TEXT        UNIQUE NOT NULL,
    plan         TEXT        NOT NULL DEFAULT 'free',
    runs_used    INTEGER     NOT NULL DEFAULT 0,
    runs_limit   INTEGER     NOT NULL DEFAULT 3,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    last_active  TIMESTAMPTZ DEFAULT NOW()
);
"""

_CREATE_ANALYSIS_RUNS = """
CREATE TABLE IF NOT EXISTS analysis_runs (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        REFERENCES users(id),
    vertical          TEXT        NOT NULL,
    spaces_object_key TEXT        NOT NULL,
    status            TEXT        NOT NULL DEFAULT 'queued',
    agent_1_ms        INTEGER,
    agent_2_ms        INTEGER,
    agent_3_ms        INTEGER,
    agent_4_ms        INTEGER,
    total_ms          INTEGER,
    input_tokens      INTEGER,
    output_tokens     INTEGER,
    cost_usd          NUMERIC(8,4),
    error_message     TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    completed_at      TIMESTAMPTZ
);
"""

_CREATE_REPORTS = """
CREATE TABLE IF NOT EXISTS reports (
    id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id         UUID  REFERENCES analysis_runs(id),
    user_id        UUID  REFERENCES users(id),
    vertical       TEXT  NOT NULL,
    assumption_map JSONB NOT NULL,
    blind_spots    JSONB NOT NULL,
    sharpening     JSONB NOT NULL,
    raw_output     TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
"""

_CREATE_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_runs_user_id    ON analysis_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_status     ON analysis_runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_created    ON analysis_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_run_id  ON reports(run_id);
"""

# ---------------------------------------------------------------------------
# Pool
# ---------------------------------------------------------------------------

async def create_pool() -> asyncpg.Pool:
    """Create and return an asyncpg connection pool using NEON_DATABASE_URL."""
    dsn = os.environ["NEON_DATABASE_URL"]
    pool: asyncpg.Pool = await asyncpg.create_pool(
        dsn=dsn,
        min_size=2,
        max_size=10,
        command_timeout=30,
        ssl="require",
    )
    return pool


async def init_db(pool: asyncpg.Pool) -> None:
    """Run all CREATE TABLE IF NOT EXISTS statements and indexes."""
    async with pool.acquire() as conn:
        await conn.execute(_CREATE_EXTENSION)
        await conn.execute(_CREATE_USERS)
        await conn.execute(_CREATE_ANALYSIS_RUNS)
        await conn.execute(_CREATE_REPORTS)
        # Indexes are individual statements; execute one-by-one
        for stmt in _CREATE_INDEXES.strip().split(";"):
            stmt = stmt.strip()
            if stmt:
                await conn.execute(stmt)


# ---------------------------------------------------------------------------
# Query helpers — users
# ---------------------------------------------------------------------------

async def get_user_by_neon_id(
    pool: asyncpg.Pool,
    neon_user_id: str,
) -> Optional[asyncpg.Record]:
    """Return the users row for *neon_user_id*, or None if not found."""
    async with pool.acquire() as conn:
        row: Optional[asyncpg.Record] = await conn.fetchrow(
            "SELECT * FROM users WHERE neon_user_id = $1",
            neon_user_id,
        )
    return row


async def create_user(
    pool: asyncpg.Pool,
    neon_user_id: str,
    email: str,
) -> asyncpg.Record:
    """Insert a new user row and return it."""
    async with pool.acquire() as conn:
        row: asyncpg.Record = await conn.fetchrow(
            """
            INSERT INTO users (neon_user_id, email)
            VALUES ($1, $2)
            ON CONFLICT (neon_user_id) DO UPDATE
                SET email = EXCLUDED.email,
                    last_active = NOW()
            RETURNING *
            """,
            neon_user_id,
            email,
        )
    return row


# ---------------------------------------------------------------------------
# Query helpers — analysis_runs
# ---------------------------------------------------------------------------

async def create_run(
    pool: asyncpg.Pool,
    user_id: uuid.UUID,
    vertical: str,
    spaces_object_key: str,
) -> asyncpg.Record:
    """Insert a new analysis_run with status='queued' and return it."""
    async with pool.acquire() as conn:
        row: asyncpg.Record = await conn.fetchrow(
            """
            INSERT INTO analysis_runs (user_id, vertical, spaces_object_key)
            VALUES ($1, $2, $3)
            RETURNING *
            """,
            user_id,
            vertical,
            spaces_object_key,
        )
    return row


async def update_run_status(
    pool: asyncpg.Pool,
    run_id: uuid.UUID,
    status: str,
    error_message: Optional[str] = None,
) -> Optional[asyncpg.Record]:
    """
    Update the status (and optional error_message) of an analysis_run.
    Sets completed_at when status is 'done' or 'failed'.
    Returns the updated row, or None if run_id not found.
    """
    async with pool.acquire() as conn:
        row: Optional[asyncpg.Record] = await conn.fetchrow(
            """
            UPDATE analysis_runs
               SET status        = $2,
                   error_message = COALESCE($3, error_message),
                   completed_at  = CASE
                                     WHEN $2 IN ('done', 'failed') THEN NOW()
                                     ELSE completed_at
                                   END
             WHERE id = $1
            RETURNING *
            """,
            run_id,
            status,
            error_message,
        )
    return row


# ---------------------------------------------------------------------------
# Query helpers — reports
# ---------------------------------------------------------------------------

async def save_report(
    pool: asyncpg.Pool,
    run_id: uuid.UUID,
    user_id: uuid.UUID,
    vertical: str,
    assumption_map: Any,
    blind_spots: Any,
    sharpening: Any,
    raw_output: Optional[str] = None,
) -> asyncpg.Record:
    """
    Insert a report row.
    *assumption_map*, *blind_spots*, and *sharpening* may be dicts or
    already-serialised JSON strings; both are handled transparently.
    """
    def _to_json(v: Any) -> str:
        return json.dumps(v) if not isinstance(v, str) else v

    async with pool.acquire() as conn:
        row: asyncpg.Record = await conn.fetchrow(
            """
            INSERT INTO reports
                (run_id, user_id, vertical, assumption_map, blind_spots, sharpening, raw_output)
            VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7)
            RETURNING *
            """,
            run_id,
            user_id,
            vertical,
            _to_json(assumption_map),
            _to_json(blind_spots),
            _to_json(sharpening),
            raw_output,
        )
    return row
