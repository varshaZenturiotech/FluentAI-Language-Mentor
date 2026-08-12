/**
 * Central learning constants shared across the FluentAI backend.
 * Import these wherever mastery thresholds, skill priorities, or plan
 * versioning decisions are evaluated — never scatter literal values.
 */

/**
 * The minimum mastery score (0–100) for an objective to be considered MASTERED.
 * Used in:
 *  - Study-plan service & repository for objective status calculation
 *  - Learning-analytics endpoint responses
 *  - Frontend display logic (returned as objectiveMasteryThreshold on plan response)
 *  - Test assertions
 */
export const OBJECTIVE_MASTERY_THRESHOLD = 70;

/**
 * Priority score cut-offs for skill prioritization in calculateSkillPriorities().
 * A priorityScore >= CRITICAL_THRESHOLD is labelled 'critical', etc.
 */
export const SKILL_PRIORITY_THRESHOLDS = {
  CRITICAL: 70,
  HIGH: 50,
  MEDIUM: 30,
  LOW: 15,
} as const;
