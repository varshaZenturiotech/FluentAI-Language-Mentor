from app.core.config import settings

# Supported audio format MIME types
SUPPORTED_AUDIO_TYPES = {
    "audio/webm",
    "audio/wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/ogg",
    "audio/flac",
    "audio/mp4",
    "audio/x-m4a"
}

# Max allowed size in bytes (1 MB = 1024 * 1024 bytes)
MAX_AUDIO_SIZE = settings.MAX_AUDIO_UPLOAD_SIZE_MB * 1024 * 1024

def validate_mime_type(mime_type: str | None) -> bool:
    """Verifies that the provided MIME type is in the supported types."""
    if not mime_type:
        return False
    return mime_type.lower().strip() in SUPPORTED_AUDIO_TYPES

def validate_file_size(file_size_bytes: int, max_bytes: int = MAX_AUDIO_SIZE) -> bool:
    """Verifies that the file size is less than or equal to max allowed bytes."""
    return file_size_bytes <= max_bytes
