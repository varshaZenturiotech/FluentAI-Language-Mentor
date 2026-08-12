from pydantic import BaseModel, Field

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text string to translate")
    source_language: str | None = Field(
        default=None, 
        description="Optional source language code (e.g. 'en'). Detected automatically if omitted."
    )
    target_language: str = Field(..., description="Target language code (e.g. 'ml' for Malayalam)")

class TranslateResponse(BaseModel):
    translated_text: str = Field(..., description="The translated text output")
    detected_source_language: str | None = Field(
        default=None, 
        description="The source language code detected by the model (if not provided in the request)"
    )
