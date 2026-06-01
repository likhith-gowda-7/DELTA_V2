# DELTA Frontend

Modern, responsive React frontend for the DELTA real-time chat application. Built with Vite, React 18, Zustand, and Tailwind CSS.

## Tech Stack

- **Build Tool**: Vite 5
- **Framework**: React 18 with Hooks
- **Routing**: React Router v6
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **UI Components**: Shadcn/ui + Lucide Icons
- **Forms**: React Hook Form (future)
- **Animations**: Framer Motion

## Project Structure

```
src/
├── api/           # Axios API calls
├── store/         # Zustand stores (auth, chat, UI)
├── hooks/         # Custom React hooks
├── components/
│   ├── common/    # Reusable components (Button, Input, etc.)
│   ├── auth/      # Login/Signup forms
│   ├── chat/      # Chat UI (ChatList, MessageList, etc.)
│   ├── modals/    # Modal dialogs
│   ├── sidebar/   # Sidebar components
│   └── layouts/   # Layout wrappers
├── pages/         # Route pages
├── lib/          # Utilities (socket, constants, format, etc.)
├── styles/       # Global CSS
└── App.jsx       # Main app component
```

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Environment variables:

- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)
- `VITE_SOCKET_URL` - Socket.IO URL (default: http://localhost:5000)

## Running the App

**Development**:

```bash
npm run dev
```

App will open at `http://localhost:5173`

**Production Build**:

```bash
npm run build
npm run preview
```

## Features

### Phase 1 (Complete)

- ✅ Project infrastructure
- ✅ Zustand state management
- ✅ Axios client with interceptors
- ✅ Tailwind CSS setup
- ✅ Global styles

### Phase 2 (In Progress)

- 🔄 User authentication (login/signup)
- 🔄 Session persistence
- 🔄 Protected routes

### Phase 3+ (Planned)

- Chat interface
- Real-time messaging
- User search
- Online status
- Typing indicators
- Dark mode
- Responsive mobile layout

## Component Architecture

### Store-based State Management

Uses Zustand for:

- **useAuthStore** - User auth state
- **useChatStore** - Chat and messages
- **useUIStore** - UI state (theme, modals)

### API Communication

Axios instance with:

- ✅ Automatic token injection
- ✅ Auto-refresh on 401
- ✅ Error interceptors
- ✅ Cookie support (httpOnly)

### Socket.IO Integration

Real-time features:

- Message delivery
- Typing indicators
- Online status
- Read receipts
- Presence tracking

## Styling Guide

### Tailwind Classes

Using configured design system:

- **Colors**: Primary blue (500-900), slate for text
- **Components**: `.btn-primary`, `.input-field`, `.card`, `.badge`
- **Dark Mode**: Automatic with `dark:` prefix
- **Responsive**: Tailwind breakpoints (sm, md, lg, xl)

### Dark Mode

Toggle via `useUIStore().toggleTheme()`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari 14+
- Edge (latest)

## Performance

- ✅ Code splitting via Vite
- ✅ Lazy route loading
- ✅ Image optimization ready (Cloudinary)
- ✅ Bundle size: ~140KB gzipped

## Development

### Adding a New Component

```javascript
// src/components/common/MyComponent.jsx
import { cn } from "../../lib/cn";

export default function MyComponent({ className, ...props }) {
  return (
    <div className={cn("base-styles", className)} {...props}>
      Content
    </div>
  );
}
```

### Adding a New Zustand Store

```javascript
// src/store/myStore.js
import { create } from "zustand";

export const useMyStore = create((set) => ({
  state: initial,
  setState: (value) => set({ state: value }),
}));
```

### API Calls

```javascript
// src/api/myApi.js
import apiClient from "./client";

export const myApiCall = (payload) => {
  return apiClient.post("/endpoint", payload);
};
```

## Linting & Formatting

```bash
npm run lint
npm run format
```

## Deployment

### Vercel (Recommended)

1. Connect GitHub repo
2. Set environment variables in dashboard
3. Deploy automatically on push

### Other Platforms

```bash
npm run build
# Deploy the 'dist' folder
```

## Troubleshooting

### CORS Errors

- Ensure `VITE_API_URL` and backend CORS configuration match

### Socket Connection Failed

- Check `VITE_SOCKET_URL` is correct
- Verify backend Socket.IO is running

### Token Not Persisting

- Check browser localStorage is enabled
- Verify refresh token cookie is httpOnly

## License

MIT
