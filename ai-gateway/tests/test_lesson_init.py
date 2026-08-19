import pytest
from unittest.mock import AsyncMock, patch
from app.schemas.chat import LessonInitRequest
from app.services.chat_service import ChatService

@pytest.fixture
def chat_service():
    with patch("app.services.chat_service.GroqProvider") as mock_provider_class:
        mock_provider = mock_provider_class.return_value
        mock_provider.complete = AsyncMock(return_value="Welcome to today's lesson on Vocabulary study!")
        mock_provider.model = "llama-3.1-70b-versatile"
        service = ChatService()
        yield service, mock_provider

@pytest.mark.asyncio
async def test_lesson_init_prompt_and_context(chat_service):
    service, mock_provider = chat_service
    request = LessonInitRequest(
        sessionId="test-session-init-1",
        language="en",
        learnerProfile={
            "nativeLanguage": "Malayalam",
            "englishLevel": "Intermediate",
            "occupation": "Engineer",
            "goals": ["Improve spoken fluency"],
            "interests": ["Technology"],
            "dailyGoal": 20
        },
        baseline={
            "actualLevel": "B1",
            "grammar": 65,
            "vocabulary": 70,
            "speaking": 60,
            "actualStrengths": "Good vocabulary",
            "actualWeaknesses": "Tense consistency"
        },
        lessonContext={
            "title": "Workplace Vocabulary Study",
            "lessonType": "Vocabulary",
            "estimatedMinutes": 12,
            "objectives": ["Master 5 key professional terms"]
        },
        studyPlan={
            "title": "8-Week Fluency Roadmap",
            "currentWeek": 1,
            "currentDay": 1
        },
        progress={
            "lessonsCompleted": 0,
            "streak": 0,
            "overallProgress": 0.0,
            "currentLevel": "INTERMEDIATE"
        },
        learningMemory={
            "weakTopics": ["Tenses"],
            "vocabulary": [{"word": "collaborate", "status": "learning"}],
            "previousMistakes": [{"corrected": "I have worked", "explanation": "Present perfect"}],
            "recentSessionSummary": "Initial baseline complete"
        }
    )

    response = await service.process_lesson_init(request)

    # Check that complete was called
    mock_provider.complete.assert_called_once()
    kwargs = mock_provider.complete.call_args[1]
    system_prompt = kwargs["system_prompt"]
    messages = kwargs["messages"]

    # Verify system prompt contains all key context blocks
    assert "CRITICAL LESSON INITIALIZATION RULES" in system_prompt
    assert "LEARNER PROFILE" in system_prompt
    assert "Malayalam" in system_prompt
    assert "Engineer" in system_prompt
    assert "BASELINE ASSESSMENT RESULTS" in system_prompt
    assert "Tense consistency" in system_prompt
    assert "Workplace Vocabulary Study" in system_prompt
    assert "Master 5 key professional terms" in system_prompt
    assert "LEARNING MEMORY & ANALYTICS" in system_prompt

    # Verify no fake user message from user input was included in messages
    assert len(messages) == 1
    assert messages[0]["role"] == "user"
    assert "initialize today's lesson" in messages[0]["content"]

    assert response.reply == "Welcome to today's lesson on Vocabulary study!"
