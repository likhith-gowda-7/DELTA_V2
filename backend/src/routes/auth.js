import express from "express";
import { validate } from "../middleware/validation.js";
import { protectedRoute } from "../middleware/auth.js";
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

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh-token", refreshToken);

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
