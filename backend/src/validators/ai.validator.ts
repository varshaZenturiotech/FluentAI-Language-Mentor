import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const chatSchema = z.object({
  sessionId: z.string({ error: 'sessionId is required.' }).uuid('sessionId must be a valid UUID.'),
  message: z.string({ error: 'message is required.' }).trim().min(1, 'message cannot be empty.'),
  language: z.string({ error: 'language is required.' }).trim().min(1, 'language cannot be empty.'),
});

export const translateSchema = z.object({
  text: z
    .string({ error: 'text is required.' })
    .trim()
    .min(1, 'text cannot be empty.')
    .max(5000, 'text cannot exceed 5000 characters.'),
  sourceLanguage: z.string({ error: 'sourceLanguage must be a string.' }).trim().optional(),
  targetLanguage: z
    .string({ error: 'targetLanguage is required.' })
    .trim()
    .min(1, 'targetLanguage cannot be empty.'),
});

export const feedbackSchema = z.object({
  sessionId: z.string({ error: 'sessionId is required.' }).uuid('sessionId must be a valid UUID.'),
  transcript: z
    .string({ error: 'transcript is required.' })
    .trim()
    .min(1, 'transcript cannot be empty.'),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['USER', 'ASSISTANT'], { error: 'role must be USER or ASSISTANT.' }),
        content: z.string({ error: 'content is required.' }).min(1, 'content cannot be empty.'),
      })
    )
    .optional(),
  targetLanguage: z
    .string({ error: 'targetLanguage is required.' })
    .trim()
    .min(1, 'targetLanguage cannot be empty.'),
  proficiencyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
});

export const pronunciationSchema = z.object({
  sessionId: z.string({ error: 'sessionId is required.' }).uuid('sessionId must be a valid UUID.'),
  audioUrl: z
    .string({ error: 'audioUrl is required.' })
    .trim()
    .url('audioUrl must be a valid URL.'),
  referenceText: z
    .string({ error: 'referenceText is required.' })
    .trim()
    .min(1, 'referenceText cannot be empty.'),
});

export const speechSchema = z.object({
  language: z.string({ error: 'language is required.' }).trim().min(1, 'language cannot be empty.'),
});

const createValidator = (schema: z.ZodSchema) => {
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
};

export const validateChat = createValidator(chatSchema);
export const validateTranslate = createValidator(translateSchema);
export const validateFeedback = createValidator(feedbackSchema);
export const validatePronunciation = createValidator(pronunciationSchema);
export const validateSpeech = createValidator(speechSchema);
