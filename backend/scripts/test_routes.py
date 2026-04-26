import asyncio
from fastapi.testclient import TestClient

from main import app
import middleware.auth

# Mock the JWT verification to bypass JWKS fetching
async def mock_verify_token(token: str) -> dict:
    if token == "mock-valid-token":
        return {"sub": "00000000-0000-0000-0000-000000000001", "email": "test@example.com"}
    raise RuntimeError("Invalid token")

middleware.auth._verify_token = mock_verify_token

def run_tests():
    print("--- Starting API Tests ---")
    with TestClient(app) as client:
        # Test health
        res = client.get("/health")
        print(f"[GET /health] {res.status_code}: {res.json()}")

        # Test reports without auth
        res = client.get("/reports")
        print(f"[GET /reports] (No Auth) {res.status_code}: {res.json()}")

        # Test reports with auth
        res = client.get("/reports", headers={"Authorization": "Bearer mock-valid-token"})
        print(f"[GET /reports] (With Auth) {res.status_code}: {res.json()}")

if __name__ == "__main__":
    run_tests()
