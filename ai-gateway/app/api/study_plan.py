import logging
from fastapi import APIRouter
from app.schemas.study_plan import (
    GeneratePlanRequest,
    GeneratePlanResponse,
    RecommendationsRequest,
    RecommendationsResponse,
)
from app.schemas.common import ApiResponse
from app.services.study_plan_service import study_plan_service

router = APIRouter(tags=["StudyPlan"])
logger = logging.getLogger("app.api.study_plan")

@router.post("/study-plan/generate", response_model=ApiResponse[GeneratePlanResponse])
async def generate_study_plan(
    request: GeneratePlanRequest
) -> ApiResponse[GeneratePlanResponse]:
    """Generates a structured AI study plan based on user profile."""
    logger.info("Received request to generate AI study plan")
    profile_dict = request.profile.model_dump(exclude_none=True)
    baseline_dict = request.baseline_skills.model_dump(exclude_none=True) if request.baseline_skills else None
    plan = await study_plan_service.generate_plan(profile_dict, baseline_dict)
    return ApiResponse[GeneratePlanResponse](success=True, data=plan, error=None)

@router.post("/study-plan/recommendations", response_model=ApiResponse[RecommendationsResponse])
async def get_recommendations(
    request: RecommendationsRequest
) -> ApiResponse[RecommendationsResponse]:
    """Generates dynamic AI daily focus and vocabulary recommendations."""
    logger.info("Received request to generate AI recommendations")
    profile_dict = request.profile.model_dump(exclude_none=True)
    recs = await study_plan_service.generate_recommendations(
        profile_dict,
        request.progress,
        request.mistakes,
        request.vocab
    )
    return ApiResponse[RecommendationsResponse](success=True, data=recs, error=None)
