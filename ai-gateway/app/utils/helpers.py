import json
import re
import logging
from typing import Any

logger = logging.getLogger("app.utils.helpers")

def extract_json_from_text(text: str) -> dict[str, Any] | None:
    """Robust helper to extract and parse JSON from a string that might be wrapped
    in markdown code blocks or contain prefix/suffix text.
    """
    if not text:
        return None
        
    cleaned_text = text.strip()
    
    # 1. Try to parse directly first
    try:
        return json.loads(cleaned_text)
    except json.JSONDecodeError:
        pass

    # 2. Try to extract from markdown code blocks: ```json ... ``` or ``` ... ```
    markdown_pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    match = re.search(markdown_pattern, cleaned_text)
    if match:
        json_content = match.group(1).strip()
        try:
            return json.loads(json_content)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON extracted from markdown block: {e}")

    # 3. Fallback: Find the first '{' and the last '}' and parse what is in between
    first_brace = cleaned_text.find("{")
    last_brace = cleaned_text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        json_content = cleaned_text[first_brace:last_brace + 1]
        try:
            return json.loads(json_content)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON extracted between curly braces: {e}")
            
    logger.error(f"Could not extract parseable JSON from text: {text[:100]}...")
    return None

def sanitize_string(text: str) -> str:
    """Cleans up extra whitespace, line breaks, or double-quotes from a string."""
    if not text:
        return ""
    # Standardize spaces and strip
    return " ".join(text.split()).strip()
