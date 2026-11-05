import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { BookmarkService } from './bookmark.service.js';

/**
 * POST /api/v1/bookmarks
 * Body: { tutorialId: string }
 * Bookmarks a tutorial for the authenticated user.
 */
export const addBookmark = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const { tutorialId } = req.body;
  const bookmark = await BookmarkService.addBookmark(userId, tutorialId);
  return ApiResponse.created(res, 'Tutorial bookmarked successfully', { bookmark });
});

/**
 * DELETE /api/v1/bookmarks
 * Body: { tutorialId: string }
 * Removes a bookmark for the authenticated user.
 */
export const removeBookmark = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const { tutorialId } = req.body;
  await BookmarkService.removeBookmark(userId, tutorialId);
  return ApiResponse.success(res, 'Tutorial bookmark removed successfully');
});

/**
 * GET /api/v1/bookmarks
 * Returns all bookmarked tutorials for the authenticated user with full tutorial details.
 */
export const getMyBookmarks = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const { tutorials, total } = await BookmarkService.getBookmarkedTutorials(
    userId,
    req.query as any
  );
  return ApiResponse.success(res, 'Bookmarked tutorials retrieved successfully', {
    tutorials,
    total,
  });
});

