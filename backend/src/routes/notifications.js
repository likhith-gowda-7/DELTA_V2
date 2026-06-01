const express = require("express");
const router = express.Router();
const {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require("../controllers/notificationController");
const { protectedRoute } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validation");
const {
  paginationSchema,
  unreadQuerySchema,
  notificationIdSchema,
} = require("../validators/notification");

// All routes require authentication
router.use(protectedRoute);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications (paginated)
 * @access  Private
 */
router.get("/", validateRequest({ query: paginationSchema }), getNotifications);

/**
 * @route   GET /api/notifications/unread
 * @desc    Get unread notifications
 * @access  Private
 */
router.get(
  "/unread",
  validateRequest({ query: unreadQuerySchema }),
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
  validateRequest({ params: notificationIdSchema }),
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
  validateRequest({ params: notificationIdSchema }),
  deleteNotification,
);

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications
 * @access  Private
 */
router.delete("/", deleteAllNotifications);

module.exports = router;
