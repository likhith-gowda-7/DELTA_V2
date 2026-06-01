import User from "../models/User.js";
import { AppError } from "../lib/AppError.js";
import logger from "../lib/logger.js";

export const userService = {
  async searchUsers(query, limit = 20, skip = 0, currentUserId) {
    // Build search regex
    const searchRegex = new RegExp(query, "i");

    // Search by name or email, exclude current user and their blocked users
    const user = await User.findById(currentUserId);
    const blockedUserIds = user?.blockedUsers || [];

    const users = await User.find({
      $and: [
        {
          $or: [{ name: searchRegex }, { email: searchRegex }],
        },
        { _id: { $ne: currentUserId } },
        { _id: { $nin: blockedUserIds } },
      ],
    })
      .select("_id name email avatar isOnline lastSeen")
      .limit(limit)
      .skip(skip)
      .sort({ name: 1 });

    const total = await User.countDocuments({
      $and: [
        {
          $or: [{ name: searchRegex }, { email: searchRegex }],
        },
        { _id: { $ne: currentUserId } },
        { _id: { $nin: blockedUserIds } },
      ],
    });

    return { users, total };
  },

  async getUserProfile(userId, currentUserId) {
    const user = await User.findById(userId).select(
      "_id name email avatar bio isOnline lastSeen createdAt",
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if current user has blocked this user
    const currentUser = await User.findById(currentUserId);
    const isBlocked = currentUser?.blockedUsers.includes(userId);

    return {
      ...user.toObject(),
      isBlocked,
    };
  },

  async blockUser(userId, blockUserId) {
    if (userId === blockUserId) {
      throw new AppError("You cannot block yourself", 400);
    }

    const user = await User.findById(userId);
    const userToBlock = await User.findById(blockUserId);

    if (!userToBlock) {
      throw new AppError("User not found", 404);
    }

    // Check if already blocked
    if (user.blockedUsers.includes(blockUserId)) {
      throw new AppError("User is already blocked", 409);
    }

    user.blockedUsers.push(blockUserId);
    await user.save();

    logger.info(`User ${userId} blocked ${blockUserId}`);

    return { message: "User blocked successfully" };
  },

  async unblockUser(userId, unblockUserId) {
    const user = await User.findById(userId);

    if (!user.blockedUsers.includes(unblockUserId)) {
      throw new AppError("User is not blocked", 400);
    }

    user.blockedUsers = user.blockedUsers.filter(
      (id) => id.toString() !== unblockUserId,
    );
    await user.save();

    logger.info(`User ${userId} unblocked ${unblockUserId}`);

    return { message: "User unblocked successfully" };
  },

  async getBlockedUsers(userId, limit = 20, skip = 0) {
    const user = await User.findById(userId).populate({
      path: "blockedUsers",
      select: "_id name email avatar isOnline",
      options: { limit, skip },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      blockedUsers: user.blockedUsers,
      total: user.blockedUsers.length,
    };
  },

  async setOnlineStatus(userId, isOnline) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isOnline,
        lastSeen: new Date(),
      },
      { new: true },
    );

    return user;
  },

  async getOnlineStatus(userIds) {
    const users = await User.find({ _id: { $in: userIds } }).select(
      "_id isOnline lastSeen",
    );

    return users;
  },

  async getMultipleUsersStatus(userIds) {
    const users = await User.find({ _id: { $in: userIds } }).select(
      "_id name avatar isOnline lastSeen",
    );

    const statusMap = {};
    users.forEach((user) => {
      statusMap[user._id] = {
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      };
    });

    return statusMap;
  },
};
