import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// ==========================================
// ZOD SCHEMAS
// ==========================================

export const createVocabularySchema = z.object({
  word: z
    .string({ error: 'Word must be a string.' })
    .trim()
    .min(1, 'Word is required.')
    .max(200, 'Word must not exceed 200 characters.'),
  meaning: z
    .string({ error: 'Meaning must be a string.' })
    .trim()
    .min(1, 'Meaning is required.')
    .max(500, 'Meaning must not exceed 500 characters.'),
  example: z
    .string({ error: 'Example must be a string.' })
    .trim()
    .max(1000, 'Example must not exceed 1000 characters.')
    .optional(),
  language: z
    .string({ error: 'Language must be a string.' })
    .trim()
    .min(1, 'Language is required.')
    .max(50, 'Language must not exceed 50 characters.'),
  difficulty: z
    .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
      error: 'Difficulty must be one of: BEGINNER, INTERMEDIATE, ADVANCED.',
    })
    .optional(),
});

export const updateVocabularySchema = z.object({
  word: z
    .string({ error: 'Word must be a string.' })
    .trim()
    .min(1, 'Word cannot be empty.')
    .max(200, 'Word must not exceed 200 characters.')
    .optional(),
  meaning: z
    .string({ error: 'Meaning must be a string.' })
    .trim()
    .min(1, 'Meaning cannot be empty.')
    .max(500, 'Meaning must not exceed 500 characters.')
    .optional(),
  example: z
    .string({ error: 'Example must be a string.' })
    .trim()
    .max(1000, 'Example must not exceed 1000 characters.')
    .optional(),
  language: z
    .string({ error: 'Language must be a string.' })
    .trim()
    .min(1, 'Language cannot be empty.')
    .max(50, 'Language must not exceed 50 characters.')
    .optional(),
  difficulty: z
    .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], {
      error: 'Difficulty must be one of: BEGINNER, INTERMEDIATE, ADVANCED.',
    })
    .optional(),
  mastered: z.boolean({ error: 'Mastered must be a boolean.' }).optional(),
  reviewCount: z
    .number({ error: 'Review count must be a number.' })
    .int('Review count must be an integer.')
    .min(0, 'Review count cannot be negative.')
    .optional(),
  lastReviewedAt: z
    .string({ error: 'Last reviewed at must be a valid date string.' })
    .datetime('Last reviewed at must be a valid ISO 8601 date.')
    .optional(),
  nextReviewAt: z
    .string({ error: 'Next review at must be a valid date string.' })
    .datetime('Next review at must be a valid ISO 8601 date.')
    .optional(),
});

export const createGrammarSchema = z.object({
  sentence: z
    .string({ error: 'Sentence must be a string.' })
    .trim()
    .min(1, 'Sentence is required.')
    .max(2000, 'Sentence must not exceed 2000 characters.'),
  correctSentence: z
    .string({ error: 'Correct sentence must be a string.' })
    .trim()
    .min(1, 'Correct sentence is required.')
    .max(2000, 'Correct sentence must not exceed 2000 characters.'),
  explanation: z
    .string({ error: 'Explanation must be a string.' })
    .trim()
    .max(2000, 'Explanation must not exceed 2000 characters.')
    .optional(),
  grammarRule: z
    .string({ error: 'Grammar rule must be a string.' })
    .trim()
    .max(200, 'Grammar rule must not exceed 200 characters.')
    .optional(),
  mistakeType: z
    .string({ error: 'Mistake type must be a string.' })
    .trim()
    .max(100, 'Mistake type must not exceed 100 characters.')
    .optional(),
});

export const createProgressSchema = z.object({
  lessonId: z
    .string({ error: 'Lesson ID must be a string.' })
    .uuid('Lesson ID must be a valid UUID.'),
  score: z
    .number({ error: 'Score must be a number.' })
    .int('Score must be an integer.')
    .min(0, 'Score cannot be negative.')
    .max(100, 'Score cannot exceed 100.'),
});

// ==========================================
// VALIDATION MIDDLEWARE FACTORY
// ==========================================

/**
 * Creates an Express validation middleware from a Zod schema.
 * Centralises the repetitive parse → 400-response pattern used across all validators.
 */
function validate(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

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
}

// ==========================================
// MIDDLEWARE EXPORTS
// ==========================================

export const validateCreateVocabulary = validate(createVocabularySchema);
export const validateUpdateVocabulary = validate(updateVocabularySchema);
export const validateCreateGrammar = validate(createGrammarSchema);
export const validateCreateProgress = validate(createProgressSchema);
