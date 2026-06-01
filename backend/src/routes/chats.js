import express from "express";
import { protectedRoute } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import {
  createOrAccessChat,
  getChats,
  getChat,
  createGroupChat,
  renameChat,
  addMember,
  removeMember,
  promoteToAdmin,
  deleteChat,
} from "../controllers/chatController.js";
import {
  createChatSchema,
  createGroupChatSchema,
  renameChatSchema,
  addMemberSchema,
  removeMemberSchema,
  promoteAdminSchema,
  deleteChatSchema,
} from "../validators/chat.js";

const router = express.Router();

// All routes are protected
router.use(protectedRoute);

// Chat CRUD
router.post("/", validateRequest(createChatSchema), createOrAccessChat);
router.get("/", getChats);
router.get("/:chatId", getChat);
router.delete("/:chatId", deleteChat);

// Group chat operations
router.post("/group", validateRequest(createGroupChatSchema), createGroupChat);
router.put("/:chatId/rename", validateRequest(renameChatSchema), renameChat);
router.put("/:chatId/members", validateRequest(addMemberSchema), addMember);
router.delete("/:chatId/members/:userId", removeMember);
router.put("/:chatId/admin/:userId", promoteToAdmin);

export default router;
