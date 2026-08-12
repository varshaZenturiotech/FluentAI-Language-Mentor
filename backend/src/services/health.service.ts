import { env } from '../config/env';
import { IHealthData } from '../interfaces/apiResponse.interface';

/**
 * Health Service handling system status business logic.
 */
export class HealthService {
  public getHealthStatus(requestId?: string): IHealthData {
    return {
      version: env.VERSION,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };
  }
}

export const healthService = new HealthService();
