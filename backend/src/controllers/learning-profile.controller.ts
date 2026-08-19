import { Request, Response, NextFunction } from 'express';
import { LearningProfileService } from '../services/learning-profile.service';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';

export class LearningProfileController {
  private learningProfileService: LearningProfileService;

  constructor(learningProfileService: LearningProfileService = new LearningProfileService()) {
    this.learningProfileService = learningProfileService;
  }

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const result = await this.learningProfileService.getProfile(req.user.id);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  upsertProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const profile = await this.learningProfileService.upsertProfile(req.user.id, req.body);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };

  submitBaselineAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const userId = req.user.id;
      const file = req.file;

      const answers = {
        writingText: req.body.writingText || '',
        mcGrammarScore: parseInt(req.body.mcGrammarScore || '0', 10),
        mcGrammarTotal: parseInt(req.body.mcGrammarTotal || '0', 10),
        mcVocabularyScore: parseInt(req.body.mcVocabularyScore || '0', 10),
        mcVocabularyTotal: parseInt(req.body.mcVocabularyTotal || '0', 10),
        mcReadingScore: parseInt(req.body.mcReadingScore || '0', 10),
        mcReadingTotal: parseInt(req.body.mcReadingTotal || '0', 10),
        mcListeningScore: parseInt(req.body.mcListeningScore || '0', 10),
        mcListeningTotal: parseInt(req.body.mcListeningTotal || '0', 10),
        targetLevel: req.body.targetLevel || 'Intermediate',
      };

      const result = await this.learningProfileService.submitBaselineAssessment(userId, answers, file);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  handleConversationalTurn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const userId = req.user.id;
      const file = req.file;

      let history = [];
      if (req.body.history) {
        try {
          history = typeof req.body.history === 'string' ? JSON.parse(req.body.history) : req.body.history;
        } catch {
          history = [];
        }
      }

      const turnCount = parseInt(req.body.turnCount || '0', 10);
      const userMessage = req.body.userMessage || '';
      const targetLevel = req.body.targetLevel || 'unknown';

      const result = await this.learningProfileService.handleConversationalAssessmentTurn(
        userId,
        history,
        turnCount,
        userMessage,
        targetLevel,
        file
      );

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const learningProfileController = new LearningProfileController();

