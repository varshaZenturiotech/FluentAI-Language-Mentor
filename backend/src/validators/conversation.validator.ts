import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Zod schema for POST /api/v1/conversations (create session).
 *
 * Rules:
 * - title: required, 1–100 characters, trimmed.
 */
export const createSessionSchema = z.object({
  title: z
    .string({ error: 'Title must be a string.' })
    .trim()
    .min(1, 'Title is required.')
    .max(100, 'Title must not exceed 100 characters.'),
  topic: z
    .string({ error: 'Topic must be a string.' })
    .trim()
    .max(100, 'Topic must not exceed 100 characters.')
    .optional(),
  lessonType: z
    .string({ error: 'Lesson type must be a string.' })
    .trim()
    .max(100, 'Lesson type must not exceed 100 characters.')
    .optional(),
  language: z
    .string({ error: 'Language must be a string.' })
    .trim()
    .min(1, 'Language cannot be empty.')
    .optional(),
  difficulty: z
    .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
      error: 'Difficulty must be one of: BEGINNER, INTERMEDIATE, ADVANCED.',
    })
    .optional(),
});

/**
 * Zod schema for POST /api/v1/conversations/:sessionId/messages (create message).
 *
 * Rules:
 * - role: must be one of USER, ASSISTANT, SYSTEM (matches Prisma MessageRole enum).
 * - content: required, 1–5000 characters, trimmed.
 */
export const createMessageSchema = z.object({
  role: z.enum(['USER', 'ASSISTANT', 'SYSTEM'], {
    error: 'Role must be one of: USER, ASSISTANT, SYSTEM.',
  }),
  content: z
    .string({ error: 'Content must be a string.' })
    .trim()
    .min(1, 'Message content is required.')
    .max(5000, 'Message content must not exceed 5000 characters.'),
  translatedText: z.string({ error: 'Translated text must be a string.' }).trim().optional(),
  correctedText: z.string({ error: 'Corrected text must be a string.' }).trim().optional(),
  feedback: z.string({ error: 'Feedback must be a string.' }).trim().optional(),
});

/**
 * Express middleware that validates the POST /api/v1/conversations request body.
 * Returns HTTP 400 with structured error details on failure.
 */
export const validateCreateSession = (req: Request, res: Response, next: NextFunction): void => {
  const result = createSessionSchema.safeParse(req.body);

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

  req.body = result.data;
  next();
};

/**
 * Express middleware that validates the POST /api/v1/conversations/:sessionId/messages request body.
 * Returns HTTP 400 with structured error details on failure.
 */
export const validateCreateMessage = (req: Request, res: Response, next: NextFunction): void => {
  const result = createMessageSchema.safeParse(req.body);

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

  req.body = result.data;
  next();
};
