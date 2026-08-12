import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

/**
 * 404 Not Found Middleware
 * Handles requests to endpoints that do not exist.
 */
export const notFoundMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const error = ApiError.notFound(`Route not found - ${req.originalUrl}`);
  next(error);
};
