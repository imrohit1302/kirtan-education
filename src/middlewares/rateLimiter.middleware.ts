import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { envConfig } from '../config/env.config.js';
import { ApiError } from '../utils/apiError.js';

export const apiLimiter = rateLimit({
  windowMs: envConfig.RATE_LIMIT_WINDOW_MS,
  max: envConfig.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(
      ApiError.tooManyRequests(
        `Too many requests from this IP. Please try again after ${Math.ceil(
          envConfig.RATE_LIMIT_WINDOW_MS / 60000
        )} minutes.`
      )
    );
  },
});

export const authLimiter = rateLimit({
  windowMs: envConfig.AUTH_RATE_LIMIT_WINDOW_MS,
  max: envConfig.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req: Request, _res: Response, next: NextFunction) => {
    next(
      ApiError.tooManyRequests(
        `Too many authentication attempts from this IP. Please wait ${Math.ceil(
          envConfig.AUTH_RATE_LIMIT_WINDOW_MS / 60000
        )} minutes before retrying.`
      )
    );
  },
});
