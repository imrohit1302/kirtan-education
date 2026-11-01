import { Response } from 'express';
import { HTTP_STATUS, HttpStatusCode } from '../constants/httpStatusCodes.js';

export class ApiResponse<T = any> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T | null;
  public readonly meta: Record<string, any>;

  constructor(
    statusCode: HttpStatusCode = HTTP_STATUS.OK,
    message: string = 'Success',
    data: T | null = null,
    meta: Record<string, any> | null = null
  ) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = {
      timestamp: new Date().toISOString(),
      ...(meta || {}),
    };
  }

  send(res: Response) {
    return res.status(this.statusCode).json({
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      meta: {
        timestamp: this.meta.timestamp,
        ...(res.locals?.requestId ? { requestId: res.locals.requestId } : {}),
        ...this.meta,
      },
    });
  }

  static success<T>(
    res: Response,
    message: string = 'Success',
    data: T | null = null,
    statusCode: HttpStatusCode = HTTP_STATUS.OK,
    meta: Record<string, any> | null = null
  ) {
    return new ApiResponse<T>(statusCode, message, data, meta).send(res);
  }

  static created<T>(
    res: Response,
    message: string = 'Resource created successfully',
    data: T | null = null,
    meta: Record<string, any> | null = null
  ) {
    return new ApiResponse<T>(HTTP_STATUS.CREATED, message, data, meta).send(res);
  }

  static noContent(res: Response) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }
}
