import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.core.config import settings
from app.core.exceptions import LLMProviderException
from app.services.study_plan_service import study_plan_service
from app.services.learning_service import learning_service

client = TestClient(app)

def test_study_plan_generate_exception_propagation():
    """Verify that a provider exception during study plan generation returns HTTP 502."""
    with patch.object(study_plan_service.provider, "complete", new_callable=AsyncMock) as mock_complete:
        mock_complete.side_effect = LLMProviderException("Groq API rate limit exceeded")
        
        response = client.post(
            "/api/v1/study-plan/generate",
            json={"profile": {"occupation": "Software Engineer"}},
            headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
        )
        
        assert response.status_code == 502
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "LLM_PROVIDER_ERROR"
        assert "Groq API rate limit" in data["error"]["message"]


def test_recommendations_exception_propagation():
    """Verify that a provider exception during recommendation generation returns HTTP 502."""
    with patch.object(study_plan_service.provider, "complete", new_callable=AsyncMock) as mock_complete:
        mock_complete.side_effect = LLMProviderException("Groq service unavailable")
        
        response = client.post(
            "/api/v1/study-plan/recommendations",
            json={
                "profile": {"occupation": "Software Engineer"},
                "progress": {},
                "mistakes": [],
                "vocab": []
            },
            headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
        )
        
        assert response.status_code == 502
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "LLM_PROVIDER_ERROR"
        assert "Groq service unavailable" in data["error"]["message"]


def test_learning_analyze_exception_propagation():
    """Verify that a provider exception during session analysis returns HTTP 502."""
    with patch.object(learning_service.provider, "complete", new_callable=AsyncMock) as mock_complete:
        mock_complete.side_effect = LLMProviderException("Groq API quota exceeded")
        
        response = client.post(
            "/api/v1/learning/analyze",
            json={
                "profile": {"occupation": "Software Engineer"},
                "messages": []
            },
            headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
        )
        
        assert response.status_code == 502
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "LLM_PROVIDER_ERROR"
        assert "Groq API quota exceeded" in data["error"]["message"]


def test_learning_analyze_pronunciation_scores():
    """Verify that learning analyze endpoint injects pronunciationScore=None and pronunciationScoreAvailable=False."""
    mock_json_response = {
        "completed": True,
        "completionPercentage": 100,
        "lessonCompletion": 100,
        "studyMinutes": 15,
        "grammarScore": 80,
        "vocabularyScore": 70,
        "confidenceScore": 75,
        "fluencyScore": 65,
        "grammarMistakes": [],
        "weakTopics": [],
        "weakAreas": [],
        "newWords": [],
        "newVocabulary": [],
        "masteredWords": [],
        "completedObjectives": [],
        "objectivesCompleted": [],
        "recommendedTopics": [],
        "recommendation": "Good job."
    }
    import json
    with patch.object(learning_service.provider, "complete", new_callable=AsyncMock) as mock_complete:
        mock_complete.return_value = json.dumps(mock_json_response)
        
        response = client.post(
            "/api/v1/learning/analyze",
            json={
                "profile": {"occupation": "Software Engineer"},
                "messages": []
            },
            headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["pronunciationScore"] is None
        assert data["data"]["pronunciationScoreAvailable"] is False

