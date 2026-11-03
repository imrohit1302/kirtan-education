import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { idParamSchema } from '../../utils/common.validation.js';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from './category.controller.js';
import {
  createCategorySchema,
  queryCategorySchema,
  updateCategorySchema,
} from './category.validation.js';

const router = Router();

// Protect all category CRUD endpoints with authentication middleware
router.use(authenticate);

router.post('/', validate(createCategorySchema), createCategory);
router.get('/', validate(queryCategorySchema), getAllCategories);
router.get('/:id', validate(idParamSchema), getCategoryById);
router.patch('/:id', validate(idParamSchema), validate(updateCategorySchema), updateCategory);
router.put('/:id', validate(idParamSchema), validate(updateCategorySchema), updateCategory);
router.delete('/:id', validate(idParamSchema), deleteCategory);

export default router;

