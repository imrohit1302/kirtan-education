import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.config.js';
import { TOKEN_TYPES } from '../constants/roles.js';
import { IAuthTokens, IJwtPayload, IUser } from '../types/index.js';
import { ApiError } from './apiError.js';

export const signJwt = (payload: object, secret: string, expiresIn?: string): string => {
  const options: jwt.SignOptions = {
    issuer: 'kirtan-education-api',
    audience: 'kirtan-education-clients',
  };

  const exp = expiresIn || envConfig.JWT_ACCESS_EXPIRATION;
  // Only set expiresIn if explicitly provided and not infinite/never
  if (exp && exp !== 'never' && exp !== 'infinity' && exp !== 'infinite') {
    options.expiresIn = exp as any;
  }

  return jwt.sign(payload, secret, options);
};

export const verifyJwt = <T extends object = IJwtPayload>(token: string, secret: string): T => {
  try {
    return jwt.verify(token, secret, {
      issuer: 'kirtan-education-api',
      audience: 'kirtan-education-clients',
    }) as T;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token has expired. Please authenticate again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid or malformed token.');
    }
    throw ApiError.unauthorized('Authentication failed.');
  }
};

export const generateAuthTokens = (user: IUser): IAuthTokens => {
  const payload: Omit<IJwtPayload, 'type'> = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = signJwt(
    { ...payload, type: TOKEN_TYPES.ACCESS },
    envConfig.JWT_ACCESS_SECRET,
    envConfig.JWT_ACCESS_EXPIRATION
  );

  const refreshToken = signJwt(
    { sub: user._id.toString(), type: TOKEN_TYPES.REFRESH },
    envConfig.JWT_REFRESH_SECRET,
    envConfig.JWT_REFRESH_EXPIRATION
  );

  return {
    tokenType: 'Bearer',
    accessToken,
    refreshToken,
    expiresIn: envConfig.JWT_ACCESS_EXPIRATION || 'never',
  };
};

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken?: string; refreshToken?: string }
): void => {
  const isProduction = envConfig.NODE_ENV === 'production';

  // 100 years (~3.15 billion ms) for permanent session persistence until manual logout
  const INFINITE_COOKIE_MS = 100 * 365.25 * 24 * 60 * 60 * 1000;

  const defaultCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'strict' : 'lax') as 'strict' | 'lax',
    path: '/',
    maxAge: INFINITE_COOKIE_MS,
  };

  if (tokens.accessToken) {
    res.cookie('accessToken', tokens.accessToken, defaultCookieOptions);
  }

  if (tokens.refreshToken) {
    res.cookie('refreshToken', tokens.refreshToken, {
      ...defaultCookieOptions,
      path: '/api/v1/auth',
    });
  }
};

export const clearAuthCookies = (res: Response): void => {
  const isProduction = envConfig.NODE_ENV === 'production';
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'strict' : 'lax') as 'strict' | 'lax',
    path: '/',
  };

  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', { ...options, path: '/api/v1/auth' });
};
