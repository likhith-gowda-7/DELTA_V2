import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useSocketStore } from "../store/useSocketStore";
import { useChatStore } from "../store/useChatStore";
import { initSocket, disconnectSocket, reconnectWithNewToken } from "../lib/socket.io";

// Dev-only logger
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

  const { addMessage, updateMessage, removeMessage } = useChatStore();

  // H4 FIX: Use a ref for selectedChat so event handlers always read the
  // current value, not the stale one captured when the effect registered.
  const selectedChatRef = useRef(null);
  const selectedChat = useChatStore((state) => state.selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Track previous token to detect refreshes (C3)
  const prevTokenRef = useRef(accessToken);

  // C3 FIX: When the access token changes (after a refresh), update the
  // socket's auth token and reconnect.
  useEffect(() => {
    if (
      accessToken &&
      prevTokenRef.current &&
      accessToken !== prevTokenRef.current &&
      socket
    ) {
      log("Access token refreshed — reconnecting socket with new token");
      reconnectWithNewToken(accessToken);
    }
    prevTokenRef.current = accessToken;
  }, [accessToken, socket]);

  // M8 FIX: Use a ref to track whether we've already created the socket
  // so the effect doesn't re-run when setSocket triggers a state change.
  const socketInitRef = useRef(false);

  useEffect(() => {
    if (!user || !accessToken) {
      // Cleanup if logged out
      if (socket) {
        disconnectSocket();
        setSocket(null);
        setConnected(false);
        socketInitRef.current = false;
      }
      return;
    }

    // Prevent duplicate socket creation
    if (socketInitRef.current || socket) {
      return;
    }

    try {
      socketInitRef.current = true;
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

      // Chat room events — use ref for selectedChat to avoid stale closure
      newSocket.on("receive_message", (message) => {
        log(`Message received in chat: ${message.chatId}`);
        const currentChat = selectedChatRef.current;
        if (currentChat?._id === message.chatId) {
          addMessage(message);
        }
      });

      newSocket.on("message_edited", (messageData) => {
        log(`Message edited: ${messageData.messageId}`);
        const currentChat = selectedChatRef.current;
        if (currentChat?._id === messageData.chatId) {
          updateMessage(messageData.messageId, {
            content: messageData.content,
            editedAt: messageData.editedAt,
          });
        }
      });

      newSocket.on("message_deleted", (messageData) => {
        log(`Message deleted: ${messageData.messageId}`);
        const currentChat = selectedChatRef.current;
        if (currentChat?._id === messageData.chatId) {
          removeMessage(messageData.messageId);
        }
      });

      // M3 FIX: Typing indicators — dispatch to store for UI rendering
      newSocket.on("user_typing", (typingData) => {
        log(`User typing: ${typingData.userId} in chat: ${typingData.chatId}`);
        const currentChat = selectedChatRef.current;
        if (currentChat?._id === typingData.chatId) {
          useChatStore.setState((state) => {
            const typingUsers = state.typingUsers || {};
            return {
              typingUsers: {
                ...typingUsers,
                [typingData.chatId]: {
                  ...(typingUsers[typingData.chatId] || {}),
                  [typingData.userId]: Date.now(),
                },
              },
            };
          });
        }
      });

      newSocket.on("user_stopped_typing", (typingData) => {
        log(`User stopped typing: ${typingData.userId}`);
        const currentChat = selectedChatRef.current;
        if (currentChat?._id === typingData.chatId) {
          useChatStore.setState((state) => {
            const typingUsers = { ...(state.typingUsers || {}) };
            if (typingUsers[typingData.chatId]) {
              const chatTyping = { ...typingUsers[typingData.chatId] };
              delete chatTyping[typingData.userId];
              typingUsers[typingData.chatId] = chatTyping;
            }
            return { typingUsers };
          });
        }
      });

      // M4 FIX: Read receipts — update message readBy state
      newSocket.on("message_read", (readData) => {
        log(`Message ${readData.messageId} read by ${readData.userId}`);
        const currentChat = selectedChatRef.current;
        if (currentChat?._id === readData.chatId) {
          updateMessage(readData.messageId, {
            readBy: readData.readBy || undefined,
          });
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
      });

      setSocket(newSocket);
    } catch (error) {
      log(`Failed to initialize socket: ${error.message}`);
      socketInitRef.current = false;
    }

    return () => {
      // Cleanup on unmount is optional - keep connection alive
      // Only disconnect if user logs out (handled in if block above)
    };
    // M8 FIX: Only depend on user and accessToken — NOT socket,
    // which would cause re-runs when setSocket updates state.
  }, [user, accessToken]);

  return socket;
};
