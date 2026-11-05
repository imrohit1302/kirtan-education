import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const userIdParamSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId format'),
  }),
};

export const updateProfileSchema = {
  body: z
    .object({
      fullName: z.string().trim().min(2).max(100).optional(),
      phone: z.string().trim().min(5).optional(),
      countryCode: z.string().trim().optional(),
      isoCode: z.string().trim().max(5).optional(),
      deviceType: z.enum(['ios', 'android', 'web']).optional(),
      deviceToken: z.string().trim().optional(),
      userProfile: z.string().trim().nullable().optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for profile update',
    }),
};

export const updateUserRoleSchema = {
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId format'),
  }),
  body: z.object({
    role: z.enum(['user', 'admin']),
  }),
};

export const queryUsersSchema = {
  query: z.object({
    search: z.string().trim().optional(),
    role: z.enum(['user', 'admin']).optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
};
