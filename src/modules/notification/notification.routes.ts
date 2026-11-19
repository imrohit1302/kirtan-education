import { Router } from 'express';
import { ROLES } from '../../constants/roles.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  clearAllNotifications,
  deleteNotification,
  getMyNotifications,
  markAllAsRead,
  markAsRead,
  sendNotification,
} from './notification.controller.js';
import {
  notificationIdParamSchema,
  queryNotificationSchema,
  sendNotificationSchema,
} from './notification.validation.js';

const router = Router();

// Protect all notification endpoints with JWT authentication
router.use(authenticate);

// 1. User In-App Notification Endpoints
router.get('/', validate(queryNotificationSchema), getMyNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', validate(notificationIdParamSchema), markAsRead);
router.delete('/:id', validate(notificationIdParamSchema), deleteNotification);
router.delete('/', clearAllNotifications);

// 2. Admin Broadcast & Targeted Push Notification Endpoint (batch-wise up to 400)
router.post(
  '/send',
  authorize(ROLES.ADMIN),
  validate(sendNotificationSchema),
  sendNotification
);

export default router;
