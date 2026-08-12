import logging
from app.schemas.translate import TranslateRequest, TranslateResponse
from app.services.llm_router import llm_router
from app.utils.helpers import extract_json_from_text
from app.core.exceptions import LLMProviderException

logger = logging.getLogger("app.services.translation_service")

SYSTEM_PROMPT = """You are a highly accurate translation system.
Translate the input text cleanly and preserve the original tone, context, and meaning.

You MUST respond strictly with a single JSON object. Do not prefix or suffix your response with markdown decorators or explanatory text outside the JSON. The JSON structure must match the following schema:
{
  "translated_text": "The translated text in the requested target language.",
  "detected_source_language": "The 2-letter ISO 639-1 code of the language you detected from the input text (e.g. 'en', 'ml', 'es')."
}
"""

class TranslationService:
    async def translate_text(self, request: TranslateRequest) -> TranslateResponse:
        """Translates text to target language in a provider-agnostic manner."""
        logger.info(
            f"Processing translation | target_language: {request.target_language} | "
            f"text_len: {len(request.text)} chars"
        )
        
        # Build user prompt instruction
        source_lang_str = request.source_language if request.source_language else "Detect automatically"
        user_content = (
            f"Target Language: {request.target_language}\n"
            f"Source Language (Hint): {source_lang_str}\n"
            f"Text to translate:\n\"\"\"\n{request.text}\n\"\"\""
        )

        messages = [
            {"role": "user", "content": user_content}
        ]

        # Call active provider via LLM router
        provider = llm_router.get_provider()
        raw_output = await provider.complete(
            system_prompt=SYSTEM_PROMPT,
            messages=messages,
            temperature=0.0,  # 0.0 is critical for translations to ensure consistency
            json_mode=True
        )

        # Extract and parse JSON response
        json_data = extract_json_from_text(raw_output)
        if not json_data:
            logger.error("Failed to parse JSON response from translator LLM.")
            raise LLMProviderException("Translation service failed to generate parseable output.")

        translated_text = json_data.get("translated_text", "").strip()
        detected_lang = json_data.get("detected_source_language", "").strip().lower()

        if not translated_text:
            logger.error("LLM translation returned empty translated_text.")
            raise LLMProviderException("Translation service output was empty.")

        return TranslateResponse(
            translated_text=translated_text,
            detected_source_language=detected_lang if detected_lang else request.source_language
        )

# Singleton service instance
translation_service = TranslationService()
