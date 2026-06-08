import { verifyAccessToken } from "../config/jwt.js";
import { AppError } from "../lib/AppError.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const protectedRoute = asyncHandler((req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new AppError("No token provided. Please log in.", 401);
  }

  try {
    const decoded = verifyAccessToken(token);
    // Standardize auth context: provide both `req.userId` (legacy string) and
    // `req.user` (Mongoose-style object with `_id`) so every controller works
    // regardless of which convention it uses.
    req.userId = decoded.userId;
    req.user = { _id: decoded.userId };
    next();
  } catch (error) {
    throw new AppError(error.message || "Invalid token", 401);
  }
});
