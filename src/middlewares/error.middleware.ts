import { NextFunction, Request, Response } from 'express';
import { envConfig } from '../config/env.config.js';
import { logger } from '../config/logger.config.js';
import { HTTP_STATUS } from '../constants/httpStatusCodes.js';
import { ApiError } from '../utils/apiError.js';

const handleCastErrorDB = (err: any): ApiError => {
  const message = `Invalid resource identifier for field '${err.path}': '${err.value}'`;
  return ApiError.badRequest(message);
};

const handleDuplicateFieldsDB = (err: any): ApiError => {
  const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `A record with ${field} '${value}' already exists. Please choose another value.`;
  return ApiError.conflict(message);
};

const handleValidationErrorDB = (err: any): ApiError => {
  const errors = Object.values(err.errors || {}).map((el: any) => ({
    field: el.path,
    message: el.message,
  }));
  const message = 'Validation failed for one or more fields.';
  return ApiError.unprocessableEntity(message, errors);
};

const handleJWTError = (): ApiError => {
  return ApiError.unauthorized('Invalid security token. Please log in again.');
};

const handleJWTExpiredError = (): ApiError => {
  return ApiError.unauthorized('Your session has expired. Please log in again to continue.');
};

const handleSyntaxError = (): ApiError => {
  return ApiError.badRequest('Malformed JSON in request payload. Please verify JSON syntax.');
};

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: ApiError = err;

  if (!(error instanceof ApiError)) {
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    else if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    else if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    else if (err.name === 'JsonWebTokenError') error = handleJWTError();
    else if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    else if (err instanceof SyntaxError && 'body' in err) error = handleSyntaxError();
    else {
      const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const message = err.message || 'Internal Server Error';
      error = new ApiError(statusCode, message, null, false, err.stack);
    }
  }

  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const requestId = (res.locals?.requestId as string) || req.id || 'N/A';
  const isDev = envConfig.NODE_ENV === 'development';

  const logContext = {
    requestId,
    statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    isOperational: error.isOperational,
    stack: error.stack,
  };

  if (statusCode >= 500) {
    logger.error(`[500 Server Error] ${error.message}`, logContext);
  } else {
    logger.warn(`[${statusCode} Client Error] ${error.message}`, {
      ...logContext,
      errors: error.errors,
    });
  }

  const response = {
    success: false,
    statusCode,
    status: error.status || 'error',
    message:
      !error.isOperational && !isDev
        ? 'An unexpected error occurred. Please contact support.'
        : error.message,
    ...(error.errors ? { errors: error.errors } : {}),
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
      path: req.originalUrl,
      method: req.method,
    },
    ...(isDev ? { stack: error.stack } : {}),
  };

  res.status(statusCode).json(response);
};

