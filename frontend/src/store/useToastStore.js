import { create } from "zustand";

/**
 * Lightweight toast notification system.
 * Manages a queue of toast messages with auto-dismiss and manual close.
 */
export const useToastStore = create((set, get) => ({
  toasts: [],

  /**
   * Add a toast notification.
   * @param {"success"|"error"|"warning"|"info"} type
   * @param {string} message
   * @param {number} duration - Auto-dismiss time in ms (default 4000)
   */
  addToast: (type, message, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast = { id, type, message, duration };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => set({ toasts: [] }),
}));
