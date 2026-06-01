# DELTA - Real-time Chat Application

Modern, production-ready chat application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Overview

DELTA is a complete rebuild of the original chat application, focusing on:

- ✅ Security (JWT with httpOnly cookies, proper authorization)
- ✅ Performance (message pagination, optimized queries)
- ✅ Real-time features (Socket.IO, presence tracking)
- ✅ Modern tech stack (React 18, Vite, Zustand, Tailwind CSS)
- ✅ Production-ready code (error handling, logging, validation)

## Project Structure

```
DELTA-REBUILD/
├── backend/          # Express.js + MongoDB server
│   ├── src/
│   ├── package.json
│   └── README.md
└── frontend/         # React + Vite web application
    ├── src/
    ├── package.json
    └── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
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

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`

## Features

### Phase 1 ✅ (Complete)

- Project infrastructure & setup
- Backend middleware & utilities
- Frontend state management
- Tailwind CSS configuration

### Phase 2 🔄 (Next)

- User authentication (register, login)
- JWT with refresh tokens
- Password hashing (bcryptjs)
- Secure session management

### Phase 3 (Planned)

- User profiles & search
- Online/offline status
- User blocking
- Presence tracking

### Phase 4 (Planned)

- 1-to-1 chat
- Group chat management
- Chat list with latest messages
- Admin controls

### Phase 5 (Planned)

- Message sending & receiving
- Message editing & deletion (soft delete)
- Message pagination
- Read receipts

### Phase 6 (Planned)

- Notifications system
- File/image sharing (Cloudinary)
- Dark mode
- Browser notifications

### Phase 7 (Planned)

- Typing indicators
- Performance optimization
- Mobile responsiveness
- Error recovery

### Phase 8 (Planned)

- Integration testing
- E2E testing
- Production build
- Deployment

## Tech Stack

### Backend

- Express.js 4
- MongoDB + Mongoose
- Socket.IO 4
- JWT authentication
- Winston logging
- Zod validation

### Frontend

- React 18
- React Router v6
- Zustand state management
- Tailwind CSS
- Vite bundler
- Axios HTTP client
- Socket.IO client

### Infrastructure

- MongoDB Atlas (database)
- Vercel (frontend deployment)
- Railway/Render (backend deployment)
- Cloudinary (file storage)

## Development

### Code Style

- ES6+ JavaScript
- Async/await over callbacks
- Modular component structure
- Comprehensive error handling

### Folder Organization

- Separate concerns (controllers, services, middleware)
- Feature-based component organization
- Centralized state management
- Consistent naming conventions

## API Endpoints

**Authentication** (`/api/auth`)

- `POST /register` - User signup
- `POST /login` - User login
- `POST /refresh-token` - Refresh access token
- `POST /logout` - User logout
- `GET /me` - Get current user

**Users** (`/api/users`)

- `GET /search?q=term` - Search users
- `GET /:id` - Get user profile
- `PUT /profile` - Update profile
- `POST /:id/block` - Block user
- `DELETE /:id/block` - Unblock user

**Chats** (`/api/chats`)

- `POST /` - Create 1-to-1 chat
- `GET /` - Get all chats
- `GET /:id` - Get chat details
- `POST /group` - Create group chat
- `PUT /:id/rename` - Rename group
- `PUT /:id/members` - Add/remove members

**Messages** (`/api/messages`)

- `GET /chat/:chatId` - Get messages (paginated)
- `POST /` - Send message
- `PUT /:id` - Edit message
- `DELETE /:id` - Delete message
- `POST /:id/read` - Mark as read

## Real-time Events (Socket.IO)

- `setup` - User connects
- `join chat` - Join specific chat room
- `new message` - Send message
- `typing` - Send typing indicator
- `stop typing` - Stop typing
- `user online` - User comes online
- `user offline` - User goes offline

## Security Features

✅ JWT authentication with access & refresh tokens  
✅ httpOnly cookies for token storage  
✅ Proper authorization checks on all endpoints  
✅ Input validation with Zod  
✅ Password hashing with bcryptjs  
✅ CORS configuration  
✅ Rate limiting  
✅ Soft delete for messages (data preservation)

## Performance Considerations

- Message pagination (50 messages per load)
- Database indexes on frequently queried fields
- Socket.IO room-based isolation
- Lazy component loading
- Code splitting via Vite
- Frontend bundle < 150KB

## Testing Strategy

- Integration tests for auth flow
- API tests for CRUD operations
- Socket.IO event tests
- Unit tests for utilities

## Deployment

### Frontend (Vercel)

```bash
npm run build
# Push to GitHub, Vercel auto-deploys
```

### Backend (Railway/Render)

1. Connect GitHub repo
2. Set environment variables
3. Auto-deploy on push

## Common Issues & Solutions

| Issue                 | Solution                                      |
| --------------------- | --------------------------------------------- |
| CORS errors           | Update `VITE_API_URL` and backend CORS origin |
| Token expired         | Check refresh token endpoint is working       |
| Socket not connecting | Verify `VITE_SOCKET_URL` matches backend URL  |
| Messages not loading  | Check MongoDB connection and indexes          |

## Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Follow code style and conventions
3. Test before committing
4. Push and create pull request

## License

MIT

---

**Project Status**: 🔄 In Development (Phase 2 starting)  
**Last Updated**: April 29, 2026  
**Maintainer**: Your Name
