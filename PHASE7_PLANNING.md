# Phase 7: Group Calls & Advanced Features - Planning Document

**Status:** 🎯 IN PLANNING  
**Date:** June 2026  
**Estimated Duration:** 3-4 weeks  
**Priority:** HIGH

---

## 📋 Overview

Phase 7 extends the calling capabilities from 1-to-1 to group/conference calling, adds screen sharing, call recording, and other advanced features requested by users. This phase significantly increases the platform's capability for business and team communications.

---

## 🎯 Phase 7 Objectives

### Primary Goals

1. ✅ Enable 2+ participant video conferences (group calls)
2. ✅ Implement screen sharing during calls
3. ✅ Record calls for future reference
4. ✅ Add call analytics and statistics
5. ✅ Implement call transfer between participants

### Success Criteria

- Users can create group calls with chat members
- Screen sharing works across all browsers
- Recordings stored and retrievable
- Call analytics available in dashboard
- No memory leaks in extended calls
- Performance maintained with 4+ participants

---

## 🏗️ Architecture Decisions

### Group Calling Topology

**Option 1: Mesh (P2P) - Selected for Phase 7a**

```
User A ←→ User B
  ↕        ↕
User C ←→ User D

Pros: No server overhead, lowest latency
Cons: N-squared connections, CPU intensive, limited to 4-6 participants
```

**Option 2: SFU (Selective Forwarding Unit) - Phase 7b**

```
User A \
User B → SFU Server → Broadcasts to others
User C /

Pros: Scales to 50+ participants, lower client CPU
Cons: Server bandwidth intensive, higher latency
```

**Decision**: Start with Mesh (Phase 7a) for simplicity and 1-to-1 scaling. SFU for Phase 7b if needed.

### Screen Sharing Architecture

```
Local Streams:
- getUserMedia() → Microphone + Camera
- getDisplayMedia() → Screen/Window

Remote Handling:
- Replace video track during share
- Show indicator "User X is sharing screen"
- Toggle between camera/screen
```

### Call Recording Strategy

```
Client-Side Option:
- MediaRecorder API
- Records local streams
- Users can share recordings

Server-Side Option (Phase 7b):
- Server captures SFU output
- Stores MP4/WebM files
- Transcoding for playback
```

**Phase 7a**: Client-side recording (user download)  
**Phase 7b**: Server-side recording (cloud storage)

---

## 📊 Data Model Changes

### Call Model Enhancement

```javascript
// Existing (Phase 6)
{
  initiatorId, recipientId, participants: []
  status: "pending" | "accepted" | "rejected" | "missed" | "ended"
  mediaType, startedAt, endedAt, duration
}

// Phase 7 additions
{
  // Group calling
  isGroupCall: boolean,           // false = 1-to-1, true = group
  maxParticipants: number,        // 2-100 depending on topology

  // Screen sharing
  screenShareParticipants: [{
    userId, startedAt, endedAt
  }],

  // Recording
  recordingUrl: string,           // Cloud storage URL
  recordingStartedAt: Date,
  recordingDuration: number,
  recordingSize: number,          // bytes

  // Analytics
  audioQuality: "good" | "fair" | "poor",
  videoQuality: "hd" | "sd" | "low",
  bandwidth: number,              // Mbps
  packetLoss: number,             // percentage
  roundTripTime: number,          // ms

  // Participants detail
  participants: [{
    userId,
    joinedAt,
    leftAt,
    duration,
    audioEnabled,
    videoEnabled,
    screenShared,
    quality: {}
  }]
}
```

### New Collections

**CallRecording** (optional, Phase 7b)

```javascript
{
  callId,
  createdBy,
  recordingUrl,
  fileSize,
  duration,
  format,
  createdAt,
  expiresAt (30-day TTL)
}
```

**CallAnalytics** (Phase 7)

```javascript
{
  callId,
  userId,
  metrics: {
    audioLevel,
    videoFrameRate,
    bandwidth,
    jitter,
    packetLoss,
    roundTripTime
  },
  timestamp
}
```

---

## 🎬 Phase 7 Features Breakdown

### Feature 1: Group Calls (2-6 participants)

#### Backend Changes

- ✅ Modify Call model to support `participants: []`
- ✅ Update call service for group operations
- ✅ New endpoint: `POST /api/calls/group/create`
- ✅ New endpoint: `PUT /api/calls/:id/add-participant`
- ✅ New endpoint: `PUT /api/calls/:id/remove-participant`
- ✅ Socket events for participant join/leave

#### Frontend Changes

- ✅ CallWindow redesign for grid layout (2-6 video)
- ✅ Participant list component
- ✅ Add participant modal
- ✅ Modify CallNotification for group calls
- ✅ Update useWebRTC to handle multiple peers

#### Implementation Steps

1. Update Call model schema
2. Create group call service methods
3. Add group call routes/endpoints
4. Modify Socket events for multiple peers
5. Build grid layout video component
6. Implement multi-peer RTCPeerConnection
7. Add participant management UI

#### Estimated LOC: 800-1000 LOC

---

### Feature 2: Screen Sharing

#### Backend Changes

- ✅ New endpoint: `PUT /api/calls/:id/share-screen`
- ✅ New endpoint: `PUT /api/calls/:id/stop-screen`
- ✅ Socket event: `screen_share_started`
- ✅ Socket event: `screen_share_stopped`
- ✅ Track screen sharers in analytics

#### Frontend Changes

- ✅ New hook: `useScreenShare()`
- ✅ Screen share button in CallWindow
- ✅ Screen selection dialog
- ✅ Visual indicator for sharer
- ✅ Track replacement logic

#### Implementation Steps

1. Implement getDisplayMedia() hook
2. Add screen share button to CallWindow
3. Handle track replacement
4. Emit Socket events
5. Update remote UI to show screen
6. Handle screen share stop

#### Estimated LOC: 400-500 LOC

---

### Feature 3: Call Recording

#### Client-Side Recording (Phase 7a)

**Backend Changes**

- ✅ Endpoint to save recording metadata
- ✅ Store recording reference in database

**Frontend Changes**

- ✅ New hook: `useCallRecorder()`
- ✅ Record button in CallWindow
- ✅ Recording indicator (red dot)
- ✅ Auto-save recording URL to backend
- ✅ Download/share recording option

**Implementation Steps**

1. Create useCallRecorder hook with MediaRecorder API
2. Add record button to CallWindow
3. Combine audio/video streams
4. Save as WebM/MP4 format
5. Store reference in database
6. Add download/playback option

**Estimated LOC**: 350-450 LOC

#### Server-Side Recording (Phase 7b - Optional)

- Capture SFU streams
- Encode to MP4
- Cloud storage (S3/Cloudinary)
- Transcoding pipeline

---

### Feature 4: Call Analytics

#### Metrics Collection

- 📊 Connection quality scores
- 📊 Audio/video frame rates
- 📊 Bandwidth usage
- 📊 Packet loss percentage
- 📊 Jitter measurements
- 📊 Round-trip time (RTT)

#### Backend Changes

- ✅ New endpoint: `GET /api/calls/:id/analytics`
- ✅ New endpoint: `POST /api/calls/:id/metrics` (update)
- ✅ Analytics aggregation service

#### Frontend Changes

- ✅ Stats panel in CallWindow
- ✅ Real-time metric updates
- ✅ Analytics history view
- ✅ Quality indicator

#### Implementation Steps

1. Extend useWebRTC to collect stats
2. Create analytics service
3. Add stats display component
4. Periodic metric uploads
5. Build analytics dashboard

**Estimated LOC**: 500-650 LOC

---

### Feature 5: Call Transfer

#### Use Case

User A calls User B, B wants to transfer to User C

```
Timeline:
A calls B
B initiates transfer
B leaves call
A automatically connected to C
```

#### Backend Changes

- ✅ New endpoint: `POST /api/calls/:id/transfer`
- ✅ Transfer validation logic
- ✅ Socket event: `call_transferred`

#### Frontend Changes

- ✅ Transfer button in CallWindow
- ✅ Select target participant
- ✅ Confirmation UI
- ✅ Handle transfer notification

**Estimated LOC**: 250-350 LOC

---

## 📅 Implementation Timeline

### Week 1-2: Group Calls

- Monday-Wednesday: Backend (model, service, routes)
- Thursday-Friday: Frontend (components, useWebRTC)
- Saturday: Integration & testing

### Week 2-3: Screen Sharing

- Monday-Tuesday: Hook & button
- Wednesday-Thursday: Track replacement & Socket
- Friday: Testing across browsers

### Week 3-4: Recording + Analytics

- Monday: Recorder hook
- Tuesday-Wednesday: Analytics collection
- Thursday: UI components
- Friday: Testing & documentation

### Final: Testing & Docs

- Comprehensive testing guide
- Session summary
- GitHub commit & push

---

## 🔌 Socket.IO Events (Phase 7)

### Group Call Events

```javascript
// Initiator creates group call
'group_call_initiated': {
  callId, initiatorId, participants: [userId], mediaType
}

// Participant joins
'participant_joined': {
  callId, userId, timestamp
}

// Participant leaves
'participant_left': {
  callId, userId, duration
}

// Add participant to active call
'add_participant': {
  callId, newUserId
}
```

### Screen Sharing Events

```javascript
'screen_share_started': {
  callId, userId
}

'screen_share_stopped': {
  callId, userId
}

'screen_shared_offer': {
  callId, userId, offer (SDP)
}
```

### Recording Events

```javascript
'recording_started': {
  callId, startedBy
}

'recording_stopped': {
  callId, duration, url
}

'recording_available': {
  recordingId, url, expiresAt
}
```

### Analytics Events

```javascript
'call_metrics': {
  callId, userId, metrics: {
    audio, video, bandwidth, packetLoss, rtt
  }
}
```

---

## 🛡️ Security Considerations

### Group Calls

- ✅ Only chat members can be added to group calls
- ✅ Ownership verification (call initiator controls)
- ✅ Rate limiting on participant additions
- ✅ Prevent duplicate participants

### Screen Sharing

- ✅ Only screen sharer's consent
- ✅ Clear visual indicator when screen is shared
- ✅ Automatic stop on tab close
- ✅ Permission revocation

### Recording

- ✅ All participants notified when recording starts
- ✅ Consent from all participants (Phase 7b)
- ✅ GDPR compliance for data deletion
- ✅ Encrypted storage

### Analytics

- ✅ No sensitive data in metrics
- ✅ User privacy respected
- ✅ Metrics aggregation only

---

## ⚠️ Known Challenges

1. **Mesh Network Scaling**: 4+ participants → exponential connections
   - Solution: Use SFU for larger groups (Phase 7b)

2. **Screen Share Track Replacement**: Browser inconsistencies
   - Solution: Test on Chrome/Firefox/Edge/Safari

3. **MediaRecorder Codec Support**: Different browsers = different output
   - Solution: Use VP8 (WebM) as standard, H.264 (MP4) fallback

4. **Bandwidth for 4+ Participants**: Significant increase
   - Solution: Adaptive bitrate, quality degradation

5. **Recording Storage**: Large files, bandwidth costs
   - Solution: Cloud storage, 30-day TTL for deletion

---

## 📈 Performance Targets

| Metric        | 1-to-1   | Group (4) | Group (6) |
| ------------- | -------- | --------- | --------- |
| Video Latency | < 200ms  | < 300ms   | < 500ms   |
| Bandwidth     | 1-3 Mbps | 4-8 Mbps  | 8-15 Mbps |
| CPU Usage     | 10-20%   | 20-40%    | 40-60%    |
| Memory        | 100MB    | 200MB     | 350MB     |

---

## 🧪 Testing Strategy

### Unit Tests

- Group call creation & operations
- Participant management
- Recording state management
- Analytics collection

### Integration Tests

- Multi-peer WebRTC connection
- Screen sharing workflow
- Call transfer flow
- Recording save/retrieve

### E2E Tests

- 4-user group call scenario
- Screen share + group call
- Recording + transfer
- Long duration calls (30+ min)

### Performance Tests

- 6-participant stress test
- Memory leak detection
- Bandwidth monitoring
- CPU usage profiling

---

## 📦 Dependencies

### No New Dependencies Required

- WebRTC: Already using RTCPeerConnection
- MediaRecorder: Browser native API
- Screen Sharing: getDisplayMedia() native API
- Zod, Mongoose, Socket.IO: Already installed

### Optional (Phase 7b)

- FFmpeg: Video encoding/transcoding
- AWS S3: Cloud storage
- Redis: Call queue management

---

## ✅ Success Metrics

**Phase 7 will be considered complete when:**

1. ✅ Users can create group calls with 2-6 participants
2. ✅ Screen sharing works on Chrome, Firefox, Edge
3. ✅ Call recording downloads/saves successfully
4. ✅ Analytics display real-time metrics
5. ✅ Call transfer completes without disconnects
6. ✅ No memory leaks in extended calls
7. ✅ Performance within targets
8. ✅ Comprehensive testing guide written
9. ✅ All code committed to GitHub
10. ✅ 99%+ uptime for test scenarios

---

## 📚 Documentation Requirements

### PHASE7_TESTING_GUIDE.md

- API endpoint testing
- WebRTC multi-peer testing
- Screen sharing test procedures
- Recording verification
- Analytics validation
- End-to-end scenarios

### PHASE7_SESSION_SUMMARY.md

- Architecture decisions
- Implementation breakdown
- Database schema changes
- Code statistics
- Performance metrics
- Deployment checklist

### Updated Files

- PROGRESS.md: Phase 7 completion section
- API_DOCUMENTATION.md: New endpoints
- README.md: Group calling features

---

## 🚀 Next Steps

1. **Review & Approve** - Confirm architecture decisions
2. **Backend Foundation** - Implement group call model & service
3. **WebRTC Multi-Peer** - Update useWebRTC hook
4. **UI Components** - Build grid layout & participant list
5. **Screen Sharing** - Implement getDisplayMedia()
6. **Recording** - Add MediaRecorder API
7. **Analytics** - Collect & display metrics
8. **Testing** - Comprehensive test coverage
9. **Documentation** - Complete guides & summary
10. **Deployment** - Commit & push to GitHub

---

**Phase 7 Status**: 🎯 READY TO BEGIN  
**Start Date**: June 2, 2026  
**Estimated Completion**: June 21, 2026

---

**Document Version**: 1.0  
**Last Updated**: June 2026  
**Status**: Complete
