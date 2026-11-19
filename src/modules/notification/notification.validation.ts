import { z } from 'zod';

export const sendNotificationSchema = {
  body: z.object({
    title: z.string().trim().min(1, 'Notification title is required').max(200),
    description: z.string().trim().min(1, 'Notification description is required').max(1000),
    imageUrl: z.string().trim().nullable().optional(),
    type: z.string().trim().optional().default('ADMIN_BROADCAST'),
    selectedUsers: z
      .union([
        z.array(z.string().trim()),
        z.literal('all'),
        z.string().trim(),
      ])
      .optional()
      .describe('Array of User MongoDB ObjectIds, "all", or omit for all users'),
    data: z.record(z.string(), z.any()).optional().default({}),
  }),
};

export const notificationIdParamSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Notification ID is required'),
  }),
};

export const queryNotificationSchema = {
  query: z.object({
    isRead: z
      .string()
      .optional()
      .transform(val => {
        if (val === 'true') return true;
        if (val === 'false') return false;
        return undefined;
      }),
    type: z.string().trim().optional(),
    sortBy: z.string().trim().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
};
