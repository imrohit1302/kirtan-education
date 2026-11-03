import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { idParamSchema } from '../../utils/common.validation.js';
import {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleById,
  updateRole,
} from './role.controller.js';
import {
  createRoleSchema,
  queryRoleSchema,
  updateRoleSchema,
} from './role.validation.js';

const router = Router();

// Protect all role CRUD endpoints with authentication middleware
router.use(authenticate);

router.post('/', validate(createRoleSchema), createRole);
router.get('/', validate(queryRoleSchema), getAllRoles);
router.get('/:id', validate(idParamSchema), getRoleById);
router.patch('/:id', validate(idParamSchema), validate(updateRoleSchema), updateRole);
router.put('/:id', validate(idParamSchema), validate(updateRoleSchema), updateRole);
router.delete('/:id', validate(idParamSchema), deleteRole);

export default router;

