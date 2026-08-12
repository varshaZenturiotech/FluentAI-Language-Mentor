export interface ISuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
  requestId?: string;
  timestamp?: string;
}

export interface IErrorResponse {
  success: false;
  message: string;
  errors?: string[] | Record<string, unknown>[];
  stack?: string;
  requestId?: string;
  timestamp?: string;
}

export interface IHealthData {
  version: string;
  environment: string;
  timestamp: string;
  requestId?: string;
}
