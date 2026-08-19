import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)
VALID_HEADERS = {"X-Internal-Key": settings.INTERNAL_API_KEY}

@pytest.mark.asyncio
async def test_conversational_assessment_next_endpoint():
    mock_service_response = {
        "message": "Tell me about your hobbies!",
        "isCompleted": False,
        "turnCount": 2,
        "estimatedLevel": "B1",
        "coveredSkills": ["introduction"],
        "evaluation": None
    }

    with patch("app.services.learning_service.learning_service.evaluate_conversational_turn", new_callable=AsyncMock) as mock_turn:
        mock_turn.return_value = mock_service_response

        response = client.post(
            "/api/v1/learning/conversational-assessment/next",
            headers=VALID_HEADERS,
            json={
                "history": [{"role": "assistant", "content": "Hi! Tell me about yourself."}],
                "turnCount": 1,
                "userMessage": "My name is Alex and I am a developer.",
                "targetLevel": "Intermediate"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["message"] == "Tell me about your hobbies!"
        assert data["data"]["isCompleted"] is False
        assert data["data"]["turnCount"] == 2


def test_extract_and_parse_json_markdown_blocks():
    from app.services.learning_service import learning_service
    llm_output = "Here is the response:\n```json\n{\n  \"message\": \"Hello!\",\n  \"isCompleted\": false\n}\n```"
    parsed = learning_service._extract_and_parse_json(llm_output)
    assert parsed["message"] == "Hello!"
    assert parsed["isCompleted"] is False


def test_extract_and_parse_json_think_tags():
    from app.services.learning_service import learning_service
    llm_output = "<think>Analyzing user profile...</think>\n{\n  \"message\": \"What is your daily routine?\",\n  \"isCompleted\": false\n}"
    parsed = learning_service._extract_and_parse_json(llm_output)
    assert parsed["message"] == "What is your daily routine?"


def test_extract_and_parse_json_brace_balancing_with_reasoning():
    from app.services.learning_service import learning_service
    llm_output = "1. Draft: {\"draft\": \"test\"}\n2. Final:\n{\n  \"message\": \"Tell me about work.\",\n  \"isCompleted\": false\n}"
    parsed = learning_service._extract_and_parse_json(llm_output)
    assert parsed["message"] == "Tell me about work."


def test_extract_and_parse_json_strip_comments():
    from app.services.learning_service import learning_service
    llm_output = "{\n  \"message\": \"Great!\", // comment here\n  \"isCompleted\": false\n}"
    parsed = learning_service._extract_and_parse_json(llm_output)
    assert parsed["message"] == "Great!"

