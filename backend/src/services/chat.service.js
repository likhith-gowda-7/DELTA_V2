import Chat from "../models/Chat.js";
import User from "../models/User.js";
import { AppError } from "../lib/AppError.js";
import logger from "../lib/logger.js";

export const chatService = {
  async createOrAccessChat(userId, otherUserId) {
    // Check if other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      throw new AppError("User not found", 404);
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [userId, otherUserId] },
    })
      .populate("users", "_id name email avatar isOnline")
      .populate("latestMessage");

    if (existingChat) {
      return existingChat;
    }

    // Create new 1-to-1 chat
    const newChat = new Chat({
      name: null,
      isGroupChat: false,
      users: [userId, otherUserId],
    });

    await newChat.save();
    await newChat.populate("users", "_id name email avatar isOnline");

    logger.info(`New 1-to-1 chat created: ${newChat._id}`);
    return newChat;
  },

  async getUserChats(userId) {
    const chats = await Chat.find({ users: userId })
      .populate("users", "_id name email avatar isOnline")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "_id name",
        },
      })
      .sort({ latestMessageTime: -1 })
      .lean();

    return chats;
  },

  async getChat(chatId, userId) {
    const chat = await Chat.findById(chatId)
      .populate("users", "_id name email avatar isOnline")
      .populate("groupAdmins", "_id name")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "_id name",
        },
      });

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    // Check if user is part of the chat
    if (!chat.users.find((u) => u._id.toString() === userId)) {
      throw new AppError("You are not a member of this chat", 403);
    }

    return chat;
  },

  async createGroupChat(name, userIds, userId, description = "") {
    // Ensure creator is included
    const uniqueUserIds = [...new Set([userId, ...userIds])];

    if (uniqueUserIds.length < 2) {
      throw new AppError("Group must have at least 2 members", 400);
    }

    const newChat = new Chat({
      name,
      isGroupChat: true,
      users: uniqueUserIds,
      groupAdmins: [userId],
      description,
    });

    await newChat.save();
    await newChat.populate("users", "_id name email avatar");
    await newChat.populate("groupAdmins", "_id name");

    logger.info(`New group chat created: ${newChat._id} by user ${userId}`);
    return newChat;
  },

  async renameChat(chatId, newName, userId) {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    if (!chat.isGroupChat) {
      throw new AppError("Cannot rename 1-to-1 chat", 400);
    }

    // Check if user is admin
    if (!chat.groupAdmins.includes(userId)) {
      throw new AppError("Only admins can rename the group", 403);
    }

    chat.name = newName;
    await chat.save();

    logger.info(`Group chat ${chatId} renamed to "${newName}"`);
    return chat;
  },

  async addMemberToChat(chatId, newUserId, userId) {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    if (!chat.isGroupChat) {
      throw new AppError("Cannot add members to 1-to-1 chat", 400);
    }

    // Check if user is admin
    if (!chat.groupAdmins.includes(userId)) {
      throw new AppError("Only admins can add members", 403);
    }

    // Check if user already exists
    if (chat.users.includes(newUserId)) {
      throw new AppError("User is already a member", 409);
    }

    // Check if new user exists
    const newUser = await User.findById(newUserId);
    if (!newUser) {
      throw new AppError("User not found", 404);
    }

    chat.users.push(newUserId);
    await chat.save();

    await chat.populate("users", "_id name email avatar");

    logger.info(`User ${newUserId} added to group chat ${chatId}`);
    return chat;
  },

  async removeMemberFromChat(chatId, userToRemove, userId) {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    if (!chat.isGroupChat) {
      throw new AppError("Cannot remove members from 1-to-1 chat", 400);
    }

    // Check if user is admin or removing themselves
    if (!chat.groupAdmins.includes(userId) && userId !== userToRemove) {
      throw new AppError("Only admins can remove members", 403);
    }

    // Check if user is a member
    if (!chat.users.includes(userToRemove)) {
      throw new AppError("User is not a member of this chat", 400);
    }

    chat.users = chat.users.filter((u) => u.toString() !== userToRemove);

    // If last admin left, make another admin
    if (chat.groupAdmins.includes(userToRemove)) {
      chat.groupAdmins = chat.groupAdmins.filter((u) => u.toString() !== userToRemove);
      if (chat.groupAdmins.length === 0 && chat.users.length > 0) {
        chat.groupAdmins.push(chat.users[0]);
      }
    }

    await chat.save();
    await chat.populate("users", "_id name email avatar");

    logger.info(`User ${userToRemove} removed from group chat ${chatId}`);
    return chat;
  },

  async promoteToAdmin(chatId, userId, promoterId) {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    if (!chat.isGroupChat) {
      throw new AppError("Cannot promote admins in 1-to-1 chat", 400);
    }

    // Check if promoter is admin
    if (!chat.groupAdmins.includes(promoterId)) {
      throw new AppError("Only admins can promote members", 403);
    }

    // Check if user is a member
    if (!chat.users.includes(userId)) {
      throw new AppError("User is not a member of this chat", 400);
    }

    // Check if already admin
    if (chat.groupAdmins.includes(userId)) {
      throw new AppError("User is already an admin", 409);
    }

    chat.groupAdmins.push(userId);
    await chat.save();

    await chat.populate("groupAdmins", "_id name");

    logger.info(`User ${userId} promoted to admin in group chat ${chatId}`);
    return chat;
  },

  async deleteChat(chatId, userId) {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    // For group chats, only admins can delete
    if (chat.isGroupChat && !chat.groupAdmins.includes(userId)) {
      throw new AppError("Only admins can delete group chats", 403);
    }

    // For 1-to-1 chats, only members can delete
    if (!chat.users.includes(userId)) {
      throw new AppError("You are not a member of this chat", 403);
    }

    await Chat.findByIdAndDelete(chatId);

    logger.info(`Chat ${chatId} deleted`);
    return { message: "Chat deleted successfully" };
  },
};
