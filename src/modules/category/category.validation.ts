import { z } from 'zod';

export const createCategorySchema = {
  body: z.object({
    id: z.number().int().positive().optional(),
    customId: z.number().int().positive().optional(),
    name_unicode: z.string().trim().min(1, 'Unicode name (name_unicode) is required'),
    name: z.string().trim().min(1, 'Category name is required'),
    slug: z.string().trim().toLowerCase().optional(),
    description: z.string().trim().optional(),
    isActive: z.boolean().optional().default(true),
  }),
};

export const updateCategorySchema = {
  body: z
    .object({
      name_unicode: z.string().trim().min(1).optional(),
      name: z.string().trim().min(1).optional(),
      slug: z.string().trim().toLowerCase().optional(),
      description: z.string().trim().optional(),
      isActive: z.boolean().optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
};

export const queryCategorySchema = {
  query: z.object({
    search: z.string().trim().optional(),
    isActive: z
      .string()
      .optional()
      .transform(val => {
        if (val === 'true') return true;
        if (val === 'false') return false;
        return undefined;
      }),
    sortBy: z.string().trim().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
};

