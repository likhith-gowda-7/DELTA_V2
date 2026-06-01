import express from "express";
import { protectedRoute } from "../middleware/auth.js";
import {
  searchUsers,
  getUserProfile,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getOnlineStatus,
} from "../controllers/userController.js";

const router = express.Router();

// All routes are protected
router.use(protectedRoute);

// Search users
router.get("/search", searchUsers);

// Get blocked users
router.get("/blocked", getBlockedUsers);

// Get online status for multiple users
router.get("/online-status", getOnlineStatus);

// Get user profile
router.get("/:userId", getUserProfile);

// Block/unblock user
router.post("/:userId/block", blockUser);
router.delete("/:userId/block", unblockUser);

export default router;
