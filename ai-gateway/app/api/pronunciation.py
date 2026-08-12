import logging
from fastapi import APIRouter
from app.schemas.pronunciation import PronunciationRequest, PronunciationResponse
from app.schemas.common import ApiResponse
from app.services.pronunciation_service import pronunciation_service

router = APIRouter(tags=["Pronunciation"])
logger = logging.getLogger("app.api.pronunciation")

@router.post("/pronunciation", response_model=ApiResponse[PronunciationResponse])
async def evaluate_pronunciation(request: PronunciationRequest) -> ApiResponse[PronunciationResponse]:
    """Triggers speech evaluation. This endpoint runs asynchronously/fire-and-forget 
    and returns immediately to avoid blocking live client operations.
    """
    logger.info(f"POST /internal/pronunciation | session_id: {request.session_id}")
    
    # Process asynchronously via service layer
    result = await pronunciation_service.evaluate_speech(request)
    
    return ApiResponse[PronunciationResponse](
        success=True,
        data=result,
        error=None
    )
