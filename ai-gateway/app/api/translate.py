import logging
from fastapi import APIRouter
from app.schemas.translate import TranslateRequest, TranslateResponse
from app.schemas.common import ApiResponse
from app.services.translation_service import translation_service

router = APIRouter(tags=["Translation"])
logger = logging.getLogger("app.api.translate")

@router.post("/translate", response_model=ApiResponse[TranslateResponse])
async def translate(request: TranslateRequest) -> ApiResponse[TranslateResponse]:
    """Translates incoming text string to a target language in a provider-agnostic manner."""
    logger.info(f"POST /internal/translate | target_lang: {request.target_language}")
    
    # Process translation request
    result = await translation_service.translate_text(request)
    
    return ApiResponse[TranslateResponse](
        success=True,
        data=result,
        error=None
    )
