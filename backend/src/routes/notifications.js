import express from "express";
import { protectedRoute } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import {
  paginationSchema,
  unreadQuerySchema,
  notificationIdSchema,
} from "../validators/notification.js";
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

// All routes require authentication
router.use(protectedRoute);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications (paginated)
 * @access  Private
 */
router.get("/", validateRequest(paginationSchema, "query"), getNotifications);

/**
 * @route   GET /api/notifications/unread
 * @desc    Get unread notifications
 * @access  Private
 */
router.get(
  "/unread",
  validateRequest(unreadQuerySchema, "query"),
  getUnreadNotifications,
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get("/unread-count", getUnreadCount);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put(
  "/:id/read",
  validateRequest(notificationIdSchema, "params"),
  markAsRead,
);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put("/read-all", markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete(
  "/:id",
  validateRequest(notificationIdSchema, "params"),
  deleteNotification,
);

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications
 * @access  Private
 */
router.delete("/", deleteAllNotifications);

export default router;
