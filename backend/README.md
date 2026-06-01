# DELTA Backend

Modern, production-ready real-time chat application backend built with Express.js, Node.js, and MongoDB.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO 4
- **Authentication**: JWT with httpOnly cookies
- **Validation**: Zod
- **Password**: bcryptjs
- **Logging**: Winston
- **Environment**: dotenv

## Project Structure

```
src/
├── config/          # Configuration files (DB, JWT, etc.)
├── middleware/      # Express middleware (auth, validation, error)
├── controllers/     # Route controllers (business logic)
├── routes/         # Express route definitions
├── models/         # Mongoose schemas
├── services/       # Business logic layer
├── socket/         # Socket.IO handlers
├── validators/     # Zod validation schemas
├── lib/           # Utility functions
└── server.js      # Express app entry point
```

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required variables:

- `MONGODB_URI` - MongoDB connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens (min 32 chars)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (min 32 chars)
- `FRONTEND_URL` - Frontend URL for CORS

## Running the Server

**Development** (with auto-reload):

```bash
npm run dev
```

**Production**:

```bash
npm start
```

The server will start on `http://localhost:5000` (or specified PORT)

## API Documentation

All endpoints require authentication unless specified otherwise.

### Authentication Routes

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Get new access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Phase 2+ Routes

- User management
- Chat operations
- Message handling
- Real-time events

## Real-time Features (Socket.IO)

- User presence tracking (online/offline status)
- Real-time message delivery
- Typing indicators
- Read receipts
- Instant notifications

## Error Handling

Consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

## Testing

```bash
npm run test
```

## Deployment

### Railway/Render

1. Set environment variables in dashboard
2. Connect GitHub repo
3. Deploy from main branch

### Environment Variables on Platform

- All variables from `.env.example` must be set
- `NODE_ENV=production`
- Ensure `FRONTEND_URL` matches your deployed frontend

## Contributing

1. Follow ES6+ standards
2. Use async/await over callbacks
3. Add error handling for all async operations
4. Use meaningful variable/function names

## License

MIT
