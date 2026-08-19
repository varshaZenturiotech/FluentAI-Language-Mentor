import pytest
from unittest.mock import AsyncMock, patch
from app.services.chat_service import ChatService, DEFAULT_CHAT_FALLBACK
from app.schemas.chat import ChatRequest, ChatMessage

@pytest.fixture
def chat_service_instance():
    return ChatService()

@pytest.mark.asyncio
async def test_process_chat_normal_flow(chat_service_instance):
    mock_provider = AsyncMock()
    mock_provider.complete.return_value = "<think>reasoning</think>Hello! How can I help you today?"
    mock_provider.model = "qwen/qwen3.6-27b"
    
    chat_service_instance.provider = mock_provider
    
    req = ChatRequest(
        sessionId="test-session-id",
        message="hi",
        language="en"
    )
    
    res = await chat_service_instance.process_chat(req, request_id="req-123")
    assert res.reply == "Hello! How can I help you today?"
    assert res.lessonComplete is False
    assert mock_provider.complete.call_count == 1

@pytest.mark.asyncio
async def test_process_chat_unclosed_think_retry_success(chat_service_instance):
    mock_provider = AsyncMock()
    # Attempt 1 returns unclosed <think> tag with no answer -> sanitizes to ""
    # Attempt 2 (retry) returns a valid mentor response
    mock_provider.complete.side_effect = [
        "<think>Unfinished internal reasoning block without answer...",
        "Hello! Great to connect with you!"
    ]
    mock_provider.model = "qwen/qwen3.6-27b"
    
    chat_service_instance.provider = mock_provider
    
    req = ChatRequest(
        sessionId="test-session-id",
        message="hi",
        language="en"
    )
    
    res = await chat_service_instance.process_chat(req, request_id="req-123")
    assert res.reply == "Hello! Great to connect with you!"
    assert mock_provider.complete.call_count == 2

@pytest.mark.asyncio
async def test_process_chat_retry_and_fallback(chat_service_instance):
    mock_provider = AsyncMock()
    # Attempt 1 and Attempt 2 both return unclosed think tags without answer
    mock_provider.complete.side_effect = [
        "<think>Unfinished reasoning 1...",
        "<think>Unfinished reasoning 2..."
    ]
    mock_provider.model = "qwen/qwen3.6-27b"
    
    chat_service_instance.provider = mock_provider
    
    req = ChatRequest(
        sessionId="test-session-id",
        message="hi",
        language="en"
    )
    
    res = await chat_service_instance.process_chat(req, request_id="req-123")
    assert res.reply == DEFAULT_CHAT_FALLBACK
    assert mock_provider.complete.call_count == 2
