import os
from pathlib import Path

from dotenv import load_dotenv

# Load root .env (one level up from backend/) so all env vars are available
# whether uvicorn is launched from backend/ or the project root.
_root_env = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_root_env, override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
from routers import analyze, reports, upload, jobs, admin, auth
from middleware.auth import JWTAuthMiddleware
from db.models import create_db_client, get_db_client_db, init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB client
    client = await create_db_client()
    db = get_db_client_db(client)
    await init_db(db)
    app.state.db_client = client
    app.state.db = db
    yield
    # Close connection
    client.close()

app = FastAPI(title="PitchReady API", lifespan=lifespan)

# Add JWTAuthMiddleware FIRST (so it is wrapped BY CORS middleware)
# This ensures CORS handles OPTIONS preflight requests before auth rejects them.
app.add_middleware(JWTAuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(reports.router)
app.include_router(upload.router)
app.include_router(jobs.router)
app.include_router(admin.router)
app.include_router(auth.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
