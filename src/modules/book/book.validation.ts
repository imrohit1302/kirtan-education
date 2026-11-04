import { z } from 'zod';

export const createBookSchema = {
  body: z.object({
    id: z.union([z.number(), z.string().trim()]).optional(),
    customId: z.union([z.number(), z.string().trim()]).optional(),
    name: z.string().trim().min(1, 'Book name is required'),
    description: z.string().trim().optional(),
    authorName: z.string().trim().min(1, 'Author name is required'),
    imageUrl: z.string().trim().optional(),
    pdfUrl: z.string().trim().optional(),
    category: z.string().trim().optional(),
    isActive: z.boolean().optional().default(true),
  }),
};

export const updateBookSchema = {
  body: z
    .object({
      id: z.union([z.number(), z.string().trim()]).optional(),
      customId: z.union([z.number(), z.string().trim()]).optional(),
      name: z.string().trim().min(1).optional(),
      description: z.string().trim().optional(),
      authorName: z.string().trim().min(1).optional(),
      imageUrl: z.string().trim().optional(),
      pdfUrl: z.string().trim().optional(),
      category: z.string().trim().optional(),
      isActive: z.boolean().optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
};

export const queryBookSchema = {
  query: z.object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    authorName: z.string().trim().optional(),
    isActive: z
      .string()
      .optional()
      .transform(val => {
        if (val === 'true') return true;
        if (val === 'false') return false;
        return undefined;
      }),
    sortBy: z.string().trim().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
};
