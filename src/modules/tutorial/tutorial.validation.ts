import { z } from 'zod';

export const createTutorialSchema = {
  body: z.object({
    id: z.union([z.number(), z.string().trim()]).optional(),
    customId: z.union([z.number(), z.string().trim()]).optional(),
    title: z.string().trim().min(1, 'Tutorial title is required'),
    yt_link: z.string().trim().min(1, 'YouTube link (yt_link) is required'),
    shabad_id: z.union([z.number(), z.string().trim()]).nullable().optional(),
    raag: z.string().trim().nullable().optional(),
    role: z.string().trim().nullable().optional(),
    category: z.string().trim().nullable().optional(),
    verse_id: z.union([z.number(), z.string().trim()]).nullable().optional(),
    first_letter_start: z.string().trim().nullable().optional(),
    description: z.string().trim().nullable().optional(),
    isActive: z.boolean().optional().default(true),
  }),
};

export const updateTutorialSchema = {
  body: z
    .object({
      id: z.union([z.number(), z.string().trim()]).optional(),
      customId: z.union([z.number(), z.string().trim()]).optional(),
      title: z.string().trim().min(1).optional(),
      yt_link: z.string().trim().min(1).optional(),
      shabad_id: z.union([z.number(), z.string().trim()]).nullable().optional(),
      raag: z.string().trim().nullable().optional(),
      role: z.string().trim().nullable().optional(),
      category: z.string().trim().nullable().optional(),
      verse_id: z.union([z.number(), z.string().trim()]).nullable().optional(),
      first_letter_start: z.string().trim().nullable().optional(),
      description: z.string().trim().nullable().optional(),
      isActive: z.boolean().optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
};

export const queryTutorialSchema = {
  query: z.object({
    search: z.string().trim().optional(),
    raag: z.string().trim().optional(),
    role: z.string().trim().optional(),
    category: z.string().trim().optional(),
    shabad_id: z.union([z.string().trim(), z.number()]).optional(),
    verse_id: z.union([z.string().trim(), z.number()]).optional(),
    first_letter_start: z.string().trim().optional(),
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
