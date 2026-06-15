// Socket.IO utility functions
import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const getSocket = () => socket;

/**
 * C3 FIX: Update the auth token on a live socket and force a reconnect.
 * Called after the HTTP interceptor refreshes the access token so the
 * socket doesn't keep using a stale/expired token.
 */
export const reconnectWithNewToken = (newToken) => {
  if (socket) {
    socket.auth = { token: newToken };
    // Disconnect and reconnect with the new token
    socket.disconnect().connect();
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
