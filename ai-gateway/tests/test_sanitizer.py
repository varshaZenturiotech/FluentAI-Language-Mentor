import pytest
from app.utils.sanitizer import sanitize_ai_response

def test_sanitize_normal_response_case_a():
    """Case A: Normal response with no <think> block."""
    text = "Hello! Welcome to your English lesson today."
    assert sanitize_ai_response(text) == text

def test_sanitize_closed_think_block_case_b():
    """Case B: Proper closed thinking block <think>...</think>."""
    text = "<think>Internal reasoning step 1\nStep 2</think>That is a wonderful goal!"
    assert sanitize_ai_response(text) == "That is a wonderful goal!"

def test_sanitize_multiple_think_blocks_case_c():
    """Case C: Multiple thinking blocks."""
    text = "<think>reasoning 1</think>Hello! How are you?\n<think>reasoning 2</think>What are you learning today?"
    expected = "Hello! How are you?\nWhat are you learning today?"
    assert sanitize_ai_response(text) == expected


def test_sanitize_unclosed_think_block_no_answer_case_d():
    """Case D: Unclosed thinking block with NO final answer."""
    text = "<think>Internal reasoning step 1 without closing tag..."
    assert sanitize_ai_response(text) == ""

def test_sanitize_unclosed_think_block_with_answer_case_e():
    """Case E: Unclosed thinking block with usable text before <think>."""
    text = "Hello! <think>Unfinished internal reasoning..."
    assert sanitize_ai_response(text) == "Hello!"

def test_sanitize_empty_string_case_f():
    """Case F: Empty or whitespace-only input."""
    assert sanitize_ai_response("") == ""
    assert sanitize_ai_response("   \n\t ") == ""

def test_sanitize_multiline_think_block():
    text = """<think>
The user is asking a question.
Let's formulate the response carefully.
1. Greet
2. Answer
</think>
Welcome to class! Let's practice speaking."""
    assert sanitize_ai_response(text) == "Welcome to class! Let's practice speaking."

def test_sanitize_orphaned_closing_tag():
    text = "Some internal reasoning</think>That is a great idea!"
    assert sanitize_ai_response(text) == "Some internal reasoning That is a great idea!"

