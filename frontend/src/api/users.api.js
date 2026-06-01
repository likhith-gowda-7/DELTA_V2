import apiClient from "./client";

// User search
export const searchUsers = (query, limit = 20, skip = 0) => {
  return apiClient.get("/users/search", {
    params: { q: query, limit, skip },
  });
};

// Get user profile
export const getUserProfile = (userId) => {
  return apiClient.get(`/users/${userId}`);
};

// Block user
export const blockUser = (userId) => {
  return apiClient.post(`/users/${userId}/block`);
};

// Unblock user
export const unblockUser = (userId) => {
  return apiClient.delete(`/users/${userId}/block`);
};

// Get blocked users
export const getBlockedUsers = (limit = 20, skip = 0) => {
  return apiClient.get("/users/blocked", {
    params: { limit, skip },
  });
};

// Get online status for multiple users
export const getOnlineStatus = (userIds) => {
  return apiClient.get("/users/online-status", {
    params: { ids: userIds.join(",") },
  });
};
