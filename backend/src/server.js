import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cookieParser from "cookie-parser";
import connectDB from "./config/database.js";
import logger from "./lib/logger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { asyncHandler } from "./lib/asyncHandler.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import chatRoutes from "./routes/chats.js";
import messageRoutes from "./routes/messages.js";
import notificationRoutes from "./routes/notifications.js";
import uploadRoutes from "./routes/uploads.js";
import callRoutes from "./routes/calls.js";
import {
  socketAuthMiddleware,
  setupPresenceEvents,
  setupChatEvents,
  setupNotificationEvents,
  setupCallEvents,
  setupGroupCallEvents,
} from "./socket/middleware.js";

// Load environment variables
dotenv.config();

// Validate required env vars
const requiredEnvVars = [
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/calls", callRoutes);

// Socket.IO middleware for authentication
io.use(socketAuthMiddleware);

// Socket.IO connection handler
io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // Setup presence tracking
  setupPresenceEvents(io, socket);

  // Setup chat room events
  setupChatEvents(io, socket);

  // Setup notification events
  setupNotificationEvents(io, socket);

  // Setup call signaling events
  setupCallEvents(io, socket);

  // Setup group call events
  setupGroupCallEvents(io, socket);

  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export default app;
