from pydantic import BaseModel, Field
from typing import List, Optional, Union
from app.schemas.study_plan import UserProfileSchema

class GrammarMistakeSchema(BaseModel):
    sentence: str = Field(..., description="Incorrect sentence spoken by user")
    correctSentence: str = Field(..., description="Corrected sentence")
    explanation: Optional[str] = Field(default=None, description="Explanation for correction")
    grammarRule: Optional[str] = Field(default=None, description="Grammar rule violated")
    mistakeType: Optional[str] = Field(default=None, description="Type of grammar mistake")

class AnalyzeResponse(BaseModel):
    completed: bool = Field(..., description="Whether today's lesson objectives were successfully practiced")
    completionPercentage: int = Field(..., description="Overall completion percentage")
    lessonCompletion: int = Field(..., description="Lesson completion percentage")
    studyMinutes: int = Field(..., description="Study duration in minutes")
    grammarScore: int = Field(..., description="Evaluated grammar score (0-100)")
    vocabularyScore: int = Field(..., description="Evaluated vocabulary score (0-100)")
    confidenceScore: int = Field(..., description="Evaluated confidence score (0-100)")
    fluencyScore: int = Field(..., description="Evaluated fluency score (0-100)")
    pronunciationScore: Optional[int] = Field(default=None, description="Evaluated pronunciation score (0-100)")
    pronunciationScoreAvailable: bool = Field(default=False, description="Whether pronunciation score is available")
    grammarMistakes: List[GrammarMistakeSchema] = Field(default_factory=list, description="Grammar mistakes detected")
    weakTopics: List[str] = Field(default_factory=list)
    weakAreas: List[str] = Field(default_factory=list)
    newWords: List[str] = Field(default_factory=list)
    newVocabulary: List[str] = Field(default_factory=list)
    masteredWords: List[str] = Field(default_factory=list)
    completedObjectives: List[str] = Field(default_factory=list)
    objectivesCompleted: List[str] = Field(default_factory=list)
    recommendedTopics: List[str] = Field(default_factory=list)
    recommendation: str = Field(..., description="Mentor recommendations")

class AnalyzeRequest(BaseModel):
    profile: UserProfileSchema
    study_plan: Optional[dict] = Field(default=None, description="Current study plan")
    current_lesson: Optional[Union[dict, str]] = Field(default=None, description="Current lesson details")
    weak_topics: Optional[List[str]] = Field(default=None, description="Weak topics")
    recent_vocab: Optional[List[str]] = Field(default=None, description="Recent vocabulary")
    prev_summary: Optional[str] = Field(default=None, description="Previous summary")
    messages: List[dict] = Field(..., description="List of messages in the session")
