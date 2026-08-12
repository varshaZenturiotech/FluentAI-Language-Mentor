import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { ApiError } from '../utils/ApiError';
import { HttpStatusCodes } from '../constants/httpStatusCodes';

export class DashboardController {
  private readonly service = dashboardService;

  public getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(ApiError.unauthorized('Authentication required.'));
        return;
      }

      const data = await this.service.getDashboardData(userId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
