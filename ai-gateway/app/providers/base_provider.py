from abc import ABC, abstractmethod

class BaseProvider(ABC):
    """Abstract interface for the LLM provider."""
    
    @abstractmethod
    async def complete(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        temperature: float = 0.0,
        json_mode: bool = False,
        max_tokens: int = 4096,
    ) -> str:
        """Asynchronously generates completion text for the given message payload.
        
        Args:
            system_prompt: Guidelines or system instructions for the LLM behavior.
            messages: List of conversation history turns, each formatted as {"role": "user"|"assistant", "content": str}.
            temperature: LLM temperature parameter (default 0.0 for deterministic output).
            json_mode: Request output formatted as structured JSON where supported by the provider.
            
        Returns:
            Raw response text from the LLM.
        """
        pass
