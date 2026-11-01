import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.config.js';
import { ApiError } from './apiError.js';
import { TOKEN_TYPES } from '../constants/roles.js';

/**
 * Sign a JSON Web Token
 * @param {object} payload
 * @param {string} secret
 * @param {string} expiresIn
 * @returns {string}
 */
export const signJwt = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'kirtan-education-api',
    audience: 'kirtan-education-clients',
  });
};

/**
 * Verify a JSON Web Token
 * @param {string} token
 * @param {string} secret
 * @returns {object} decoded payload
 */
export const verifyJwt = (token, secret) => {
  try {
    return jwt.verify(token, secret, {
      issuer: 'kirtan-education-api',
      audience: 'kirtan-education-clients',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token has expired. Please authenticate again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid or malformed token.');
    }
    throw ApiError.unauthorized('Authentication failed.');
  }
};

/**
 * Generate Access and Refresh token pair for authenticated user
 * @param {object} user
 * @returns {{ accessToken: string, refreshToken: string, tokenType: string }}
 */
export const generateAuthTokens = user => {
  const payload = {
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
    expiresIn: envConfig.JWT_ACCESS_EXPIRATION,
  };
};

/**
 * Set secure HttpOnly cookies for tokens
 * @param {import('express').Response} res
 * @param {{ accessToken: string, refreshToken?: string }} tokens
 */
export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  const isProduction = envConfig.NODE_ENV === 'production';

  const defaultCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  };

  if (accessToken) {
    res.cookie('accessToken', accessToken, {
      ...defaultCookieOptions,
      maxAge: 15 * 60 * 1000, // 15 mins
    });
  }

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...defaultCookieOptions,
      path: '/api/v1/auth', // restrict refresh cookie to auth endpoints
      maxAge: envConfig.JWT_COOKIE_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
    });
  }
};

/**
 * Clear authentication cookies on logout
 * @param {import('express').Response} res
 */
export const clearAuthCookies = res => {
  const isProduction = envConfig.NODE_ENV === 'production';
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  };

  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', { ...options, path: '/api/v1/auth' });
};
