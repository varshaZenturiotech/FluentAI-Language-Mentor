import logging
from fastapi import APIRouter
from app.schemas.common import ApiResponse
from app.schemas.baseline import ConversationalAssessmentRequest, ConversationalAssessmentResponse
from app.services.learning_service import learning_service

router = APIRouter(tags=["Conversational Assessment"])
logger = logging.getLogger("app.api.conversational_assessment")

@router.post("/learning/conversational-assessment/next", response_model=ApiResponse[ConversationalAssessmentResponse])
async def conversational_assessment_next(
    request: ConversationalAssessmentRequest
) -> ApiResponse[ConversationalAssessmentResponse]:
    """Processes a conversational baseline assessment turn and returns the next mentor prompt or final report."""
    history_list = [item.model_dump() for item in request.history]
    logger.info(f"[LIVE_PAYLOAD_RECEIVED] turnCount={request.turnCount} | userMessage='{request.userMessage}' | targetLevel='{request.targetLevel}' | historyCount={len(history_list)} | history={history_list}")
    
    result = await learning_service.evaluate_conversational_turn(
        history=history_list,
        turn_count=request.turnCount,
        user_message=request.userMessage,
        target_level=request.targetLevel or "unknown"
    )
    
    return ApiResponse[ConversationalAssessmentResponse](success=True, data=result, error=None)
