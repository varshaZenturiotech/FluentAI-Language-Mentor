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

    model_config = {
        "populate_by_name": True
    }

class ChatResponse(BaseModel):
    reply: str = Field(..., description="AI generated mentor response")
    provider: str = Field(..., description="LLM provider name (e.g. 'groq')")
    model: str = Field(..., description="Name of the model that served the request")

