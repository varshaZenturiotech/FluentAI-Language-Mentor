from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class UserProfileSchema(BaseModel):
    ageGroup: Optional[str] = Field(default=None, description="Age group of the user")
    occupation: Optional[str] = Field(default=None, description="Occupation of the user")
    englishLevel: Optional[str] = Field(default=None, description="English level of the user")
    nativeLanguage: Optional[str] = Field(default=None, description="Native language of the user")
    goals: Optional[List[str]] = Field(default=None, description="List of learning goals")
    interests: Optional[List[str]] = Field(default=None, description="List of user interests")
    dailyLearningGoal: Optional[int] = Field(default=None, description="Daily learning goal in minutes")

class StudyPlanDay(BaseModel):
    dayNumber: int = Field(..., description="Day number of the study plan")
    weekNumber: int = Field(..., description="Week number of the study plan")
    title: str = Field(..., description="Short title for the day's study")
    estimatedMinutes: int = Field(..., description="Estimated minutes for study")
    lessonType: str = Field(..., description="Type of the lesson (e.g. Vocabulary, Grammar, etc.)")
    lessonContent: str = Field(..., description="Detailed instructions and content")

    @field_validator('title')
    @classmethod
    def title_non_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("title cannot be empty")
        return v.strip()

    @field_validator('lessonContent')
    @classmethod
    def content_non_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("lessonContent cannot be empty")
        return v.strip()

class WeekObjective(BaseModel):
    id: str = Field(..., description="Unique ID for the objective (e.g., w1_obj1)")
    description: str = Field(..., description="Measurable description of the objective")
    successCriteria: List[str] = Field(..., description="Measurable success criteria")

    @field_validator('id')
    @classmethod
    def id_non_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("objective id cannot be empty")
        return v.strip()

    @field_validator('description')
    @classmethod
    def desc_non_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("objective description cannot be empty")
        return v.strip()

    @field_validator('successCriteria')
    @classmethod
    def criteria_non_empty(cls, v):
        if not v:
            raise ValueError("success criteria cannot be empty")
        for c in v:
            if not c or not c.strip():
                raise ValueError("success criteria items cannot be empty")
        return v

class StudyPlanWeek(BaseModel):
    weekNumber: int = Field(..., description="Week number (1-8)")
    title: str = Field(..., description="Title of the week")
    description: str = Field(..., description="Description of the weekly goals")
    focusSkills: List[str] = Field(..., description="List of skills focused on this week")
    objectives: List[WeekObjective] = Field(..., description="List of weekly objectives")
    days: List[StudyPlanDay] = Field(..., description="List of 7 days in the week")

    @field_validator('weekNumber')
    @classmethod
    def check_week_number(cls, v):
        if v < 1 or v > 8:
            raise ValueError("weekNumber must be between 1 and 8")
        return v

    @field_validator('title')
    @classmethod
    def title_non_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("title cannot be empty")
        return v.strip()

    @field_validator('description')
    @classmethod
    def desc_non_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("description cannot be empty")
        return v.strip()

    @field_validator('focusSkills')
    @classmethod
    def check_skills(cls, v):
        valid_skills = {'grammar', 'vocabulary', 'reading', 'listening', 'writing', 'speaking', 'pronunciation', 'fluency'}
        for skill in v:
            if skill.lower() not in valid_skills:
                raise ValueError(f"Invalid focus skill: {skill}. Must be one of {valid_skills}")
        return [skill.lower() for skill in v]

class GeneratePlanResponse(BaseModel):
    title: str = Field(..., description="Title of the study plan")
    description: str = Field(..., description="Warm, motivating description of the plan")
    durationWeeks: int = Field(..., description="Duration of the plan in weeks")
    weeks: List[StudyPlanWeek] = Field(..., description="List of weeks in the study plan")

    @field_validator('weeks')
    @classmethod
    def validate_weeks(cls, v):
        if len(v) != 8:
            raise ValueError("Must contain exactly 8 weeks")
        
        # Check duplicate week numbers
        week_numbers = [w.weekNumber for w in v]
        if len(set(week_numbers)) != len(week_numbers):
            raise ValueError("Duplicate week numbers found")
        
        # Check unique objective IDs
        obj_ids = []
        for w in v:
            for obj in w.objectives:
                obj_ids.append(obj.id)
        if len(set(obj_ids)) != len(obj_ids):
            raise ValueError("Duplicate objective IDs found across weeks")

        # Check total days is exactly 56, and dayNumbers are 1 to 56
        all_days = []
        for w in v:
            if len(w.days) != 7:
                raise ValueError(f"Week {w.weekNumber} must contain exactly 7 days")
            for day in w.days:
                # Validate day maps to the parent weekNumber
                if day.weekNumber != w.weekNumber:
                    raise ValueError(f"Day {day.dayNumber} weekNumber {day.weekNumber} does not match parent weekNumber {w.weekNumber}")
                # Validate dayNumber maps to the correct week
                expected_week = (day.dayNumber - 1) // 7 + 1
                if expected_week != w.weekNumber:
                    raise ValueError(f"Day {day.dayNumber} belongs to Week {expected_week}, but is nested under Week {w.weekNumber}")
                all_days.append(day)

        if len(all_days) != 56:
            raise ValueError("Must contain exactly 56 days across all weeks")

        day_numbers = sorted([d.dayNumber for d in all_days])
        expected_day_numbers = list(range(1, 57))
        if day_numbers != expected_day_numbers:
            raise ValueError("Day numbers must be unique and consecutively span 1 to 56")

        return v

class BaselineSkillsSchema(BaseModel):
    grammar: Optional[int] = Field(default=None, description="Grammar baseline score")
    vocabulary: Optional[int] = Field(default=None, description="Vocabulary baseline score")
    reading: Optional[int] = Field(default=None, description="Reading baseline score")
    speaking: Optional[int] = Field(default=None, description="Speaking baseline score")
    listening: Optional[int] = Field(default=None, description="Listening baseline score")
    writing: Optional[int] = Field(default=None, description="Writing baseline score")
    pronunciation: Optional[int] = Field(default=None, description="Pronunciation baseline score")
    fluency: Optional[int] = Field(default=None, description="Fluency baseline score")
    strengths: Optional[List[str]] = Field(default=None, description="Strengths identified during baseline")
    weaknesses: Optional[List[str]] = Field(default=None, description="Weaknesses identified during baseline")
    level: Optional[str] = Field(default=None, description="CEFR level from assessment")
    score: Optional[int] = Field(default=None, description="Overall score from assessment")
    priority_areas: Optional[List[str]] = Field(default=None, description="Top prioritized skills for the user")
    is_actual_assessment: Optional[bool] = Field(default=False, description="Flag indicating if these are measured scores")

class GeneratePlanRequest(BaseModel):
    profile: UserProfileSchema
    baseline_skills: Optional[BaselineSkillsSchema] = Field(default=None, description="Baseline self-assessment scores")

class RecommendationsResponse(BaseModel):
    focus: str = Field(..., description="Today's focus header text")
    reason: str = Field(..., description="Why we are focusing on this topic today")
    vocabulary: List[str] = Field(..., description="List of 5 contextual vocabulary words")

class RecommendationsRequest(BaseModel):
    profile: UserProfileSchema
    progress: dict = Field(default_factory=dict, description="Progress tracking dictionary")
    mistakes: List[dict] = Field(default_factory=list, description="Recent grammar mistakes/corrections")
    vocab: List[str] = Field(default_factory=list, description="Vocabulary words studied recently")
