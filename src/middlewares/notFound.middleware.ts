import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/apiError.js';

export const notFoundMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  next(
    ApiError.notFound(`Cannot ${req.method} ${req.originalUrl} - Route not found on this server`)
  );
};

