import { ApiError } from '../utils/apiError.js';

/**
 * 404 Route Not Found Middleware
 * Intercepts any unhandled HTTP requests and passes a formatted ApiError to the global handler.
 */
export const notFoundMiddleware = (req, res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl} - Route not found on this server`));
};
