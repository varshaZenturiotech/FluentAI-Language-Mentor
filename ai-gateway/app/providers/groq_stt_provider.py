import logging
import time
from groq import AsyncGroq
from app.core.config import settings
from app.core.exceptions import SpeechProviderException

logger = logging.getLogger("app.providers.groq_stt_provider")

class GroqSTTProvider:
    def __init__(self):
        self.client = AsyncGroq(
            api_key=settings.GROQ_API_KEY,
            timeout=settings.REQUEST_TIMEOUT
        )
        self.model = settings.GROQ_STT_MODEL
        logger.info(f"GroqSTTProvider initialized with model: {self.model}")

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
        language: str | None
    ) -> str:
        """Asynchronously uploads audio data to Groq's speech-to-text API and returns the transcript.
        Do NOT validate inputs. Assume validation already happened.
        """
        start_time = time.perf_counter()
        logger.info(
            f"Initiating STT transcription | model: {self.model} | filename: {filename} | "
            f"content_type: {content_type} | language: {language}"
        )

        try:
            # Pass (filename, bytes, content_type) tuple to the Groq client
            response = await self.client.audio.transcriptions.create(
                file=(filename, audio_bytes, content_type),
                model=self.model,
                language=language if language else None
            )
            duration = time.perf_counter() - start_time
            logger.info(f"STT transcription successful | duration: {duration:.4f}s")
            return response.text
        except Exception as e:
            duration = time.perf_counter() - start_time
            logger.error(
                f"STT transcription failed | model: {self.model} | filename: {filename} | "
                f"duration: {duration:.4f}s | error: {str(e)}",
                exc_info=True
            )
            raise SpeechProviderException(f"Groq transcription API failed: {str(e)}") from e
