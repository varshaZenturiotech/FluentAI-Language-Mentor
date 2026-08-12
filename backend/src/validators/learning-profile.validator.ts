import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const learningProfileSchema = z.object({
  ageGroup: z.string({ error: 'Age group is required.' }).trim().min(1, 'Age group cannot be empty.'),
  occupation: z.string().trim().optional().nullable(),
  englishLevel: z.string({ error: 'English level is required.' }).trim().min(1, 'English level cannot be empty.'),
  nativeLanguage: z.string({ error: 'Native language is required.' }).trim().min(1, 'Native language cannot be empty.'),
  dailyGoal: z.number({ error: 'Daily goal is required.' }).int().min(5, 'Daily goal must be at least 5 minutes.').max(240, 'Daily goal cannot exceed 240 minutes.'),
  goals: z.array(z.string()).min(1, 'At least one learning goal is required.'),
  interests: z.array(z.string()).min(1, 'At least one interest is required.'),
  baselineSkills: z.object({
    grammar: z.number().int().min(0).max(100),
    vocabulary: z.number().int().min(0).max(100),
    reading: z.number().int().min(0).max(100),
    speaking: z.number().int().min(0).max(100),
    listening: z.number().int().min(0).max(100),
    writing: z.number().int().min(0).max(100),
    pronunciation: z.number().int().min(0).max(100),
    fluency: z.number().int().min(0).max(100),
  }).optional().nullable(),
});

export const validateLearningProfile = (req: Request, res: Response, next: NextFunction): void => {
  const result = learningProfileSchema.safeParse(req.body);

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
