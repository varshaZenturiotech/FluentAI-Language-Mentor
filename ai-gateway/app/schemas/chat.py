from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    sessionId: str = Field(..., description="Unique UUID session identifier")
    message: str = Field(..., min_length=1, description="Content of the user's message")
    language: str = Field(..., min_length=1, description="Language code, e.g. 'en'")
    history: Optional[List[ChatMessage]] = Field(default=None, description="Optional conversation history")
    lessonContext: Optional[Dict] = Field(default=None, description="Optional lesson context")
    learnerProfile: Optional[Dict] = Field(default=None, description="Optional learner profile")
    learningMemory: Optional[Dict] = Field(default=None, description="Optional learning memory")
    baseline: Optional[Dict] = Field(default=None, description="Optional baseline assessment")
    studyPlan: Optional[Dict] = Field(default=None, description="Optional study plan metadata")
    progress: Optional[Dict] = Field(default=None, description="Optional overall progress")

    model_config = {
        "populate_by_name": True
    }

class LessonInitRequest(BaseModel):
    sessionId: str = Field(..., description="Unique UUID session identifier")
    language: str = Field(default="en", description="Language code")
    learnerProfile: Optional[Dict] = Field(default=None, description="Learner profile metadata")
    baseline: Optional[Dict] = Field(default=None, description="Baseline assessment metadata")
    lessonContext: Optional[Dict] = Field(default=None, description="Current study plan day/lesson metadata")
    studyPlan: Optional[Dict] = Field(default=None, description="Full study plan metadata")
    progress: Optional[Dict] = Field(default=None, description="Overall progress metadata")
    learningMemory: Optional[Dict] = Field(default=None, description="Learning memory metadata")

    model_config = {
        "populate_by_name": True
    }

class ChatResponse(BaseModel):
    reply: str = Field(..., description="AI generated mentor response")
    provider: str = Field(..., description="LLM provider name (e.g. 'groq')")
    model: str = Field(..., description="Name of the model that served the request")
    lessonComplete: bool = Field(default=False, description="Whether all active lesson objectives are complete")
    completedObjectives: List[str] = Field(default_factory=list, description="List of objectives completed during session")


