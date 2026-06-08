// Tests for useAuthStore. Mocks the axios client to avoid network calls.

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the axios client before importing the store
const mockPost = vi.fn();
const mockGet = vi.fn();

vi.mock("../api/client", () => ({
  default: {
    post: (...args) => mockPost(...args),
    get: (...args) => mockGet(...args),
  },
}));

const { useAuthStore } = await import("./useAuthStore");

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("useAuthStore", () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockGet.mockReset();
    localStorage.clear();
    // Reset store between tests
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
    });
  });

  it("starts in unauthenticated state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("signup sets user + accessToken on success", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        data: {
          user: { _id: "u1", email: "alice@example.com", name: "Alice" },
          accessToken: "fake-access-token",
        },
      },
    });

    await useAuthStore.getState().signup("Alice", "alice@example.com", "Pass1234", "Pass1234");
    await flush();

    const state = useAuthStore.getState();
    expect(state.user.email).toBe("alice@example.com");
    expect(state.accessToken).toBe("fake-access-token");
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(localStorage.getItem("accessToken")).toBe("fake-access-token");
  });

  it("signup captures server error message", async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { message: "Email already registered" } },
    });

    await expect(
      useAuthStore.getState().signup("Bob", "bob@example.com", "Pass1234", "Pass1234"),
    ).rejects.toBeDefined();
    await flush();

    const state = useAuthStore.getState();
    expect(state.error).toBe("Email already registered");
    expect(state.user).toBeNull();
  });

  it("logout clears user + accessToken", async () => {
    useAuthStore.setState({
      user: { _id: "u1", email: "x@y.com" },
      accessToken: "tok",
    });
    localStorage.setItem("accessToken", "tok");

    // logout posts to /logout; mock the response
    mockPost.mockResolvedValueOnce({ data: { success: true } });

    await useAuthStore.getState().logout();
    await flush();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});
