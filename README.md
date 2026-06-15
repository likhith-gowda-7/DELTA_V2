# DELTA — Real-time Communication Platform

Modern, production-grade real-time communication platform built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring WebRTC video/audio calls, real-time messaging, and group collaboration.

## Overview

DELTA is a complete rebuild of the original chat application, engineered for production with:

- ✅ **Security** — JWT with httpOnly cookies, token refresh mutex, rate limiting, Zod validation, regex-safe search
- ✅ **Performance** — Message pagination, bulk `updateMany` operations, optimized MongoDB indexes, dev-only logging
- ✅ **Real-time** — Socket.IO with persistent presence tracking, typing indicators, read receipts, WebRTC calls
- ✅ **Resilience** — Socket re-authentication after token refresh, stale closure protection, error boundaries
- ✅ **Modern Stack** — React 18, Vite 5, Zustand, Tailwind CSS, ESM throughout
- ✅ **Production-ready** — Centralized config, structured logging, comprehensive error handling

## Project Status

| Phase | Title | Status |
|---|---|---|
| 1 | Project Infrastructure | ✅ Complete |
| 2 | Authentication System | ✅ Complete |
| 3 | User Management & Presence | ✅ Complete |
| 4 | Chat (1-to-1 + Group) | ✅ Complete |
| 5 | Notifications & File Sharing | ✅ Complete |
| 6 | 1-to-1 Video/Audio Calls & History | ✅ Complete |
| 7a | Group Calls, Screen Share, Recording | ✅ Code complete |
| 7b | SFU, Server-side Recording, Call Analytics | 📋 Planned |
| 8 | Production Readiness & Deploy | 🛠 In progress |
| **Audit** | **Engineering Audit & Stabilization** | ✅ **Complete (Phases A–D)** |

### Engineering Audit Summary (Latest)

A comprehensive engineering audit was performed across 70+ source files, identifying and fixing:

- **5 Critical bugs** — Group call creation failure, token refresh race conditions, socket auth expiry, presence not persisting, N+1 DB queries
- **10 High-severity issues** — Socket events not persisting edits/deletes, stale closures, missing ICE candidate routing, console.log in production
- **10 Medium issues** — Rate limiter not wired, regex injection, typing indicators/read receipts unimplemented
- **5 Low-priority items** — Duplicate indexes, dead dependencies, schema cleanup

All fixes verified: backend syntax check ✅, frontend production build ✅ (1711 modules, 5.2s)

## Project Structure

```
DELTA-REBUILD/
├── backend/               # Express.js + MongoDB server (ESM)
│   ├── src/
│   │   ├── config/        # env (centralized), database, jwt, cloudinary, TURN
│   │   ├── controllers/   # auth, user, chat, message, call, notification, upload
│   │   ├── lib/           # AppError, asyncHandler, logger
│   │   ├── middleware/     # auth, errorHandler, validation, rateLimit
│   │   ├── models/        # User, Chat, Message, Call, Notification
│   │   ├── routes/        # auth, users, chats, messages, calls, notifications, uploads, health
│   │   ├── services/      # business logic layer
│   │   ├── socket/        # middleware (presence, chat, calls, group calls, notifications)
│   │   └── validators/    # Zod schemas
│   ├── tests/             # Jest + Supertest scaffolding
│   └── package.json
├── frontend/              # React + Vite web application
│   ├── src/
│   │   ├── api/           # axios client (refresh mutex) + endpoint modules
│   │   ├── components/    # auth, chat, calls, modals, ui
│   │   ├── hooks/         # useWebRTC, useGroupWebRTC, useSocket, useScreenShare, useCallRecorder
│   │   ├── lib/           # cn, constants, format, socket.io (reconnect), callConfig
│   │   ├── pages/         # ChatPage, AuthPage
│   │   ├── store/         # Zustand stores (auth, chat, call, notification, socket, UI, toast)
│   │   └── styles/
│   └── package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ (Node 20 recommended)
- MongoDB Atlas account (or local MongoDB)
- Git

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Backend runs on `http://localhost:5000`. Health check: `GET /api/health`.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`.

### Environment Variables

**Backend** (`.env`):
```env
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PORT=5000
```

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Running Tests

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npm test
```

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js 18+ (ESM) | Runtime |
| Express.js 4 | HTTP framework |
| MongoDB + Mongoose 8 | Database + ODM |
| Socket.IO 4 | Real-time communication |
| JWT (15m access / 7d refresh) | Authentication |
| bcryptjs (10 rounds) | Password hashing |
| Zod | Input validation |
| Winston | Structured logging |
| express-rate-limit | Brute-force protection |
| Multer + Cloudinary | File uploads |
| Jest + Supertest | Testing |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite 5 | UI framework + build tool |
| React Router v6 | Client-side routing |
| Zustand (with persist) | State management |
| Tailwind CSS | Styling (dark mode) |
| Axios (refresh mutex) | HTTP client |
| Socket.IO Client | Real-time events |
| WebRTC | Peer-to-peer calls |
| MediaRecorder API | Client-side recording |

### Infrastructure
| Service | Purpose |
|---|---|
| MongoDB Atlas | Database hosting |
| Vercel | Frontend deployment |
| Railway / Render | Backend deployment |
| Cloudinary | File/image storage |
| Twilio / coturn | TURN server (production calls) |

## Architecture

### Authentication Flow
```
Client → POST /auth/login → Server validates credentials
  ← { accessToken (15m), refreshToken (7d, httpOnly cookie) }

Client → GET /api/chats (with Bearer token)
  ← 401 (expired) → Interceptor queues request
  → POST /auth/refresh-token (mutex prevents duplicates)
  ← New accessToken → Retry all queued requests
  → Socket reconnects with new token
```

### Real-time Event Flow
```
Socket connects → auth middleware verifies JWT
  → setup event → User.isOnline = true (DB persisted)
  → join_room(chatId) → subscribe to chat events

send_message → messageService.sendMessage() (DB persist)
  → io.to(chatId).emit("receive_message") (broadcast)

edit_message → messageService.editMessage() (DB persist)
  → io.to(chatId).emit("message_edited") (broadcast)

disconnect → check other sockets
  → if none: User.isOnline = false, lastSeen = now (DB persisted)
```

## API Endpoints

| Group | Path | Description |
|---|---|---|
| **Auth** | `/api/auth` | register, login, refresh-token, logout, me, profile, change-password |
| **Users** | `/api/users` | search, profile, block/unblock |
| **Chats** | `/api/chats` | 1-to-1 + group CRUD, rename, add/remove/promote members |
| **Messages** | `/api/messages` | paginated send/edit/delete, read receipts, search |
| **Notifications** | `/api/notifications` | paginated, mark-read, delete |
| **Calls** | `/api/calls` | initiate, accept, reject, end, group, screen share, recording, history, stats |
| **Uploads** | `/api/uploads` | multipart file → Cloudinary |
| **Health** | `/api/health` | Server health check |

## Real-time Events (Socket.IO)

- **Presence:** `setup`, `user_online`, `user_offline`, `online_users`
- **Chat:** `join_room`, `leave_room`, `send_message`, `edit_message`, `delete_message`, `typing`, `stop_typing`, `mark_as_read`, `mark_chat_as_read`
- **Notifications:** `send_notification`, `send_chat_notification`, `notification_read`
- **1-to-1 Calls:** `initiate_call`, `call_accepted`, `call_rejected`, `call_ended`, `webrtc_offer`, `webrtc_answer`, `webrtc_ice_candidate`, `call_timeout`
- **Group Calls:** `group_call_initiated`, `participant_joined`, `participant_left`, `screen_share_started/stopped`, `recording_started/stopped`, `call_metrics`

## Security Features

| Feature | Implementation |
|---|---|
| Token Authentication | JWT access (15m) + refresh (7d) with rotation |
| Cookie Security | httpOnly, sameSite=strict, secure in production |
| Token Refresh | Mutex-based — prevents race conditions from concurrent 401s |
| Rate Limiting | Auth: 20 req/15min, API: 200 req/15min (env-tunable) |
| Input Validation | Zod schemas on all endpoints |
| Password Security | bcryptjs with 10 salt rounds |
| CORS | Restricted to configured `FRONTEND_URL` |
| Regex Safety | User search input escaped to prevent ReDoS |
| Message Protection | Soft delete, ownership checks, 5-minute edit window |
| Socket Auth | JWT verified on connection, re-auth on token refresh |

## Performance Optimizations

- Message pagination (50 per load, cursor-based with `createdAt` index)
- Bulk `updateMany` for marking messages as read (replaced N+1 loop)
- Compound MongoDB indexes on hot query paths
- Socket.IO room-based event isolation
- Dev-only logging (tree-shaken in production builds)
- React component code splitting via Vite
- JSON body limit: 2MB (prevents DoS via large payloads)

## Deployment

- **Frontend:** Vercel — env vars: `VITE_API_URL`, `VITE_SOCKET_URL`
- **Backend:** Railway / Render — env: `MONGODB_URI`, `JWT_*`, `FRONTEND_URL`, `CLOUDINARY_*`
- **TURN:** Required for production calls (~30-50% of users need it for NAT traversal). See `frontend/src/lib/callConfig.js`

## Troubleshooting

| Issue | Solution |
|---|---|
| CORS errors | Update `VITE_API_URL` and backend `FRONTEND_URL` to match |
| 401 on protected call | Token expired; axios interceptor refreshes automatically |
| Socket not connecting | Verify `VITE_SOCKET_URL` matches backend URL |
| Messages not loading | Check MongoDB connection and indexes |
| Call fails on mobile | TURN server required for symmetric NAT / cellular networks |
| Module not found | All backend code is ESM — use `import`/`export`, not `require` |
| Group call creation fails | Fixed in audit — `recipientId` is now optional for group calls |

## Contributing

1. Branch: `git checkout -b feature/<name>`
2. Code style: ES6+, async/await, controller → service → model layering
3. Add Zod validation for any new HTTP inputs
4. Add unit tests for any new service or middleware
5. PR against `main` — CI runs lint + test + build

## License

MIT

---

**Project Status**: 🛠 Phase 8 in progress (production readiness)
**Last Updated**: 2026-06-15
**Maintainer**: Likhith Gowda
