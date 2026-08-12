import jwt from 'jsonwebtoken';
import { JwtPayload } from '../interfaces/auth.interface';
import { ApiError } from './ApiError';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ApiError(500, 'JWT_SECRET environment variable is not defined.');
  }
  return secret;
};

/**
 * Generates an Access Token with a 15-minute expiration.
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: '15m' });
};

/**
 * Verifies an Access Token and returns the decoded JwtPayload.
 * Throws ApiError (401 Unauthorized) if token is invalid or expired.
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as Record<string, unknown>;
    return {
      userId: decoded.userId as string,
      email: decoded.email as string,
    };
  } catch (_error) {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
};
