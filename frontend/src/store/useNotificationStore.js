import { create } from "zustand";
import { notificationsAPI } from "../api/notifications.api";

export const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadNotifications: [],
  unreadCount: 0,
  loading: false,
  loadingNotifications: false,
  error: null,

  // Actions
  fetchNotifications: async (page = 1, limit = 20) => {
    try {
      set({ loadingNotifications: true, error: null });
      const response = await notificationsAPI.getNotifications(page, limit);
      set({
        notifications: response.data,
        loadingNotifications: false,
      });
    } catch (error) {
      set({
        error: error.message || "Failed to fetch notifications",
        loadingNotifications: false,
      });
    }
  },

  fetchUnreadNotifications: async (limit = 10) => {
    try {
      set({ loading: true, error: null });
      const response = await notificationsAPI.getUnreadNotifications(limit);
      set({
        unreadNotifications: response.data || [],
        loading: false,
      });
    } catch (error) {
      set({
        error: error.message || "Failed to fetch unread notifications",
        loading: false,
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      set({ unreadCount: response.unreadCount || 0 });
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      unreadNotifications: [notification, ...state.unreadNotifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  removeNotification: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.filter(
        (n) => n._id !== notificationId,
      ),
      unreadNotifications: state.unreadNotifications.filter(
        (n) => n._id !== notificationId,
      ),
    }));
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n,
        ),
        unreadNotifications: state.unreadNotifications.filter(
          (n) => n._id !== notificationId,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      set({ error: error.message || "Failed to mark notification as read" });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsAPI.markAllAsRead();

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadNotifications: [],
        unreadCount: 0,
      }));
    } catch (error) {
      set({
        error: error.message || "Failed to mark all notifications as read",
      });
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      get().removeNotification(notificationId);
    } catch (error) {
      set({ error: error.message || "Failed to delete notification" });
    }
  },

  deleteAllNotifications: async () => {
    try {
      await notificationsAPI.deleteAllNotifications();
      set({
        notifications: [],
        unreadNotifications: [],
        unreadCount: 0,
      });
    } catch (error) {
      set({
        error: error.message || "Failed to delete all notifications",
      });
    }
  },

  clearError: () => set({ error: null }),
}));
