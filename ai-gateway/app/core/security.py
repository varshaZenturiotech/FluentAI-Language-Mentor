import secrets
from app.core.config import settings

def validate_internal_api_key(provided_key: str | None) -> bool:
    """Compares the provided API key with the configured INTERNAL_API_KEY.
    Uses constant-time comparison to prevent timing attacks.
    """
    if not provided_key:
        return False
    return secrets.compare_digest(provided_key, settings.INTERNAL_API_KEY)
