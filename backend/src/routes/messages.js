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
} from "../validators/message.js";

const router = express.Router();

// All routes are protected
router.use(protectedRoute);

// Message CRUD
router.post("/", validateRequest(sendMessageSchema), sendMessage);
router.put("/:messageId", validateRequest(editMessageSchema), editMessage);
router.delete("/:messageId", deleteMessage);

// Read receipts - specific routes first to avoid conflicts
router.put("/:messageId/read", markMessageAsRead);
router.put("/chat/:chatId/read", markChatAsRead);
router.get("/chat/:chatId/unread", getUnreadCount);
router.get(
  "/search/:chatId",
  validateRequest(searchMessagesSchema),
  searchMessages,
);

// Get messages - general route last
router.get("/:chatId", validateRequest(getMessagesSchema), getMessages);

export default router;
