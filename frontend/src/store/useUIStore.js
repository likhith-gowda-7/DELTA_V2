// Zustand store for UI state (theme, modals, etc.)
import { create } from "zustand";

export const useUIStore = create((set) => ({
  theme: "light",
  sidebarOpen: true,
  modals: {
    createGroup: false,
    updateGroup: false,
    userProfile: false,
    confirmDialog: false,
  },
  confirmDialog: {
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
  },

  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  openModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: true },
    })),
  closeModal: (modalName) =>
    set((state) => ({
      modals: { ...state.modals, [modalName]: false },
    })),

  openConfirmDialog: (title, message, onConfirm, onCancel) =>
    set({
      modals: { ...useUIStore.getState().modals, confirmDialog: true },
      confirmDialog: { title, message, onConfirm, onCancel },
    }),
  closeConfirmDialog: () =>
    set({
      modals: { ...useUIStore.getState().modals, confirmDialog: false },
      confirmDialog: {
        title: "",
        message: "",
        onConfirm: null,
        onCancel: null,
      },
    }),
}));
