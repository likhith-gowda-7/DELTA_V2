// Zustand store for Socket.IO state
import { create } from "zustand";

export const useSocketStore = create((set) => ({
  socket: null,
  isConnected: false,
  onlineUsers: [],
  typingUsers: [],

  setSocket: (socket) => set({ socket }),
  setConnected: (connected) => set({ isConnected: connected }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addOnlineUser: (userId) =>
    set((state) => {
      if (!state.onlineUsers.includes(userId)) {
        return { onlineUsers: [...state.onlineUsers, userId] };
      }
      return state;
    }),

  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((id) => id !== userId),
    })),

  addTypingUser: (userId) =>
    set((state) => {
      if (!state.typingUsers.includes(userId)) {
        return { typingUsers: [...state.typingUsers, userId] };
      }
      return state;
    }),

  removeTypingUser: (userId) =>
    set((state) => ({
      typingUsers: state.typingUsers.filter((id) => id !== userId),
    })),

  clearTypingUsers: () => set({ typingUsers: [] }),
}));
