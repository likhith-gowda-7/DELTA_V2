import express from "express";
import { protectedRoute } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  markChatAsRead,
  getUnreadCount,
  searchMessages,
} from "../controllers/messageController.js";
import {
  sendMessageSchema,
  editMessageSchema,
  markAsReadSchema,
  deleteMessageSchema,
  searchMessagesSchema,
  getMessagesSchema,
  chatIdParamSchema,
  messageIdParamSchema,
} from "../validators/message.js";

const router = express.Router();

// All routes are protected
router.use(protectedRoute);

// Message CRUD
router.post("/", validateRequest(sendMessageSchema), sendMessage);
router.put(
  "/:messageId",
  validateRequest(messageIdParamSchema, "params"),
  validateRequest(editMessageSchema, "body"),
  editMessage,
);
router.delete(
  "/:messageId",
  validateRequest(deleteMessageSchema, "params"),
  deleteMessage,
);

// Read receipts - specific routes first to avoid conflicts
router.put(
  "/:messageId/read",
  validateRequest(markAsReadSchema, "params"),
  markMessageAsRead,
);
router.put(
  "/chat/:chatId/read",
  validateRequest(chatIdParamSchema, "params"),
  markChatAsRead,
);
router.get(
  "/chat/:chatId/unread",
  validateRequest(chatIdParamSchema, "params"),
  getUnreadCount,
);
router.get(
  "/search/:chatId",
  validateRequest(chatIdParamSchema, "params"),
  validateRequest(searchMessagesSchema, "query"),
  searchMessages,
);

// Get messages - general route last
router.get(
  "/:chatId",
  validateRequest(chatIdParamSchema, "params"),
  validateRequest(getMessagesSchema, "query"),
  getMessages,
);

export default router;
