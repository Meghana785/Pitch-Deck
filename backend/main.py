from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analyze, reports, upload, jobs, admin, auth
from middleware.auth import JWTAuthMiddleware

app = FastAPI(title="PitchReady API")

# Add JWTAuthMiddleware FIRST (so it is wrapped BY CORS middleware)
# This ensures CORS handles OPTIONS preflight requests before auth rejects them.
app.add_middleware(JWTAuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],  # Specific origins required when allow_credentials=True
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
