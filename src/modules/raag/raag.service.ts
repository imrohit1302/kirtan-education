import { ApiError } from '../../utils/apiError.js';
import { buildIdQuery, slugify } from '../../utils/query.util.js';
import { CounterService } from '../counter/counter.service.js';
import { IRaagDocument, Raag } from './raag.model.js';

export class RaagService {
  /**
   * Create a new Raag with atomic auto-incremented ID
   */
  static async createRaag(data: Partial<IRaagDocument>): Promise<IRaagDocument> {
    let numericId: number;

    if (data.id !== undefined && typeof data.id === 'number') {
      numericId = data.id;
      await CounterService.syncSequence('raag', numericId);
    } else if (data.customId !== undefined && typeof data.customId === 'number') {
      numericId = data.customId;
      await CounterService.syncSequence('raag', numericId);
    } else {
      numericId = await CounterService.getNextSequence('raag', Raag);
    }

    const slug = data.slug ? slugify(data.slug) : slugify(data.name || '');

    const isSlugTaken = await Raag.isSlugTaken(slug);
    if (isSlugTaken) {
      throw ApiError.conflict(`Raag slug '${slug}' already exists`);
    }

    const raag = await Raag.create({
      ...data,
      customId: numericId,
      id: numericId,
      slug,
      display_order: data.display_order ?? numericId,
    });

    return raag;
  }

  /**
   * Get all raags without pagination
   */
  static async getAllRaags(query: {
    search?: string;
    thaat?: string;
    time?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ raags: IRaagDocument[]; total: number }> {
    const filter: Record<string, any> = {};

    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    if (query.thaat) {
      filter.thaat = new RegExp(`^${query.thaat}$`, 'i');
    }

    if (query.time) {
      filter.time = new RegExp(`^${query.time}$`, 'i');
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { name_unicode: searchRegex },
        { slug: searchRegex },
        { thaat: searchRegex },
        { vaadi: searchRegex },
        { samvadi: searchRegex },
      ];
    }

    const sortField = query.sortBy || 'display_order';
    const sortDirection = query.sortOrder === 'desc' ? -1 : 1;

    const raags = await Raag.find(filter).sort({ [sortField]: sortDirection });

    return {
      raags,
      total: raags.length,
    };
  }

  /**
   * Get single raag by MongoDB _id, numeric ID, or slug
   */
  static async getRaagById(identifier: string): Promise<IRaagDocument> {
    const filter = buildIdQuery(identifier, { hasSlug: true });
    const raag = await Raag.findOne(filter);

    if (!raag) {
      throw ApiError.notFound(`Raag with identifier '${identifier}' not found`);
    }

    return raag;
  }

  /**
   * Update raag by MongoDB _id, numeric ID, or slug
   */
  static async updateRaag(
    identifier: string,
    updateData: Partial<IRaagDocument>
  ): Promise<IRaagDocument> {
    const filter = buildIdQuery(identifier, { hasSlug: true });
    const raag = await Raag.findOne(filter);

    if (!raag) {
      throw ApiError.notFound(`Raag with identifier '${identifier}' not found`);
    }

    if (updateData.slug) {
      const slug = slugify(updateData.slug);
      const isTaken = await Raag.isSlugTaken(slug, raag._id.toString());
      if (isTaken) {
        throw ApiError.conflict(`Raag slug '${slug}' is already in use`);
      }
      raag.slug = slug;
    }

    const updatableFields: (keyof IRaagDocument)[] = [
      'name',
      'name_unicode',
      'display_order',
      'aroh',
      'avroh',
      'pakad',
      'thaat',
      'jaati',
      'vaadi',
      'samvadi',
      'time',
      'sur',
      'wargit_sur',
      'description',
      'isActive',
    ];

    for (const field of updatableFields) {
      if (updateData[field] !== undefined) {
        (raag as any)[field] = updateData[field];
      }
    }

    await raag.save();
    return raag;
  }

  /**
   * Delete raag by MongoDB _id, numeric ID, or slug
   */
  static async deleteRaag(identifier: string): Promise<void> {
    const filter = buildIdQuery(identifier, { hasSlug: true });
    const raag = await Raag.findOne(filter);

    if (!raag) {
      throw ApiError.notFound(`Raag with identifier '${identifier}' not found`);
    }

    await Raag.deleteOne({ _id: raag._id });
  }
}
