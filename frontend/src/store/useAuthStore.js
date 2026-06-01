// Zustand store for authentication
import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiClient from "../api/client";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      signup: async (name, email, password, passwordConfirm) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post("/auth/register", {
            name,
            email,
            password,
            passwordConfirm,
          });
          set({
            user: response.data.data.user,
            accessToken: response.data.data.accessToken,
            isLoading: false,
          });
          localStorage.setItem("accessToken", response.data.data.accessToken);
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post("/auth/login", {
            email,
            password,
          });
          set({
            user: response.data.data.user,
            accessToken: response.data.data.accessToken,
            isLoading: false,
          });
          localStorage.setItem("accessToken", response.data.data.accessToken);
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || error.message;
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiClient.post("/auth/logout");
          set({ user: null, accessToken: null, isLoading: false });
          localStorage.removeItem("accessToken");
        } catch (error) {
          console.error("Logout error:", error);
          set({ isLoading: false });
        }
      },

      getCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const response = await apiClient.get("/auth/me");
          set({
            user: response.data.data,
            isLoading: false,
          });
          return response.data.data;
        } catch (error) {
          set({ isLoading: false, user: null, accessToken: null });
          localStorage.removeItem("accessToken");
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);
