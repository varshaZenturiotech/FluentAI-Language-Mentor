import { Request, Response } from 'express';
import { healthService } from '../services/health.service';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpStatusCodes } from '../constants/httpStatusCodes';

/**
 * Health Controller for handling status requests.
 */
export class HealthController {
  public checkHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const healthStatus = healthService.getHealthStatus(req.requestId);

    res.status(HttpStatusCodes.OK).json({
      success: true,
      message: 'FluentAI Backend is running',
      version: healthStatus.version,
      environment: healthStatus.environment,
      timestamp: healthStatus.timestamp,
      requestId: healthStatus.requestId,
    });
  });
}

export const healthController = new HealthController();
