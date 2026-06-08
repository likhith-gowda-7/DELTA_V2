import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster queries
    },
    type: {
      type: String,
      enum: [
        "new_message",
        "mention",
        "user_joined",
        "user_left",
        "member_added",
      ],
      required: true,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    triggerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // User who triggered the notification
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },
    read: {
      type: Boolean,
      default: false,
      index: true, // For quick unread count
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Index for finding unread notifications for a user
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Pre-save hook to validate
notificationSchema.pre("save", async function (next) {
  if (!this.isNew && !this.isModified("read")) {
    return next();
  }

  // Set readAt timestamp when marked as read
  if (this.read && !this.readAt) {
    this.readAt = new Date();
  }

  next();
});

// Static method to create notification
notificationSchema.statics.createNotification = async function (
  userId,
  type,
  chatId,
  triggerUserId,
  content,
  messageId = null,
) {
  try {
    const notification = await this.create({
      userId,
      type,
      chatId,
      triggerUserId,
      content,
      messageId,
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function (userId) {
  try {
    const count = await this.countDocuments({
      userId,
      read: false,
    });

    return count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
};

export default mongoose.model("Notification", notificationSchema);
