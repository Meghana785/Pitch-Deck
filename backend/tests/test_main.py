from fastapi.testclient import TestClient
import os
import sys
from pathlib import Path

# Add backend to path so we can import main
sys.path.append(str(Path(__file__).resolve().parent.parent))

from main import app

client = TestClient(app)

def test_read_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_public_docs():
    response = client.get("/docs")
    assert response.status_code == 200

def test_unauthorized_upload():
    # Attempting to access a protected route without a token
    response = client.post("/upload/presign", json={
        "filename": "test.pdf",
        "content_type": "application/pdf",
        "vertical": "B2B SaaS"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing Authorization header."
