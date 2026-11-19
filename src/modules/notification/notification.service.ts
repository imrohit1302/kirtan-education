import mongoose, { Types } from 'mongoose';
import { logger } from '../../config/logger.config.js';
import {
  PushNotificationPayload,
  sendBatchPushNotifications,
} from '../../config/firebase.config.js';
import { ApiError } from '../../utils/apiError.js';
import { User } from '../user/user.model.js';
import { INotificationDocument, Notification } from './notification.model.js';

export interface SendNotificationOptions {
  title: string;
  description: string;
  imageUrl?: string | null;
  type?: string;
  data?: Record<string, any>;
  selectedUsers?: string[] | string;
}

export class NotificationService {
  /**
   * Broadcast a notification to all active users.
   * 1. Saves an in-app notification document for each user (default isRead: false).
   * 2. Gathers device tokens and sends FCM push in batches of up to 400.
   */
  static async sendToAll(payload: {
    title: string;
    description: string;
    imageUrl?: string | null;
    type?: string;
    data?: Record<string, any>;
  }) {
    const users = await User.find({ isActive: true }).select('_id deviceToken').lean();

    if (users.length === 0) {
      return {
        totalRecipients: 0,
        pushTokensCount: 0,
        pushResult: { totalTokens: 0, successCount: 0, failureCount: 0, failedTokens: [] },
      };
    }

    const notificationType = payload.type || 'GENERAL';
    const notificationData = payload.data || {};

    // 1. Bulk insert in-app notifications
    const notificationDocs = users.map(user => ({
      userId: user._id,
      title: payload.title,
      description: payload.description,
      imageUrl: payload.imageUrl || null,
      type: notificationType,
      data: notificationData,
      isRead: false,
      readAt: null,
    }));

    try {
      await Notification.insertMany(notificationDocs, { ordered: false });
    } catch (insertError: any) {
      logger.error('Error bulk-inserting in-app notifications:', { error: insertError.message });
    }

    // 2. Collect FCM tokens
    const tokens = users
      .map(u => u.deviceToken)
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

    // 3. Send FCM push notifications in batches of 400
    const pushPayload: PushNotificationPayload = {
      title: payload.title,
      description: payload.description,
      imageUrl: payload.imageUrl,
      data: {
        ...notificationData,
        type: notificationType,
      },
    };

    const pushResult = await sendBatchPushNotifications(tokens, pushPayload, 400);

    return {
      totalRecipients: users.length,
      pushTokensCount: tokens.length,
      pushResult,
    };
  }

  /**
   * Send notification to selected users or all users.
   */
  static async sendToUsers(options: SendNotificationOptions) {
    const { selectedUsers, title, description, imageUrl, type, data } = options;

    const isAll =
      !selectedUsers ||
      selectedUsers === 'all' ||
      (Array.isArray(selectedUsers) && (selectedUsers.length === 0 || selectedUsers.includes('all')));

    if (isAll) {
      return NotificationService.sendToAll({
        title,
        description,
        imageUrl,
        type: type || 'ADMIN_BROADCAST',
        data,
      });
    }

    const rawUserIds = Array.isArray(selectedUsers) ? selectedUsers : [selectedUsers];
    const validObjectIds = rawUserIds
      .filter(id => mongoose.isValidObjectId(id))
      .map(id => new mongoose.Types.ObjectId(id));

    if (validObjectIds.length === 0) {
      throw ApiError.badRequest('No valid user IDs provided in selectedUsers');
    }

    const users = await User.find({
      _id: { $in: validObjectIds },
      isActive: true,
    })
      .select('_id deviceToken')
      .lean();

    if (users.length === 0) {
      throw ApiError.notFound('No active users found matching the selected user IDs');
    }

    const notificationType = type || 'ADMIN_BROADCAST';
    const notificationData = data || {};

    // 1. Bulk insert in-app notifications
    const docs = users.map(user => ({
      userId: user._id,
      title,
      description,
      imageUrl: imageUrl || null,
      type: notificationType,
      data: notificationData,
      isRead: false,
      readAt: null,
    }));

    try {
      await Notification.insertMany(docs, { ordered: false });
    } catch (insertError: any) {
      logger.error('Error inserting in-app notifications for selected users:', {
        error: insertError.message,
      });
    }

    // 2. Collect FCM tokens
    const tokens = users
      .map(u => u.deviceToken)
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

    // 3. Batch push FCM notifications
    const pushResult = await sendBatchPushNotifications(
      tokens,
      {
        title,
        description,
        imageUrl,
        data: {
          ...notificationData,
          type: notificationType,
        },
      },
      400
    );

    return {
      totalRecipients: users.length,
      pushTokensCount: tokens.length,
      pushResult,
    };
  }

  /**
   * Helper called automatically when a new tutorial is published.
   */
  static async notifyNewTutorial(tutorial: { id: any; title: string; description?: string }) {
    logger.info(`Dispatching new tutorial notification for: "${tutorial.title}"`);
    return NotificationService.sendToAll({
      title: 'New Tutorial Added! 🎶',
      description: `New tutorial "${tutorial.title}" is now available to practice.`,
      type: 'NEW_TUTORIAL',
      data: {
        tutorialId: String(tutorial.id),
        type: 'NEW_TUTORIAL',
      },
    });
  }

  /**
   * Get all notifications for the current authenticated user without pagination.
   * Requirement: When this API is called, mark all unread notifications as read.
   */
  static async getUserNotifications(
    userId: string,
    query: {
      isRead?: boolean;
      type?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{
    notifications: INotificationDocument[];
    total: number;
    unreadCountBeforeRead: number;
  }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter: Record<string, any> = { userId: userObjectId };

    if (typeof query.isRead === 'boolean') {
      filter.isRead = query.isRead;
    }

    if (query.type) {
      filter.type = query.type;
    }

    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    // 1. Count unread notifications before marking read
    const unreadCountBeforeRead = await Notification.countDocuments({
      userId: userObjectId,
      isRead: false,
    });

    // 2. Fetch all matching notifications (unpaginated)
    const notifications = await Notification.find(filter).sort({ [sortField]: sortDirection });

    // 3. Automatically mark all unread notifications as read
    if (unreadCountBeforeRead > 0) {
      await Notification.updateMany(
        { userId: userObjectId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );
    }

    return {
      notifications,
      total: notifications.length,
      unreadCountBeforeRead,
    };
  }

  /**
   * Mark a single notification as read by ID (one by one).
   */
  static async markAsRead(notificationId: string, userId: string): Promise<INotificationDocument> {
    if (!mongoose.isValidObjectId(notificationId)) {
      throw ApiError.badRequest('Invalid Notification ID format');
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!notification) {
      throw ApiError.notFound('Notification not found or access denied');
    }

    return notification;
  }

  /**
   * Mark all notifications as read for current user.
   */
  static async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await Notification.updateMany(
      { userId: userObjectId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a notification by ID for current user.
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    if (!mongoose.isValidObjectId(notificationId)) {
      throw ApiError.badRequest('Invalid Notification ID format');
    }

    const result = await Notification.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!result) {
      throw ApiError.notFound('Notification not found or access denied');
    }
  }

  /**
   * Clear all notifications for current user.
   */
  static async clearAllNotifications(userId: string): Promise<{ deletedCount: number }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await Notification.deleteMany({ userId: userObjectId });
    return { deletedCount: result.deletedCount || 0 };
  }
}
