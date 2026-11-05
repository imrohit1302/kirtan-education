import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { addBookmark, getMyBookmarks, removeBookmark } from './bookmark.controller.js';
import { bookmarkTutorialSchema, queryBookmarksSchema } from './bookmark.validation.js';

const router = Router();

// All bookmark routes require authentication
router.use(authenticate);

/**
 * GET  /api/v1/bookmarks          → Get all bookmarked tutorials for current user
 * POST /api/v1/bookmarks          → Bookmark a tutorial  { tutorialId }
 * DELETE /api/v1/bookmarks        → Un-bookmark a tutorial { tutorialId }
 */
router.get('/', validate(queryBookmarksSchema), getMyBookmarks);
router.post('/', validate(bookmarkTutorialSchema), addBookmark);
router.delete('/', validate(bookmarkTutorialSchema), removeBookmark);

export default router;
