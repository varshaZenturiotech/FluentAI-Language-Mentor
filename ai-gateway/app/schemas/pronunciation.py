from pydantic import BaseModel, Field

class PronunciationRequest(BaseModel):
    session_id: str = Field(..., description="UUID corresponding to ConversationSession.id")
    user_id: str = Field(..., description="UUID of the user")
    audio_url: str = Field(..., description="URL to the uploaded audio clip to be evaluated")
    reference_text: str = Field(..., description="The target text that the user attempted to pronounce")

class PhonemeScore(BaseModel):
    phoneme: str
    score: float = Field(..., description="Individual phoneme pronunciation score (0-100)")

class WordScore(BaseModel):
    word: str
    score: float = Field(..., description="Individual word pronunciation score (0-100)")
    phonemes: list[PhonemeScore] = Field(default_factory=list)

class PronunciationResponse(BaseModel):
    overall_score: float = Field(..., description="Overall aggregated pronunciation quality score (0-100)")
    accuracy_score: float = Field(..., description="Pronunciation accuracy score (0-100)")
    fluency_score: float = Field(..., description="Speech fluency score (0-100)")
    completeness_score: float = Field(..., description="Percentage of reference text pronounced (0-100)")
    words: list[WordScore] = Field(default_factory=list)
