import logging
import time
from groq import AsyncGroq
from app.core.config import settings
from app.providers.base_provider import BaseProvider
from app.core.exceptions import LLMProviderException, TimeoutException

logger = logging.getLogger("app.providers.groq_provider")

class GroqProvider(BaseProvider):
    def __init__(self):
        self.client = AsyncGroq(
            api_key=settings.GROQ_API_KEY,
            timeout=settings.REQUEST_TIMEOUT
        )
        self.model = settings.GROQ_MODEL
        logger.info(f"GroqProvider initialized with model: {self.model}")

    async def complete(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        json_mode: bool = False,
        max_tokens: int = 4096,
    ) -> str:
        start_time = time.perf_counter()
        
        # Log Incoming request details, selected model, and prompt size
        prompt_size = len(system_prompt) + sum(len(m.get("content", "")) for m in messages)
        logger.info(f"[DEBUG LOG] Incoming Request Messages: {messages}")
        logger.info(f"[DEBUG LOG] Loaded Prompt: '{system_prompt}' (size: {len(system_prompt)} chars)")
        logger.info(f"[DEBUG LOG] Selected Model: {self.model}")
        logger.info(f"[DEBUG LOG] Prompt Size: {prompt_size} chars")

        api_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            role = m["role"].lower()
            if role == "assistant":
                api_messages.append({"role": "assistant", "content": m["content"]})
            elif role == "user":
                api_messages.append({"role": "user", "content": m["content"]})
            elif role == "system":
                continue

        kwargs = {
            "model": self.model,
            "messages": api_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        # Log Outgoing request details
        logger.info(f"[DEBUG LOG] Outgoing Request Arguments: {kwargs}")

        try:
            logger.debug(f"Sending request to Groq with model={self.model}, messages_count={len(api_messages)}")
            response = await self.client.chat.completions.create(**kwargs)
            
            duration = time.perf_counter() - start_time
            reply_text = response.choices[0].message.content or ""
            
            # Access token usage and other metadata from the Groq API response
            request_id = getattr(response, "id", None)
            usage = getattr(response, "usage", None)
            prompt_tokens = getattr(usage, "prompt_tokens", None) if usage else None
            completion_tokens = getattr(usage, "completion_tokens", None) if usage else None
            total_tokens = getattr(usage, "total_tokens", None) if usage else None
            
            # Log Groq request id, latency, and tokens
            logger.info(f"[DEBUG LOG] Groq Request ID: {request_id}")
            logger.info(f"[DEBUG LOG] Latency (Response Time): {duration:.4f}s")
            logger.info(f"[DEBUG LOG] Prompt Tokens: {prompt_tokens}")
            logger.info(f"[DEBUG LOG] Completion Tokens: {completion_tokens}")
            logger.info(f"[DEBUG LOG] Total Tokens: {total_tokens}")
            logger.info(f"[DEBUG LOG] Groq Response Received: '{reply_text}'")
            
            return reply_text
        except Exception as e:
            duration = time.perf_counter() - start_time
            status = getattr(e, "status_code", None)
            message = getattr(e, "message", str(e))
            
            request_id = None
            if hasattr(e, "response") and hasattr(e.response, "headers"):
                request_id = e.response.headers.get("x-request-id")

            # Log Error details and response time
            logger.error(
                f"[DEBUG LOG] Groq API Request Failed | status: {status} | "
                f"message: {message} | request_id: {request_id} | duration: {duration:.4f}s",
                exc_info=True
            )
            
            if "timeout" in str(e).lower() or "deadline" in str(e).lower():
                raise TimeoutException("Groq completion request timed out.")
            
            raise LLMProviderException(
                message=f"Groq service error: {message}",
                details={
                    "status_code": status,
                    "error_message": message,
                    "request_id": request_id
                }
            )

    async def health(self) -> bool:
        """Verifies if the Groq provider is configured and reachable."""
        try:
            return bool(self.client.api_key)
        except Exception:
            return False
