import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { env } from '../config/env';

/**
 * Middleware to authenticate requests via JWT Bearer Access Token or Internal API Key.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const internalKey = req.headers['x-internal-key'];
  const userId = req.headers['x-user-id'];

  if (internalKey && internalKey === env.INTERNAL_API_KEY && userId) {
    req.user = {
      id: userId as string,
    };
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access token is required. Please log in.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.userId,
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired access token.',
    });
  }
};

/**
 * Middleware to authorize requests (role check pass-through for now).
 */
export const authorize = (_req: Request, _res: Response, next: NextFunction): void => {
  next();
};
