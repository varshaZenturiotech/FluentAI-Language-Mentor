import 'express';

declare global {
  namespace Express {
    /**
     * Authenticated user payload attached to the request by auth middleware.
     * Populated after a valid JWT is verified. Always present on protected routes.
     */
    interface Request {
      requestId?: string;
      /** Authenticated user context. Set by the authentication middleware. */
      user?: {
        id: string;
      };
    }
  }
}
