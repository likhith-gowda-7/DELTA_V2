import { messageService } from "../services/message.service.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { AppError } from "../lib/AppError.js";
import logger from "../lib/logger.js";

// @route   GET /api/messages/:chatId
// @access  Protected
export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { skip = 0, limit = 50 } = req.query;

  const messages = await messageService.getMessages(
    chatId,
    req.userId,
    parseInt(skip),
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    data: {
      messages,
      count: messages.length,
    },
  });
});

// @route   POST /api/messages
// @access  Protected
export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content, fileUrl, fileType, fileName, fileSize } = req.body;

  if (!chatId || !content) {
    throw new AppError("Chat ID and message content are required", 400);
  }

  const message = await messageService.sendMessage(
    chatId,
    req.userId,
    content,
    fileUrl,
    fileType,
    fileName,
    fileSize,
  );

  res.status(201).json({
    success: true,
    data: message,
  });
});

// @route   PUT /api/messages/:messageId
// @access  Protected
export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new AppError("Message content is required", 400);
  }

  const message = await messageService.editMessage(messageId, content, req.userId);

  res.status(200).json({
    success: true,
    data: message,
  });
});

// @route   DELETE /api/messages/:messageId
// @access  Protected
export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const result = await messageService.deleteMessage(messageId, req.userId);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// @route   PUT /api/messages/:messageId/read
// @access  Protected
export const markMessageAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  await messageService.markAsRead(messageId, req.userId);

  res.status(200).json({
    success: true,
    message: "Message marked as read",
  });
});

// @route   PUT /api/messages/chat/:chatId/read
// @access  Protected
export const markChatAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const result = await messageService.markChatAsRead(chatId, req.userId);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// @route   GET /api/messages/:chatId/unread
// @access  Protected
export const getUnreadCount = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const count = await messageService.getUnreadCount(chatId, req.userId);

  res.status(200).json({
    success: true,
    data: {
      unreadCount: count,
    },
  });
});

// @route   GET /api/messages/search/:chatId
// @access  Protected
export const searchMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { keyword } = req.query;

  if (!keyword) {
    throw new AppError("Search keyword is required", 400);
  }

  const messages = await messageService.searchMessages(
    chatId,
    keyword,
    req.userId
  );

  res.status(200).json({
    success: true,
    data: {
      messages,
      count: messages.length,
    },
  });
});
