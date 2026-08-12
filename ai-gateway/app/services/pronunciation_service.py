import logging
from app.schemas.pronunciation import PronunciationRequest, PronunciationResponse, WordScore, PhonemeScore

logger = logging.getLogger("app.services.pronunciation_service")

class PronunciationService:
    """Pronunciation Scoring Service Interface.
    
    DESIGN CONSTRAINT & LATENCY CRITICAL NOTE:
    -------------------------------------------
    This endpoint evaluates speech quality and is computationally heavy. It is designed 
    to be called asynchronously (fire-and-forget / background tasks) from the Node.js backend, 
    with results delivered out-of-band (e.g. via webhook or polling). 
    
    It MUST NOT be chained synchronously during the main conversation loop (/converse),
    otherwise the turn-around voice roundtrip will exceed the ~3s latency threshold.
    """
    
    async def evaluate_speech(self, request: PronunciationRequest) -> PronunciationResponse:
        """Processes audio data and returns detailed phoneme-level pronunciation scores.
        Currently a placeholder interface returning high-fidelity mock scores.
        """
        logger.info(
            f"Asynchronously initiating pronunciation scoring for session_id: {request.session_id} | "
            f"audio_url: {request.audio_url}"
        )
        
        # Split words from reference text to simulate word-by-word scoring
        reference_words = request.reference_text.split()
        mock_words = []
        
        for idx, word in enumerate(reference_words[:3]):  # Limit to first 3 words in placeholder
            mock_words.append(
                WordScore(
                    word=word,
                    score=85.0 + idx,  # Mock score
                    phonemes=[
                        PhonemeScore(phoneme="aa", score=82.0 + idx),
                        PhonemeScore(phoneme="r", score=88.0 + idx)
                    ]
                )
            )

        # Build high-fidelity dummy response matching expected schema
        return PronunciationResponse(
            overall_score=86.5,
            accuracy_score=87.0,
            fluency_score=84.0,
            completeness_score=95.0,
            words=mock_words
        )

# Singleton service instance
pronunciation_service = PronunciationService()
