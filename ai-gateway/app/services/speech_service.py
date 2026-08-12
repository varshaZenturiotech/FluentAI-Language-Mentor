import logging
import time
from app.providers.groq_stt_provider import GroqSTTProvider
from app.utils.audio import validate_mime_type, validate_file_size, MAX_AUDIO_SIZE
from app.core.exceptions import SpeechProviderException, SpeechValidationException

logger = logging.getLogger("app.services.speech_service")

class SpeechService:
    def __init__(self, provider: GroqSTTProvider = None):
        """Constructor injection of GroqSTTProvider."""
        self.provider = provider or GroqSTTProvider()

    async def validate_audio(self, file, language: str | None) -> dict:
        """Validates incoming audio upload request: checks file existence, language, file size, and MIME type.
        Does NOT raise HTTPException. Raises SpeechValidationException instead.
        """
        # 1. Validate file exists
        if not file or not file.filename:
            logger.warning("Audio validation failed: Missing audio file.")
            raise SpeechValidationException("Audio file is required.", status_code=400)

        # 2. Validate language exists
        if not language or not language.strip():
            logger.warning("Audio validation failed: Missing language.")
            raise SpeechValidationException("Language is required.", status_code=400)

        # Determine file size using the underlying synchronous file object
        try:
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)
        except Exception as e:
            logger.error(f"Failed to read file size: {e}")
            raise SpeechValidationException("Failed to read audio file size.", status_code=500)

        # 3. Validate maximum size
        if not validate_file_size(file_size):
            logger.warning(f"Audio validation failed: File size {file_size} bytes exceeds maximum size {MAX_AUDIO_SIZE} bytes.")
            raise SpeechValidationException("Audio file exceeds the maximum allowed size.", status_code=413)

        # 4. Validate MIME type
        if not validate_mime_type(file.content_type):
            logger.warning(f"Audio validation failed: Unsupported MIME type {file.content_type}.")
            raise SpeechValidationException("Unsupported audio format.", status_code=415)

        return {
            "success": True,
            "message": "Audio validation successful."
        }

    async def transcribe(self, file, language: str) -> dict:
        """Orchestrates speech validation, reads bytes, calls the STT provider, and returns the transcript.
        Does NOT raise HTTPException.
        """
        start_time = time.perf_counter()
        filename = file.filename if file else "None"
        
        logger.info(f"Speech transcription request started | filename: {filename} | language: {language}")

        # 1. Validate audio inputs (reusing validation utilities)
        await self.validate_audio(file, language)

        # Get file size for logging
        try:
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)
        except Exception:
            file_size = 0

        logger.info(f"Validation completed | filename: {filename} | size: {file_size} bytes")

        # 2. Read bytes into memory once
        try:
            audio_bytes = await file.read()
        except Exception as e:
            logger.error(f"Failed to read audio bytes: {e}")
            raise SpeechValidationException("Failed to read uploaded file data.", status_code=500)

        # 3. Call GroqSTTProvider.transcribe()
        logger.info(f"Groq transcription request started | filename: {filename}")
        try:
            transcript = await self.provider.transcribe(
                audio_bytes=audio_bytes,
                filename=filename,
                content_type=file.content_type,
                language=language
            )
        except SpeechProviderException as e:
            logger.error(f"Speech provider transcription failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected speech transcription failure: {e}")
            raise SpeechProviderException(f"Unexpected speech transcription failure: {str(e)}") from e

        total_time = time.perf_counter() - start_time
        logger.info(f"Groq transcription completed successfully | duration: {total_time:.4f}s")

        return {
            "success": True,
            "transcript": transcript
        }

# Singleton service instance
speech_service = SpeechService()
