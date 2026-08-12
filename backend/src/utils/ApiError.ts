import { HttpStatusCodes, HttpStatusCode } from '../constants/httpStatusCodes';

/**
 * Custom operational API Error class extending standard Error.
 */
export class ApiError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly errors: string[] | Record<string, unknown>[];

  constructor(
    statusCode: HttpStatusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR,
    message: string = 'Internal Server Error',
    errors: string[] | Record<string, unknown>[] = [],
    isOperational: boolean = true,
    stack: string = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string, errors: string[] = []): ApiError {
    return new ApiError(HttpStatusCodes.BAD_REQUEST, message, errors);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(HttpStatusCodes.UNAUTHORIZED, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(HttpStatusCodes.FORBIDDEN, message);
  }

  static notFound(message: string = 'Resource Not Found'): ApiError {
    return new ApiError(HttpStatusCodes.NOT_FOUND, message);
  }

  static internal(message: string = 'Internal Server Error'): ApiError {
    return new ApiError(HttpStatusCodes.INTERNAL_SERVER_ERROR, message, [], false);
  }
}

// Alias for AppError naming convention compatibility
export const AppError = ApiError;
