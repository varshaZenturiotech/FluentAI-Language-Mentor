import pytest
from unittest.mock import AsyncMock, patch
from app.schemas.chat import ChatRequest, ChatMessage
from app.services.chat_service import ChatService

@pytest.fixture
def chat_service():
    with patch("app.services.chat_service.GroqProvider") as mock_provider_class:
        mock_provider = mock_provider_class.return_value
        mock_provider.complete = AsyncMock(return_value="Hello! I am your English Language Mentor.")
        mock_provider.model = "llama3-8b-8192"
        service = ChatService()
        yield service, mock_provider

@pytest.mark.asyncio
async def test_beginner_learner(chat_service):
    service, mock_provider = chat_service
    request = ChatRequest(
        sessionId="test-session-123",
        message="Hello",
        language="en",
        learnerProfile={
            "nativeLanguage": "Malayalam",
            "ageGroup": "Adult",
            "occupation": "Teacher",
            "englishLevel": "Beginner",
            "goals": ["Improve vocabulary"],
            "interests": ["Books"],
            "dailyGoal": 15
        }
    )
    
    await service.process_chat(request)
    
    # Verify complete was called
    mock_provider.complete.assert_called_once()
    kwargs = mock_provider.complete.call_args[1]
    system_prompt = kwargs["system_prompt"]
    
    # Assertions for Beginner learner
    assert "Beginner" in system_prompt
    assert "Malayalam" in system_prompt
    assert "Teacher" in system_prompt
    assert "friendly, encouraging English Language Mentor" in system_prompt  # Loaded from mentor_behavior.txt

@pytest.mark.asyncio
async def test_intermediate_learner(chat_service):
    service, mock_provider = chat_service
    request = ChatRequest(
        sessionId="test-session-123",
        message="Hello",
        language="en",
        learnerProfile={
            "nativeLanguage": "Spanish",
            "ageGroup": "Adult",
            "occupation": "Designer",
            "englishLevel": "Intermediate",
            "goals": ["Improve speaking"],
            "interests": ["Art"],
            "dailyGoal": 15
        }
    )
    
    await service.process_chat(request)
    
    kwargs = mock_provider.complete.call_args[1]
    system_prompt = kwargs["system_prompt"]
    
    assert "Intermediate" in system_prompt
    assert "Spanish" in system_prompt
    assert "Designer" in system_prompt

@pytest.mark.asyncio
async def test_malayalam_learner(chat_service):
    service, mock_provider = chat_service
    request = ChatRequest(
        sessionId="test-session-123",
        message="Hello",
        language="en",
        learnerProfile={
            "nativeLanguage": "Malayalam",
            "ageGroup": "Adult",
            "occupation": "Software Engineer",
            "englishLevel": "Intermediate",
            "goals": ["Improve fluency"],
            "interests": ["Tech"],
            "dailyGoal": 15
        }
    )
    
    await service.process_chat(request)
    
    kwargs = mock_provider.complete.call_args[1]
    system_prompt = kwargs["system_prompt"]
    
    assert "Malayalam" in system_prompt

@pytest.mark.asyncio
async def test_software_engineer(chat_service):
    service, mock_provider = chat_service
    request = ChatRequest(
        sessionId="test-session-123",
        message="Hello",
        language="en",
        learnerProfile={
            "nativeLanguage": "Malayalam",
            "ageGroup": "Adult",
            "occupation": "Software Engineer",
            "englishLevel": "Intermediate",
            "goals": ["Fluency"],
            "interests": ["Coding"],
            "dailyGoal": 15
        }
    )
    
    await service.process_chat(request)
    
    kwargs = mock_provider.complete.call_args[1]
    system_prompt = kwargs["system_prompt"]
    
    assert "Software Engineer" in system_prompt

@pytest.mark.asyncio
async def test_structured_study_plan_lesson(chat_service):
    service, mock_provider = chat_service
    request = ChatRequest(
        sessionId="test-session-123",
        message="Hello",
        language="en",
        lessonContext={
            "title": "Present Perfect Tense Practice",
            "lessonType": "Grammar",
            "estimatedMinutes": 20,
            "difficulty": "Intermediate",
            "objectives": ["Practice Present Perfect structure", "Use went vs have gone"]
        }
    )
    
    await service.process_chat(request)
    
    kwargs = mock_provider.complete.call_args[1]
    system_prompt = kwargs["system_prompt"]
    
    # Check that lesson Context details are present
    assert "Present Perfect Tense Practice" in system_prompt
    assert "Grammar" in system_prompt
    assert "Practice Present Perfect structure" in system_prompt
    
    # Check that structured study plan lesson behavior rules are present (lesson_behavior.txt)
    assert "conducting a structured Study Plan lesson" in system_prompt
    assert "Guide the learner step-by-step" in system_prompt

@pytest.mark.asyncio
async def test_grammar_correction(chat_service):
    service, mock_provider = chat_service
    request = ChatRequest(
        sessionId="test-session-123",
        message="I have went to office yesterday",
        language="en",
        learningMemory={
            "weakGrammarTopics": ["Past Tense"],
            "vocabulary": [],
            "previousMistakes": [
                {
                    "original": "I have went",
                    "corrected": "I went",
                    "explanation": "went is simple past",
                    "rule": "Simple Past"
                }
            ],
            "strengths": [],
            "recentSessionSummary": "Needs to practice past tense",
            "confidence": 65,
            "fluency": 60
        }
    )
    
    await service.process_chat(request)
    
    kwargs = mock_provider.complete.call_args[1]
    system_prompt = kwargs["system_prompt"]
    
    # Check that correction guidelines and mistakes are formatted
    assert "politely correct important mistakes" in system_prompt
    assert "I have went" in system_prompt
    assert "I went" in system_prompt

@pytest.mark.asyncio
async def test_vocabulary_practice(chat_service):
    service, mock_provider = chat_service
    request = ChatRequest(
        sessionId="test-session-123",
        message="Hello",
        language="en",
        learningMemory={
            "weakGrammarTopics": [],
            "vocabulary": [
                {"word": "ubiquitous", "status": "learning", "mastery": 20},
                {"word": "leverage", "status": "new", "mastery": 0}
            ],
            "previousMistakes": [],
            "strengths": [],
            "recentSessionSummary": "Learning vocabulary",
            "confidence": 75,
            "fluency": 70
        }
    )
    
    await service.process_chat(request)
    
    kwargs = mock_provider.complete.call_args[1]
    system_prompt = kwargs["system_prompt"]
    
    assert "ubiquitous (learning)" in system_prompt
    assert "leverage (new)" in system_prompt

@pytest.mark.asyncio
async def test_weak_topic_personalization(chat_service):
    service, mock_provider = chat_service
    request = ChatRequest(
        sessionId="test-session-123",
        message="Hello",
        language="en",
        learningMemory={
            "weakGrammarTopics": ["Subject-Verb Agreement", "Articles"],
            "vocabulary": [],
            "previousMistakes": [],
            "strengths": [],
            "recentSessionSummary": "Struggles with singular/plural",
            "confidence": 80,
            "fluency": 75
        }
    )
    
    await service.process_chat(request)
    
    kwargs = mock_provider.complete.call_args[1]
    system_prompt = kwargs["system_prompt"]
    
    assert "Subject-Verb Agreement" in system_prompt
    assert "Articles" in system_prompt

@pytest.mark.asyncio
async def test_lesson_completion_behavior(chat_service):
    service, mock_provider = chat_service
    request = ChatRequest(
        sessionId="test-session-123",
        message="Hello",
        language="en",
        lessonContext={
            "title": "Introduction to Greetings",
            "lessonType": "Conversation",
            "estimatedMinutes": 10,
            "difficulty": "Beginner",
            "objectives": ["Greetings"]
        }
    )
    
    await service.process_chat(request)
    
    kwargs = mock_provider.complete.call_args[1]
    system_prompt = kwargs["system_prompt"]
    
    # Check that the objective-driven completion rules are in system prompt
    assert "[LESSON_COMPLETE: objective 1 | objective 2]" in system_prompt
    assert "NEVER pretend that the learner completed a lesson" in system_prompt

@pytest.mark.asyncio
async def test_lesson_completion_marker_parsing(chat_service):
    service, mock_provider = chat_service
    mock_provider.complete.return_value = "Great job! You have demonstrated greetings.\n[LESSON_COMPLETE: Greetings]"
    
    request = ChatRequest(
        sessionId="test-session-123",
        message="Hello teacher!",
        language="en",
        lessonContext={
            "objectives": ["Greetings"]
        }
    )
    
    response = await service.process_chat(request)
    
    assert response.lessonComplete is True
    assert response.completedObjectives == ["Greetings"]
    assert response.reply == "Great job! You have demonstrated greetings."
