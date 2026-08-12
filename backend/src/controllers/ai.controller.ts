import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';
import { ProgressTracker } from '../utils/progress-tracker';

export class AiController {
  private readonly aiService = aiService;

  public chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const result = await this.aiService.chat(userId, req.body, req.requestId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public translate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const result = await this.aiService.translate(userId, req.body, req.requestId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public feedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const result = await this.aiService.feedback(userId, req.body, req.requestId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public pronunciation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const result = await this.aiService.pronunciation(userId, req.body, req.requestId);
      await ProgressTracker.trackProgressEvent(userId, 'pronunciation', 3);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public speech = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const file = req.file;
      const language = req.body.language;

      if (!file) {
        next(ApiError.badRequest('Audio file is required.'));
        return;
      }
      if (!language) {
        next(ApiError.badRequest('Language is required.'));
        return;
      }

      const result = await this.aiService.speech(userId, file, language, req.requestId);
      await ProgressTracker.trackProgressEvent(userId, 'listening', 5);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const aiController = new AiController();
