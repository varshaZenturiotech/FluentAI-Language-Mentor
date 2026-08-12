import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from app.services.speech_service import speech_service
from app.schemas.speech import UploadAudioResponse

router = APIRouter(tags=["Speech"])
logger = logging.getLogger("app.api.speech")

@router.post("/speech/transcribe")
async def transcribe_audio(
    file: UploadFile = File(None),
    language: str = Form(None)
):
    """Uploads audio file and checks validity.
    Verification endpoint for Module 7C.3.
    """
    logger.info("Received request on POST /api/v1/speech/transcribe")
    try:
        result = await speech_service.transcribe(file=file, language=language)
        return result
    except Exception as exc:
        status_code = getattr(exc, "status_code", 500)
        detail = getattr(exc, "message", str(exc))
        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "message": detail
            }
        )
