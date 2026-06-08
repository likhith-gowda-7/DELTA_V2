import express from "express";
import { validate } from "../middleware/validation.js";
import { protectedRoute } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/auth.js";

const router = express.Router();

// Public routes — protected by a strict rate limiter against brute force
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh-token", authLimiter, refreshToken);

// Protected routes
router.post("/logout", protectedRoute, logout);
router.get("/me", protectedRoute, getCurrentUser);
router.put(
  "/profile",
  protectedRoute,
  validate(updateProfileSchema),
  updateProfile,
);
router.post(
  "/change-password",
  protectedRoute,
  validate(changePasswordSchema),
  changePassword,
);

export default router;
