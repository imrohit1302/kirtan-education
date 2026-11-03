import { ApiError } from '../../utils/apiError.js';
import { buildIdQuery } from '../../utils/query.util.js';
import { CounterService } from '../counter/counter.service.js';
import { ITutorialDocument, Tutorial } from './tutorial.model.js';

export class TutorialService {
  /**
   * Create a new tutorial with atomic auto-incremented ID
   */
  static async createTutorial(data: Partial<ITutorialDocument>): Promise<ITutorialDocument> {
    let numericId: number;

    if (data.id !== undefined && typeof data.id === 'number') {
      numericId = data.id;
      await CounterService.syncSequence('tutorial', numericId);
    } else if (data.customId !== undefined && typeof data.customId === 'number') {
      numericId = data.customId;
      await CounterService.syncSequence('tutorial', numericId);
    } else {
      numericId = await CounterService.getNextSequence('tutorial', Tutorial);
    }

    let firstLetter = data.first_letter_start;
    if (!firstLetter && data.title) {
      const trimmed = data.title.trim();
      if (trimmed.length > 0) {
        firstLetter = Array.from(trimmed)[0];
      }
    }

    const tutorial = await Tutorial.create({
      ...data,
      customId: numericId,
      id: numericId,
      first_letter_start: firstLetter,
    });

    return tutorial;
  }

  /**
   * Get all tutorials without pagination
   */
  static async getAllTutorials(query: {
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
  }): Promise<{ tutorials: ITutorialDocument[]; total: number }> {
    const filter: Record<string, any> = {};

    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    if (query.raag !== undefined) {
      const num = Number(query.raag);
      filter.raag =
        !isNaN(num) && String(num) === String(query.raag)
          ? { $in: [num, String(query.raag)] }
          : query.raag;
    }

    if (query.role !== undefined) {
      const num = Number(query.role);
      filter.role =
        !isNaN(num) && String(num) === String(query.role)
          ? { $in: [num, String(query.role)] }
          : query.role;
    }

    if (query.category !== undefined) {
      const num = Number(query.category);
      filter.category =
        !isNaN(num) && String(num) === String(query.category)
          ? { $in: [num, String(query.category)] }
          : query.category;
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

    const sortField = query.sortBy || 'customId';
    const sortDirection = query.sortOrder === 'desc' ? -1 : 1;

    const tutorials = await Tutorial.find(filter).sort({ [sortField]: sortDirection });

    return {
      tutorials,
      total: tutorials.length,
    };
  }

  /**
   * Get single tutorial by MongoDB _id or numeric ID
   */
  static async getTutorialById(identifier: string): Promise<ITutorialDocument> {
    const filter = buildIdQuery(identifier);
    const tutorial = await Tutorial.findOne(filter);

    if (!tutorial) {
      throw ApiError.notFound(`Tutorial with identifier '${identifier}' not found`);
    }

    return tutorial;
  }

  /**
   * Update tutorial by MongoDB _id or numeric ID
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
   * Delete tutorial by MongoDB _id or numeric ID
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
