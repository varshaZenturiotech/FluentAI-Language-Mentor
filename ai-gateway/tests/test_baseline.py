import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.core.config import settings
from app.core.exceptions import LLMProviderException
from app.services.learning_service import learning_service

client = TestClient(app)

def test_evaluate_baseline_validation():
    """Verify that a request to /api/v1/learning/evaluate-baseline without required fields fails validation."""
    response = client.post(
        "/api/v1/learning/evaluate-baseline",
        json={},
        headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
    )
    assert response.status_code == 422


def test_evaluate_baseline_success():
    """Verify that a successful AI baseline evaluation returns properly structured metrics."""
    mock_llm_response = {
        "grammar": {
            "score": 85,
            "level": "B2",
            "strengths": ["Good verb tenses"],
            "weaknesses": ["Minor preposition errors"]
        },
        "vocabulary": {
            "score": 80,
            "level": "B2",
            "strengths": ["Academic vocabulary present"],
            "weaknesses": ["Word repetition"]
        },
        "reading": {
            "score": 90,
            "level": "C1",
            "strengths": ["Excellent detail comprehension"],
            "weaknesses": []
        },
        "listening": {
            "score": 85,
            "level": "B2",
            "strengths": ["Understands key accents"],
            "weaknesses": []
        },
        "writing": {
            "score": 75,
            "level": "B1",
            "strengths": ["Clear paragraphs"],
            "weaknesses": ["Run-on sentences"]
        },
        "speaking": {
            "score": 70,
            "level": "B1",
            "strengths": ["Coherent flow"],
            "weaknesses": ["Pronunciation hesitations"]
        },
        "pronunciation": {
            "score": 68,
            "level": "B1",
            "strengths": ["Clear vowel sounds"],
            "weaknesses": ["Consonant clusters"],
            "assessmentStatus": "completed"
        },
        "fluency": {
            "score": 72,
            "level": "B1",
            "strengths": ["Steady pace"],
            "weaknesses": ["Filler words"]
        },
        "overallScore": 79,
        "overallLevel": "B2",
        "strengths": ["Strong overall reading and listening comprehension"],
        "weaknesses": ["Needs work on pronunciation and run-on sentences"],
        "assessmentStatus": "completed"
    }

    with patch.object(learning_service.provider, "complete", new_callable=AsyncMock) as mock_complete:
        mock_complete.return_value = json.dumps(mock_llm_response)

        response = client.post(
            "/api/v1/learning/evaluate-baseline",
            json={
                "writingText": "I have been learning English for five years. It has helped me communicate with international clients at work.",
                "speakingTranscript": "Continuous learning is the key to personal and professional growth.",
                "mcGrammarScore": 2,
                "mcGrammarTotal": 3,
                "mcVocabularyScore": 3,
                "mcVocabularyTotal": 3,
                "mcReadingScore": 2,
                "mcReadingTotal": 2,
                "mcListeningScore": 2,
                "mcListeningTotal": 2,
                "targetLevel": "Advanced",
                "speakingAudioProvided": True
            },
            headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["overallLevel"] == "B2"
        assert data["data"]["overallScore"] == 79
        assert data["data"]["grammar"]["score"] == 85
        assert data["data"]["assessmentStatus"] == "completed"


def test_evaluate_baseline_exception_propagation():
    """Verify that a LLM provider exception during baseline evaluation yields fallback baseline metrics (HTTP 200)."""
    with patch.object(learning_service.provider, "complete", new_callable=AsyncMock) as mock_complete:
        mock_complete.side_effect = LLMProviderException("Groq API quota exceeded")

        response = client.post(
            "/api/v1/learning/evaluate-baseline",
            json={
                "writingText": "Valid writing response goes here.",
                "speakingTranscript": "Valid speaking response goes here.",
                "mcGrammarScore": 2,
                "mcGrammarTotal": 3,
                "mcVocabularyScore": 3,
                "mcVocabularyTotal": 3,
                "mcReadingScore": 2,
                "mcReadingTotal": 2,
                "mcListeningScore": 2,
                "mcListeningTotal": 2,
                "targetLevel": "Advanced",
                "speakingAudioProvided": True
            },
            headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["overallLevel"] == "A2"
        assert data["data"]["overallScore"] == 50
        assert data["data"]["grammar"]["score"] == 50
