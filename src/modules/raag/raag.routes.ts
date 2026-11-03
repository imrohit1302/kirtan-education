import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { idParamSchema } from '../../utils/common.validation.js';
import {
  createRaag,
  deleteRaag,
  getAllRaags,
  getRaagById,
  updateRaag,
} from './raag.controller.js';
import {
  createRaagSchema,
  queryRaagSchema,
  updateRaagSchema,
} from './raag.validation.js';

const router = Router();

// Protect all raag CRUD endpoints with authentication middleware
router.use(authenticate);

router.post('/', validate(createRaagSchema), createRaag);
router.get('/', validate(queryRaagSchema), getAllRaags);
router.get('/:id', validate(idParamSchema), getRaagById);
router.patch('/:id', validate(idParamSchema), validate(updateRaagSchema), updateRaag);
router.put('/:id', validate(idParamSchema), validate(updateRaagSchema), updateRaag);
router.delete('/:id', validate(idParamSchema), deleteRaag);

export default router;

