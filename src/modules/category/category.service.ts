import { ApiError } from '../../utils/apiError.js';
import { buildIdQuery, slugify } from '../../utils/query.util.js';
import { Category, ICategoryDocument } from './category.model.js';

export class CategoryService {
  /**
   * Create a new category.
   * id is optional in body and not internally generated/managed.
   */
  static async createCategory(data: Partial<ICategoryDocument>): Promise<ICategoryDocument> {
    const userProvidedId = data.id !== undefined ? data.id : data.customId;
    const slug = data.slug ? slugify(data.slug) : slugify(data.name || '');

    const isSlugTaken = await Category.isSlugTaken(slug);
    if (isSlugTaken) {
      throw ApiError.conflict(`Category slug '${slug}' already exists`);
    }

    const category = await Category.create({
      ...data,
      ...(userProvidedId !== undefined ? { id: userProvidedId, customId: userProvidedId } : {}),
      slug,
    });

    return category;
  }

  /**
   * Get all categories without pagination
   */
  static async getAllCategories(query: {
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ categories: ICategoryDocument[]; total: number }> {
    const filter: Record<string, any> = {};

    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { name_unicode: searchRegex },
        { slug: searchRegex },
      ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'desc' ? -1 : 1;

    const categories = await Category.find(filter).sort({ [sortField]: sortDirection });

    return {
      categories,
      total: categories.length,
    };
  }

  /**
   * Get single category by MongoDB _id or body-provided id or slug
   */
  static async getCategoryById(identifier: string): Promise<ICategoryDocument> {
    const filter = buildIdQuery(identifier, { hasSlug: true });
    const category = await Category.findOne(filter);

    if (!category) {
      throw ApiError.notFound(`Category with identifier '${identifier}' not found`);
    }

    return category;
  }

  /**
   * Update category by MongoDB _id or body-provided id or slug
   */
  static async updateCategory(
    identifier: string,
    updateData: Partial<ICategoryDocument>
  ): Promise<ICategoryDocument> {
    const filter = buildIdQuery(identifier, { hasSlug: true });
    const category = await Category.findOne(filter);

    if (!category) {
      throw ApiError.notFound(`Category with identifier '${identifier}' not found`);
    }

    if (updateData.slug) {
      const slug = slugify(updateData.slug);
      const isTaken = await Category.isSlugTaken(slug, category._id.toString());
      if (isTaken) {
        throw ApiError.conflict(`Category slug '${slug}' is already in use`);
      }
      category.slug = slug;
    }

    if (updateData.id !== undefined) {
      category.id = updateData.id;
      category.customId = updateData.id;
    } else if (updateData.customId !== undefined) {
      category.id = updateData.customId;
      category.customId = updateData.customId;
    }

    if (updateData.name !== undefined) category.name = updateData.name;
    if (updateData.name_unicode !== undefined) category.name_unicode = updateData.name_unicode;
    if (updateData.description !== undefined) category.description = updateData.description;
    if (updateData.isActive !== undefined) category.isActive = updateData.isActive;

    await category.save();
    return category;
  }

  /**
   * Delete category by MongoDB _id or body-provided id or slug
   */
  static async deleteCategory(identifier: string): Promise<void> {
    const filter = buildIdQuery(identifier, { hasSlug: true });
    const category = await Category.findOne(filter);

    if (!category) {
      throw ApiError.notFound(`Category with identifier '${identifier}' not found`);
    }

    await Category.deleteOne({ _id: category._id });
  }
}
