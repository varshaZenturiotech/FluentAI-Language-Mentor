import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_health_endpoint_public():
    """Verify that /internal/health is accessible without X-Internal-Key."""
    response = client.get("/internal/health")
    assert response.status_code in (200, 502) # Depending on whether internal services are up/mocked

def test_api_routes_require_auth():
    """Verify that routes under /api/v1/ return 401 Unauthorized when X-Internal-Key is missing or invalid."""
    routes = [
        "/api/v1/chat",
        "/api/v1/speech/transcribe",
        "/api/v1/study-plan/generate",
        "/api/v1/study-plan/recommendations",
        "/api/v1/learning/analyze"
    ]
    for route in routes:
        # Missing key
        response = client.post(route, json={})
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "UNAUTHORIZED"

        # Invalid key
        response = client.post(route, json={}, headers={"X-Internal-Key": "wrong-key"})
        assert response.status_code == 401

def test_api_routes_accept_valid_auth():
    """Verify that request fails with 422 (or passes/fails other validation but not 401) with valid key."""
    # Since we are passing empty JSON {}, it should fail validation (422) but NOT authentication (401)
    response = client.post("/api/v1/chat", json={}, headers={"X-Internal-Key": settings.INTERNAL_API_KEY})
    assert response.status_code == 422
