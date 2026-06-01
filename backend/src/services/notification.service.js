const Notification = require("../models/Notification");
const User = require("../models/User");
const Chat = require("../models/Chat");
const logger = require("../lib/logger");
const AppError = require("../lib/AppError");

/**
 * Create a new notification
 */
const createNotification = async (
  userId,
  type,
  chatId,
  triggerUserId,
  content,
  messageId = null,
) => {
  try {
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Validate chat exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    // Don't notify user about their own actions
    if (userId.toString() === triggerUserId.toString()) {
      return null;
    }

    const notification = await Notification.create({
      userId,
      type,
      chatId,
      triggerUserId,
      content,
      messageId,
    });

    // Populate references for response
    const populated = await notification.populate([
      { path: "triggerUserId", select: "fullName avatar" },
      { path: "chatId", select: "name isGroupChat" },
    ]);

    logger.info(`Notification created: ${notification._id} for user ${userId}`);
    return populated;
  } catch (error) {
    logger.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Get all notifications for a user (paginated)
 */
const getNotifications = async (userId, page = 1, limit = 20) => {
  try {
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId })
      .populate("triggerUserId", "fullName avatar")
      .populate("chatId", "name isGroupChat")
      .populate("messageId", "content")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments({ userId });

    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    throw error;
  }
};

/**
 * Get unread notifications for a user
 */
const getUnreadNotifications = async (userId, limit = 10) => {
  try {
    const notifications = await Notification.find({
      userId,
      read: false,
    })
      .populate("triggerUserId", "fullName avatar")
      .populate("chatId", "name isGroupChat")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return notifications;
  } catch (error) {
    logger.error("Error fetching unread notifications:", error);
    throw error;
  }
};

/**
 * Get unread count for a user
 */
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      userId,
      read: false,
    });

    return count;
  } catch (error) {
    logger.error("Error getting unread count:", error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    // Verify ownership
    if (notification.userId.toString() !== userId.toString()) {
      throw new AppError("Unauthorized to update this notification", 403);
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    logger.info(`Notification marked as read: ${notificationId}`);
    return notification;
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      {
        userId,
        read: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      },
    );

    logger.info(
      `Marked ${result.modifiedCount} notifications as read for user ${userId}`,
    );
    return result;
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    // Verify ownership
    if (notification.userId.toString() !== userId.toString()) {
      throw new AppError("Unauthorized to delete this notification", 403);
    }

    await Notification.findByIdAndDelete(notificationId);

    logger.info(`Notification deleted: ${notificationId}`);
    return { message: "Notification deleted successfully" };
  } catch (error) {
    logger.error("Error deleting notification:", error);
    throw error;
  }
};

/**
 * Delete all notifications for a user
 */
const deleteAllNotifications = async (userId) => {
  try {
    const result = await Notification.deleteMany({ userId });

    logger.info(
      `Deleted ${result.deletedCount} notifications for user ${userId}`,
    );
    return result;
  } catch (error) {
    logger.error("Error deleting all notifications:", error);
    throw error;
  }
};

/**
 * Bulk create notifications for multiple users
 * Useful for group chat notifications
 */
const createNotificationsForUsers = async (
  userIds,
  type,
  chatId,
  triggerUserId,
  content,
  messageId = null,
) => {
  try {
    const notifications = [];

    for (const userId of userIds) {
      // Skip notifying the user who triggered the action
      if (userId.toString() !== triggerUserId.toString()) {
        const notif = await createNotification(
          userId,
          type,
          chatId,
          triggerUserId,
          content,
          messageId,
        );
        if (notif) {
          notifications.push(notif);
        }
      }
    }

    logger.info(
      `Created ${notifications.length} notifications for ${userIds.length} users`,
    );
    return notifications;
  } catch (error) {
    logger.error("Error bulk creating notifications:", error);
    throw error;
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotificationsForUsers,
};
