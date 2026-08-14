import logging
import time
from fastapi import APIRouter, Header
from app.schemas.chat import ChatRequest, ChatResponse, LessonInitRequest
from app.schemas.common import ApiResponse
from app.services.chat_service import chat_service

router = APIRouter(tags=["Chat"])
logger = logging.getLogger("app.api.chat")

@router.post("/chat", response_model=ApiResponse[ChatResponse])
async def chat(
    request: ChatRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id")
) -> ApiResponse[ChatResponse]:
    """Exposes POST /api/v1/chat for language mentor conversation."""
    start_time = time.perf_counter()
    
    logger.info(
        f"POST /api/v1/chat | sessionId: {request.sessionId} | "
        f"language: {request.language} | message_len: {len(request.message)} chars"
    )
    
    response_data = await chat_service.process_chat(request, user_id=x_user_id)
    
    duration = time.perf_counter() - start_time
    logger.info(
        f"Chat turn completed | sessionId: {request.sessionId} | "
        f"provider: {response_data.provider} | model: {response_data.model} | "
        f"duration: {duration:.4f}s"
    )
    
    return ApiResponse[ChatResponse](
        success=True,
        data=response_data,
        error=None
    )

@router.post("/chat/lesson-init", response_model=ApiResponse[ChatResponse])
@router.post("/lesson-init", response_model=ApiResponse[ChatResponse])
async def init_lesson(
    request: LessonInitRequest,
    x_user_id: str | None = Header(default=None, alias="X-User-Id")
) -> ApiResponse[ChatResponse]:
    """Exposes POST /api/v1/chat/lesson-init for AI-initiated study plan lesson greetings."""
    start_time = time.perf_counter()
    
    logger.info(f"POST /api/v1/chat/lesson-init | sessionId: {request.sessionId} | language: {request.language}")
    
    response_data = await chat_service.process_lesson_init(request, user_id=x_user_id)
    
    duration = time.perf_counter() - start_time
    logger.info(
        f"Lesson init completed | sessionId: {request.sessionId} | "
        f"provider: {response_data.provider} | model: {response_data.model} | "
        f"duration: {duration:.4f}s"
    )
    
    return ApiResponse[ChatResponse](
        success=True,
        data=response_data,
        error=None
    )
