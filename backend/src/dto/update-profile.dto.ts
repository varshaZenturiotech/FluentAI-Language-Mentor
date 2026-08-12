/**
 * Data Transfer Object for the PUT /api/v1/profile endpoint.
 * Represents the validated, type-safe shape of an update-profile request body.
 * Only includes fields that are permitted to be updated by the user.
 */
export interface UpdateProfileDto {
  name?: string;
  nativeLanguage?: string;
  learningLanguage?: string;
  bio?: string;
  country?: string;
  timezone?: string;
  dailyGoalMinutes?: number;
}
