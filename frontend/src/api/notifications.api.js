import apiClient from "./client";

export const notificationsAPI = {
  // Get all notifications (paginated)
  getNotifications: async (page = 1, limit = 20) => {
    const response = await apiClient.get("/notifications", {
      params: { page, limit },
    });
    return response.data;
  },

  // Get unread notifications
  getUnreadNotifications: async (limit = 10) => {
    const response = await apiClient.get("/notifications/unread", {
      params: { limit },
    });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await apiClient.get("/notifications/unread-count");
    return response.data;
  },

  // Mark single notification as read
  markAsRead: async (notificationId) => {
    const response = await apiClient.put(
      `/notifications/${notificationId}/read`,
    );
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await apiClient.put("/notifications/read-all");
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Delete all notifications
  deleteAllNotifications: async () => {
    const response = await apiClient.delete("/notifications");
    return response.data;
  },
};
