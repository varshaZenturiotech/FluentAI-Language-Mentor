import logging
from fastapi import APIRouter
from app.schemas.common import ApiResponse
from app.schemas.learning import AnalyzeRequest, AnalyzeResponse
from app.schemas.baseline import EvaluateBaselineRequest, EvaluateBaselineResponse
from app.services.learning_service import learning_service

router = APIRouter(tags=["Learning"])
logger = logging.getLogger("app.api.learning")

@router.post("/learning/analyze", response_model=ApiResponse[AnalyzeResponse])
async def analyze_learning_session(
    request: AnalyzeRequest
) -> ApiResponse[AnalyzeResponse]:
    """Analyzes a completed learning session and returns metrics/insights."""
    logger.info("Received request to analyze learning session")
    profile_dict = request.profile.model_dump(exclude_none=True)
    analysis = await learning_service.analyze_session(
        profile=profile_dict,
        study_plan=request.study_plan,
        current_lesson=request.current_lesson,
        weak_topics=request.weak_topics,
        recent_vocab=request.recent_vocab,
        prev_summary=request.prev_summary,
        messages=request.messages
    )
    return ApiResponse[AnalyzeResponse](success=True, data=analysis, error=None)

@router.post("/learning/evaluate-baseline", response_model=ApiResponse[EvaluateBaselineResponse])
async def evaluate_baseline_assessment(
    request: EvaluateBaselineRequest
) -> ApiResponse[EvaluateBaselineResponse]:
    """Evaluates a learner's baseline assessment responses (MCQs, writing, speaking transcript)."""
    logger.info("Received request to evaluate baseline assessment")
    req_dict = request.model_dump()
    evaluation = await learning_service.evaluate_baseline(req_dict)
    return ApiResponse[EvaluateBaselineResponse](success=True, data=evaluation, error=None)
