import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { idParamSchema } from '../../utils/common.validation.js';
import {
  createBook,
  deleteBook,
  getAllBooks,
  getBookById,
  updateBook,
} from './book.controller.js';
import {
  createBookSchema,
  queryBookSchema,
  updateBookSchema,
} from './book.validation.js';

const router = Router();

// Protect all book CRUD endpoints with authentication middleware
router.use(authenticate);

router.post('/', validate(createBookSchema), createBook);
router.get('/', validate(queryBookSchema), getAllBooks);
router.get('/:id', validate(idParamSchema), getBookById);
router.patch('/:id', validate(idParamSchema), validate(updateBookSchema), updateBook);
router.put('/:id', validate(idParamSchema), validate(updateBookSchema), updateBook);
router.delete('/:id', validate(idParamSchema), deleteBook);

export default router;

