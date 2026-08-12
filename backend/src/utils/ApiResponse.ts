import { Response } from 'express';
import { HttpStatusCodes, HttpStatusCode } from '../constants/httpStatusCodes';

/**
 * Standardized API Response structure and helper.
 */
export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data?: T;

  constructor(message: string, data?: T, success: boolean = true) {
    this.success = success;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
  }

  /**
   * Helper to send JSON response directly via Express Response object.
   */
  public static send<T>(
    res: Response,
    statusCode: HttpStatusCode = HttpStatusCodes.OK,
    message: string,
    data?: T
  ): Response {
    const responsePayload = new ApiResponse(message, data, true);
    return res.status(statusCode).json(responsePayload);
  }

  public static success<T>(
    res: Response,
    message: string = 'Success',
    data?: T,
    statusCode: HttpStatusCode = HttpStatusCodes.OK
  ): Response {
    return ApiResponse.send(res, statusCode, message, data);
  }

  public static created<T>(
    res: Response,
    message: string = 'Resource created successfully',
    data?: T
  ): Response {
    return ApiResponse.send(res, HttpStatusCodes.CREATED, message, data);
  }
}
