import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Zod schema for validating PUT /api/v1/profile request body.
 *
 * Rules:
 * - All fields are optional (partial update supported).
 * - Forbidden fields (email, password, level, etc.) are intentionally absent.
 * - Explicit character limits enforce data integrity at the API boundary.
 *
 * Note: Uses Zod v4 compatible API (`error` instead of `invalid_type_error`).
 */
export const updateProfileSchema = z.object({
  name: z
    .string({ error: 'Name must be a string.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .optional(),

  nativeLanguage: z
    .string({ error: 'Native language must be a string.' })
    .trim()
    .min(1, 'Native language cannot be empty.')
    .optional(),

  learningLanguage: z
    .string({ error: 'Learning language must be a string.' })
    .trim()
    .min(1, 'Learning language cannot be empty.')
    .optional(),

  bio: z
    .string({ error: 'Bio must be a string.' })
    .trim()
    .max(500, 'Bio must not exceed 500 characters.')
    .optional(),

  country: z
    .string({ error: 'Country must be a string.' })
    .trim()
    .max(100, 'Country must not exceed 100 characters.')
    .optional(),

  timezone: z
    .string({ error: 'Timezone must be a string.' })
    .trim()
    .max(100, 'Timezone must not exceed 100 characters.')
    .optional(),

  dailyGoalMinutes: z
    .number({ error: 'Daily goal minutes must be a number.' })
    .int('Daily goal minutes must be an integer.')
    .min(5, 'Daily goal must be at least 5 minutes.')
    .max(240, 'Daily goal must not exceed 240 minutes.')
    .optional(),
});

/**
 * Express middleware that validates the PUT /api/v1/profile request body
 * using the Zod schema. Returns HTTP 400 with structured error details on failure.
 */
export const validateUpdateProfile = (req: Request, res: Response, next: NextFunction): void => {
  const result = updateProfileSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // Replace req.body with the sanitized, validated data
  req.body = result.data;
  next();
};
