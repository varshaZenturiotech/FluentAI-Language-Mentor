"""
Central learning constants for the FluentAI AI Gateway.
Import from here — never hard-code literal threshold values.
"""

# Minimum mastery score (0–100) for an objective to be considered MASTERED.
# Must match OBJECTIVE_MASTERY_THRESHOLD in backend/src/constants/learningConstants.ts
OBJECTIVE_MASTERY_THRESHOLD: int = 70
