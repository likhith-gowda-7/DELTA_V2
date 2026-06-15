import logger from "../lib/logger.js";
import { AppError } from "../lib/AppError.js";

// Express error handling middleware
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong MongoDB ID error
  if (err.name === "CastError") {
    err.statusCode = 400;
    err.message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err.statusCode = 409;
    err.message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError" && err.errors) {
    err.statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    err.message = messages.join(", ");
  }

  // Zod validation error — extract field-level messages for UX
  if (err.name === "ZodError" || (err.issues && Array.isArray(err.issues))) {
    err.statusCode = 400;
    const fieldErrors = err.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    err.message = fieldErrors.join("; ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    err.statusCode = 401;
    err.message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    err.statusCode = 401;
    err.message = "Token expired";
  }

  logger.error(`${err.statusCode} - ${err.message}`);

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// 404 Not Found
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
