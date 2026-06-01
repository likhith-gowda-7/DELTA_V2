import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../config/jwt.js";
import { AppError } from "../lib/AppError.js";
import logger from "../lib/logger.js";

export const authService = {
  async register(name, email, password) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
    });

    await user.save();
    logger.info(`New user registered: ${email}`);

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  },

  async login(email, password) {
    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    logger.info(`User logged in: ${email}`);

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  },

  async refreshAccessToken(refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      const newAccessToken = generateAccessToken(user._id);
      return { accessToken: newAccessToken };
    } catch (error) {
      throw new AppError("Invalid or expired refresh token", 401);
    }
  },

  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user.toJSON();
  },

  async updateProfile(userId, updates) {
    const allowedFields = ["name", "bio", "avatar"];
    const filteredUpdates = {};

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    logger.info(`User profile updated: ${user._id}`);
    return user.toJSON();
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isPasswordValid = await user.matchPassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError("Current password is incorrect", 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${userId}`);
    return { message: "Password changed successfully" };
  },
};
