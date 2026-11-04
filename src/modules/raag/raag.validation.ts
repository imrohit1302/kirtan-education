import { z } from 'zod';

export const createRaagSchema = {
  body: z.object({
    id: z.union([z.number(), z.string().trim()]).optional(),
    customId: z.union([z.number(), z.string().trim()]).optional(),
    name_unicode: z.string().trim().min(1, 'Unicode name (name_unicode) is required'),
    name: z.string().trim().min(1, 'Raag name is required'),
    slug: z.string().trim().toLowerCase().optional(),
    display_order: z.number().int().optional().default(1),
    aroh: z.string().trim().optional(),
    avroh: z.string().trim().optional(),
    pakad: z.string().trim().optional(),
    thaat: z.string().trim().optional(),
    jaati: z.string().trim().optional(),
    vaadi: z.string().trim().optional(),
    samvadi: z.string().trim().optional(),
    time: z.string().trim().optional(),
    sur: z.string().trim().optional(),
    wargit_sur: z.string().trim().optional(),
    description: z.string().trim().optional(),
    isActive: z.boolean().optional().default(true),
  }),
};

export const updateRaagSchema = {
  body: z
    .object({
      id: z.union([z.number(), z.string().trim()]).optional(),
      customId: z.union([z.number(), z.string().trim()]).optional(),
      name_unicode: z.string().trim().min(1).optional(),
      name: z.string().trim().min(1).optional(),
      slug: z.string().trim().toLowerCase().optional(),
      display_order: z.number().int().optional(),
      aroh: z.string().trim().optional(),
      avroh: z.string().trim().optional(),
      pakad: z.string().trim().optional(),
      thaat: z.string().trim().optional(),
      jaati: z.string().trim().optional(),
      vaadi: z.string().trim().optional(),
      samvadi: z.string().trim().optional(),
      time: z.string().trim().optional(),
      sur: z.string().trim().optional(),
      wargit_sur: z.string().trim().optional(),
      description: z.string().trim().optional(),
      isActive: z.boolean().optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
};

export const queryRaagSchema = {
  query: z.object({
    search: z.string().trim().optional(),
    thaat: z.string().trim().optional(),
    time: z.string().trim().optional(),
    isActive: z
      .string()
      .optional()
      .transform(val => {
        if (val === 'true') return true;
        if (val === 'false') return false;
        return undefined;
      }),
    sortBy: z.string().trim().optional().default('display_order'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
};
