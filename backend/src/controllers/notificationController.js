import { asyncHandler } from "../lib/asyncHandler.js";
import { AppError } from "../lib/AppError.js";
import * as notificationService from "../services/notification.service.js";

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for current user (paginated)
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const result = await notificationService.getNotifications(
    req.user._id,
    parseInt(page),
    parseInt(limit),
  );

  res.status(200).json({
    success: true,
    data: result.notifications,
    pagination: {
      page: result.page,
      pages: result.pages,
      total: result.total,
    },
  });
});

/**
 * @route   GET /api/notifications/unread
 * @desc    Get unread notifications for current user
 * @access  Private
 */
export const getUnreadNotifications = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const notifications = await notificationService.getUnreadNotifications(
    req.user._id,
    parseInt(limit),
  );

  res.status(200).json({
    success: true,
    data: notifications,
  });
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for current user
 * @access  Private
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);

  res.status(200).json({
    success: true,
    unreadCount: count,
  });
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await notificationService.markAsRead(id, req.user._id);

  res.status(200).json({
    success: true,
    data: notification,
    message: "Notification marked as read",
  });
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for current user
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);

  res.status(200).json({
    success: true,
    message: `Marked ${result.modifiedCount} notifications as read`,
  });
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await notificationService.deleteNotification(id, req.user._id);

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
  });
});

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications for current user
 * @access  Private
 */
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteAllNotifications(req.user._id);

  res.status(200).json({
    success: true,
    message: `Deleted ${result.deletedCount} notifications`,
  });
});
