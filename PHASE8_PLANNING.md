# PHASE 8 — Production Readiness, Tests & Deploy

**Status:** Planning
**Owner:** DELTA team
**Goal:** Move DELTA from "code-complete, untested, un-deployed" to a deployable v1.0.

---

## 8.0 Pre-flight (DONE in this session)

The following deploy-breaking defects were repaired before Phase 8 began:

| # | Issue | Fix |
|---|---|---|
| 1 | Routes imported `validateRequest` (non-existent) | Added `validateRequest` as named alias in `middleware/validation.js` |
| 2 | Notification/upload modules were CJS while rest of backend is ESM | Converted to ESM (model, validator, service, controller, route) |
| 3 | `auth.js` set `req.userId` only; controllers use `req.user._id` | `auth.js` now sets both: `req.userId` and `req.user = { _id: userId }` |
| 4 | `express-rate-limit` declared but never wired | Created `middleware/rateLimit.js` with `authLimiter` + `apiLimiter`; `authLimiter` applied to `/api/auth/{register,login,refresh-token}` |
| 5 | STUN-only ICE config (calls fail on symmetric NAT) | Created `frontend/src/lib/callConfig.js` centralizing STUN + optional TURN; adopted by `useWebRTC` and `useGroupWebRTC` |
| 6 | Env validation scattered across `server.js` and `database.js` | Created `config/env.js` with `validateEnv()` and a single `config` object |

All existing imports of `validateRequest` (`routes/calls.js`, `routes/chats.js`, `routes/messages.js`, `routes/notifications.js`) now resolve.

---

## 8.1 Test Scaffolding

### Backend (Jest + Supertest)
**Tooling:** `jest@29` (already in devDeps), `supertest`, `mongodb-memory-server`.

**Initial test files:**
- `backend/src/services/auth.service.test.js` — register, login, refresh, getUserById
- `backend/src/middleware/auth.test.js` — token validation, missing token, expired token
- `backend/src/middleware/validation.test.js` — Zod schema pass/fail
- `backend/src/routes/auth.test.js` — full HTTP flow with supertest
- `backend/src/socket/middleware.test.js` — presence + chat events (using `socket.io-client` against in-process server)

**Coverage target:** ≥70% on services & middleware, ≥50% on controllers in the first pass.

### Frontend (Vitest + React Testing Library)
**Tooling:** Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.

**Initial test files:**
- `frontend/src/store/useAuthStore.test.js` — login, logout, refresh
- `frontend/src/api/client.test.js` — interceptor 401-retry, single-flight refresh
- `frontend/src/components/auth/LoginForm.test.jsx` — form validation, submit
- `frontend/src/lib/callConfig.test.js` — TURN config presence/absence

### E2E (Playwright)
**Tooling:** `playwright` (browser-driven, multi-user chat scenario).

**Critical journeys:**
1. Register → login → see online in another tab → 1-to-1 message
2. Start a 1-to-1 audio call, accept, end
3. Start a group call, all 3 participants join, hang up

---

## 8.2 CI/CD

**GitHub Actions workflow** (`.github/workflows/ci.yml`):
- Matrix: Node 18 + 20
- Jobs:
  1. `lint` — `eslint src/`
  2. `test-be` — `npm test` in `backend/`
  3. `test-fe` — `npm test` in `frontend/`
  4. `build-fe` — `npm run build` in `frontend/`
- Triggers: push to any branch, PRs to `main`.

**Optional:** Codecov for coverage reporting.

---

## 8.3 Containerization

- `backend/Dockerfile` — node:20-alpine, multi-stage, non-root user
- `frontend/Dockerfile` — node:20-alpine build → nginx:alpine serve
- `docker-compose.yml` at repo root — mongo + backend + frontend for local integration

---

## 8.4 Deployment

- **Frontend:** Vercel (already configured in docs)
  - Env vars: `VITE_API_URL`, `VITE_SOCKET_URL`, optional `VITE_TURN_*`
- **Backend:** Railway or Render
  - Env vars: `MONGODB_URI`, `JWT_*`, `FRONTEND_URL`, `CLOUDINARY_*`, `LOG_LEVEL`
  - Health check: `GET /api/health`
- **Database:** MongoDB Atlas (M0 free tier is fine to start)
- **TURN:** Twilio Network Traversal (free tier: 1GB/mo) or self-hosted coturn

### Pre-deploy checklist
- [ ] `.env` files NOT in repo (verified — already in `.gitignore`)
- [ ] `NODE_ENV=production` set
- [ ] Real secrets rotated (Mongo URI, JWT, Cloudinary, SMTP)
- [ ] `CORS` origin = deployed frontend URL
- [ ] Rate limiter tuned (env-driven; defaults are dev-friendly)
- [ ] Logging → file transport works OR move to stdout for cloud logs
- [ ] TURN configured for production calls (otherwise 30-50% call failure)
- [ ] Backups enabled on MongoDB Atlas
- [ ] Error monitoring wired (Sentry or equivalent)

---

## 8.5 Observability (Post-Phase 8)

- **Error monitoring:** Sentry (backend `@sentry/node`, frontend `@sentry/react`)
- **Log aggregation:** Loki / Datadog / CloudWatch (depending on host)
- **Uptime monitoring:** UptimeRobot (free tier) on `/api/health`
- **Performance:** Add APM (Sentry Performance, Datadog APM) for prod traffic

---

## 8.6 Phase 7b — Call Hardening (parallel track)

These were identified during the audit and are queued for Phase 7b:

| Item | Notes |
|---|---|
| **TURN config** | ✅ Stub created (`callConfig.js`); needs production credentials |
| **SFU for >6 participants** | Evaluate mediasoup (self-hosted) vs LiveKit (managed). Mesh collapses past 6-8 users. |
| **`send_message` socket event doesn't persist** | Fix: route through `messageService.sendMessage` before broadcast. Currently messages sent only over socket vanish on reload. |
| **Server-side recording** | Replace client-side MediaRecorder with server-side recording (FFmpeg + storage). |
| **Call metrics / analytics dashboard** | Wire `call_metrics` socket event to a CallMetrics model; add a `/api/calls/analytics` admin endpoint. |
| **Custom-event IPC for ICE** | Replace `window.dispatchEvent(CustomEvent)` with proper Zustand-mediated signaling (currently bypasses both React and the stores). |

---

## 8.7 Timeline (proposed)

| Week | Milestone |
|---|---|
| 1 | Jest+Supertest scaffolding; first 5 backend tests passing; CI lint+test passing |
| 2 | Vitest+RTL scaffolding; first 5 frontend tests passing; build verified in CI |
| 3 | Dockerfiles + docker-compose; first local stack-up |
| 4 | Deploy to Vercel + Railway/Render; verify `/api/health` reachable; TURN configured |
| 5 | E2E Playwright suite; Sentry wired; first end-to-end deploy |

---

## 8.8 Open Questions

- **SFU or no SFU for v1?** Mesh is fine for ≤6 users. If we expect larger groups, budget for mediasoup.
- **TURN provider?** Twilio (easy, paid), Cloudflare Calls (new, generous free tier), self-hosted coturn (free, ops burden).
- **Sentry tier?** Free tier is 5K events/mo — plenty for v1.
- **CI minutes budget?** GitHub free tier is 2,000 min/mo — fine for lint+test+build.

---

**Last updated:** 2026-06-06
