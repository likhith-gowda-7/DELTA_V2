import { apiClient } from "./client";

export const chatsAPI = {
  // Get all chats for current user
  getChats: async () => {
    const response = await apiClient.get("/api/chats");
    return response.data.data;
  },

  // Get single chat
  getChat: async (chatId) => {
    const response = await apiClient.get(`/api/chats/${chatId}`);
    return response.data.data;
  },

  // Create or access 1-to-1 chat
  createOrAccessChat: async (userId) => {
    const response = await apiClient.post("/api/chats", { userId });
    return response.data.data;
  },

  // Create group chat
  createGroupChat: async (name, userIds, description = "") => {
    const response = await apiClient.post("/api/chats/group", {
      name,
      userIds,
      description,
    });
    return response.data.data;
  },

  // Rename group chat
  renameChat: async (chatId, name) => {
    const response = await apiClient.put(`/api/chats/${chatId}/rename`, {
      name,
    });
    return response.data.data;
  },

  // Add member to group
  addMember: async (chatId, userId) => {
    const response = await apiClient.put(`/api/chats/${chatId}/members`, {
      userId,
    });
    return response.data.data;
  },

  // Remove member from group
  removeMember: async (chatId, userId) => {
    const response = await apiClient.delete(`/api/chats/${chatId}/members/${userId}`);
    return response.data.data;
  },

  // Promote user to admin
  promoteToAdmin: async (chatId, userId) => {
    const response = await apiClient.put(`/api/chats/${chatId}/admin/${userId}`);
    return response.data.data;
  },

  // Delete chat
  deleteChat: async (chatId) => {
    const response = await apiClient.delete(`/api/chats/${chatId}`);
    return response.data;
  },
};
