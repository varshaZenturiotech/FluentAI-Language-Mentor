import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { HttpStatusCodes } from '../constants/httpStatusCodes';

/**
 * Global Centralized Error Handling Middleware
 * Catches all operational and unexpected errors, logs them, and sends standard JSON error response.
 */
export const errorMiddleware = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  let statusCode: number = HttpStatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';
  let errors: string[] | Record<string, unknown>[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof Error) {
    message = err.message;
  }

  logger.error(`Error processing request ${req.method} ${req.originalUrl}: ${message}`, {
    requestId: req.requestId,
    stack: err.stack,
  });

  const errorResponse = {
    success: false,
    message,
    errors,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(req.requestId && { requestId: req.requestId }),
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(errorResponse);
};
