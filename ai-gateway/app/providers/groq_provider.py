import asyncio
import logging
import time
from groq import AsyncGroq
from app.core.config import settings
from app.providers.base_provider import BaseProvider
from app.core.exceptions import LLMProviderException, TimeoutException, LLMRateLimitException

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
        max_tokens: int = 1024,
    ) -> str:

        start_time = time.perf_counter()
        
        # Log incoming request details safely
        prompt_size = len(system_prompt) + sum(len(m.get("content", "")) for m in messages)
        logger.info(f"[MODEL_REQUEST_SENDING] provider=groq model={settings.GROQ_MODEL} messages_count={len(messages)} promptSize={prompt_size} maxTokens={max_tokens}")

        api_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            role = m["role"].lower()
            if role == "assistant":
                api_messages.append({"role": "assistant", "content": m["content"]})
            elif role == "user":
                api_messages.append({"role": "user", "content": m["content"]})
            elif role == "system":
                continue

        current_model = settings.GROQ_MODEL
        kwargs = {
            "model": current_model,
            "messages": api_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        max_attempts = 3
        for attempt in range(1, max_attempts + 1):
            try:
                logger.debug(f"Sending request to Groq with model={current_model}, attempt={attempt}, messages_count={len(api_messages)}")
                response = await self.client.chat.completions.create(**kwargs)
                
                duration = time.perf_counter() - start_time
                msg_obj = response.choices[0].message
                reply_text = getattr(msg_obj, "content", "") or ""
                
                # Inspect for structured reasoning fields if exposed by provider SDK
                structured_reasoning = getattr(msg_obj, "reasoning", None) or getattr(msg_obj, "reasoning_content", None)
                if structured_reasoning:
                    logger.info(f"[AI_REASONING_DETECTED] Provider returned separate structured reasoning field | length={len(structured_reasoning)}")

                # Access token usage and other metadata from the Groq API response
                request_id = getattr(response, "id", None)
                usage = getattr(response, "usage", None)
                prompt_tokens = getattr(usage, "prompt_tokens", None) if usage else None
                completion_tokens = getattr(usage, "completion_tokens", None) if usage else None
                total_tokens = getattr(usage, "total_tokens", None) if usage else None
                
                # Log structured summary without logging sensitive prompts or auth
                logger.info(
                    f"[MODEL_RESPONSE_RECEIVED] provider=groq model={current_model} request_id={request_id} "
                    f"rawLength={len(reply_text)} promptTokens={prompt_tokens} completionTokens={completion_tokens} "
                    f"totalTokens={total_tokens} duration={duration:.4f}s"
                )
                
                return reply_text

            except Exception as e:
                duration = time.perf_counter() - start_time
                status = getattr(e, "status_code", None)
                message = getattr(e, "message", str(e))
                
                request_id = None
                retry_after = None
                if hasattr(e, "response") and hasattr(e.response, "headers"):
                    request_id = e.response.headers.get("x-request-id")
                    retry_after = e.response.headers.get("retry-after")

                is_rate_limit = status == 429 or "429" in str(e) or "rate limit" in str(e).lower() or "tokens per minute" in str(e).lower()

                if is_rate_limit and attempt < max_attempts:
                    sleep_time = 3.0
                    if retry_after:
                        try:
                            sleep_time = min(float(retry_after), 6.0)
                        except (ValueError, TypeError):
                            sleep_time = 3.0
                    logger.warning(
                        f"[AI_RATE_LIMITED_RETRY] Groq Rate Limit Reached (Attempt {attempt}/{max_attempts}). "
                        f"Waiting {sleep_time}s before retrying request..."
                    )
                    await asyncio.sleep(sleep_time)
                    continue

                # Log Error details and response time
                logger.error(
                    f"[DEBUG LOG] Groq API Request Failed | status: {status} | "
                    f"message: {message} | request_id: {request_id} | duration: {duration:.4f}s",
                    exc_info=True
                )
                
                if is_rate_limit:
                    logger.warning(
                        f"[AI_RATE_LIMITED] Groq Rate Limit Reached | status: 429 | "
                        f"message: {message} | request_id: {request_id} | duration: {duration:.4f}s"
                    )
                    raise LLMRateLimitException(
                        message=f"Groq rate limit exceeded: {message}",
                        details={
                            "provider": "groq",
                            "request_id": request_id,
                            "retry_after": retry_after
                        }
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
