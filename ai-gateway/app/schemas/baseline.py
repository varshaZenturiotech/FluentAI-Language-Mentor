from pydantic import BaseModel, Field
from typing import List, Optional

class EvaluateBaselineRequest(BaseModel):
    writingText: str = Field(..., description="The learner's written text response")
    speakingTranscript: Optional[str] = Field(default=None, description="The transcript of the learner's speaking response")
    mcGrammarScore: int = Field(..., description="Number of correct grammar questions")
    mcGrammarTotal: int = Field(..., description="Total number of grammar questions presented")
    mcVocabularyScore: int = Field(..., description="Number of correct vocab questions")
    mcVocabularyTotal: int = Field(..., description="Total number of vocab questions")
    mcReadingScore: int = Field(..., description="Number of correct reading questions")
    mcReadingTotal: int = Field(..., description="Total number of reading questions")
    mcListeningScore: int = Field(..., description="Number of correct listening questions")
    mcListeningTotal: int = Field(..., description="Total number of listening questions")
    targetLevel: str = Field(..., description="The user's self-selected target English level")
    speakingAudioProvided: bool = Field(default=False, description="Whether actual speaking audio was uploaded")

class SkillAssessmentResult(BaseModel):
    score: int = Field(..., description="Evaluated score out of 100")
    level: str = Field(..., description="Evaluated CEFR level (e.g. A1, B2)")
    strengths: List[str] = Field(default_factory=list, description="Key strengths in this skill")
    weaknesses: List[str] = Field(default_factory=list, description="Areas of improvement")

class EvaluateBaselineResponse(BaseModel):
    grammar: SkillAssessmentResult
    vocabulary: SkillAssessmentResult
    reading: SkillAssessmentResult
    listening: SkillAssessmentResult
    writing: SkillAssessmentResult
    speaking: SkillAssessmentResult
    pronunciation: SkillAssessmentResult
    fluency: SkillAssessmentResult
    overallScore: int = Field(..., description="Weighted overall score 0-100")
    overallLevel: str = Field(..., description="CEFR level (Pre-A1 to C2)")
    strengths: List[str] = Field(default_factory=list, description="Top overall strengths")
    weaknesses: List[str] = Field(default_factory=list, description="Top overall weaknesses")
    assessmentStatus: str = Field("completed", description="Status of the evaluation: completed, incomplete, error")
