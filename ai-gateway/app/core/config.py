import os
from typing import Self
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GROQ_API_KEY: str = Field(..., description="API key for Groq")
    GROQ_MODEL: str = Field(default="llama-3.1-8b-instant", description="Model name for Groq completions")
    GROQ_STT_MODEL: str = Field(default="whisper-large-v3", description="Model name for Groq speech-to-text")
    REQUEST_TIMEOUT: float = Field(default=10.0, description="Global request timeout in seconds")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level (DEBUG, INFO, WARNING, ERROR)")
    INTERNAL_API_KEY: str = Field(..., description="Shared secret key for authentication with Node backend")
    PORT: int = Field(default=5001, description="Port on which the FastAPI application runs")
    MAX_AUDIO_UPLOAD_SIZE_MB: int = Field(default=25, description="Maximum audio upload file size in megabytes")
    BACKEND_URL: str = Field(default="http://localhost:5000", description="Backend URL")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

    @field_validator("INTERNAL_API_KEY")
    @classmethod
    def validate_internal_key(cls, v: str) -> str:
        if not v or v.strip() == "":
            raise ValueError("INTERNAL_API_KEY must be configured and cannot be empty")
        return v

    @field_validator("GROQ_API_KEY")
    @classmethod
    def validate_groq_key(cls, v: str) -> str:
        if not v or v.strip() == "":
            raise ValueError("GROQ_API_KEY must be configured and cannot be empty")
        return v

# Create a singleton settings instance
# This will trigger verification immediately at import time to fail-fast
settings = Settings()
