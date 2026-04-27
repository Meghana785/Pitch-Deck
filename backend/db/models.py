"""
MongoDB — Collection initialization + Motor query helpers.
No ORM; raw Motor (pymongo-style) throughout.
"""

from __future__ import annotations

import datetime
import os
import uuid
from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, IndexModel


# ---------------------------------------------------------------------------
# Client & DB
# ---------------------------------------------------------------------------

async def create_db_client() -> AsyncIOMotorClient:
    """Create and return a Motor AsyncIOMotorClient using MONGODB_URI."""
    uri = os.environ["MONGODB_URI"]
    client = AsyncIOMotorClient(uri)
    return client


from fastapi import Request

def get_db_client_db(client: AsyncIOMotorClient) -> AsyncIOMotorDatabase:
    """Return the database instance from the client."""
    # Try to get default DB name from URI, fallback to 'pitchready'
    try:
        db_name = client.get_default_database().name
    except Exception:
        db_name = "pitchready"
    return client[db_name]


def get_db(request: Request) -> AsyncIOMotorDatabase:
    """FastAPI dependency to get the DB from app state."""
    return request.app.state.db


async def init_db(db: AsyncIOMotorDatabase) -> None:
    """Initialize collections and create necessary indexes."""
    # 1. Users collection
    # Drop legacy neon index if it exists (prevents DuplicateKeyError for nulls)
    try:
        await db.users.drop_index("neon_user_id_1")
    except Exception:
        pass

    await db.users.create_indexes([
        IndexModel([("email", ASCENDING)], unique=True),
    ])

    # 2. Analysis Runs collection
    await db.analysis_runs.create_indexes([
        IndexModel([("user_id", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
        IndexModel([("created_at", DESCENDING)]),
    ])

    # 3. Reports collection
    await db.reports.create_indexes([
        IndexModel([("run_id", ASCENDING)], unique=True),
        IndexModel([("user_id", ASCENDING)]),
        IndexModel([("created_at", DESCENDING)]),
    ])


# ---------------------------------------------------------------------------
# Query helpers — users
# ---------------------------------------------------------------------------

async def get_user_by_email(
    db: AsyncIOMotorDatabase,
    email: str,
) -> Optional[dict]:
    """Return the user document for *email*, or None if not found."""
    user = await db.users.find_one({"email": email.lower()})
    return user


async def create_user(
    db: AsyncIOMotorDatabase,
    email: str,
    hashed_password: str,
) -> dict:
    """Create a new user document and return it."""
    now = datetime.datetime.now(datetime.timezone.utc)
    user_id = str(uuid.uuid4())
    doc = {
        "_id": user_id,
        "email": email.lower(),
        "hashed_password": hashed_password,
        "plan": "free",
        "runs_used": 0,
        "runs_limit": 3,
        "skeptic_level": "high",
        "focus_area": "general",
        "created_at": now,
        "last_active": now,
    }
    await db.users.insert_one(doc)
    return doc


async def update_user_preferences(
    db: AsyncIOMotorDatabase,
    user_id: str,
    skeptic_level: str,
    focus_area: str,
) -> Optional[dict]:
    """Update a user's intelligence profile preferences."""
    result = await db.users.find_one_and_update(
        {"_id": user_id},
        {"$set": {
            "skeptic_level": skeptic_level,
            "focus_area": focus_area
        }},
        return_document=True
    )
    return result


# ---------------------------------------------------------------------------
# Query helpers — analysis_runs
# ---------------------------------------------------------------------------

async def create_run(
    db: AsyncIOMotorDatabase,
    user_id: str | uuid.UUID,
    vertical: str,
    storage_object_key: str,
    run_id: Optional[str | uuid.UUID] = None,
) -> dict:
    """Insert a new analysis_run with status='queued' and return it."""
    now = datetime.datetime.now(datetime.timezone.utc)
    actual_run_id = str(run_id) if run_id else str(uuid.uuid4())
    doc = {
        "_id": actual_run_id,
        "user_id": str(user_id),
        "vertical": vertical,
        "storage_object_key": storage_object_key,
        "status": "queued",
        "created_at": now,
    }
    await db.analysis_runs.insert_one(doc)
    return doc


async def update_run_status(
    db: AsyncIOMotorDatabase,
    run_id: str | uuid.UUID,
    status: str,
    error_message: Optional[str] = None,
) -> Optional[dict]:
    """
    Update the status (and optional error_message) of an analysis_run.
    Sets completed_at when status is 'done' or 'failed'.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    update_doc = {"$set": {"status": status}}
    
    if error_message:
        update_doc["$set"]["error_message"] = error_message
        
    if status in ("done", "failed"):
        update_doc["$set"]["completed_at"] = now
        
    result = await db.analysis_runs.find_one_and_update(
        {"_id": str(run_id)},
        update_doc,
        return_document=True
    )
    return result


# ---------------------------------------------------------------------------
# Query helpers — reports
# ---------------------------------------------------------------------------

async def save_report(
    db: AsyncIOMotorDatabase,
    run_id: str | uuid.UUID,
    user_id: str | uuid.UUID,
    vertical: str,
    assumption_map: Any,
    blind_spots: Any,
    sharpening: Any,
    raw_output: Optional[dict | str] = None,
) -> dict:
    """
    Insert a report document.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    report_id = str(uuid.uuid4())
    doc = {
        "_id": report_id,
        "run_id": str(run_id),
        "user_id": str(user_id),
        "vertical": vertical,
        "assumption_map": assumption_map,
        "blind_spots": blind_spots,
        "sharpening": sharpening,
        "raw_output": raw_output,
        "created_at": now,
    }
    await db.reports.insert_one(doc)
    return doc

