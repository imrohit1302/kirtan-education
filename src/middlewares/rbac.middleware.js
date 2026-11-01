import { ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Role-Based Access Control (RBAC) Middleware.
 * Restricts access to routes based on user role.
 *
 * @param  {...string} allowedRoles - Roles permitted to access the endpoint
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    // Super Admin has master access to all endpoints
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
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
