import { Request, Response, NextFunction } from 'express';
import { LearningService } from '../services/learning.service';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';
import { LanguageLevel } from '@prisma/client';
import { learningMemoryService } from '../services/learning-memory.service';
import { prisma } from '../database/prisma';

/**
 * Learning Controller
 *
 * Responsibility: HTTP request/response handling ONLY.
 * Extracts data from req (params, body, query, user context),
 * calls the service, formats the response.
 * All errors are delegated to the global error handler via next().
 */
export class LearningController {
  private learningService: LearningService;

  constructor(learningService: LearningService = new LearningService()) {
    this.learningService = learningService;
  }

  // ==========================================
  // TODAY XP
  // ==========================================

  async getTodayXp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const data = await this.learningService.getTodayXp(req.user.id);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // VOCABULARY
  // ==========================================

  async getVocabulary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      // If checking progress
      if (req.query.progress === 'true') {
        const data = await prisma.vocabularyProgress.findMany({
          where: { userId: req.user.id },
          orderBy: { lastReviewed: 'desc' },
        });
        res.status(HttpStatusCodes.OK).json({
          success: true,
          data,
        });
        return;
      }

      const query = {
        search: req.query.search as string | undefined,
        sort: req.query.sort as 'newest' | 'oldest' | 'mastered' | 'needs_review' | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const data = await this.learningService.getVocabulary(req.user.id, query);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  async createVocabulary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const data = await this.learningService.createVocabulary(req.user.id, req.body);

      res.status(HttpStatusCodes.CREATED).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVocabulary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const { id } = req.params;
      const data = await this.learningService.updateVocabulary(req.user.id, id, req.body);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteVocabulary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const { id } = req.params;
      await this.learningService.deleteVocabulary(req.user.id, id);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        message: 'Vocabulary entry deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // GRAMMAR
  // ==========================================

  async getGrammarMistakes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const data = await this.learningService.getGrammarMistakes(req.user.id);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async createGrammarMistake(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const data = await this.learningService.createGrammarMistake(req.user.id, req.body);

      res.status(HttpStatusCodes.CREATED).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // LESSONS
  // ==========================================

  async getLessons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const query = {
        level: req.query.level as LanguageLevel | undefined,
        language: req.query.language as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const data = await this.learningService.getLessons(query);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // PROGRESS
  // ==========================================

  async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const data = await this.learningService.getProgress(req.user.id);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async completeLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const data = await this.learningService.completeLesson(req.user.id, req.body);

      res.status(HttpStatusCodes.CREATED).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ACHIEVEMENTS
  // ==========================================

  async getAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const data = await this.learningService.getAchievements(req.user.id);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // HYBRID LEARNING MEMORY SYSTEM
  // ==========================================

  async analyzeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const { sessionId, studyPlanDayId, isFinal } = req.body;
      if (!sessionId) {
        next(ApiError.badRequest('Session ID is required.'));
        return;
      }

      // Trigger background analysis
      learningMemoryService.queueAnalysisJob(req.user.id, sessionId, studyPlanDayId, isFinal === true);

      res.status(HttpStatusCodes.ACCEPTED).json({
        success: true,
        message: 'AI session analysis queued successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  async getWeakTopics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const data = await prisma.weakTopic.findMany({
        where: { userId: req.user.id },
        orderBy: { mistakeCount: 'desc' },
      });

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVocabularyProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const data = await prisma.vocabularyProgress.findMany({
        where: { userId: req.user.id },
        orderBy: { lastReviewed: 'desc' },
      });

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLearningSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const data = await prisma.learningSession.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLearningSessionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const { sessionId } = req.params;
      if (!sessionId) {
        next(ApiError.badRequest('Session ID is required.'));
        return;
      }

      const session = await prisma.learningSession.findFirst({
        where: { sessionId, userId: req.user.id },
      });

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: session || null,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const latestSession = await prisma.learningSession.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });

      let recommendations = null;
      if (latestSession && latestSession.recommendations) {
        try {
          recommendations = JSON.parse(latestSession.recommendations);
        } catch (e) {
          recommendations = {
            focus: 'Continue practicing English speaking',
            reason: 'Practice daily conversations.',
            vocabulary: [],
          };
        }
      }

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const latestSession = await prisma.learningSession.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });

      let summary = null;
      if (latestSession) {
        summary = {
          completedTasks: latestSession.completedTasks,
          weakTopics: latestSession.weakTopics ? JSON.parse(latestSession.weakTopics) : [],
          newWords: latestSession.newWords ? JSON.parse(latestSession.newWords) : [],
          recommendations: latestSession.recommendations ? JSON.parse(latestSession.recommendations) : null,
          grammarScore: latestSession.grammarScore,
          vocabularyScore: latestSession.vocabularyScore,
          fluencyScore: latestSession.fluencyScore,
          confidenceScore: latestSession.confidenceScore,
          pronunciationScore: latestSession.pronunciationScore,
          createdAt: latestSession.createdAt,
        };
      }

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLearningAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }
      const data = await learningMemoryService.getLearningAnalytics(req.user.id);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getXpHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }
      const profile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
      });
      const logs = await prisma.dailyLearningLog.findMany({
        where: { userId: req.user.id },
        orderBy: { date: 'desc' },
        take: 30,
      });
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: {
          totalXp: profile?.totalXP || 0,
          history: logs.map(l => ({
            date: l.date,
            xpEarned: l.minutesStudied * 10 + (l.completedLessons * 20),
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getStreakDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }
      const progress = await prisma.learningProgress.findUnique({
        where: { userId: req.user.id },
      });
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: {
          streak: progress?.streak || 0,
          lastLearningDate: progress?.lastLearningDate || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getGrammarProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }
      const mistakes = await prisma.grammarMistake.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });
      const weakTopics = await prisma.weakTopic.findMany({
        where: { userId: req.user.id },
        orderBy: { mistakeCount: 'desc' },
      });
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: {
          mistakes,
          weakTopics,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
