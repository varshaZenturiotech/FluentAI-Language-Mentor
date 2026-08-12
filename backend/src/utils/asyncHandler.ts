import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Async handler wrapper to catch unhandled promise rejections
 * and pass them automatically to the global error handling middleware.
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
