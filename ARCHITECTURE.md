# DELTA — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                        │
│                                                                │
│  React 18 + Vite 5 + Zustand + Tailwind CSS                   │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ AuthPage │  │ ChatPage │  │ CallPage  │  │ Service       │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │ Worker (PWA) │  │
│       │             │              │         └──────────────┘  │
│  ┌────┴─────────────┴──────────────┴─────┐                    │
│  │            Zustand Stores              │                    │
│  │  Auth │ Chat │ Socket │ Call │ Toast   │                    │
│  └────┬──────────────────────────────────┘                    │
│       │                                                        │
│  ┌────┴──────────────────────┐  ┌────────────────────────┐    │
│  │  Axios Client             │  │  Socket.IO Client      │    │
│  │  (refresh mutex)          │  │  (auto-reconnect)      │    │
│  └────┬──────────────────────┘  └─────┬──────────────────┘    │
└───────┼───────────────────────────────┼───────────────────────┘
        │ HTTPS / REST                  │ WSS / WebSocket
        ▼                               ▼
┌───────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js)                          │
│                                                               │
│  Express.js 4 + Socket.IO 4 + Mongoose 8                     │
│                                                               │
│  Middleware Pipeline:                                         │
│  helmet → compression → json(2mb) → cookie → requestLogger   │
│  → cors → apiLimiter → routes → notFound → errorHandler      │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    REST API (/api/*)                     │  │
│  │                                                         │  │
│  │  Routes  →  Controllers  →  Services  →  Models         │  │
│  │  + Zod     + asyncHandler   + AppError   + Mongoose     │  │
│  │  schemas   + auth middleware              + validators   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Socket.IO (real-time events)                │  │
│  │                                                         │  │
│  │  socketAuthMiddleware  →  Event Handlers                │  │
│  │                                                         │  │
│  │  Presence: setup, disconnect, user_online/offline       │  │
│  │  Chat: send/edit/delete_message, typing, read receipts  │  │
│  │  Calls: initiate/accept/reject/end, WebRTC signaling    │  │
│  │  Group: participant join/leave, screen share, recording │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────┐  ┌──────────────────────────┐   │
│  │ Winston Logger           │  │ Cloudinary (file upload) │   │
│  └─────────────────────────┘  └──────────────────────────┘   │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│                     MongoDB Atlas                             │
│                                                               │
│  Collections:                                                 │
│  ┌──────┐ ┌──────┐ ┌────────┐ ┌──────┐ ┌──────────────┐     │
│  │ User │ │ Chat │ │Message │ │ Call │ │ Notification │     │
│  └──────┘ └──────┘ └────────┘ └──────┘ └──────────────┘     │
│                                                               │
│  Indexes:                                                     │
│  - User: email (unique), isOnline + lastSeen                 │
│  - Chat: users + isGroupChat, latestMessageTime              │
│  - Message: chat + createdAt (compound), chat + sender       │
│  - Call: initiatorId + createdAt, recipientId + createdAt    │
│  - Notification: userId + read + createdAt, TTL (30 days)    │
└───────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
1. Login/Register → POST /api/auth/login
   ← accessToken (JWT, 15m) in response body
   ← refreshToken (JWT, 7d) in httpOnly cookie

2. Authenticated Request → GET /api/chats
   → Authorization: Bearer <accessToken>
   ← 200 OK + data

3. Token Expired → GET /api/chats
   ← 401 Unauthorized
   → Axios interceptor catches 401
   → Mutex lock acquired (prevents parallel refresh calls)
   → POST /api/auth/refresh-token (cookie-based)
   ← New accessToken
   → Socket reconnects with new token
   → All queued requests retry with new token
   → Mutex released

4. Refresh Token Expired
   ← 401 from refresh endpoint
   → Clear localStorage + Zustand state
   → Redirect to login
```

## Real-Time Architecture

```
Socket Connection Lifecycle:

  Connect → socketAuthMiddleware (verify JWT)
    → "setup" event → User.isOnline = true (DB persist)
    → "join_room(chatId)" → Subscribe to room events

  Message Flow:
    Client → socket.emit("send_message", data)
      → messageService.sendMessage() (DB persist FIRST)
      → io.to(chatId).emit("receive_message", savedMessage)

  Edit/Delete Flow:
    Client → socket.emit("edit_message", data)
      → messageService.editMessage() (DB persist FIRST)
      → io.to(chatId).emit("message_edited", update)
      (Same pattern for delete_message)

  Disconnect:
    → Check for other active sockets from same user (multi-tab)
    → If none: User.isOnline = false, lastSeen = now (DB persist)
    → Broadcast "user_offline" to all clients
```

## WebRTC Call Architecture

```
1-to-1 Call (Peer-to-Peer):

  Initiator                    Recipient
     │                              │
     ├── initiate_call ──────────►  │
     │                              ├── incoming_call
     │  ◄──────── call_accepted ────┤
     │                              │
     ├── webrtc_offer ───────────►  │
     │  ◄──────── webrtc_answer ────┤
     │                              │
     │ ◄─── webrtc_ice_candidate ──►│ (bidirectional)
     │                              │
     ├── call_ended ─────────────►  │
     │                              │

Group Call (Mesh Topology):
  Each participant maintains a peer connection to every other.
  Max participants controlled by GROUP_CALL_LIMITS.MAX_PARTICIPANTS.
  ICE candidates include otherUserId for proper relay routing.
```

## Directory Structure

```
backend/
├── src/
│   ├── config/          # Centralized env, database, jwt, cloudinary
│   ├── controllers/     # HTTP request handlers (thin — delegate to services)
│   ├── lib/             # AppError, asyncHandler, logger (Winston)
│   ├── middleware/       # auth, errorHandler, validation, rateLimit, requestLogger
│   ├── models/          # Mongoose schemas + indexes + methods
│   ├── routes/          # Express routers (Zod validation middleware)
│   ├── services/        # Business logic (testable, no req/res dependency)
│   ├── socket/          # Socket.IO event handlers (presence, chat, calls)
│   └── validators/      # Zod schemas for HTTP input validation
└── tests/               # Test helpers (mongodb-memory-server)

frontend/
├── src/
│   ├── api/             # Axios client (refresh mutex) + endpoint modules
│   ├── components/
│   │   ├── auth/        # Login/Register forms
│   │   ├── calls/       # CallWindow, GroupCallWindow
│   │   ├── chat/        # ChatList, SingleChat, TypingIndicator, ReadReceipt, UnreadBadge
│   │   ├── common/      # ProtectedRoute, ErrorBoundary, ToastContainer
│   │   ├── modals/      # CreateGroupModal
│   │   ├── notifications/
│   │   └── sidebar/     # Sidebar, UserSearch
│   ├── hooks/           # useSocket, useWebRTC, useGroupWebRTC, useScreenShare, useCallRecorder
│   ├── lib/             # socket.io (reconnect), callConfig, format utils
│   ├── pages/           # AuthPage, ChatPage (lazy-loaded)
│   ├── store/           # Zustand stores (auth, chat, call, socket, notification, toast, UI)
│   └── styles/
├── Dockerfile           # Multi-stage (build + nginx)
└── vite.config.js       # PWA + React plugin
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Persist before broadcast** | Socket edit/delete events save to DB first, then broadcast. Prevents data loss on page refresh. |
| **Token refresh mutex** | Single refresh in-flight. Parallel 401s queue and retry, preventing token race conditions. |
| **useRef for selectedChat** | Socket event handlers capture closure at registration time. Ref always reflects current value. |
| **ObjectId comparison via helper** | Mongoose ObjectIds need `.toString()` for equality. `includesObjectId()` prevents subtle bugs. |
| **updateMany for markChatAsRead** | Single DB operation instead of N individual saves. O(1) instead of O(N). |
| **Dev-only logging** | `import.meta.env.DEV` conditional — tree-shaken in production builds. Zero overhead. |
| **Notification TTL index** | MongoDB auto-deletes notifications older than 30 days. Zero maintenance. |
| **Message content optional with fileUrl** | Allows file-only messages (images, PDFs) without requiring dummy text content. |
