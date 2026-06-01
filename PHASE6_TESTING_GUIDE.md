# Phase 6: Video/Audio Calls & Call History - Testing Guide

**Status:** ✅ COMPLETE  
**Date:** June 2026  
**Test Coverage:** API, WebRTC, UI Components, End-to-End

---

## Backend Setup for Testing

### Prerequisites

1. **Environment Variables (.env)**

   ```
   MONGODB_URI=mongodb+srv://...
   JWT_ACCESS_SECRET=your_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   FRONTEND_URL=http://localhost:5173
   ```

2. **Dependencies Installed**

   ```bash
   cd backend
   npm install
   ```

3. **MongoDB Connection Active**

4. **Server Running**
   ```bash
   npm start
   # Server should start on http://localhost:5000
   ```

---

## API Testing

### 1. Call Endpoints

#### 1.1 Initiate Call

**Endpoint:** `POST /api/calls/initiate`

**Request:**

```bash
curl -X POST http://localhost:5000/api/calls/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "user_id_2",
    "mediaType": "audio-video"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "_id": "call_id",
    "initiatorId": "user_id_1",
    "recipientId": "user_id_2",
    "callType": "1-to-1",
    "mediaType": "audio-video",
    "status": "pending",
    "createdAt": "2026-06-01T10:00:00Z"
  }
}
```

#### 1.2 Accept Call

**Endpoint:** `PUT /api/calls/:id/accept`

**Request:**

```bash
curl -X PUT http://localhost:5000/api/calls/call_id/accept \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "_id": "call_id",
    "status": "accepted",
    "startedAt": "2026-06-01T10:00:05Z"
  }
}
```

#### 1.3 Reject Call

**Endpoint:** `PUT /api/calls/:id/reject`

**Request:**

```bash
curl -X PUT http://localhost:5000/api/calls/call_id/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "busy"}'
```

#### 1.4 End Call

**Endpoint:** `PUT /api/calls/:id/end`

**Request:**

```bash
curl -X PUT http://localhost:5000/api/calls/call_id/end \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration": 120}'
```

#### 1.5 Get Call History

**Endpoint:** `GET /api/calls?page=1&limit=20`

**Request:**

```bash
curl -X GET "http://localhost:5000/api/calls?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "calls": [
    {
      "_id": "call_id",
      "initiatorId": { "name": "User 1", "avatar": "..." },
      "recipientId": { "name": "User 2", "avatar": "..." },
      "status": "ended",
      "duration": 120,
      "createdAt": "2026-06-01T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "pages": 1 }
}
```

#### 1.6 Get Missed Calls

**Endpoint:** `GET /api/calls/missed`

**Request:**

```bash
curl -X GET http://localhost:5000/api/calls/missed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 1.7 Get Active Calls

**Endpoint:** `GET /api/calls/active`

**Request:**

```bash
curl -X GET http://localhost:5000/api/calls/active \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 1.8 Get Call Statistics

**Endpoint:** `GET /api/calls/stats`

**Request:**

```bash
curl -X GET http://localhost:5000/api/calls/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "totalCalls": 25,
    "missedCalls": 3,
    "totalDuration": 7200,
    "averageDuration": 288
  }
}
```

---

## Socket.IO Testing

### 2. WebRTC Signaling Events

#### 2.1 Setup Socket Connection

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_TOKEN",
  },
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});
```

#### 2.2 Initiate Call

```javascript
socket.emit("initiate_call", {
  recipientId: "user_id_2",
  mediaType: "audio-video",
  callId: "call_id",
});

socket.on("incoming_call", (data) => {
  console.log("Incoming call:", data);
  // {
  //   callId: "...",
  //   initiatorId: "...",
  //   mediaType: "audio-video",
  //   timestamp: "..."
  // }
});
```

#### 2.3 Accept Call

```javascript
socket.emit("call_accepted", {
  callId: "call_id",
  initiatorId: "user_id_1",
});

socket.on("call_accepted", (data) => {
  console.log("Call accepted by recipient");
  // Start WebRTC negotiation
});
```

#### 2.4 Reject Call

```javascript
socket.emit("call_rejected", {
  callId: "call_id",
  initiatorId: "user_id_1",
  reason: "busy",
});
```

#### 2.5 WebRTC Offer

```javascript
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

socket.emit("webrtc_offer", {
  callId: "call_id",
  recipientId: "user_id_2",
  offer: offer,
});

socket.on("webrtc_offer", async (data) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer),
  );
});
```

#### 2.6 WebRTC Answer

```javascript
const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);

socket.emit("webrtc_answer", {
  callId: "call_id",
  initiatorId: "user_id_1",
  answer: answer,
});

socket.on("webrtc_answer", async (data) => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer),
  );
});
```

#### 2.7 ICE Candidates

```javascript
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit("webrtc_ice_candidate", {
      callId: "call_id",
      otherUserId: "user_id_2",
      candidate: event.candidate,
    });
  }
};

socket.on("webrtc_ice_candidate", async (data) => {
  await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
});
```

#### 2.8 End Call

```javascript
socket.emit("call_ended", {
  callId: "call_id",
  otherUserId: "user_id_2",
  duration: 120,
});

socket.on("call_ended", (data) => {
  console.log("Call ended:", data.duration);
});
```

---

## Frontend Testing

### 3. UI Components

#### 3.1 CallButton Component

**Location:** `frontend/src/components/calls/CallButton.jsx`

**Test Steps:**

1. Open a 1-to-1 chat
2. Locate call button in ChatHeader
3. Click to open call menu
4. Select "Audio Call" or "Video Call"
5. Verify call initiates

**Expected Behavior:**

- ✅ Menu opens on click
- ✅ Audio/Video options displayed
- ✅ Loading spinner shows during initiation
- ✅ Socket event emitted
- ✅ Call API endpoint called

#### 3.2 CallNotification Component

**Location:** `frontend/src/components/calls/CallNotification.jsx`

**Test Steps:**

1. User A initiates call to User B
2. User B should see full-screen notification
3. Verify caller name and avatar display
4. Click Accept - call should start
5. Click Reject - call should be rejected

**Expected Behavior:**

- ✅ Full-screen overlay appears
- ✅ Caller info displayed correctly
- ✅ Accept button starts call
- ✅ Reject button sends rejection
- ✅ Auto-reject after 30 seconds
- ✅ Ringing animation plays
- ✅ Socket events emitted on accept/reject

#### 3.3 CallWindow Component

**Location:** `frontend/src/components/calls/CallWindow.jsx`

**Test Steps:**

1. Accept an incoming call
2. Verify local video stream appears (PiP)
3. Verify remote video stream appears (main)
4. Test mute button - audio should toggle
5. Test video button - video should toggle
6. Test end call button - call should terminate
7. Test PiP button - window should minimize/restore
8. Check call duration timer - should increment

**Expected Behavior:**

- ✅ Local stream displays in corner
- ✅ Remote stream displays full-screen
- ✅ Audio/video toggles work
- ✅ Call duration timer increments
- ✅ Connection status displayed
- ✅ End call button terminates properly
- ✅ Cleanup happens on unmount
- ✅ WebRTC connection established

#### 3.4 CallHistory Component

**Location:** `frontend/src/components/calls/CallHistory.jsx`

**Test Steps:**

1. Complete several calls (accept, reject, miss)
2. Open call history component
3. Filter by "incoming", "outgoing", "missed"
4. Verify correct calls displayed
5. Check pagination works
6. Verify call duration formatted correctly

**Expected Behavior:**

- ✅ All calls displayed in list
- ✅ Filters work correctly
- ✅ Call icons correct (incoming/outgoing/missed)
- ✅ Duration formatted (e.g., "2m 30s")
- ✅ Dates formatted (e.g., "Today 10:30", "Yesterday")
- ✅ Pagination loads more calls
- ✅ User info displays correctly

---

## WebRTC Testing

### 4. Peer Connection Flow

#### 4.1 Test Local Stream

```javascript
const constraints = { audio: true, video: { width: 640, height: 480 } };
const stream = await navigator.mediaDevices.getUserMedia(constraints);

// Verify tracks
console.log("Audio tracks:", stream.getAudioTracks());
console.log("Video tracks:", stream.getVideoTracks());
```

**Expected:**

- ✅ At least 1 audio track
- ✅ At least 1 video track
- ✅ Tracks are enabled

#### 4.2 Test Peer Connection

```javascript
const pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});

// Add local stream
stream.getTracks().forEach((track) => {
  pc.addTrack(track, stream);
});

// Verify connection states
console.log("Connection state:", pc.connectionState);
console.log("ICE connection state:", pc.iceConnectionState);
console.log("ICE gathering state:", pc.iceGatheringState);
```

**Expected States:**

- ✅ Initial: "new", "new", "new"
- ✅ After offer: "connecting", "checking", "gathering/complete"
- ✅ After answer: "connected", "connected", "complete"

#### 4.3 Test SDP Negotiation

```javascript
const offer = await pc1.createOffer();
await pc1.setLocalDescription(offer);

await pc2.setRemoteDescription(offer);
const answer = await pc2.createAnswer();
await pc2.setLocalDescription(answer);

await pc1.setRemoteDescription(answer);
```

**Expected:**

- ✅ No errors thrown
- ✅ Connection states progress correctly
- ✅ Both sides have local & remote descriptions

#### 4.4 Test ICE Candidates

```javascript
let candidates = [];

pc1.onicecandidate = (event) => {
  if (event.candidate) {
    candidates.push(event.candidate);
    pc2.addIceCandidate(event.candidate);
  }
};
```

**Expected:**

- ✅ Multiple candidates gathered
- ✅ No errors adding candidates
- ✅ Connection eventually "connected"

---

## End-to-End Testing

### 5. Complete Call Flow

**Scenario A: Successful 1-to-1 Video Call**

**Setup:**

- User A and User B logged in on different browsers
- Both have microphone/camera permissions
- Socket connections active

**Test Steps:**

1. User A opens 1-to-1 chat with User B
2. User A clicks call button → selects "Video Call"
3. User B receives incoming call notification
4. User B clicks Accept
5. Both users' video streams appear
6. Users can see/hear each other
7. User A clicks End Call
8. Call terminates cleanly
9. Call appears in both users' history

**Expected Outcomes:**

- ✅ Call created in database with "ended" status
- ✅ Both users see call in history
- ✅ Duration recorded correctly
- ✅ No console errors
- ✅ Proper cleanup (streams stopped, connection closed)

**Scenario B: Incoming Call Rejection**

**Setup:** Same as Scenario A

**Test Steps:**

1. User A initiates call to User B
2. User B sees notification
3. User B clicks Reject
4. Call terminates
5. User B's history shows rejected call

**Expected Outcomes:**

- ✅ Call status = "rejected"
- ✅ Rejection reason recorded
- ✅ No streams started
- ✅ Notification closes

**Scenario C: Missed Call (No Answer)**

**Setup:** Same as Scenario A

**Test Steps:**

1. User A initiates call to User B
2. Wait 30+ seconds
3. Call auto-terminates
4. Both users see call in history

**Expected Outcomes:**

- ✅ Call status = "missed"
- ✅ No duration (or very short)
- ✅ Marked in both users' histories
- ✅ Notification disappeared

**Scenario D: Audio-Only Call**

**Setup:** Same as Scenario A

**Test Steps:**

1. User A initiates "Audio Call"
2. User B accepts
3. Verify no video streams
4. Only audio works
5. End call

**Expected Outcomes:**

- ✅ No video displayed
- ✅ Video toggle disabled/grayed out
- ✅ Audio works properly
- ✅ Call type recorded as "audio"

---

## Error Handling Testing

### 6. Permission Errors

#### 6.1 Camera Denied

**Steps:**

1. Deny camera permission
2. Try to initiate video call
3. Verify error message shown

**Expected:**

- ✅ Clear error message: "Camera permission denied"
- ✅ User can still make audio call
- ✅ No crash or hang

#### 6.2 Microphone Denied

**Steps:**

1. Deny microphone permission
2. Try to initiate any call

**Expected:**

- ✅ Clear error message displayed
- ✅ Call does not start
- ✅ Graceful error handling

#### 6.3 No Media Devices

**Steps:**

1. On system with no camera/mic
2. Try to initiate call

**Expected:**

- ✅ Error shown: "No media devices found"
- ✅ Fallback option (text chat)

### 7. Connection Errors

#### 7.1 Network Disconnect During Call

**Steps:**

1. Start active call
2. Disconnect internet
3. Observe behavior

**Expected:**

- ✅ Connection state changes to "disconnected"
- ✅ Auto-reconnection attempted
- ✅ User notified of connection issue
- ✅ Option to end call cleanly

#### 7.2 Peer Doesn't Accept SDP

**Steps:**

1. Start call with deliberate corruption
2. Monitor console

**Expected:**

- ✅ No crash
- ✅ Error logged
- ✅ Graceful timeout

---

## Performance Testing

### 8. Load Testing

#### 8.1 Multiple Concurrent Calls

**Steps:**

1. Create 5+ call records quickly
2. Monitor database
3. Check API response times

**Expected:**

- ✅ All calls created successfully
- ✅ Response time < 500ms per call
- ✅ No database locks

#### 8.2 Large Call History

**Steps:**

1. Create 100+ calls in database
2. Test pagination (first, middle, last pages)
3. Check response times

**Expected:**

- ✅ Pagination works smoothly
- ✅ Response time < 1s
- ✅ Filtering by status works
- ✅ Sorting by date works

#### 8.3 Long Duration Call

**Steps:**

1. Simulate call lasting 1+ hour
2. Monitor memory usage
3. Check for stream cleanup

**Expected:**

- ✅ No memory leaks
- ✅ Video quality maintained
- ✅ No connection drops
- ✅ Cleanup on end

---

## Browser Compatibility

### 9. Cross-Browser Testing

| Browser | Version | Status     | Notes              |
| ------- | ------- | ---------- | ------------------ |
| Chrome  | Latest  | ✅ PASS    | Full VP8 support   |
| Firefox | Latest  | ✅ PASS    | Full VP8 support   |
| Edge    | Latest  | ✅ PASS    | Full support       |
| Safari  | Latest  | ⚠️ LIMITED | H.264 only, no VP8 |

**Safari-specific tests:**

- ✅ Audio-only calls work
- ✅ Video may require H.264 codec fallback
- ✅ Permission requests different UI

---

## Checklist

- [ ] All 8 API endpoints return correct responses
- [ ] Socket events emit and receive properly
- [ ] CallButton initiates calls
- [ ] CallNotification displays for incoming calls
- [ ] CallWindow streams render correctly
- [ ] CallHistory shows past calls
- [ ] Audio/video toggles work
- [ ] Call duration tracked accurately
- [ ] Missed calls recorded
- [ ] Pagination works in call history
- [ ] Filters work (incoming/outgoing/missed)
- [ ] WebRTC connection established
- [ ] SDP offer/answer exchanged
- [ ] ICE candidates gathered
- [ ] Proper cleanup on disconnect
- [ ] Error messages clear and helpful
- [ ] Dark mode styling works
- [ ] No console errors
- [ ] Works on Chrome/Firefox/Edge
- [ ] Call persists in database
- [ ] Call stats calculated correctly

---

## Troubleshooting

### Issue: WebRTC Connection Stuck on "connecting"

**Solution:**

- Check STUN server accessibility
- Verify ICE candidates being gathered
- Check browser console for errors
- Ensure both peers send ICE candidates

### Issue: No Video Stream

**Solution:**

- Verify camera permission granted
- Check camera is not used by other app
- Try audio-only call first
- Restart browser

### Issue: No Audio

**Solution:**

- Verify microphone permission granted
- Check audio output device
- Restart browser
- Try on different device

### Issue: Call History Empty

**Solution:**

- Verify calls table has data
- Check pagination params
- Verify user ID correct
- Check date range filters

---

**Document Version:** 1.0  
**Last Updated:** June 2026  
**Status:** Complete
