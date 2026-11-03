import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { idParamSchema } from '../../utils/common.validation.js';
import {
  createTutorial,
  deleteTutorial,
  getAllTutorials,
  getTutorialById,
  updateTutorial,
} from './tutorial.controller.js';
import {
  createTutorialSchema,
  queryTutorialSchema,
  updateTutorialSchema,
} from './tutorial.validation.js';

const router = Router();

// Protect all tutorial CRUD endpoints with authentication middleware
router.use(authenticate);

router.post('/', validate(createTutorialSchema), createTutorial);
router.get('/', validate(queryTutorialSchema), getAllTutorials);
router.get('/:id', validate(idParamSchema), getTutorialById);
router.patch('/:id', validate(idParamSchema), validate(updateTutorialSchema), updateTutorial);
router.put('/:id', validate(idParamSchema), validate(updateTutorialSchema), updateTutorial);
router.delete('/:id', validate(idParamSchema), deleteTutorial);

export default router;

