import { z } from 'zod';

export const idParamSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Resource identifier is required'),
  }),
};

export const commonListQuerySchema = {
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
    sortBy: z.string().trim().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
};

