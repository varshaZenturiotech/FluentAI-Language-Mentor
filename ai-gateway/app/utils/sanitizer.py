import re
import logging

logger = logging.getLogger("app.utils.sanitizer")

def sanitize_ai_response(text: str) -> str:
    """Sanitizes raw LLM output before it is returned or persisted.
    
    1. Removes all closed <think>...</think> blocks (including multiline).
    2. Handles unclosed <think> blocks (where <think> appears without a matching </think>)
       by preserving content before <think> and removing reasoning after <think>.
    3. Handles orphaned </think> tags.
    4. Handles multiple <think> blocks.
    5. Strips leading/trailing whitespace while preserving natural sentence layout.
    """
    if not text or not text.strip():
        return ""

    cleaned = text

    # 1. Remove all closed <think>...</think> blocks (case-insensitive, dotall mode)
    cleaned = re.sub(r"(?i)<think>[\s\S]*?</think>", "", cleaned)

    # 2. Handle unclosed <think> blocks: if an unclosed <think> tag remains, truncate from <think> onwards
    match = re.search(r"(?i)<think>", cleaned)
    if match:
        logger.warning("[AI_SANITIZER] Unclosed <think> tag detected. Truncating reasoning content.")
        cleaned = cleaned[:match.start()]

    # 3. Clean up orphaned </think> tags if any remain
    cleaned = re.sub(r"(?i)</think>", " ", cleaned)


    # 4. Clean up whitespace: strip surrounding whitespace and collapse multi-newlines
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned)
    return cleaned.strip()

