import { chatService } from "../services/chat.service.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { AppError } from "../lib/AppError.js";
import logger from "../lib/logger.js";

// @route   POST /api/chats
// @access  Protected
export const createOrAccessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new AppError("User ID is required", 400);
  }

  const chat = await chatService.createOrAccessChat(req.userId, userId);

  res.status(200).json({
    success: true,
    data: chat,
  });
});

// @route   GET /api/chats
// @access  Protected
export const getChats = asyncHandler(async (req, res) => {
  const chats = await chatService.getUserChats(req.userId);

  res.status(200).json({
    success: true,
    data: {
      chats,
      count: chats.length,
    },
  });
});

// @route   GET /api/chats/:chatId
// @access  Protected
export const getChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await chatService.getChat(chatId, req.userId);

  res.status(200).json({
    success: true,
    data: chat,
  });
});

// @route   POST /api/chats/group
// @access  Protected
export const createGroupChat = asyncHandler(async (req, res) => {
  const { name, userIds, description } = req.body;

  if (!name || !userIds || !Array.isArray(userIds) || userIds.length < 2) {
    throw new AppError("Group name and at least 2 members are required", 400);
  }

  const chat = await chatService.createGroupChat(
    name,
    userIds,
    req.userId,
    description
  );

  res.status(201).json({
    success: true,
    data: chat,
  });
});

// @route   PUT /api/chats/:chatId/rename
// @access  Protected
export const renameChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { name } = req.body;

  if (!name) {
    throw new AppError("Chat name is required", 400);
  }

  const chat = await chatService.renameChat(chatId, name, req.userId);

  res.status(200).json({
    success: true,
    data: chat,
  });
});

// @route   PUT /api/chats/:chatId/members
// @access  Protected
export const addMember = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    throw new AppError("User ID is required", 400);
  }

  const chat = await chatService.addMemberToChat(chatId, userId, req.userId);

  res.status(200).json({
    success: true,
    data: chat,
  });
});

// @route   DELETE /api/chats/:chatId/members/:userId
// @access  Protected
export const removeMember = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.params;

  const chat = await chatService.removeMemberFromChat(
    chatId,
    userId,
    req.userId
  );

  res.status(200).json({
    success: true,
    data: chat,
  });
});

// @route   PUT /api/chats/:chatId/admin/:userId
// @access  Protected
export const promoteToAdmin = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.params;

  const chat = await chatService.promoteToAdmin(chatId, userId, req.userId);

  res.status(200).json({
    success: true,
    data: chat,
  });
});

// @route   DELETE /api/chats/:chatId
// @access  Protected
export const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const result = await chatService.deleteChat(chatId, req.userId);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});
