import { envConfig } from '../config/env.config.js';
import { logger } from '../config/logger.config.js';
import { HTTP_STATUS } from '../constants/httpStatusCodes.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Normalizes Mongoose CastError (e.g. invalid MongoDB ObjectId)
 */
const handleCastErrorDB = err => {
  const message = `Invalid resource identifier for field '${err.path}': '${err.value}'`;
  return ApiError.badRequest(message);
};

/**
 * Normalizes MongoDB Duplicate Key error (E11000)
 */
const handleDuplicateFieldsDB = err => {
  const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `A record with ${field} '${value}' already exists. Please choose another value.`;
  return ApiError.conflict(message);
};

/**
 * Normalizes Mongoose Schema Validation error
 */
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message,
  }));
  const message = 'Validation failed for one or more fields.';
  return ApiError.unprocessableEntity(message, errors);
};

/**
 * Normalizes JWT Signature error
 */
const handleJWTError = () => {
  return ApiError.unauthorized('Invalid security token. Please log in again.');
};

/**
 * Normalizes JWT Expired error
 */
const handleJWTExpiredError = () => {
  return ApiError.unauthorized('Your session has expired. Please log in again to continue.');
};

/**
 * Normalizes Malformed JSON Syntax error from body-parser
 */
const handleSyntaxError = () => {
  return ApiError.badRequest('Malformed JSON in request payload. Please verify JSON formatting.');
};

/**
 * Centralized Global Error Handler Middleware
 * Intercepts all operational and programming errors.
 */
export const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  // Transform non-ApiError exceptions into standardized ApiError instances
  if (!(error instanceof ApiError)) {
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    else if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    else if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    else if (error.name === 'JsonWebTokenError') error = handleJWTError();
    else if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    else if (error instanceof SyntaxError && 'body' in error) error = handleSyntaxError();
    else {
      // Unhandled generic programming error
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const message = error.message || 'Internal Server Error';
      error = new ApiError(statusCode, message, null, false, err.stack);
    }
  }

  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const requestId = res.locals?.requestId || req.id || 'N/A';
  const isDev = envConfig.NODE_ENV === 'development';

  // Structured log based on severity
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

  // Response payload construction
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
    // Include stack trace only in non-production environments for operational safety
    ...(isDev ? { stack: error.stack } : {}),
  };

  res.status(statusCode).json(response);
};
