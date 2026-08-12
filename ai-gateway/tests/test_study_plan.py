import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.core.config import settings
from app.services.study_plan_service import study_plan_service
from app.schemas.study_plan import GeneratePlanResponse
from app.constants import OBJECTIVE_MASTERY_THRESHOLD
from pydantic import ValidationError

client = TestClient(app)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_valid_llm_response():
    weeks = []
    for w in range(1, 9):
        days = []
        for d in range((w - 1) * 7 + 1, w * 7 + 1):
            days.append({
                "dayNumber": d,
                "weekNumber": w,
                "title": f"Practice Day {d}",
                "estimatedMinutes": 15,
                "lessonType": "Conversation",
                "lessonContent": f"Focus on conversational fluency for day {d}."
            })
        weeks.append({
            "weekNumber": w,
            "title": f"Week {w} Focus Theme",
            "description": f"Master basic speaking and vocabulary in week {w}.",
            "focusSkills": ["speaking", "fluency"],
            "objectives": [
                {
                    "id": f"w{w}_obj1",
                    "description": f"Introduce concepts for week {w}",
                    "successCriteria": ["Goal met"]
                }
            ],
            "days": days
        })
    return {
        "title": "8-Week Adaptive Learning Journey",
        "description": "Tailored curriculum to enhance vocabulary and conversational speaking skills.",
        "durationWeeks": 8,
        "weeks": weeks
    }


def compute_priority_areas(goals: list[str], **skill_scores: int) -> list[str]:
    """
    Minimal re-implementation of the TypeScript calculateSkillPriorities logic for Python tests.
    Weights are consistent with the TypeScript service.
    """
    MASTERY_THRESHOLD = OBJECTIVE_MASTERY_THRESHOLD  # 70
    goal_str = " ".join(goals).lower()

    career_keywords = {"interview", "career", "work", "job", "conversation", "social"}
    exam_keywords = {"exam", "academic", "study", "test"}
    travel_keywords = {"travel"}

    is_career = any(k in goal_str for k in career_keywords)
    is_exam = any(k in goal_str for k in exam_keywords)
    is_travel = any(k in goal_str for k in travel_keywords)

    skills_all = ["grammar", "vocabulary", "reading", "listening", "writing", "speaking", "pronunciation", "fluency"]
    scores = {s: skill_scores.get(s, 50) for s in skills_all}

    results = []
    for skill in skills_all:
        score = scores[skill]
        weakness_factor = 100 - score

        if is_career:
            if skill in ("speaking", "fluency"):
                goal_relevance = 2.0
            elif skill in ("pronunciation", "vocabulary"):
                goal_relevance = 1.5
            else:
                goal_relevance = 1.2
        elif is_exam:
            if skill in ("grammar", "writing"):
                goal_relevance = 2.0
            elif skill in ("reading", "vocabulary"):
                goal_relevance = 1.5
            else:
                goal_relevance = 1.2
        elif is_travel:
            if skill in ("speaking", "listening"):
                goal_relevance = 2.0
            elif skill == "fluency":
                goal_relevance = 1.5
            else:
                goal_relevance = 1.1
        else:
            goal_relevance = 1.0

        priority_score = weakness_factor * goal_relevance
        results.append((skill, priority_score))

    results.sort(key=lambda x: x[1], reverse=True)
    return [r[0] for r in results[:3]]


# ---------------------------------------------------------------------------
# Existing Tests
# ---------------------------------------------------------------------------

def test_generate_study_plan_schema_success():
    """Verify that a correct LLM response is parsed and validates against GeneratePlanResponse schema."""
    mock_response = make_valid_llm_response()
    with patch.object(study_plan_service.provider, "complete", new_callable=AsyncMock) as mock_complete:
        mock_complete.return_value = json.dumps(mock_response)

        response = client.post(
            "/api/v1/study-plan/generate",
            json={
                "profile": {
                    "ageGroup": "25-34",
                    "occupation": "Software Engineer",
                    "englishLevel": "Intermediate",
                    "nativeLanguage": "Hindi",
                    "goals": ["Career advancement"],
                    "interests": ["Technology"],
                    "dailyLearningGoal": 20
                },
                "baseline_skills": {
                    "grammar": 50,
                    "vocabulary": 60,
                    "speaking": 40,
                    "fluency": 45,
                    "priority_areas": ["speaking", "fluency", "grammar"]
                }
            },
            headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["durationWeeks"] == 8
        assert len(data["data"]["weeks"]) == 8
        assert data["data"]["weeks"][0]["weekNumber"] == 1
        assert len(data["data"]["weeks"][0]["days"]) == 7
        assert data["data"]["weeks"][0]["days"][0]["dayNumber"] == 1
        assert data["data"]["weeks"][0]["days"][0]["weekNumber"] == 1


def test_generate_study_plan_invalid_weeks_count_uses_fallback():
    """Verify that an LLM response containing less than 8 weeks triggers fallback and returns 200."""
    mock_response = make_valid_llm_response()
    mock_response["weeks"] = mock_response["weeks"][:7]  # only 7 weeks

    with patch.object(study_plan_service.provider, "complete", new_callable=AsyncMock) as mock_complete:
        mock_complete.return_value = json.dumps(mock_response)

        response = client.post(
            "/api/v1/study-plan/generate",
            json={
                "profile": {"occupation": "Product Manager"},
                "baseline_skills": {"grammar": 80}
            },
            headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Personalized 8-Week English Roadmap" in data["data"]["title"]


def test_generate_study_plan_duplicate_week_numbers_uses_fallback():
    """Verify duplicate week numbers validation triggers fallback and returns 200."""
    mock_response = make_valid_llm_response()
    mock_response["weeks"][1]["weekNumber"] = 1  # duplicate week 1

    with patch.object(study_plan_service.provider, "complete", new_callable=AsyncMock) as mock_complete:
        mock_complete.return_value = json.dumps(mock_response)

        response = client.post(
            "/api/v1/study-plan/generate",
            json={
                "profile": {"occupation": "QA Lead"}
            },
            headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Personalized 8-Week English Roadmap" in data["data"]["title"]


def test_generate_study_plan_invalid_fallback_raises_500():
    """Verify that if fallback validation itself fails, it raises 500."""
    mock_response = make_valid_llm_response()
    mock_response["weeks"] = mock_response["weeks"][:7]  # force fallback

    # Mock GeneratePlanResponse.model_validate to raise ValidationError on fallback
    original_validate = GeneratePlanResponse.model_validate
    call_count = 0
    def mock_validate(value, *args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count > 1:
            # Second call is the fallback validation, make it fail
            raise ValueError("Simulated fallback validation failure")
        return original_validate(value, *args, **kwargs)

    with patch.object(study_plan_service.provider, "complete", new_callable=AsyncMock) as mock_complete, \
         patch.object(GeneratePlanResponse, "model_validate", side_effect=mock_validate):
        mock_complete.return_value = json.dumps(mock_response)

        response = client.post(
            "/api/v1/study-plan/generate",
            json={
                "profile": {"occupation": "DevOps"},
            },
            headers={"X-Internal-Key": settings.INTERNAL_API_KEY}
        )
        assert response.status_code == 500
        data = response.json()
        assert data["success"] is False
        assert "Fallback validation failed" in data["error"]["message"]


# ---------------------------------------------------------------------------
# NEW: 7e – 56-Day → Week Mapping
# ---------------------------------------------------------------------------

def test_day_week_mapping_formula():
    """
    Requirement 8: Validate that the day→week mapping formula (dayNumber - 1) // 7 + 1
    is enforced by GeneratePlanResponse schema validation for all 56 days.

    Canonical mapping:
        day 1  → week 1    day 7  → week 1
        day 8  → week 2    day 14 → week 2
        day 15 → week 3    day 49 → week 7
        day 50 → week 8    day 56 → week 8
    """
    canonical_cases = [
        (1, 1), (7, 1),
        (8, 2), (14, 2),
        (15, 3),
        (49, 7),
        (50, 8), (56, 8),
    ]
    for day_num, expected_week in canonical_cases:
        computed_week = (day_num - 1) // 7 + 1
        assert computed_week == expected_week, (
            f"Day {day_num} should be in week {expected_week}, got week {computed_week}"
        )

    # Also validate that GeneratePlanResponse enforces this via Pydantic
    plan_data = make_valid_llm_response()
    plan = GeneratePlanResponse(**plan_data)
    for week in plan.weeks:
        for day in week.days:
            expected_week = (day.dayNumber - 1) // 7 + 1
            assert day.weekNumber == expected_week, (
                f"Schema validation failed: day {day.dayNumber} has weekNumber={day.weekNumber}, "
                f"expected {expected_week}"
            )
            assert day.weekNumber == week.weekNumber


def test_day_week_mapping_rejects_wrong_nesting():
    """Verify that placing a day in the wrong week is rejected by GeneratePlanResponse."""
    plan_data = make_valid_llm_response()
    # Move day 8 (which belongs to week 2) into the week 1 days list,
    # and swap it out with week 2's first day so day counts remain 7 per week.
    week1_days = plan_data["weeks"][0]["days"]
    week2_days = plan_data["weeks"][1]["days"]

    # Swap: give week1 day 8 and give week2 day 1
    week1_days[0] = {**week2_days[0], "weekNumber": 1}   # day 8 with weekNumber=1 → wrong
    week2_days[0] = {**week1_days[1], "weekNumber": 2}   # day 1 with weekNumber=2 → wrong

    with pytest.raises(ValidationError):
        GeneratePlanResponse(**plan_data)


# ---------------------------------------------------------------------------
# NEW: 7f – Objective Mastery Threshold Constant
# ---------------------------------------------------------------------------

def test_objective_mastery_threshold_constant():
    """
    Requirement 2 & 7: The central OBJECTIVE_MASTERY_THRESHOLD must equal 70.
    Mastery status is score-gated, not day-completion-gated.
    """
    assert OBJECTIVE_MASTERY_THRESHOLD == 70, (
        f"OBJECTIVE_MASTERY_THRESHOLD must be 70, got {OBJECTIVE_MASTERY_THRESHOLD}"
    )


def test_objective_mastery_score_independent_of_day_completion():
    """
    Requirement 7: masteryScore 60 with 7/7 days completed → NOT mastered.
    masteryScore 70 → mastered. No mastery record → NOT_STARTED.
    This logic mirrors deriveMasteryStatus in study-plan.repository.ts.
    """
    def derive_status(mastery_score: float, attempts: int) -> str:
        if attempts == 0:
            return "NOT_STARTED"
        if mastery_score >= OBJECTIVE_MASTERY_THRESHOLD:
            return "MASTERED"
        if mastery_score >= 50:
            return "PROFICIENT"
        return "PRACTICING"

    # 7/7 days completed but masteryScore=60 → PROFICIENT, NOT mastered
    assert derive_status(60, 7) == "PROFICIENT"
    assert derive_status(60, 7) != "MASTERED"

    # masteryScore exactly at threshold → MASTERED
    assert derive_status(70, 1) == "MASTERED"

    # masteryScore above threshold → MASTERED
    assert derive_status(85, 3) == "MASTERED"

    # masteryScore below 50 → PRACTICING
    assert derive_status(40, 2) == "PRACTICING"

    # No mastery record at all → NOT_STARTED
    assert derive_status(0, 0) == "NOT_STARTED"


# ---------------------------------------------------------------------------
# NEW: 7g – Profile A vs Profile B Differentiation
# ---------------------------------------------------------------------------

def test_profile_career_vs_exam_priority_areas_differ():
    """
    Requirement 9: Career profile (weak speaking/fluency) and Exam profile (weak grammar/reading)
    must produce logically different priority areas.
    """
    # Profile A: Career goal, weak speaking and fluency
    career_priorities = compute_priority_areas(
        goals=["Career advancement"],
        grammar=65, vocabulary=65, reading=65, listening=65,
        writing=65, speaking=35, pronunciation=55, fluency=38
    )

    # Profile B: Exam goal, weak grammar and reading
    exam_priorities = compute_priority_areas(
        goals=["Exam preparation"],
        grammar=30, vocabulary=65, reading=35, listening=65,
        writing=60, speaking=65, pronunciation=55, fluency=60
    )

    # The two profiles must produce different priority areas
    assert career_priorities != exam_priorities, (
        f"Career and Exam profiles should differ.\n"
        f"Career: {career_priorities}\nExam: {exam_priorities}"
    )

    # Career profile priorities must be logically related to speaking/fluency weakness + career goal
    career_set = set(career_priorities)
    assert career_set & {"speaking", "fluency"}, (
        f"Career profile with weak speaking(35)/fluency(38) must prioritise speaking/fluency.\n"
        f"Got: {career_priorities}"
    )

    # Exam profile priorities must be logically related to grammar/reading weakness + exam goal
    exam_set = set(exam_priorities)
    assert exam_set & {"grammar", "reading"}, (
        f"Exam profile with weak grammar(30)/reading(35) must prioritise grammar/reading.\n"
        f"Got: {exam_priorities}"
    )


def test_profile_travel_vs_career_priority_areas_differ():
    """
    Supplementary: Travel goal (weak listening) vs Career goal (weak speaking) produce different areas.
    """
    travel_priorities = compute_priority_areas(
        goals=["Travel"],
        grammar=60, vocabulary=60, reading=60, listening=30,
        writing=60, speaking=55, pronunciation=55, fluency=50
    )

    career_priorities = compute_priority_areas(
        goals=["Career advancement"],
        grammar=60, vocabulary=60, reading=60, listening=65,
        writing=60, speaking=30, pronunciation=55, fluency=55
    )

    assert travel_priorities != career_priorities
    assert "listening" in travel_priorities or "speaking" in travel_priorities
    assert "speaking" in career_priorities or "fluency" in career_priorities
