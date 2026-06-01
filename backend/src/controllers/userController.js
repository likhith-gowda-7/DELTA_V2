import { userService } from "../services/user.service.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { AppError } from "../lib/AppError.js";
import logger from "../lib/logger.js";

// @route   GET /api/users/search?q=term&limit=20&skip=0
// @access  Protected
export const searchUsers = asyncHandler(async (req, res) => {
  const { q, limit = 20, skip = 0 } = req.query;

  if (!q || q.trim().length < 1) {
    throw new AppError("Search query is required", 400);
  }

  const { users, total } = await userService.searchUsers(
    q.trim(),
    parseInt(limit),
    parseInt(skip),
    req.userId,
  );

  res.status(200).json({
    success: true,
    data: {
      users,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    },
  });
});

// @route   GET /api/users/:userId
// @access  Protected
export const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await userService.getUserProfile(userId, req.userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @route   POST /api/users/:userId/block
// @access  Protected
export const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await userService.blockUser(req.userId, userId);

  logger.info(`User ${req.userId} blocked ${userId}`);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// @route   DELETE /api/users/:userId/block
// @access  Protected
export const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await userService.unblockUser(req.userId, userId);

  logger.info(`User ${req.userId} unblocked ${userId}`);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// @route   GET /api/users/blocked
// @access  Protected
export const getBlockedUsers = asyncHandler(async (req, res) => {
  const { limit = 20, skip = 0 } = req.query;

  const result = await userService.getBlockedUsers(
    req.userId,
    parseInt(limit),
    parseInt(skip),
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});

// @route   GET /api/users/online-status?ids=id1,id2,id3
// @access  Protected
export const getOnlineStatus = asyncHandler(async (req, res) => {
  const { ids } = req.query;

  if (!ids) {
    throw new AppError("User IDs are required", 400);
  }

  const userIds = ids.split(",").filter((id) => id.match(/^[0-9a-f]{24}$/));

  if (userIds.length === 0) {
    throw new AppError("Invalid user IDs", 400);
  }

  const statusMap = await userService.getMultipleUsersStatus(userIds);

  res.status(200).json({
    success: true,
    data: statusMap,
  });
});
