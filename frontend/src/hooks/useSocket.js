import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useSocketStore } from "../store/useSocketStore";
import { useChatStore } from "../store/useChatStore";
import { initSocket, getSocket, disconnectSocket } from "../lib/socket.io";

// Simple logger for frontend
const log = (msg) => {
  if (import.meta.env.DEV) {
    console.log(`[Socket] ${msg}`);
  }
};

export const useSocket = () => {
  const { user, accessToken } = useAuthStore();
  const {
    socket,
    setSocket,
    setConnected,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
  } = useSocketStore();

  const { addMessage, updateMessage, removeMessage, selectedChat } =
    useChatStore();

  useEffect(() => {
    if (!user || !accessToken) {
      // Cleanup if logged out
      if (socket) {
        disconnectSocket();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Connect socket if not already connected
    if (!socket) {
      try {
        const newSocket = initSocket();

        // Authenticate socket
        newSocket.auth = {
          token: accessToken,
        };

        newSocket.connect();

        // Socket event listeners
        newSocket.on("connect", () => {
          log("Socket connected");
          setConnected(true);

          // Send setup event with user data
          newSocket.emit("setup", { userId: user._id, name: user.name });
        });

        newSocket.on("disconnect", () => {
          log("Socket disconnected");
          setConnected(false);
        });

        newSocket.on("connect_error", (error) => {
          log(`Connection error: ${error.message}`);
        });

        // Presence events
        newSocket.on("online_users", (users) => {
          log(`Received online users: ${users.length}`);
          setOnlineUsers(users);
        });

        newSocket.on("user_online", ({ userId }) => {
          log(`User online: ${userId}`);
          addOnlineUser(userId);
        });

        newSocket.on("user_offline", ({ userId }) => {
          log(`User offline: ${userId}`);
          removeOnlineUser(userId);
        });

        // Chat room events
        newSocket.on("receive_message", (message) => {
          log(`Message received in chat: ${message.chatId}`);
          // Only add if viewing this chat
          if (selectedChat?._id === message.chatId) {
            addMessage(message);
          }
        });

        newSocket.on("message_edited", (messageData) => {
          log(`Message edited: ${messageData.messageId}`);
          if (selectedChat?._id === messageData.chatId) {
            updateMessage(messageData.messageId, {
              content: messageData.content,
              editedAt: messageData.editedAt,
            });
          }
        });

        newSocket.on("message_deleted", (messageData) => {
          log(`Message deleted: ${messageData.messageId}`);
          if (selectedChat?._id === messageData.chatId) {
            removeMessage(messageData.messageId);
          }
        });

        newSocket.on("user_typing", (typingData) => {
          log(`User typing in chat: ${typingData.userId}`);
          // This can be used to show typing indicators
          // Store can be enhanced in Phase 5 for typing indicators
        });

        newSocket.on("user_stopped_typing", (typingData) => {
          log(`User stopped typing: ${typingData.userId}`);
          // Clear typing indicator
        });

        newSocket.on("message_read", (readData) => {
          log(`Message marked as read: ${readData.messageId}`);
          if (selectedChat?._id === readData.chatId) {
            // Update read receipts if needed
          }
        });

        newSocket.on("user_joined_chat", (joinData) => {
          log(`User joined chat: ${joinData.userId}`);
        });

        newSocket.on("user_left_chat", (leaveData) => {
          log(`User left chat: ${leaveData.userId}`);
        });

        newSocket.on("online_users_in_chat", (data) => {
          log(`Online users in chat: ${data.onlineUsers.length}`);
          // Can be used to show who's active in this specific chat
        });

        setSocket(newSocket);
      } catch (error) {
        log(`Failed to initialize socket: ${error.message}`);
      }
    }

    return () => {
      // Cleanup on unmount is optional - keep connection alive
      // Only disconnect if user logs out (handled in if block above)
    };
  }, [user, accessToken, socket]);

  return socket;
};
