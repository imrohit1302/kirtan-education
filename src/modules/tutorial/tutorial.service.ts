import { ApiError } from '../../utils/apiError.js';
import { BookmarkService } from '../bookmark/bookmark.service.js';
import { buildIdQuery } from '../../utils/query.util.js';
import { ITutorialDocument, Tutorial } from './tutorial.model.js';

export class TutorialService {
  /**
   * Create a new tutorial.
   * id is optional in body and not internally generated/managed.
   */
  static async createTutorial(data: Partial<ITutorialDocument>): Promise<ITutorialDocument> {
    const userProvidedId = data.id !== undefined ? data.id : data.customId;

    let firstLetter = data.first_letter_start;
    if (!firstLetter && data.title) {
      const trimmed = data.title.trim();
      if (trimmed.length > 0) {
        firstLetter = Array.from(trimmed)[0];
      }
    }

    const tutorial = await Tutorial.create({
      ...data,
      ...(userProvidedId !== undefined ? { id: userProvidedId, customId: userProvidedId } : {}),
      first_letter_start: firstLetter,
    });

    return tutorial;
  }

  /**
   * Get all tutorials without pagination.
   * Optionally injects isBookmarked per authenticated user.
   */
  static async getAllTutorials(
    query: {
      search?: string;
      raag?: string | number;
      role?: string | number;
      category?: string | number;
      shabad_id?: string | number;
      verse_id?: string | number;
      first_letter_start?: string;
      isActive?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    userId?: string
  ): Promise<{ tutorials: (ITutorialDocument & { isBookmarked: boolean })[]; total: number }> {
    const filter: Record<string, any> = {};

    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    if (query.raag !== undefined && query.raag !== '') {
      filter.raag = query.raag;
    }

    if (query.role !== undefined && query.role !== '') {
      filter.role = query.role;
    }

    if (query.category !== undefined && query.category !== '') {
      if (query.category === 'null' || query.category === 'none') {
        filter.category = null;
      } else {
        filter.category = query.category;
      }
    }

    if (query.shabad_id !== undefined) {
      const num = Number(query.shabad_id);
      filter.shabad_id =
        !isNaN(num) && String(num) === String(query.shabad_id)
          ? { $in: [num, String(query.shabad_id)] }
          : query.shabad_id;
    }

    if (query.verse_id !== undefined) {
      const num = Number(query.verse_id);
      filter.verse_id =
        !isNaN(num) && String(num) === String(query.verse_id)
          ? { $in: [num, String(query.verse_id)] }
          : query.verse_id;
    }

    if (query.first_letter_start) {
      filter.first_letter_start = query.first_letter_start.trim();
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'desc' ? -1 : 1;

    const tutorials = await Tutorial.find(filter)
      .populate('raag', 'name name_unicode slug id customId')
      .populate('role', 'name slug id customId')
      .populate('category', 'name name_unicode slug id customId')
      .sort({ [sortField]: sortDirection });

    // Inject isBookmarked per authenticated user (bulk query for performance)
    let bookmarkedSet: Set<string> = new Set();
    if (userId) {
      bookmarkedSet = await BookmarkService.getBookmarkedTutorialIds(userId);
    }

    const tutorialsWithBookmark = tutorials.map(tutorial => {
      const tutorialObj = tutorial.toJSON() as any;
      tutorialObj.isBookmarked = bookmarkedSet.has(String(tutorial._id));
      return tutorialObj;
    });

    return {
      tutorials: tutorialsWithBookmark,
      total: tutorials.length,
    };
  }

  /**
   * Get single tutorial by MongoDB _id or body-provided id.
   * Optionally injects isBookmarked for the authenticated user.
   */
  static async getTutorialById(identifier: string, userId?: string): Promise<ITutorialDocument & { isBookmarked: boolean }> {
    const filter = buildIdQuery(identifier);
    const tutorial = await Tutorial.findOne(filter)
      .populate('raag', 'name name_unicode slug id customId')
      .populate('role', 'name slug id customId')
      .populate('category', 'name name_unicode slug id customId');

    if (!tutorial) {
      throw ApiError.notFound(`Tutorial with identifier '${identifier}' not found`);
    }

    const tutorialObj = tutorial.toJSON() as any;

    if (userId) {
      const bookmarkedSet = await BookmarkService.getBookmarkedTutorialIds(userId);
      tutorialObj.isBookmarked = bookmarkedSet.has(String(tutorial._id));
    } else {
      tutorialObj.isBookmarked = false;
    }

    return tutorialObj;
  }

  /**
   * Update tutorial by MongoDB _id or body-provided id
   */
  static async updateTutorial(
    identifier: string,
    updateData: Partial<ITutorialDocument>
  ): Promise<ITutorialDocument> {
    const filter = buildIdQuery(identifier);
    const tutorial = await Tutorial.findOne(filter);

    if (!tutorial) {
      throw ApiError.notFound(`Tutorial with identifier '${identifier}' not found`);
    }

    if (updateData.id !== undefined) {
      tutorial.id = updateData.id;
      tutorial.customId = updateData.id;
    } else if (updateData.customId !== undefined) {
      tutorial.id = updateData.customId;
      tutorial.customId = updateData.customId;
    }

    const updatableFields: (keyof ITutorialDocument)[] = [
      'title',
      'yt_link',
      'shabad_id',
      'raag',
      'role',
      'category',
      'verse_id',
      'first_letter_start',
      'description',
      'isActive',
    ];

    for (const field of updatableFields) {
      if (updateData[field] !== undefined) {
        (tutorial as any)[field] = updateData[field];
      }
    }

    if (updateData.title && !updateData.first_letter_start && !tutorial.first_letter_start) {
      const trimmed = updateData.title.trim();
      if (trimmed.length > 0) {
        tutorial.first_letter_start = Array.from(trimmed)[0];
      }
    }

    await tutorial.save();
    return tutorial;
  }

  /**
   * Delete tutorial by MongoDB _id or body-provided id
   */
  static async deleteTutorial(identifier: string): Promise<void> {
    const filter = buildIdQuery(identifier);
    const tutorial = await Tutorial.findOne(filter);

    if (!tutorial) {
      throw ApiError.notFound(`Tutorial with identifier '${identifier}' not found`);
    }

    await Tutorial.deleteOne({ _id: tutorial._id });
  }
}
