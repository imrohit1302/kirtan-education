import { NextFunction, Request, RequestHandler, Response } from 'express';
import { UserRole } from '../constants/roles.js';
import { ApiError } from '../utils/apiError.js';

export const authorize = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Permission denied: Requires role [${allowedRoles.join(', ')}]. Your role is '${req.user.role}'.`
        )
      );
    }

    next();
  };
};
