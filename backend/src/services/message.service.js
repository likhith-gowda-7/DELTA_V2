import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import { AppError } from "../lib/AppError.js";
import logger from "../lib/logger.js";

const includesObjectId = (arr, id) =>
  arr.some((item) => item.toString() === id.toString());

export const messageService = {
  async sendMessage(
    chatId,
    senderId,
    content,
    fileUrl = null,
    fileType = null,
    fileName = null,
    fileSize = null,
  ) {
    // Verify chat exists and user is a member
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    if (!includesObjectId(chat.users, senderId)) {
      throw new AppError("You are not a member of this chat", 403);
    }

    // Create message
    const message = new Message({
      sender: senderId,
      chat: chatId,
      content,
      fileUrl,
      fileType,
      fileName,
      fileSize,
      readBy: [{ user: senderId }], // Sender has read their own message
    });

    await message.save();
    await message.populate("sender", "_id name avatar");

    // Update latest message in chat
    chat.latestMessage = message._id;
    chat.latestMessageTime = new Date();
    await chat.save();

    logger.info(`Message sent in chat ${chatId} by user ${senderId}`);
    return message;
  },

  async getMessages(chatId, userId, skip = 0, limit = 50) {
    // Verify chat exists and user is a member
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    if (!includesObjectId(chat.users, userId)) {
      throw new AppError("You are not a member of this chat", 403);
    }

    const messages = await Message.find({
      chat: chatId,
      isDeleted: false,
    })
      .populate("sender", "_id name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Reverse to get chronological order
    return messages.reverse();
  },

  async editMessage(messageId, newContent, userId) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId) {
      throw new AppError("Only sender can edit message", 403);
    }

    // Can only edit messages within 5 minutes
    const messageAge = Date.now() - message.createdAt.getTime();
    if (messageAge > 5 * 60 * 1000) {
      throw new AppError("Messages can only be edited within 5 minutes", 400);
    }

    message.content = newContent;
    message.editedAt = new Date();
    await message.save();

    await message.populate("sender", "_id name avatar");

    logger.info(`Message ${messageId} edited by user ${userId}`);
    return message;
  },

  async deleteMessage(messageId, userId) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Check if user is the sender or chat admin
    const chat = await Chat.findById(message.chat);
    const isSender = message.sender.toString() === userId;
    const isAdmin = chat?.groupAdmins?.some((id) => id.toString() === userId);

    if (!isSender && !isAdmin) {
      throw new AppError("You can only delete your own messages", 403);
    }

    // Soft delete
    message.isDeleted = true;
    await message.save();

    logger.info(`Message ${messageId} deleted by user ${userId}`);
    return { message: "Message deleted successfully" };
  },

  async markAsRead(messageId, userId) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Check if user already read the message
    const alreadyRead = message.readBy.some((r) => r.user.toString() === userId);
    if (!alreadyRead) {
      message.readBy.push({ user: userId, readAt: new Date() });
      await message.save();
    }

    return message;
  },

  async markChatAsRead(chatId, userId) {
    // Mark all unread messages in chat as read by this user.
    // Uses a single updateMany with $addToSet instead of N individual saves.
    const result = await Message.updateMany(
      {
        chat: chatId,
        isDeleted: false,
        "readBy.user": { $ne: userId },
      },
      {
        $addToSet: {
          readBy: { user: userId, readAt: new Date() },
        },
      },
    );

    return { message: `Marked ${result.modifiedCount} messages as read` };
  },

  async getUnreadCount(chatId, userId) {
    const count = await Message.countDocuments({
      chat: chatId,
      isDeleted: false,
      "readBy.user": { $ne: userId },
    });

    return count;
  },

  async searchMessages(chatId, keyword, userId) {
    // Verify user is a member of the chat
    const chat = await Chat.findById(chatId);
    if (!chat || !includesObjectId(chat.users, userId)) {
      throw new AppError("Unauthorized", 403);
    }

    // Escape regex special characters to prevent ReDoS
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const messages = await Message.find({
      chat: chatId,
      isDeleted: false,
      content: { $regex: escapedKeyword, $options: "i" },
    })
      .populate("sender", "_id name avatar")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return messages;
  },
};
