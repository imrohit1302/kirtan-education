import { Router } from 'express';
import { ROLES } from '../../constants/roles.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  deleteUser,
  getAllUsers,
  getProfile,
  getUserById,
  updateProfile,
  updateUserRole,
} from './user.controller.js';
import {
  queryUsersSchema,
  updateProfileSchema,
  updateUserRoleSchema,
  userIdParamSchema,
} from './user.validation.js';

const router = Router();

// Protect all user routes with JWT authentication
router.use(authenticate);

// Profile management for current user
router.get('/me', getProfile);
router.patch('/me', validate(updateProfileSchema), updateProfile);

// Admin-only management endpoints
router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validate(queryUsersSchema),
  getAllUsers
);

router.get(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validate(userIdParamSchema),
  getUserById
);

router.patch(
  '/:id/role',
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validate(updateUserRoleSchema),
  updateUserRole
);

router.delete(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validate(userIdParamSchema),
  deleteUser
);

export default router;
