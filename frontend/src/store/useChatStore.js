import { create } from "zustand";
import { apiClient } from "../api/client";

export const useChatStore = create((set) => ({
  // State
  chats: [],
  selectedChat: null,
  messages: [],
  typingUsers: {},
  unreadCounts: {}, // { [chatId]: number }
  notifications: [],
  loading: false,
  loadingMessages: false,
  error: null,

  // Chat actions
  setChats: (chats) => set({ chats }),
  setSelectedChat: (chat) => set({ selectedChat: chat }),
  setMessages: (messages) => set({ messages }),
  setNotifications: (notifications) => set({ notifications }),
  setLoading: (loading) => set({ loading }),
  setLoadingMessages: (loadingMessages) => set({ loadingMessages }),
  setError: (error) => set({ error }),

  // Fetch all chats for current user
  fetchChats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.get("/chats");
      set({ chats: response.data.data.chats });
    } catch (error) {
      set({ error: error.response?.data?.message || "Failed to fetch chats" });
    } finally {
      set({ loading: false });
    }
  },

  // Create or access 1-to-1 chat
  createOrAccessChat: async (userId) => {
    try {
      const response = await apiClient.post("/chats", { userId });
      const newChat = response.data.data;

      set((state) => {
        // Check if chat already exists
        const existingChatIndex = state.chats.findIndex(
          (c) => c._id === newChat._id
        );
        if (existingChatIndex !== -1) {
          return { selectedChat: newChat };
        }
        // Add new chat to the beginning
        return {
          chats: [newChat, ...state.chats],
          selectedChat: newChat,
        };
      });

      return newChat;
    } catch (error) {
      set({ error: error.response?.data?.message || "Failed to create chat" });
      throw error;
    }
  },

  // Create group chat
  createGroupChat: async (name, userIds, description = "") => {
    try {
      const response = await apiClient.post("/chats/group", {
        name,
        userIds,
        description,
      });
      const newChat = response.data.data;

      set((state) => ({
        chats: [newChat, ...state.chats],
        selectedChat: newChat,
      }));

      return newChat;
    } catch (error) {
      set({ error: error.response?.data?.message || "Failed to create group" });
      throw error;
    }
  },

  // Rename group chat
  renameChat: async (chatId, newName) => {
    try {
      const response = await apiClient.put(
        `/chats/${chatId}/rename`,
        { name: newName }
      );
      const updatedChat = response.data.data;

      set((state) => ({
        chats: state.chats.map((c) =>
          c._id === chatId ? updatedChat : c
        ),
        selectedChat: state.selectedChat?._id === chatId ? updatedChat : state.selectedChat,
      }));

      return updatedChat;
    } catch (error) {
      set({ error: error.response?.data?.message || "Failed to rename chat" });
      throw error;
    }
  },

  // Add member to group
  addMemberToChat: async (chatId, userId) => {
    try {
      const response = await apiClient.put(
        `/chats/${chatId}/members`,
        { userId }
      );
      const updatedChat = response.data.data;

      set((state) => ({
        chats: state.chats.map((c) =>
          c._id === chatId ? updatedChat : c
        ),
        selectedChat: state.selectedChat?._id === chatId ? updatedChat : state.selectedChat,
      }));

      return updatedChat;
    } catch (error) {
      set({ error: error.response?.data?.message || "Failed to add member" });
      throw error;
    }
  },

  // Remove member from group
  removeMemberFromChat: async (chatId, userId) => {
    try {
      const response = await apiClient.delete(
        `/chats/${chatId}/members/${userId}`
      );
      const updatedChat = response.data.data;

      set((state) => ({
        chats: state.chats.map((c) =>
          c._id === chatId ? updatedChat : c
        ),
        selectedChat: state.selectedChat?._id === chatId ? updatedChat : state.selectedChat,
      }));

      return updatedChat;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to remove member",
      });
      throw error;
    }
  },

  // Promote user to admin
  promoteToAdmin: async (chatId, userId) => {
    try {
      const response = await apiClient.put(
        `/chats/${chatId}/admin/${userId}`
      );
      const updatedChat = response.data.data;

      set((state) => ({
        chats: state.chats.map((c) =>
          c._id === chatId ? updatedChat : c
        ),
        selectedChat: state.selectedChat?._id === chatId ? updatedChat : state.selectedChat,
      }));

      return updatedChat;
    } catch (error) {
      set({ error: error.response?.data?.message || "Failed to promote admin" });
      throw error;
    }
  },

  // Delete chat
  deleteChat: async (chatId) => {
    try {
      await apiClient.delete(`/chats/${chatId}`);

      set((state) => ({
        chats: state.chats.filter((c) => c._id !== chatId),
        selectedChat: state.selectedChat?._id === chatId ? null : state.selectedChat,
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || "Failed to delete chat" });
      throw error;
    }
  },

  // Message actions
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  // H3 FIX: Merges updates with existing message instead of replacing.
  // Callers can pass partial updates like { content, editedAt } without
  // losing other fields (sender, readBy, etc.).
  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId ? { ...m, ...updates } : m
      ),
    })),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== messageId),
    })),

  // Notification actions
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  clearNotifications: () => set({ notifications: [] }),

  // Unread count actions
  incrementUnread: (chatId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: (state.unreadCounts[chatId] || 0) + 1,
      },
    })),

  clearUnread: (chatId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: 0,
      },
    })),

  setUnreadCounts: (counts) => set({ unreadCounts: counts }),
}));
