import { NextFunction, Request, Response } from 'express';
import { envConfig } from '../config/env.config.js';
import { TOKEN_TYPES } from '../constants/roles.js';
import { User } from '../modules/user/user.model.js';
import { IJwtPayload } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { verifyJwt } from '../utils/token.util.js';

export const authenticate = catchAsync(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication token is missing. Please log in.');
    }

    const decoded = verifyJwt<IJwtPayload>(token, envConfig.JWT_ACCESS_SECRET);

    if (decoded.type !== TOKEN_TYPES.ACCESS) {
      throw ApiError.unauthorized('Invalid token type provided.');
    }

    const currentUser = await User.findById(decoded.sub).select('+isActive');

    if (!currentUser) {
      throw ApiError.unauthorized('The user belonging to this token no longer exists.');
    }

    if (!currentUser.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
    }

    // User remains logged in permanently until they explicitly choose to log out themselves
    req.user = currentUser;
    next();
  }
);
