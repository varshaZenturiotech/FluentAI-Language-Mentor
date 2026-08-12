import logging
from fastapi import APIRouter
from app.schemas.common import ApiResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])
logger = logging.getLogger("app.api.health")

@router.get("/health", response_model=ApiResponse[dict])
async def health_check() -> ApiResponse[dict]:
    """Basic health check endpoint that does not require internal auth header validation."""
    logger.debug("Health check requested")
    return ApiResponse[dict](
        success=True,
        data={
            "provider": "groq",
            "model": settings.GROQ_MODEL,
            "status": "healthy"
        },
        error=None
    )
