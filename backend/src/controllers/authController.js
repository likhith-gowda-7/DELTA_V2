import { authService } from "../services/auth.service.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { AppError } from "../lib/AppError.js";
import logger from "../lib/logger.js";

// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const result = await authService.register(name, email, password);

  // Set refresh token in httpOnly cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  // Set refresh token in httpOnly cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError("No refresh token provided", 401);
  }

  const result = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      accessToken: result.accessToken,
    },
  });
});

// @route   POST /api/auth/logout
// @access  Protected
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  logger.info(`User logged out: ${req.userId}`);

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

// @route   GET /api/auth/me
// @access  Protected
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @route   PUT /api/auth/profile
// @access  Protected
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, avatar } = req.body;

  const updatedUser = await authService.updateProfile(req.userId, {
    name,
    bio,
    avatar,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

// @route   POST /api/auth/change-password
// @access  Protected
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  await authService.changePassword(req.userId, currentPassword, newPassword);

  // Clear refresh token cookie for security
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});
