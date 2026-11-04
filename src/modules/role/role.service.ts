import { ApiError } from '../../utils/apiError.js';
import { buildIdQuery, slugify } from '../../utils/query.util.js';
import { IRoleDocument, Role } from './role.model.js';

export class RoleService {
  /**
   * Create a new role.
   * id is optional in body and not internally generated/managed.
   */
  static async createRole(data: Partial<IRoleDocument>): Promise<IRoleDocument> {
    const userProvidedId = data.id !== undefined ? data.id : data.customId;
    const slug = data.slug ? slugify(data.slug) : slugify(data.name || '');

    const isSlugTaken = await Role.isSlugTaken(slug);
    if (isSlugTaken) {
      throw ApiError.conflict(`Role slug '${slug}' already exists`);
    }

    const role = await Role.create({
      ...data,
      ...(userProvidedId !== undefined ? { id: userProvidedId, customId: userProvidedId } : {}),
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

    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'desc' ? -1 : 1;

    const roles = await Role.find(filter).sort({ [sortField]: sortDirection });

    return {
      roles,
      total: roles.length,
    };
  }

  /**
   * Get single role by MongoDB _id or body-provided id or slug
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
   * Update role by MongoDB _id or body-provided id or slug
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

    if (updateData.id !== undefined) {
      role.id = updateData.id;
      role.customId = updateData.id;
    } else if (updateData.customId !== undefined) {
      role.id = updateData.customId;
      role.customId = updateData.customId;
    }

    if (updateData.name !== undefined) role.name = updateData.name;
    if (updateData.description !== undefined) role.description = updateData.description;
    if (updateData.isActive !== undefined) role.isActive = updateData.isActive;

    await role.save();
    return role;
  }

  /**
   * Delete role by MongoDB _id or body-provided id or slug
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
