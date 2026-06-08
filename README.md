# DELTA - Real-time Chat Application

Modern, production-bound chat application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Overview

DELTA is a complete rebuild of the original chat application, focusing on:

- ✅ Security (JWT with httpOnly cookies, rate limiting, proper authorization)
- ✅ Performance (message pagination, optimized queries, indexes)
- ✅ Real-time features (Socket.IO, presence, typing, WebRTC calls)
- ✅ Modern tech stack (React 18, Vite, Zustand, Tailwind CSS)
- ✅ Production-ready code (error handling, logging, Zod validation)

## Project Status (as of 2026-06-06)

| Phase | Title | Status |
|---|---|---|
| 1 | Project Infrastructure | ✅ Complete |
| 2 | Authentication System | ✅ Complete |
| 3 | User Management & Presence | ✅ Complete |
| 4 | Chat (1-to-1 + group) | ✅ Complete |
| 5 | Notifications & File Sharing | ✅ Complete |
| 6 | 1-to-1 Video/Audio Calls & History | ✅ Complete |
| 7a | Group Calls, Screen Share, Recording | 🟡 Code complete; 31 manual test cases documented, not yet executed |
| 7b | SFU, server-side recording, call analytics | ❌ Not started |
| **8** | **Tests, CI/CD, Docker, Deploy** | 🛠 **In progress — see [PHASE8_PLANNING.md](./PHASE8_PLANNING.md)** |

**Pre-flight deploy-breaking defects fixed in this session:**
1. `validateRequest` alias added to validation middleware (4 route files)
2. Notification & upload modules converted from CJS → ESM
3. `auth.js` sets both `req.userId` and `req.user = { _id }` for controller compatibility
4. `express-rate-limit` wired on auth routes
5. WebRTC STUN/TURN config centralized
6. Env validation centralized

## Project Structure

```
DELTA-REBUILD/
├── backend/             # Express.js + MongoDB server (ESM)
│   ├── src/
│   │   ├── config/      # env, database, jwt, cloudinary
│   │   ├── controllers/ # auth, user, chat, message, call, notification, upload
│   │   ├── lib/         # AppError, asyncHandler, logger
│   │   ├── middleware/  # auth, errorHandler, validation, rateLimit
│   │   ├── models/      # User, Chat, Message, Call, Notification
│   │   ├── routes/      # auth, users, chats, messages, calls, notifications, uploads, health
│   │   ├── services/    # business logic
│   │   ├── socket/      # middleware (presence, chat, calls, group calls)
│   │   └── validators/  # Zod schemas
│   ├── tests/           # Jest test scaffolding
│   ├── jest.config.js
│   └── package.json
├── frontend/            # React + Vite web application
│   ├── src/
│   │   ├── api/         # axios + endpoints
│   │   ├── components/  # auth, chat, calls, modals, ui
│   │   ├── hooks/       # useWebRTC, useGroupWebRTC, useSocket, useScreenShare, useCallRecorder
│   │   ├── lib/         # cn, constants, format, socket, callConfig (TURN stub)
│   │   ├── pages/       # ChatPage, LoginPage, RegisterPage
│   │   ├── store/       # useAuthStore, useChatStore, useCallStore, useNotificationStore, useUIStore, useSocketStore
│   │   └── styles/
│   └── package.json
├── PHASE*_*.md          # Per-phase planning, summaries, testing guides
├── PROGRESS.md          # Single-source feature overview
├── PHASE8_PLANNING.md   # Tests, CI, Docker, Deploy
└── README.md            # This file
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

### Running Tests (Phase 8)

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npm test
```

## Tech Stack

### Backend
- Node.js 18+ (ESM modules)
- Express.js 4
- MongoDB + Mongoose 8
- Socket.IO 4
- JWT (access 15m / refresh 7d) + httpOnly cookies
- bcryptjs (10 rounds)
- Zod validation
- Winston logging
- express-rate-limit (wired on auth)
- Multer + Cloudinary
- Jest (Phase 8)

### Frontend
- React 18 + Vite 5
- React Router v6
- Zustand (with persist for auth)
- Tailwind CSS (dark mode)
- Axios (auto-refresh interceptor)
- Socket.IO client
- WebRTC (STUN + optional TURN via `lib/callConfig.js`)
- MediaRecorder API (client-side recording)

### Infrastructure
- MongoDB Atlas
- Vercel (frontend)
- Railway / Render (backend)
- Cloudinary (file storage)
- Twilio / coturn (TURN server — see `callConfig.js`)

## API Endpoints (summary)

**Auth** (`/api/auth`) — register, login, refresh-token, logout, me, profile, change-password (rate-limited)
**Users** (`/api/users`) — search, profile, block/unblock
**Chats** (`/api/chats`) — 1-to-1 + group, rename, add/remove/promote members
**Messages** (`/api/messages`) — paginated send/edit/delete, read receipts
**Notifications** (`/api/notifications`) — paginated, mark-read, delete
**Calls** (`/api/calls`) — initiate, accept, reject, end, group create, screen share, recording, history, missed, active, stats
**Uploads** (`/api/uploads`) — multipart file → Cloudinary

Full reference: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Real-time Events (Socket.IO)

- **Presence:** `setup`, `user_online`, `user_offline`, `online_users`
- **Chat:** `join_room`, `leave_room`, `send_message`, `edit_message`, `delete_message`, `typing`, `stop_typing`, `mark_as_read`, `mark_chat_as_read`
- **Notifications:** `send_notification`, `send_chat_notification`, `notification_read`
- **1-to-1 calls:** `initiate_call`, `call_accepted`, `call_rejected`, `call_ended`, `webrtc_offer`, `webrtc_answer`, `webrtc_ice_candidate`, `call_timeout`
- **Group calls:** `group_call_initiated`, `participant_joined`, `participant_left`, `screen_share_started/stopped`, `recording_started/stopped`, `call_metrics`

## Security Features

✅ JWT (access 15m + refresh 7d) with rotation  
✅ httpOnly cookies for refresh token (sameSite=strict, secure in prod)  
✅ Authorization checks on every protected endpoint  
✅ Zod input validation  
✅ bcryptjs password hashing  
✅ CORS restricted to `FRONTEND_URL`  
✅ Rate limiting on auth (20 req / 15 min, env-tunable)  
✅ Soft delete for messages (data preservation)  
✅ Ownership checks on all call/message operations

## Performance Considerations

- Message pagination (50 per load)
- DB indexes on hot fields (email, chatId+createdAt, userId+read, etc.)
- Socket.IO room-based isolation
- React component lazy loading
- Code splitting via Vite

## Deployment

See [PHASE8_PLANNING.md](./PHASE8_PLANNING.md) §8.4 for the full deploy guide.

- **Frontend:** Vercel — env vars: `VITE_API_URL`, `VITE_SOCKET_URL`, optional `VITE_TURN_*`
- **Backend:** Railway / Render — env: `MONGODB_URI`, `JWT_*`, `FRONTEND_URL`, `CLOUDINARY_*`
- **TURN:** required for production calls; see `frontend/src/lib/callConfig.js`

## Common Issues & Solutions

| Issue                 | Solution                                                  |
| --------------------- | --------------------------------------------------------- |
| CORS errors           | Update `VITE_API_URL` and backend `FRONTEND_URL`          |
| 401 on protected call | Token expired; axios interceptor will refresh automatically |
| Socket not connecting | Verify `VITE_SOCKET_URL` matches backend URL              |
| Messages not loading  | Check MongoDB connection and indexes                      |
| Call fails on mobile  | TURN server required for symmetric NAT / cellular networks |
| Module not found      | All backend code is ESM — use `import`/`export`, not `require` |

## Contributing

1. Branch: `git checkout -b feature/<name>`
2. Code style: ES6+, async/await, controller→service→model layering
3. Add Zod validation for any new HTTP inputs
4. Add unit tests for any new service or middleware (Phase 8)
5. PR against `main` — CI runs lint + test + build

## License

MIT

---

**Project Status**: 🛠 Phase 8 in progress (production readiness)  
**Last Updated**: 2026-06-06  
**Maintainer**: DELTA team

