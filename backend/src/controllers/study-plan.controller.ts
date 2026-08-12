import { Request, Response, NextFunction } from 'express';
import { studyPlanService, StudyPlanService } from '../services/study-plan.service';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';

export class StudyPlanController {
  private readonly service = studyPlanService;

  public generatePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const plan = await this.service.generatePlan(userId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        planId: plan.id,
        durationWeeks: plan.durationWeeks,
        plan,
      });
    } catch (error) {
      next(error);
    }
  };

  public getPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const plan = await this.service.getPlan(userId);
      const isGenerating = StudyPlanService.isGenerating(userId);
      const recentError = StudyPlanService.getRecentError(userId);
      const planGenerationStatus = plan ? 'ready' : (isGenerating ? 'generating' : (recentError ? 'failed' : 'not_generated'));

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: plan,
        planGenerationStatus,
        planGenerationError: plan ? null : recentError,
      });
    } catch (error) {
      next(error);
    }
  };

  public completeDay = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const dayId = req.params.id;
      if (!dayId) {
        next(ApiError.badRequest('Day ID is required.'));
        return;
      }

      const updatedDay = await this.service.completeDay(userId, dayId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: updatedDay,
      });
    } catch (error) {
      next(error);
    }
  };

  public getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const recs = await this.service.getRecommendations(userId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: recs,
      });
    } catch (error) {
      next(error);
    }
  };

  public getProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const progressData = await this.service.getProgress(userId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: progressData,
      });
    } catch (error) {
      next(error);
    }
  };

  public startLessonSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const dayId = req.params.id;
      if (!dayId) {
        next(ApiError.badRequest('Day ID is required.'));
        return;
      }

      const result = await this.service.startLessonSession(userId, dayId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const studyPlanController = new StudyPlanController();
