# Phase 6: Video/Audio Calls & Call History - Planning Document

**Phase**: 6  
**Objective**: Implement real-time video/audio calling with WebRTC and maintain call history  
**Timeline**: 2-3 weeks  
**Dependencies**: Phase 1-5 (Complete)  
**Technology Stack**: WebRTC, Socket.IO, Peerjs (optional), Dailyjs (optional)

---

## Executive Summary

Phase 6 introduces **peer-to-peer video/audio calling** to DELTA using WebRTC technology. The implementation will enable users to:

- Initiate 1-to-1 or group video/audio calls
- Stream audio and video in real-time
- Handle call signaling via Socket.IO
- Store complete call history with metadata
- View call duration, participants, and status
- Receive call invitations with notifications
- End calls gracefully with proper cleanup

---

## Technology Stack

### WebRTC Components

- **WebRTC API** (browser-native)
- **Socket.IO** (signaling layer for call setup)
- **Peerjs** (optional, simplifies WebRTC complexity)
- **getUserMedia API** (audio/video access)
- **RTCPeerConnection** (peer-to-peer connection)

### Audio/Video Libraries

- **simple-peer** (WebRTC wrapper) OR
- **peerjs** (higher-level abstraction)
- **react-use-webrtc** (custom hooks)

### Backend

- **Node.js/Express** (existing)
- **MongoDB** (call history storage)
- **Socket.IO** (call signaling)

### Frontend

- **React 18** (existing)
- **Zustand** (state management)
- **Tailwind CSS** (UI styling)

---

## Database Schema

### Call Model (NEW)

```javascript
{
  _id: ObjectId,
  initiatorId: ObjectId (indexed),
  recipientId: ObjectId (indexed),
  chatId: ObjectId (for group calls),
  participants: [ObjectId],
  callType: "1-to-1" | "group",
  mediaType: "audio" | "video" | "audio-video",
  status: "pending" | "accepted" | "rejected" | "missed" | "ended",
  startedAt: Date,
  endedAt: Date,
  duration: Number (seconds),
  recordingUrl: String (optional),
  rejectionReason: String (optional),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- initiatorId + createdAt (for user's outgoing calls)
- recipientId + createdAt (for user's incoming calls)
- chatId + createdAt (for group call history)
- status (for filtering active/ended calls)
```

### CallLog Model (NEW - optional for detailed tracking)

```javascript
{
  _id: ObjectId,
  callId: ObjectId (reference to Call),
  userId: ObjectId,
  action: "initiated" | "accepted" | "declined" | "ended" | "missed",
  timestamp: Date,
  metadata: {
    connectionQuality: "good" | "fair" | "poor",
    mediaReceived: boolean,
    audioEnabled: boolean,
    videoEnabled: boolean
  }
}
```

---

## API Endpoints

### Call Management

#### 1. Initiate Call

```
POST /api/calls/initiate
Request: {
  recipientId: String,
  mediaType: "audio" | "video" | "audio-video",
  chatId: String (optional, for group calls)
}
Response: {
  success: true,
  data: {
    callId: ObjectId,
    initiatorId: ObjectId,
    recipientId: ObjectId,
    status: "pending",
    createdAt: Date
  }
}
```

#### 2. Accept Call

```
PUT /api/calls/:callId/accept
Response: {
  success: true,
  data: {
    callId: ObjectId,
    status: "accepted",
    startedAt: Date
  }
}
```

#### 3. Reject Call

```
PUT /api/calls/:callId/reject
Request: {
  reason: String (optional)
}
Response: {
  success: true,
  message: "Call rejected"
}
```

#### 4. End Call

```
PUT /api/calls/:callId/end
Request: {
  duration: Number (seconds)
}
Response: {
  success: true,
  data: {
    callId: ObjectId,
    status: "ended",
    duration: Number,
    endedAt: Date
  }
}
```

#### 5. Get Call History (Paginated)

```
GET /api/calls/history?page=1&limit=20&type=incoming|outgoing|all
Response: {
  success: true,
  data: [
    {
      _id: ObjectId,
      participants: [...],
      duration: Number,
      status: String,
      createdAt: Date
    }
  ],
  pagination: { page, limit, total }
}
```

#### 6. Get Call Details

```
GET /api/calls/:callId
Response: {
  success: true,
  data: {
    _id: ObjectId,
    initiatorId: ObjectId,
    recipientId: ObjectId,
    status: String,
    duration: Number,
    startedAt: Date,
    endedAt: Date
  }
}
```

#### 7. Get Missed Calls

```
GET /api/calls/missed
Response: {
  success: true,
  data: [{ /* call objects */ }],
  count: Number
}
```

#### 8. Get Active Calls

```
GET /api/calls/active
Response: {
  success: true,
  data: [{ /* call objects with status = pending or accepted */ }]
}
```

---

## Socket.IO Events

### Call Signaling Events

#### Client → Server

**1. initiate_call**

```javascript
socket.emit("initiate_call", {
  recipientId: "user_id",
  mediaType: "video" | "audio",
  chatId: "chat_id"(optional),
});
```

**2. call_accepted**

```javascript
socket.emit("call_accepted", {
  callId: "call_id",
  recipientId: "user_id",
});
```

**3. call_rejected**

```javascript
socket.emit("call_rejected", {
  callId: "call_id",
  recipientId: "user_id",
  reason: "busy" | "declined" | "no_answer",
});
```

**4. call_ended**

```javascript
socket.emit("call_ended", {
  callId: "call_id",
  duration: 300, // seconds
});
```

**5. webrtc_offer**

```javascript
socket.emit("webrtc_offer", {
  callId: "call_id",
  recipientId: "user_id",
  offer: RTCSessionDescription,
});
```

**6. webrtc_answer**

```javascript
socket.emit("webrtc_answer", {
  callId: "call_id",
  initiatorId: "user_id",
  answer: RTCSessionDescription,
});
```

**7. webrtc_ice_candidate**

```javascript
socket.emit("webrtc_ice_candidate", {
  callId: "call_id",
  recipientId: "user_id",
  candidate: RTCIceCandidate,
});
```

#### Server → Client

**1. incoming_call**

```javascript
socket.on("incoming_call", {
  callId: "call_id",
  initiatorId: "user_id",
  initiatorName: "User Name",
  mediaType: "video" | "audio",
  timestamp: Date,
});
```

**2. call_accepted**

```javascript
socket.on("call_accepted", {
  callId: "call_id",
  recipientId: "user_id",
});
```

**3. call_rejected**

```javascript
socket.on("call_rejected", {
  callId: "call_id",
  reason: String,
});
```

**4. call_missed**

```javascript
socket.on("call_missed", {
  callId: "call_id",
  initiatorId: "user_id",
});
```

**5. webrtc_offer**

```javascript
socket.on("webrtc_offer", {
  callId: "call_id",
  offer: RTCSessionDescription,
});
```

**6. webrtc_answer**

```javascript
socket.on("webrtc_answer", {
  callId: "call_id",
  answer: RTCSessionDescription,
});
```

**7. webrtc_ice_candidate**

```javascript
socket.on("webrtc_ice_candidate", {
  callId: "call_id",
  candidate: RTCIceCandidate,
});
```

---

## Implementation Strategy

### Phase 6.1: Backend Foundation (Days 1-2)

1. **Create Call Model**
   - Database schema with proper indexes
   - Validation and field types
   - Methods for status updates

2. **Create Call Service**
   - initiateCall() - Create call record
   - acceptCall() - Update status and set startedAt
   - rejectCall() - Update status with reason
   - endCall() - Calculate duration, set endedAt
   - getCallHistory() - Paginated retrieval
   - getActiveCall() - Get current ongoing call
   - markAsMissed() - If not answered

3. **Create Call Controller**
   - HTTP handlers for all 8 endpoints
   - Error handling with AppError
   - Proper response formatting

4. **Create Call Routes**
   - POST /api/calls/initiate
   - PUT /api/calls/:id/accept
   - PUT /api/calls/:id/reject
   - PUT /api/calls/:id/end
   - GET /api/calls/history
   - GET /api/calls/:id
   - GET /api/calls/missed
   - GET /api/calls/active

5. **Create Call Validators**
   - Zod schemas for all inputs
   - Enum validation for statuses/media types

6. **Setup WebRTC Signaling**
   - setupCallEvents() Socket handler
   - Event listeners for all 7 signaling events
   - Relay SDP offers/answers between peers
   - Handle ICE candidates
   - Error handling and timeout management

7. **Integrate into Server**
   - Mount call routes
   - Call setupCallEvents() in connection handler
   - Update User model with callStatus field (optional)

### Phase 6.2: Frontend State & API (Days 3-4)

1. **Create Calls API Client**
   - HTTP wrappers for all 8 endpoints
   - Error handling

2. **Create useCallStore** (Zustand)
   - State: currentCall, callHistory, incomingCall, isCallActive
   - Actions: initiateCall(), acceptCall(), rejectCall(), endCall()
   - Actions: fetchCallHistory(), getActiveCall()
   - Socket integration

3. **Setup WebRTC Utilities**
   - getUserMedia() wrapper
   - RTCPeerConnection setup
   - SDP negotiation logic
   - ICE candidate handling
   - Stream management (add/remove tracks)

4. **Create useWebRTC Hook**
   - Manage RTCPeerConnection lifecycle
   - Handle local/remote streams
   - Error recovery
   - Cleanup on unmount

### Phase 6.3: UI Components (Days 5-7)

1. **CallNotification Component**
   - Display incoming call with caller name
   - Accept/Reject buttons
   - Caller avatar
   - Ringing sound (optional)

2. **CallWindow Component**
   - Local video stream (self)
   - Remote video stream (other participant)
   - Video/audio toggle buttons
   - End call button
   - Call timer
   - Network quality indicator (optional)

3. **CallHistory Component**
   - List of past calls
   - Filter by type (incoming/outgoing/missed)
   - Call duration display
   - Caller/callee information
   - Timestamp
   - Missed call badge

4. **MiniCallWindow Component**
   - Floating window for PiP (picture-in-picture)
   - Minimize/maximize
   - Keep on top of other content

5. **CallButton Component**
   - In ChatHeader for 1-to-1 chats
   - Initiate call with video/audio toggle

### Phase 6.4: Integration (Days 7-8)

1. **Update ChatHeader**
   - Add call button
   - Show call status
   - Disable during group chats (or enable for group calls)

2. **Update Notification System**
   - Create "incoming_call" notification type
   - Trigger notification on incoming call

3. **Update Socket Integration**
   - Socket listeners for all call events
   - Real-time call state updates

4. **Handle Call Permissions**
   - Request camera/microphone permissions
   - Show permission errors
   - Fallback to audio-only if video fails

### Phase 6.5: Testing & Docs (Days 9-10)

1. **Create Test Guide**
   - API endpoint testing
   - WebRTC connection testing
   - Call flow scenarios
   - Error handling tests

2. **Create Documentation**
   - Implementation summary
   - Architecture overview
   - Deployment guide

---

## Key Considerations

### WebRTC Challenges

1. **Signaling** - Handled via Socket.IO (offer/answer/ICE)
2. **NAT Traversal** - Need STUN/TURN servers (add to config)
3. **Browser Compatibility** - Safari/Edge video codec support
4. **Media Permissions** - Handle gracefully if denied
5. **Connection Loss** - Implement reconnection logic
6. **CPU Usage** - Monitor video encoding quality

### Architecture Decisions

1. **No WebRTC Gateway** - P2P only (more scalable)
2. **Socket.IO for Signaling** - Already have infrastructure
3. **Simple-peer vs PeerJS** - Evaluate based on complexity
4. **Group Calls** - Via multiple 1-to-1 connections or mesh topology
5. **Recording** - Browser-side only (no server storage initially)

### Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ⚠️ Limited codec support (H.264)
- Mobile: ⚠️ May have permission issues

### Performance Optimization

- Lazy load WebRTC libraries
- Optimize video codecs (VP8/H.264)
- Implement adaptive bitrate
- Use hardware acceleration when available
- Monitor memory usage during calls

---

## Dependencies to Install

### Backend

```bash
npm install simple-peer
# or
npm install peerjs
```

### Frontend

```bash
npm install simple-peer react-use-measure
# or
npm install peerjs
```

### Optional (for STUN/TURN)

```javascript
// No extra install needed - use public STUN servers
const iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
```

---

## File Structure

### Backend (NEW)

```
backend/src/
├── models/
│   ├── Call.js (NEW)
│   └── CallLog.js (optional NEW)
├── services/
│   └── call.service.js (NEW)
├── controllers/
│   └── callController.js (NEW)
├── routes/
│   └── calls.js (NEW)
├── validators/
│   └── call.js (NEW)
└── socket/
    └── middleware.js (MODIFIED - add setupCallEvents)
```

### Frontend (NEW)

```
frontend/src/
├── api/
│   └── calls.api.js (NEW)
├── store/
│   └── useCallStore.js (NEW)
├── hooks/
│   ├── useWebRTC.js (NEW)
│   └── useCallSignaling.js (NEW)
├── components/
│   ├── calls/ (NEW FOLDER)
│   │   ├── CallNotification.jsx
│   │   ├── CallWindow.jsx
│   │   ├── MiniCallWindow.jsx
│   │   └── CallHistory.jsx
│   ├── chat/
│   │   ├── ChatHeader.jsx (MODIFIED - add call button)
│   │   └── SingleChat.jsx (unchanged)
│   └── common/
│       └── CallButton.jsx (NEW)
└── pages/
    └── ChatPage.jsx (MODIFIED - add call components)
```

---

## Success Criteria

✅ Users can initiate 1-to-1 video/audio calls  
✅ Users can accept/reject incoming calls  
✅ Real-time audio/video transmission works  
✅ Call history is persisted and viewable  
✅ Call duration is tracked accurately  
✅ Missed calls are recorded  
✅ Clean call termination and cleanup  
✅ Error handling for permission denial  
✅ Works across different browsers  
✅ Comprehensive test coverage  
✅ Production-ready documentation

---

## Risk Mitigation

| Risk                  | Probability | Impact | Mitigation                                     |
| --------------------- | ----------- | ------ | ---------------------------------------------- |
| WebRTC not connecting | Low         | High   | Implement STUN/TURN, test fallbacks            |
| Browser compatibility | Medium      | Medium | Use simple-peer/peerjs, test multiple browsers |
| Permission denial     | Medium      | Medium | Graceful error handling, clear UI messages     |
| Call state sync       | Low         | Medium | Socket.IO events are source of truth           |
| Memory leaks          | Medium      | High   | Proper cleanup in useEffect, test long calls   |
| NAT/Firewall issues   | Low         | High   | STUN servers should handle most cases          |

---

## Timeline Estimate

| Phase                 | Duration    | Status          |
| --------------------- | ----------- | --------------- |
| Backend Foundation    | 2 days      | Not Started     |
| Frontend Setup        | 2 days      | Not Started     |
| UI Components         | 3 days      | Not Started     |
| Integration & Testing | 2 days      | Not Started     |
| Documentation         | 1 day       | Not Started     |
| **Total**             | **10 days** | **Not Started** |

**Buffer**: +30% for WebRTC debugging/testing

---

## Next Steps

1. Confirm Phase 6 starts
2. Create Call Model
3. Create Call Service
4. Create Call API endpoints
5. Setup Socket.IO signaling events
6. Create frontend state management
7. Build UI components
8. Test end-to-end calling flow
9. Comprehensive documentation

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Status**: Ready for Implementation
