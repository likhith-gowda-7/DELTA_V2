import { verifyAccessToken } from "../config/jwt.js";
import logger from "../lib/logger.js";

// Socket.IO authentication middleware
export const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    logger.warn(`Socket connection rejected - no token: ${socket.id}`);
    return next(new Error("Authentication error: no token provided"));
  }

  try {
    const decoded = verifyAccessToken(token);
    socket.userId = decoded.userId;
    socket.userToken = token;
    logger.info(`Socket authenticated: ${socket.id} (user: ${decoded.userId})`);
    next();
  } catch (error) {
    logger.warn(`Socket authentication failed: ${socket.id}`);
    next(new Error("Authentication error: invalid token"));
  }
};

// Socket events for presence tracking
export const setupPresenceEvents = (io, socket) => {
  // User connects (sets online status)
  socket.on("setup", async (userData) => {
    if (!socket.userId) {
      logger.warn(`Setup event without auth: ${socket.id}`);
      return;
    }

    socket.join(socket.userId);
    logger.info(`User ${socket.userId} connected via socket`);

    // Broadcast user is online to all connected clients
    io.emit("user_online", {
      userId: socket.userId,
      isOnline: true,
      timestamp: new Date(),
    });

    // Send online users list to the connected user
    const onlineUsers = Array.from(io.sockets.sockets.values())
      .filter((s) => s.userId && s.userId !== socket.userId)
      .map((s) => s.userId);

    socket.emit("online_users", onlineUsers);
  });

  // Disconnect event (sets offline status)
  socket.on("disconnect", () => {
    if (!socket.userId) return;

    logger.info(`User ${socket.userId} disconnected`);

    // Broadcast user is offline to all connected clients
    io.emit("user_offline", {
      userId: socket.userId,
      isOnline: false,
      timestamp: new Date(),
    });
  });

  // User explicitly goes offline (for logout, etc.)
  socket.on("user_offline", () => {
    if (!socket.userId) return;

    logger.info(`User ${socket.userId} marked as offline`);

    io.emit("user_offline", {
      userId: socket.userId,
      isOnline: false,
      timestamp: new Date(),
    });

    socket.leave(socket.userId);
  });
};

// Socket events for chat functionality
export const setupChatEvents = (io, socket) => {
  // Join a chat room
  socket.on("join_room", (chatId) => {
    if (!socket.userId || !chatId) {
      logger.warn(
        `join_room event invalid: userId=${socket.userId}, chatId=${chatId}`,
      );
      return;
    }

    socket.join(chatId);
    logger.info(`User ${socket.userId} joined chat room ${chatId}`);

    // Notify others in the room
    socket.to(chatId).emit("user_joined_chat", {
      userId: socket.userId,
      chatId,
      timestamp: new Date(),
    });

    // Send list of online users in this chat
    const onlineUsersInChat = Array.from(
      io.sockets.adapter.rooms.get(chatId) || [],
    )
      .map((socketId) => {
        const s = io.sockets.sockets.get(socketId);
        return s?.userId;
      })
      .filter(Boolean);

    socket.emit("online_users_in_chat", {
      chatId,
      onlineUsers: onlineUsersInChat,
    });
  });

  // Leave a chat room
  socket.on("leave_room", (chatId) => {
    if (!socket.userId || !chatId) return;

    socket.leave(chatId);
    logger.info(`User ${socket.userId} left chat room ${chatId}`);

    // Notify others in the room
    io.to(chatId).emit("user_left_chat", {
      userId: socket.userId,
      chatId,
      timestamp: new Date(),
    });
  });

  // Send message in real-time
  socket.on("send_message", (messageData) => {
    if (!socket.userId || !messageData.chatId || !messageData.content) {
      logger.warn(`send_message event invalid: ${socket.id}`);
      return;
    }

    const { chatId, content, messageId, sender } = messageData;

    logger.info(`Message sent in chat ${chatId} by user ${socket.userId}`);

    // Broadcast to all users in the chat room (including sender)
    io.to(chatId).emit("receive_message", {
      _id: messageId,
      chatId,
      content,
      sender: {
        _id: sender._id,
        name: sender.name,
        avatar: sender.avatar,
      },
      createdAt: new Date(),
      readBy: [{ user: sender._id }],
      isDeleted: false,
    });
  });

  // Message edited
  socket.on("edit_message", (messageData) => {
    if (!socket.userId || !messageData.chatId || !messageData.messageId) return;

    const { chatId, messageId, content, editedAt } = messageData;

    logger.info(
      `Message ${messageId} edited by user ${socket.userId} in chat ${chatId}`,
    );

    // Broadcast to all users in the chat room
    io.to(chatId).emit("message_edited", {
      messageId,
      content,
      editedAt,
      chatId,
    });
  });

  // Message deleted
  socket.on("delete_message", (messageData) => {
    if (!socket.userId || !messageData.chatId || !messageData.messageId) return;

    const { chatId, messageId } = messageData;

    logger.info(
      `Message ${messageId} deleted by user ${socket.userId} in chat ${chatId}`,
    );

    // Broadcast to all users in the chat room
    io.to(chatId).emit("message_deleted", {
      messageId,
      chatId,
    });
  });

  // Typing indicator
  socket.on("typing", (chatId) => {
    if (!socket.userId || !chatId) return;

    logger.debug(`User ${socket.userId} is typing in chat ${chatId}`);

    socket.to(chatId).emit("user_typing", {
      userId: socket.userId,
      chatId,
      timestamp: new Date(),
    });
  });

  // Stop typing indicator
  socket.on("stop_typing", (chatId) => {
    if (!socket.userId || !chatId) return;

    logger.debug(`User ${socket.userId} stopped typing in chat ${chatId}`);

    socket.to(chatId).emit("user_stopped_typing", {
      userId: socket.userId,
      chatId,
    });
  });

  // Mark message as read
  socket.on("mark_as_read", (readData) => {
    if (!socket.userId || !readData.chatId || !readData.messageId) return;

    const { chatId, messageId } = readData;

    logger.debug(
      `Message ${messageId} marked as read by user ${socket.userId} in chat ${chatId}`,
    );

    // Broadcast to all users in the chat room
    io.to(chatId).emit("message_read", {
      messageId,
      userId: socket.userId,
      readAt: new Date(),
      chatId,
    });
  });

  // Mark entire chat as read
  socket.on("mark_chat_as_read", (chatId) => {
    if (!socket.userId || !chatId) return;

    logger.debug(`Chat ${chatId} marked as read by user ${socket.userId}`);

    socket.to(chatId).emit("chat_read", {
      userId: socket.userId,
      chatId,
      readAt: new Date(),
    });
  });

  // Request list of online users in chat
  socket.on("get_online_users_in_chat", (chatId) => {
    if (!socket.userId || !chatId) return;

    const onlineUsersInChat = Array.from(
      io.sockets.adapter.rooms.get(chatId) || [],
    )
      .map((socketId) => {
        const s = io.sockets.sockets.get(socketId);
        return s?.userId;
      })
      .filter(Boolean);

    socket.emit("online_users_in_chat", {
      chatId,
      onlineUsers: onlineUsersInChat,
    });
  });
};

// Socket events for notifications
export const setupNotificationEvents = (io, socket) => {
  // Send notification to specific user
  socket.on("send_notification", (notificationData) => {
    if (!socket.userId || !notificationData.userId) return;

    const { userId, type, chatId, content, messageId } = notificationData;

    logger.info(`Notification sent by ${socket.userId} to ${userId}: ${type}`);

    // Send notification to specific user's socket room
    io.to(userId).emit("new_notification", {
      type,
      chatId,
      messageId,
      content,
      triggerUserId: socket.userId,
      timestamp: new Date(),
    });
  });

  // Send notification to all users in a chat (for group chat events)
  socket.on("send_chat_notification", (notificationData) => {
    if (!socket.userId || !notificationData.chatId) return;

    const { chatId, type, content, userIds } = notificationData;

    logger.info(`Chat notification sent to chat ${chatId}: ${type}`);

    // Send to each user in the chat (except the sender)
    userIds.forEach((userId) => {
      if (userId.toString() !== socket.userId.toString()) {
        io.to(userId).emit("new_notification", {
          type,
          chatId,
          content,
          triggerUserId: socket.userId,
          timestamp: new Date(),
        });
      }
    });
  });

  // Notify user they have unread notifications
  socket.on("check_unread_notifications", (userId) => {
    if (!socket.userId || userId.toString() !== socket.userId.toString())
      return;

    // This event is primarily for checking via HTTP API
    // But we can emit back unread count
    logger.debug(`Unread notifications check for user ${userId}`);
  });

  // Listen for notification acknowledgment
  socket.on("notification_read", (notificationId) => {
    if (!socket.userId) return;

    logger.debug(
      `Notification ${notificationId} marked as read by user ${socket.userId}`,
    );

    // Could broadcast to connected clients about read status
    socket.emit("notification_marked_read", {
      notificationId,
      readAt: new Date(),
    });
  });
};

// Socket events for WebRTC call signaling
export const setupCallEvents = (io, socket) => {
  // User initiates a call
  socket.on("initiate_call", (data) => {
    if (!socket.userId) return;

    const { recipientId, mediaType, callId } = data;

    logger.info(
      `Call initiated: ${socket.userId} -> ${recipientId} (${mediaType})`,
    );

    // Send incoming call notification to recipient
    io.to(recipientId).emit("incoming_call", {
      callId,
      initiatorId: socket.userId,
      mediaType,
      timestamp: new Date(),
    });
  });

  // User accepts a call
  socket.on("call_accepted", (data) => {
    if (!socket.userId) return;

    const { callId, initiatorId } = data;

    logger.info(
      `Call accepted: ${socket.userId} accepted call from ${initiatorId}`,
    );

    // Notify initiator that call was accepted
    io.to(initiatorId).emit("call_accepted", {
      callId,
      recipientId: socket.userId,
      timestamp: new Date(),
    });
  });

  // User rejects a call
  socket.on("call_rejected", (data) => {
    if (!socket.userId) return;

    const { callId, initiatorId, reason } = data;

    logger.info(
      `Call rejected: ${socket.userId} rejected call from ${initiatorId} (${reason})`,
    );

    // Notify initiator that call was rejected
    io.to(initiatorId).emit("call_rejected", {
      callId,
      recipientId: socket.userId,
      reason,
      timestamp: new Date(),
    });
  });

  // User ends a call
  socket.on("call_ended", (data) => {
    if (!socket.userId) return;

    const { callId, otherUserId, duration } = data;

    logger.info(
      `Call ended: ${socket.userId} ended call with ${otherUserId} (duration: ${duration}s)`,
    );

    // Notify other participant that call ended
    io.to(otherUserId).emit("call_ended", {
      callId,
      duration,
      timestamp: new Date(),
    });
  });

  // WebRTC SDP Offer - send from initiator to recipient
  socket.on("webrtc_offer", (data) => {
    if (!socket.userId) return;

    const { callId, recipientId, offer } = data;

    logger.debug(`WebRTC offer: ${socket.userId} -> ${recipientId}`);

    // Forward offer to recipient
    io.to(recipientId).emit("webrtc_offer", {
      callId,
      offer,
    });
  });

  // WebRTC SDP Answer - send from recipient to initiator
  socket.on("webrtc_answer", (data) => {
    if (!socket.userId) return;

    const { callId, initiatorId, answer } = data;

    logger.debug(`WebRTC answer: ${socket.userId} -> ${initiatorId}`);

    // Forward answer to initiator
    io.to(initiatorId).emit("webrtc_answer", {
      callId,
      answer,
    });
  });

  // ICE Candidate - relay between peers
  socket.on("webrtc_ice_candidate", (data) => {
    if (!socket.userId) return;

    const { callId, otherUserId, candidate } = data;

    logger.debug(`ICE candidate: ${socket.userId} -> ${otherUserId}`);

    // Forward ICE candidate to other peer
    io.to(otherUserId).emit("webrtc_ice_candidate", {
      callId,
      candidate,
    });
  });

  // Handle call timeout (for ringing)
  socket.on("call_timeout", (data) => {
    if (!socket.userId) return;

    const { callId, recipientId } = data;

    logger.info(
      `Call timeout: ${socket.userId} call to ${recipientId} (callId: ${callId})`,
    );

    // Notify recipient that call timed out
    io.to(recipientId).emit("call_missed", {
      callId,
      initiatorId: socket.userId,
      timestamp: new Date(),
    });
  });
};
