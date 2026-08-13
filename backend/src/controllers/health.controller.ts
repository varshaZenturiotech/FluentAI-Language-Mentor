import { Request, Response } from 'express';
import axios from 'axios';
import { healthService } from '../services/health.service';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpStatusCodes } from '../constants/httpStatusCodes';
import { env } from '../config/env';

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

  public diagnoseGateway = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const aiServiceUrl = env.AI_SERVICE_URL;
    const internalApiKeyPresent = !!env.INTERNAL_API_KEY;
    const requestUrl = `${aiServiceUrl}/internal/health`;

    let connectionSuccess = false;
    let gatewayResponse: any = null;
    let errorDetails: any = null;

    try {
      const response = await axios.get(requestUrl, {
        timeout: 5000, // 5 seconds timeout for quick feedback
      });
      connectionSuccess = true;
      gatewayResponse = response.data;
    } catch (err: any) {
      errorDetails = {
        message: err.message,
        code: err.code, // e.g. ECONNREFUSED
        status: err.response?.status, // e.g. 502
        statusText: err.response?.statusText,
        responseData: err.response?.data,
      };
    }

    res.status(HttpStatusCodes.OK).json({
      success: true,
      diagnostics: {
        aiServiceUrl,
        internalApiKeyPresent,
        requestUrl,
        connectionSuccess,
        gatewayResponse,
        error: errorDetails,
      },
    });
  });
}

export const healthController = new HealthController();
