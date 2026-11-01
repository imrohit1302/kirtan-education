import rateLimit from 'express-rate-limit';
import { envConfig } from '../config/env.config.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Standard API Rate Limiter
 * Limits requests from each IP across the application
 */
export const apiLimiter = rateLimit({
  windowMs: envConfig.RATE_LIMIT_WINDOW_MS,
  max: envConfig.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      ApiError.tooManyRequests(
        `Too many requests from this IP. Please try again after ${Math.ceil(
          envConfig.RATE_LIMIT_WINDOW_MS / 60000
        )} minutes.`
      )
    );
  },
});

/**
 * Stricter Rate Limiter for Authentication Endpoints (Login, Register, Password Reset)
 * Mitigates brute-force and credential stuffing attacks.
 */
export const authLimiter = rateLimit({
  windowMs: envConfig.AUTH_RATE_LIMIT_WINDOW_MS,
  max: envConfig.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res, next) => {
    next(
      ApiError.tooManyRequests(
        `Too many authentication attempts from this IP. Please wait ${Math.ceil(
          envConfig.AUTH_RATE_LIMIT_WINDOW_MS / 60000
        )} minutes before retrying.`
      )
    );
  },
});
