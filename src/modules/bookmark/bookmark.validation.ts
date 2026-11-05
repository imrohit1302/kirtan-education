import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Schema for bookmark/unbookmark by tutorial MongoDB _id or numeric id.
 * tutorialId can be either a 24-char hex ObjectId or a numeric id (passed as string).
 */
export const bookmarkTutorialSchema = {
  body: z.object({
    tutorialId: z
      .string()
      .trim()
      .min(1, 'tutorialId is required')
      .describe('Tutorial MongoDB _id (24-char hex) or numeric id as string'),
  }),
};

export const bookmarkIdParamSchema = {
  params: z.object({
    tutorialId: z
      .string()
      .trim()
      .min(1, 'tutorialId is required'),
  }),
};

export const queryBookmarksSchema = {
  query: z.object({
    sortBy: z.string().trim().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
};
