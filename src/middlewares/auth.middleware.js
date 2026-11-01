import { envConfig } from '../config/env.config.js';
import { TOKEN_TYPES } from '../constants/roles.js';
import { User } from '../modules/user/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { verifyJwt } from '../utils/token.util.js';

/**
 * Authentication Middleware
 * Validates JWT access token from Authorization header or HttpOnly cookie.
 * Ensures user exists, is active, and hasn't changed their password since token issuance.
 */
export const authenticate = catchAsync(async (req, res, next) => {
  let token;

  // 1. Extract token from Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    // Fallback: Extract from secure HttpOnly cookie
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication token is missing. Please log in.');
  }

  // 2. Verify JWT signature & expiration
  const decoded = verifyJwt(token, envConfig.JWT_ACCESS_SECRET);

  if (decoded.type !== TOKEN_TYPES.ACCESS) {
    throw ApiError.unauthorized('Invalid token type provided.');
  }

  // 3. Verify user still exists in database
  const currentUser = await User.findById(decoded.sub).select('+isActive +passwordChangedAt');

  if (!currentUser) {
    throw ApiError.unauthorized('The user belonging to this token no longer exists.');
  }

  // 4. Verify account is active
  if (!currentUser.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
  }

  // 5. Check if user changed password after token was issued
  if (currentUser.isPasswordChangedAfter(decoded.iat)) {
    throw ApiError.unauthorized('User recently changed password. Please log in again.');
  }

  // Attach sanitized user to request context
  req.user = currentUser;
  next();
});
