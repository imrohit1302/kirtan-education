import mongoose, { Types } from 'mongoose';
import { ApiError } from '../../utils/apiError.js';
import { buildIdQuery } from '../../utils/query.util.js';
import { Tutorial } from '../tutorial/tutorial.model.js';
import { Bookmark } from './bookmark.model.js';

export class BookmarkService {
  /**
   * Resolve a tutorialId string to a Mongoose ObjectId.
   * Supports both 24-char hex ObjectId strings and numeric ids.
   */
  private static async resolveTutorialObjectId(tutorialId: string): Promise<Types.ObjectId> {
    const filter = buildIdQuery(tutorialId);
    const tutorial = await Tutorial.findOne(filter).select('_id').lean();
    if (!tutorial) {
      throw ApiError.notFound(`Tutorial with identifier '${tutorialId}' not found`);
    }
    return (tutorial as any)._id as Types.ObjectId;
  }

  /**
   * Add a bookmark for a user on a tutorial.
   */
  static async addBookmark(userId: string, tutorialId: string) {
    const tutorialObjectId = await BookmarkService.resolveTutorialObjectId(tutorialId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Check if already bookmarked
    const existing = await Bookmark.findOne({
      userId: userObjectId,
      tutorialId: tutorialObjectId,
    });

    if (existing) {
      throw ApiError.conflict('Tutorial is already bookmarked');
    }

    const bookmark = await Bookmark.create({
      userId: userObjectId,
      tutorialId: tutorialObjectId,
    });

    return bookmark;
  }

  /**
   * Remove a bookmark for a user on a tutorial.
   */
  static async removeBookmark(userId: string, tutorialId: string) {
    const tutorialObjectId = await BookmarkService.resolveTutorialObjectId(tutorialId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const deleted = await Bookmark.findOneAndDelete({
      userId: userObjectId,
      tutorialId: tutorialObjectId,
    });

    if (!deleted) {
      throw ApiError.notFound('Bookmark not found — this tutorial is not in your bookmarks');
    }

    return true;
  }

  /**
   * Get all bookmarked tutorials for a user, with full tutorial details populated.
   */
  static async getBookmarkedTutorials(
    userId: string,
    query: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    const bookmarks = await Bookmark.find({ userId: userObjectId })
      .sort({ [sortField]: sortDirection })
      .populate('tutorialId')
      .lean();

    // Map: flatten bookmark into tutorial, inject isBookmarked: true
    const tutorials = bookmarks
      .filter(b => b.tutorialId != null)
      .map(b => {
        const tutorial = (b.tutorialId as any);
        return {
          ...tutorial,
          isBookmarked: true,
          bookmarkedAt: b.createdAt,
        };
      });

    return { tutorials, total: tutorials.length };
  }

  /**
   * Check if a user has bookmarked a specific tutorial (by ObjectId).
   */
  static async isBookmarked(userId: Types.ObjectId, tutorialObjectId: Types.ObjectId): Promise<boolean> {
    const exists = await Bookmark.exists({
      userId,
      tutorialId: tutorialObjectId,
    });
    return !!exists;
  }

  /**
   * Get a Set of tutorial ObjectId strings bookmarked by a user (for bulk lookup).
   */
  static async getBookmarkedTutorialIds(userId: string): Promise<Set<string>> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const bookmarks = await Bookmark.find({ userId: userObjectId })
      .select('tutorialId')
      .lean();
    return new Set(bookmarks.map(b => String(b.tutorialId)));
  }
}

