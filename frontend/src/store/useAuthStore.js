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
      setAccessToken: (token) => {
        // H7 FIX: Single source of truth — Zustand persist handles storage.
        // We still write to localStorage because the API client interceptor
        // reads from there (it doesn't have access to the Zustand store).
        localStorage.setItem("accessToken", token);
        set({ accessToken: token });
      },
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
          const { user, accessToken } = response.data.data;
          localStorage.setItem("accessToken", accessToken);
          set({
            user,
            accessToken,
            isLoading: false,
          });
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
          const { user, accessToken } = response.data.data;
          localStorage.setItem("accessToken", accessToken);
          set({
            user,
            accessToken,
            isLoading: false,
          });
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
          localStorage.removeItem("accessToken");
          set({ user: null, accessToken: null, isLoading: false });
        } catch (error) {
          console.error("Logout error:", error);
          // Even if the API call fails, clear local state
          localStorage.removeItem("accessToken");
          set({ user: null, accessToken: null, isLoading: false });
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
          localStorage.removeItem("accessToken");
          set({ isLoading: false, user: null, accessToken: null });
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
