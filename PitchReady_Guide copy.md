# Implementation Plan: Migrate PitchReady to MongoDB

This plan outlines the complete transition of the PitchReady data layer from Neon Postgres (SQL) to MongoDB (NoSQL). This change will simplify the storage of JSON-heavy reports and align with the flexible document-based nature of the analysis results.

## User Review Required

> [!IMPORTANT]
> This is a destructive change regarding the codebase. All existing relational logic (Foreign Keys, Joins) will be replaced with document references and MongoDB aggregation.
>
> **Infrastructure Action Required**: You will need to provide a `MONGODB_URI` (e.g., from MongoDB Atlas) and add it to your `.env` file. The current `NEON_DATABASE_URL` will become obsolete.

## Proposed Changes

### Core Database Layer

#### [MODIFY] [requirements.txt](file:///Users/apple/WorkSpace/orbrot/Projects/PitchReady/backend/requirements.txt)
- Remove `asyncpg`.
- Add `motor` (the official async MongoDB driver for Python).

#### [MODIFY] [models.py](file:///Users/apple/WorkSpace/orbrot/Projects/PitchReady/backend/db/models.py)
- **Complete Rewrite**: 
  - Replace `asyncpg.Pool` with `motor.motor_asyncio.AsyncIOMotorClient`.
  - Implement a `get_db()` helper to access the MongoDB database.
  - Rewrite all query helpers (`create_user`, `create_run`, `update_run_status`) to use MongoDB collections (`users`, `analysis_runs`, `reports`).
  - Implement an `init_db` function that creates necessary **indexes** (e.g., unique index on `neon_user_id`).

### Application Integration

#### [MODIFY] [main.py](file:///Users/apple/WorkSpace/orbrot/Projects/PitchReady/backend/main.py)
- Update the `lifespan` handler to initialize the `MotorClient` and store it in `app.state.db`.
- Replace SQL-based health checks with a MongoDB `ping`.

#### [MODIFY] [usage_guard.py](file:///Users/apple/WorkSpace/orbrot/Projects/PitchReady/backend/middleware/usage_guard.py)
- Update the usage check logic to query the `users` collection in MongoDB instead of Postgres.

### Routers & Worker

#### [MODIFY] [upload.py](file:///Users/apple/WorkSpace/orbrot/Projects/PitchReady/backend/routers/upload.py) & [analyze.py](file:///Users/apple/WorkSpace/orbrot/Projects/PitchReady/backend/routers/analyze.py)
- Update all calls to DB helpers to match the new MongoDB-based signatures.
- Ensure that `ObjectId` is handled correctly (MongoDB uses `_id` as an `ObjectId` instead of a standard `UUID` string by default, though we can store UUIDs as strings if preferred for compatibility).

#### [MODIFY] [worker.py](file:///Users/apple/WorkSpace/orbrot/Projects/PitchReady/worker/worker.py)
- Update the worker to use `motor` for connecting to MongoDB.
- Update the result persistence logic (`INSERT INTO reports`, `UPDATE analysis_runs`) to use MongoDB collection operations.

## Verification Plan

### Automated Tests
1. **Connection Test**: Run a script to verify connection to the MongoDB instance.
2. **Schema Init**: Run the updated `init_db` and verify that collections and indexes are created in the MongoDB UI/Compass.

### Manual Verification
1. **User Sync**: Trigger a login/upload to ensure the user is correctly upserted into the `users` collection.
2. **Upload & Analyze**: Verify that a new analysis run is created in the `analysis_runs` collection.
3. **Worker Completion**: Verify that the worker successfully saves the report into the `reports` collection and updates the run status to `done`.
