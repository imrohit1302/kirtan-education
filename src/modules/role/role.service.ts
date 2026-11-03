import { ApiError } from '../../utils/apiError.js';
import { buildIdQuery, slugify } from '../../utils/query.util.js';
import { CounterService } from '../counter/counter.service.js';
import { IRoleDocument, Role } from './role.model.js';

export class RoleService {
  /**
   * Create a new role with atomic auto-incremented ID
   */
  static async createRole(data: Partial<IRoleDocument>): Promise<IRoleDocument> {
    let numericId: number;

    if (data.id !== undefined && typeof data.id === 'number') {
      numericId = data.id;
      await CounterService.syncSequence('role', numericId);
    } else if (data.customId !== undefined && typeof data.customId === 'number') {
      numericId = data.customId;
      await CounterService.syncSequence('role', numericId);
    } else {
      numericId = await CounterService.getNextSequence('role', Role);
    }

    const slug = data.slug ? slugify(data.slug) : slugify(data.name || '');

    const isSlugTaken = await Role.isSlugTaken(slug);
    if (isSlugTaken) {
      throw ApiError.conflict(`Role slug '${slug}' already exists`);
    }

    const role = await Role.create({
      ...data,
      customId: numericId,
      id: numericId,
      slug,
    });

    return role;
  }

  /**
   * Get all roles without pagination
   */
  static async getAllRoles(query: {
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ roles: IRoleDocument[]; total: number }> {
    const filter: Record<string, any> = {};

    if (typeof query.isActive === 'boolean') {
      filter.isActive = query.isActive;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [{ name: searchRegex }, { slug: searchRegex }];
    }

    const sortField = query.sortBy || 'customId';
    const sortDirection = query.sortOrder === 'desc' ? -1 : 1;

    const roles = await Role.find(filter).sort({ [sortField]: sortDirection });

    return {
      roles,
      total: roles.length,
    };
  }

  /**
   * Get single role by MongoDB _id, numeric ID, or slug
   */
  static async getRoleById(identifier: string): Promise<IRoleDocument> {
    const filter = buildIdQuery(identifier, { hasSlug: true });
    const role = await Role.findOne(filter);

    if (!role) {
      throw ApiError.notFound(`Role with identifier '${identifier}' not found`);
    }

    return role;
  }

  /**
   * Update role by MongoDB _id, numeric ID, or slug
   */
  static async updateRole(
    identifier: string,
    updateData: Partial<IRoleDocument>
  ): Promise<IRoleDocument> {
    const filter = buildIdQuery(identifier, { hasSlug: true });
    const role = await Role.findOne(filter);

    if (!role) {
      throw ApiError.notFound(`Role with identifier '${identifier}' not found`);
    }

    if (updateData.slug) {
      const slug = slugify(updateData.slug);
      const isTaken = await Role.isSlugTaken(slug, role._id.toString());
      if (isTaken) {
        throw ApiError.conflict(`Role slug '${slug}' is already in use`);
      }
      role.slug = slug;
    }

    if (updateData.name !== undefined) role.name = updateData.name;
    if (updateData.description !== undefined) role.description = updateData.description;
    if (updateData.isActive !== undefined) role.isActive = updateData.isActive;

    await role.save();
    return role;
  }

  /**
   * Delete role by MongoDB _id, numeric ID, or slug
   */
  static async deleteRole(identifier: string): Promise<void> {
    const filter = buildIdQuery(identifier, { hasSlug: true });
    const role = await Role.findOne(filter);

    if (!role) {
      throw ApiError.notFound(`Role with identifier '${identifier}' not found`);
    }

    await Role.deleteOne({ _id: role._id });
  }
}
