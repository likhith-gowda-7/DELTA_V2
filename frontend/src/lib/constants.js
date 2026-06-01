// Constants for the application
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const MESSAGE_TYPES = {
  TEXT: "text",
  FILE: "file",
  IMAGE: "image",
};

export const NOTIFICATION_TYPES = {
  MESSAGE: "message",
  TYPING: "typing",
  GROUP_ADDED: "groupAdded",
  REMOVED_FROM_GROUP: "removedFromGroup",
  ONLINE: "online",
  OFFLINE: "offline",
};

export const SOCKET_EVENTS = {
  // Connection
  SETUP: "setup",
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // Chat
  JOIN_CHAT: "join chat",
  LEAVE_CHAT: "leave chat",
  NEW_MESSAGE: "new message",

  // Typing
  TYPING: "typing",
  STOP_TYPING: "stop typing",

  // Presence
  USER_ONLINE: "user online",
  USER_OFFLINE: "user offline",
  ONLINE_USERS: "online users",
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};
