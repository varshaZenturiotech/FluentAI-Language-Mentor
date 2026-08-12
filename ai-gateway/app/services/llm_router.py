import logging
from app.providers.base_provider import BaseProvider
from app.providers.groq_provider import GroqProvider

logger = logging.getLogger("app.services.llm_router")

class LLMRouter:
    """Router simplified to always cache and return the unified Groq Provider instance."""
    
    def __init__(self):
        logger.info("Initializing LLM Router with unified GroqProvider")
        self._provider = GroqProvider()

    def get_provider(self) -> BaseProvider:
        """Returns the active Groq concrete instance of BaseProvider."""
        return self._provider

# Singleton router instance
llm_router = LLMRouter()
