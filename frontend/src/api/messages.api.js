import { apiClient } from "./client";

export const messagesAPI = {
  // Get messages for a chat
  getMessages: async (chatId, skip = 0, limit = 50) => {
    const response = await apiClient.get(`/api/messages/${chatId}`, {
      params: { skip, limit },
    });
    return response.data.data;
  },

  // Send a message
  sendMessage: async (chatId, messagePayload) => {
    // Support both old string format and new object format
    const payload =
      typeof messagePayload === "string"
        ? { chatId, content: messagePayload }
        : { chatId, ...messagePayload };

    const response = await apiClient.post("/api/messages", payload);
    return response.data.data;
  },

  // Edit a message
  editMessage: async (messageId, content) => {
    const response = await apiClient.put(`/api/messages/${messageId}`, {
      content,
    });
    return response.data.data;
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    const response = await apiClient.delete(`/api/messages/${messageId}`);
    return response.data;
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    const response = await apiClient.put(`/api/messages/${messageId}/read`);
    return response.data;
  },

  // Mark all messages in chat as read
  markChatAsRead: async (chatId) => {
    const response = await apiClient.put(`/api/messages/chat/${chatId}/read`);
    return response.data;
  },

  // Get unread count for a chat
  getUnreadCount: async (chatId) => {
    const response = await apiClient.get(`/api/messages/chat/${chatId}/unread`);
    return response.data.data;
  },

  // Search messages in a chat
  searchMessages: async (chatId, keyword) => {
    const response = await apiClient.get(`/api/messages/search/${chatId}`, {
      params: { keyword },
    });
    return response.data.data;
  },
};
