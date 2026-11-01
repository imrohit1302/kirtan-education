import { HTTP_STATUS, HttpStatusCode } from '../constants/httpStatusCodes.js';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly status: 'fail' | 'error';
  public readonly isOperational: boolean;
  public readonly errors: any[] | null;

  constructor(
    statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: string = 'Internal Server Error',
    errors: any[] | null = null,
    isOperational: boolean = true,
    stack: string = ''
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string = 'Bad Request', errors: any[] | null = null) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  static unauthorized(message: string = 'Unauthorized access') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message);
  }

  static forbidden(message: string = 'Access forbidden') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message);
  }

  static notFound(message: string = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  static conflict(message: string = 'Resource conflict detected') {
    return new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  static unprocessableEntity(message: string = 'Unprocessable Entity', errors: any[] | null = null) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
  }

  static tooManyRequests(message: string = 'Too many requests, please try again later') {
    return new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message);
  }

  static internal(message: string = 'Internal Server Error') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, null, false);
  }
}

