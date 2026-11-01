import { z } from 'zod';
import { ALL_ROLES } from '../../constants/roles.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const userIdParamSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId format'),
  }),
};

export const updateProfileSchema = {
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      email: z.string().trim().email('Invalid email address format').optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one field (name or email) must be provided for update',
    }),
};

export const updateUserRoleSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId format'),
  }),
  body: z.object({
    role: z.enum(ALL_ROLES, {
      errorMap: () => ({ message: `Role must be one of: ${ALL_ROLES.join(', ')}` }),
    }),
  }),
};

export const queryUsersSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().trim().optional(),
    role: z.enum(ALL_ROLES).optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};
