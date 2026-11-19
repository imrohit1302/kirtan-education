import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/apiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { NotificationService } from './notification.service.js';

/**
 * GET /api/v1/notifications
 * Retrieves all notifications for current authenticated user (unpaginated).
 * Automatically marks all unread notifications as read.
 */
export const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const { notifications, total, unreadCountBeforeRead } =
    await NotificationService.getUserNotifications(userId, req.query as any);

  return ApiResponse.success(
    res,
    'Notifications retrieved successfully (unread items marked as read)',
    { notifications, total },
    200,
    { unreadMarkedRead: unreadCountBeforeRead }
  );
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read by ID (one by one).
 */
export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const notification = await NotificationService.markAsRead(req.params.id as string, userId);

  return ApiResponse.success(res, 'Notification marked as read successfully', { notification });
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read for current user.
 */
export const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const result = await NotificationService.markAllAsRead(userId);

  return ApiResponse.success(res, 'All notifications marked as read successfully', result);
});

/**
 * DELETE /api/v1/notifications/:id
 * Delete a specific notification by ID.
 */
export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  await NotificationService.deleteNotification(req.params.id as string, userId);

  return ApiResponse.success(res, 'Notification deleted successfully');
});

/**
 * DELETE /api/v1/notifications
 * Clear all notifications for current user.
 */
export const clearAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id.toString();
  const result = await NotificationService.clearAllNotifications(userId);

  return ApiResponse.success(res, 'All notifications cleared successfully', result);
});

/**
 * POST /api/v1/notifications/send (Admin)
 * Send push & in-app notification to all or selected users in batches of 400.
 */
export const sendNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.sendToUsers(req.body);

  return ApiResponse.success(
    res,
    `Notification dispatched successfully to ${result.totalRecipients} recipient(s)`,
    result
  );
});
