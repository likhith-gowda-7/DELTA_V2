# PHASE 7 GROUP CALLS - TESTING GUIDE

## Overview

This guide provides comprehensive testing procedures for Phase 7 Group Calls implementation. Tests cover group call initiation, multi-peer connections, WebRTC signaling, media controls, screen sharing, recording, and error scenarios.

---

## PART 1: GROUP CALL INITIATION TESTING

### Test 1.1: Start Audio Group Call from Group Chat

**Objective:** Verify group call can be initiated with audio-only media type

**Prerequisites:**

- Backend server running on http://localhost:5000
- Frontend server running on http://localhost:5173
- User logged in with valid credentials
- User is member of at least 3-person group chat

**Steps:**

1. Navigate to ChatPage
2. Select a group chat with 3+ members
3. Locate blue call button with Users icon in ChatHeader
4. Click the call button to open call menu
5. Click "Audio Group Call" option
6. Wait for GroupCallWindow to appear

**Expected Results:**

- ✅ GroupCallWindow opens in full screen with black background
- ✅ Header shows "Group Call" and connection count
- ✅ ParticipantGrid displays local video (bottom-left or first position)
- ✅ Call state updated in useCallStore
- ✅ Socket event group_call_initiated sent to participants
- ✅ Backend creates Call record with isGroupCall=true
- ✅ No errors in console

**Pass Criteria:**
All expected results visible and no console errors

---

### Test 1.2: Start Video Group Call from Group Chat

**Objective:** Verify group call can be initiated with audio-video media type

**Prerequisites:**

- Same as Test 1.1
- Browser camera/microphone permissions granted

**Steps:**

1. Follow steps 1-5 from Test 1.1
2. Click "Video Group Call" option instead
3. Allow browser camera/microphone permissions if prompted
4. Wait for media stream to load (2-3 seconds)

**Expected Results:**

- ✅ GroupCallWindow opens with video stream
- ✅ Local camera feed visible in grid
- ✅ Video toggle button shows video is enabled
- ✅ Audio toggle button shows audio is enabled
- ✅ Remote participant slots ready for incoming streams

**Pass Criteria:**
Local video stream displays and all controls are functional

---

### Test 1.3: Incoming Group Call Notification

**Objective:** Verify participants receive notification when group call is initiated

**Prerequisites:**

- Two browser windows open (User A and User B in same group chat)
- User A is call initiator
- User B is participant

**Steps (User A):**

1. Select group chat with User B
2. Click group call button → select "Video Group Call"
3. Wait for GroupCallWindow to appear

**Steps (User B):**

1. Observe ChatPage for incoming call notification
2. Notification should appear as full-screen modal overlay

**Expected Results:**

- ✅ User A sees GroupCallWindow with their local video
- ✅ User B receives CallNotification (incoming call modal)
- ✅ Notification shows "Incoming Group Call" or similar
- ✅ User B can accept or reject the call
- ✅ If accepted, GroupCallWindow opens for User B

**Pass Criteria:**
Notification appears and call can be accepted/rejected

---

## PART 2: MULTI-PEER CONNECTION TESTING

### Test 2.1: Two-Participant Video Grid

**Objective:** Verify video grid correctly displays 2 participants (1 local + 1 remote)

**Prerequisites:**

- Two users in active group call (Test 1.3 completed, call accepted)
- Both have video enabled

**Steps:**

1. Both users accept group call and wait for connection
2. Observe video grid in both windows
3. Each user should see 2 video feeds: their own + remote

**Expected Results:**

- ✅ Grid layout is 2-column (2x1 for 2 participants)
- ✅ Local video on left, remote video on right
- ✅ Both videos show correct participants
- ✅ Labels show "You (Local)" and "Participant 2"
- ✅ No black/frozen video feeds

**Pass Criteria:**
Both video feeds display correctly with proper layout

---

### Test 2.2: Three-Participant Video Grid

**Objective:** Verify video grid correctly displays 3 participants

**Prerequisites:**

- Three users in active group call
- All have video enabled

**Steps:**

1. All three users accept group call
2. Wait for all peer connections to establish
3. Observe grid layout in all three windows

**Expected Results:**

- ✅ Grid layout is 2x2 (4 slots for 3 participants + 1 empty)
- ✅ Each user sees their local video + 2 remote videos
- ✅ All videos synchronized and not lagging
- ✅ Empty grid slot visible (placeholder)

**Pass Criteria:**
Grid layout adjusts correctly and all 3 video feeds visible in each window

---

### Test 2.3: Four-Participant Video Grid

**Objective:** Verify video grid correctly displays 4 participants

**Prerequisites:**

- Four users in active group call
- All have video enabled

**Steps:**

1. All four users accept group call
2. Wait for all peer connections to establish
3. Observe grid layout in all windows

**Expected Results:**

- ✅ Grid layout is 2x2 (4 slots for 4 participants)
- ✅ Each user sees their local video + 3 remote videos
- ✅ No empty slots
- ✅ All videos displaying smoothly

**Pass Criteria:**
4-participant grid displays correctly without lag

---

### Test 2.4: Connection State Indicators

**Objective:** Verify connection state is tracked and displayed correctly

**Prerequisites:**

- Two-participant active group call

**Steps:**

1. Enable stats display by clicking "Stats" button in header
2. Observe connection state indicators in each video feed
3. Indicators should show connection quality
4. Disable stats by clicking "Hide" button

**Expected Results:**

- ✅ Stats toggle works (Show/Hide button)
- ✅ Connection indicators display (green/yellow/red)
- ✅ States include: Good, Connecting, Disconnected, Failed
- ✅ Stats can be toggled without affecting call quality

**Pass Criteria:**
Stats display toggles correctly and shows connection state

---

## PART 3: WEBRTC SIGNALING TESTING

### Test 3.1: Offer/Answer Exchange

**Objective:** Verify SDP offers and answers are exchanged correctly

**Prerequisites:**

- Two users ready to start group call
- Browser DevTools open to view Socket.IO events

**Steps:**

1. Open DevTools Network tab → WebSocket filter
2. Start group call between two users
3. Observe WebSocket frames for group_webrtc_offer and group_webrtc_answer events
4. Check event payloads contain SDP descriptions

**Expected Results:**

- ✅ group_webrtc_offer events sent from call initiator
- ✅ group_webrtc_answer events sent from recipient
- ✅ Offers contain SDP with video/audio codec info
- ✅ Answers contain corresponding SDP
- ✅ All offers/answers match peer IDs correctly
- ✅ No SDP transmission errors

**Pass Criteria:**
Offers and answers exchanged successfully via Socket.IO

---

### Test 3.2: ICE Candidate Exchange

**Objective:** Verify ICE candidates are exchanged for NAT traversal

**Prerequisites:**

- Two users in active group call
- Browser DevTools WebSocket monitoring active

**Steps:**

1. Monitor WebSocket for group_webrtc_ice_candidate events
2. Watch for multiple candidate exchanges during connection setup
3. Each peer should receive candidates from remote peer
4. Call connection should establish after candidate exchange

**Expected Results:**

- ✅ Multiple group_webrtc_ice_candidate events logged
- ✅ Candidates contain IP, port, and connection info
- ✅ Both host and srflx candidates sent (if applicable)
- ✅ Call connects within 5-10 seconds
- ✅ Video/audio flows once connected

**Pass Criteria:**
ICE candidates exchanged and connection established

---

### Test 3.3: Error Handling - Missing Peer Connection

**Objective:** Verify system handles missing peer connection gracefully

**Prerequisites:**

- Group call active with 2+ participants

**Steps:**

1. Inject error: modify peerConnectionsRef in DevTools console
2. Delete one peer connection manually
3. Trigger another signaling event (e.g., add participant)
4. Observe error handling

**Expected Results:**

- ✅ Error caught and logged to console (not thrown)
- ✅ Call continues with remaining participants
- ✅ UI doesn't crash
- ✅ Warning message appears (optional)

**Pass Criteria:**
System handles missing connections gracefully without UI crash

---

## PART 4: AUDIO/VIDEO CONTROLS TESTING

### Test 4.1: Mute/Unmute Audio

**Objective:** Verify audio toggle works and remote users see status change

**Prerequisites:**

- Two-participant active group call with audio enabled
- Audio input device working

**Steps:**

1. User A observes their microphone icon (should be active/green)
2. User A clicks mute button (Mic icon)
3. Mute button changes to show muted state (MicOff icon)
4. User A speaks into microphone
5. User B should not hear audio from User A
6. User A clicks mute button again to unmute
7. User A speaks and User B should hear audio again

**Expected Results:**

- ✅ Mute button toggles between Mic and MicOff icons
- ✅ Audio tracks disabled when muted
- ✅ Remote user cannot hear muted user
- ✅ Audio restored when unmuted
- ✅ Button state synced with actual audio state

**Pass Criteria:**
Audio toggle works and remote users see status correctly

---

### Test 4.2: Stop/Start Video

**Objective:** Verify video toggle works and remote users see status change

**Prerequisites:**

- Two-participant active group call with video enabled

**Steps:**

1. User A observes their video feed (should be visible)
2. User A clicks video toggle button (Video icon)
3. Video button changes to show disabled state (VideoOff icon)
4. User A's video disappears from User B's grid
5. User A clicks video toggle again
6. Video feed resumes in User B's window

**Expected Results:**

- ✅ Video button toggles between Video and VideoOff icons
- ✅ Video track disabled when stopped
- ✅ Remote user sees black/frozen frame when video off
- ✅ Video stream restored when re-enabled
- ✅ Connection remains active during video toggle

**Pass Criteria:**
Video toggle works and remote users see status correctly

---

### Test 4.3: Multiple Audio/Video Toggles

**Objective:** Verify rapid audio/video toggles don't cause issues

**Prerequisites:**

- Two-participant active group call

**Steps:**

1. Rapidly click mute button 5 times (on/off/on/off/on)
2. Wait 2 seconds
3. Rapidly click video button 5 times
4. Observe call stability during toggles

**Expected Results:**

- ✅ All toggles respond immediately
- ✅ No lag or delay in button response
- ✅ Audio/video state synchronized correctly
- ✅ Call remains stable throughout
- ✅ No errors in console

**Pass Criteria:**
Multiple rapid toggles work without errors

---

## PART 5: SCREEN SHARING TESTING

### Test 5.1: Start Screen Share

**Objective:** Verify screen sharing can be initiated and displays correctly

**Prerequisites:**

- Two-participant active group call with video enabled
- User A has multiple screens/windows available

**Steps:**

1. User A clicks screen share button (Share2 icon)
2. Browser displays screen/window selection dialog
3. User A selects screen or window to share
4. Click "Share" button in browser dialog
5. Wait for screen to display in video grid (2-3 seconds)
6. User B should see User A's screen instead of camera

**Expected Results:**

- ✅ Screen selection dialog appears
- ✅ Screen/window choices are available
- ✅ Screen share starts after selection
- ✅ Screen appears in place of camera feed
- ✅ Screen share button changes visual state (purple/highlighted)
- ✅ User B sees the shared screen

**Pass Criteria:**
Screen sharing initiates and displays correctly to remote user

---

### Test 5.2: Stop Screen Share

**Objective:** Verify screen sharing can be stopped and camera resumes

**Prerequisites:**

- User A currently screen sharing in active call
- User B can see the shared screen

**Steps:**

1. User A clicks screen share button again (or Stop button)
2. Wait for video stream to switch back to camera (2-3 seconds)
3. Camera feed should resume in User A's grid position
4. User B should see User A's camera again

**Expected Results:**

- ✅ Screen share stops immediately or within 3 seconds
- ✅ Camera feed resumes in video grid
- ✅ User B sees camera feed instead of screen
- ✅ Screen share button returns to normal state
- ✅ No lag or frozen frames during transition

**Pass Criteria:**
Screen sharing stops and camera resumes correctly

---

### Test 5.3: Stop Screen Share via Browser UI

**Objective:** Verify stopping screen share from browser UI works

**Prerequisites:**

- User A sharing screen in active call
- Browser showing "Stop sharing" button

**Steps:**

1. User A clicks "Stop sharing" button in browser UI (not app button)
2. Wait for video to switch back to camera
3. Observe that app is notified of screen share stop
4. Check that app button state updates to "not sharing"

**Expected Results:**

- ✅ Screen share stops from browser UI
- ✅ Camera resumes automatically
- ✅ App button state updates (no manual click needed)
- ✅ User B sees camera feed again
- ✅ No error messages

**Pass Criteria:**
Browser stop button triggers app cleanup correctly

---

## PART 6: RECORDING TESTING

### Test 6.1: Start Recording

**Objective:** Verify call recording can be initiated

**Prerequisites:**

- Two-participant active group call with audio and video
- Browser supports MediaRecorder API

**Steps:**

1. Click recording button (Record icon) in controls
2. Recording button should change appearance (red/highlighted)
3. Recording should begin capturing audio and video
4. Speak in microphone and move on camera

**Expected Results:**

- ✅ Recording button changes state (visual feedback)
- ✅ Recording duration timer starts or recording state visible
- ✅ Recording captures audio from all participants
- ✅ Recording captures video streams
- ✅ No errors in console
- ✅ Performance unaffected by recording

**Pass Criteria:**
Recording starts successfully with no performance impact

---

### Test 6.2: Stop Recording and Save File

**Objective:** Verify recording stops and file is saved/downloaded

**Prerequisites:**

- Recording is active for 10+ seconds
- At least 2 participants with audio and video

**Steps:**

1. Click recording button again to stop
2. Wait for file to be processed (3-5 seconds)
3. File download should start automatically or prompt
4. File should be named something like "recording-[timestamp].webm"
5. Check Downloads folder for file

**Expected Results:**

- ✅ Recording button returns to normal state
- ✅ File download initiated automatically
- ✅ File size > 5MB (indicates real content)
- ✅ File format is .webm or .mp4
- ✅ File can be opened in video player
- ✅ Recording contains audio and video content

**Pass Criteria:**
Recording file saved and playable

---

### Test 6.3: Recorded File Playback

**Objective:** Verify recorded file can be played back correctly

**Prerequisites:**

- Recording file downloaded from Test 6.2

**Steps:**

1. Open saved recording file in video player
2. Play video and listen to audio
3. Verify you can see both participants (audio and video)
4. Seek to different timestamps
5. Pause and resume playback

**Expected Results:**

- ✅ File plays without errors
- ✅ Both audio and video tracks present
- ✅ Audio from multiple participants audible
- ✅ Video shows both participants' feeds or screen share
- ✅ Duration > 10 seconds
- ✅ Seeking works smoothly
- ✅ Pause/resume works

**Pass Criteria:**
Recorded file plays correctly with full content

---

## PART 7: PARTICIPANT MANAGEMENT TESTING

### Test 7.1: Add Participant via Modal

**Objective:** Verify new participant can be added to active group call

**Prerequisites:**

- Two-participant group call active
- Third user is member of chat but not in call
- Third user's browser ready to join

**Steps (Participant in Call):**

1. Click "Add Participant" button (Users icon in controls)
2. AddParticipantModal should appear
3. Search for the third user by name
4. Click checkbox to select them
5. Click "Add" button

**Steps (Third User):**

1. Wait for incoming group call notification
2. Accept the call
3. Wait for connection to establish

**Expected Results:**

- ✅ Modal appears with list of available members
- ✅ Search filters members correctly
- ✅ Checkbox selection works
- ✅ "Add" button shows selected count
- ✅ Third user receives incoming call notification
- ✅ Third user's video appears in grid after accepting
- ✅ All three video feeds visible to each participant
- ✅ No errors in console

**Pass Criteria:**
New participant added successfully and visible in grid

---

### Test 7.2: Search Participants in Add Modal

**Objective:** Verify search functionality in add participant modal

**Prerequisites:**

- Add Participant modal open
- Multiple members available in chat

**Steps:**

1. Type member name in search box (e.g., "john")
2. List should filter to matching members
3. Clear search box
4. All members should reappear
5. Try partial search (e.g., "jo")
6. Should filter correctly

**Expected Results:**

- ✅ Search filters members by name
- ✅ Partial matches work correctly
- ✅ Case-insensitive search
- ✅ Clearing search shows all members again
- ✅ No lag in search response
- ✅ Empty state message if no matches

**Pass Criteria:**
Search works correctly with various inputs

---

### Test 7.3: Multi-Select and Add Multiple Participants

**Objective:** Verify multiple participants can be added in one action

**Prerequisites:**

- Add Participant modal open
- At least 2 available participants

**Steps:**

1. Click checkbox for first available member
2. Click checkbox for second available member
3. Modal should show "2 participants selected"
4. Click "Add" button
5. Wait for both participants to receive notifications
6. Both accept the calls

**Expected Results:**

- ✅ Multiple checkboxes can be selected
- ✅ Count updates as selections change
- ✅ Both participants receive incoming call notifications
- ✅ Both can accept and join call
- ✅ Grid expands to show all 4 participants
- ✅ No errors during multi-add

**Pass Criteria:**
Multiple participants added simultaneously without errors

---

## PART 8: CALL MANAGEMENT TESTING

### Test 8.1: End Group Call

**Objective:** Verify group call can be ended and call is terminated for all

**Prerequisites:**

- Three-participant active group call
- All participants connected with video/audio

**Steps:**

1. One participant clicks End Call button (Phone icon, red)
2. Wait for call to end
3. Observe in all three windows

**Expected Results:**

- ✅ GroupCallWindow closes in ending participant's window
- ✅ Chat window returns to view
- ✅ Other participants' windows show incoming call notification or connection lost
- ✅ Call duration recorded correctly
- ✅ Call record updated in database
- ✅ No lingering peer connections

**Pass Criteria:**
Call ends cleanly and all participants disconnected

---

### Test 8.2: Call Duration Tracking

**Objective:** Verify call duration is tracked and displayed correctly

**Prerequisites:**

- Start a two-participant group call

**Steps:**

1. Note the start time (MM:SS format in header)
2. Wait 1 minute
3. Check duration has increased to approximately 01:00
4. Wait another 30 seconds
5. Check duration shows approximately 01:30
6. End call and verify total duration in database

**Expected Results:**

- ✅ Duration timer starts at 00:00
- ✅ Timer increments every second
- ✅ Format is MM:SS (00:00 to 99:59)
- ✅ Timer is accurate (within 1 second)
- ✅ Final duration stored in database
- ✅ Duration matches actual call length

**Pass Criteria:**
Duration tracked accurately throughout call

---

## PART 9: ERROR HANDLING & EDGE CASES

### Test 9.1: Media Permission Denied

**Objective:** Verify app handles camera/microphone permission denial

**Prerequisites:**

- Group call initiated but media permission not granted yet

**Steps:**

1. Attempt to start group call
2. Browser prompts for camera/microphone permissions
3. Click "Block" or "Deny" button
4. Observe error handling

**Expected Results:**

- ✅ Error message displayed to user
- ✅ Error clearly indicates permission was denied
- ✅ GroupCallWindow doesn't open with black screens
- ✅ User can retry permission request
- ✅ App doesn't crash

**Pass Criteria:**
Permission denial handled gracefully with user-friendly error

---

### Test 9.2: Connection Lost During Call

**Objective:** Verify app handles connection loss to remote peer

**Prerequisites:**

- Three-participant active group call

**Steps:**

1. Simulate network interruption:
   - Disconnect internet for 5-10 seconds
   - Or use DevTools to throttle network severely
2. Observe what happens to call
3. Restore network connection
4. Observe reconnection attempt

**Expected Results:**

- ✅ Loss of connection detected (state changes to "disconnected")
- ✅ Video feed freezes or shows last frame
- ✅ Connection state indicator shows "Disconnected"
- ✅ App remains responsive
- ✅ Call doesn't immediately end
- ✅ When network restored, reconnection attempted
- ✅ Video/audio resumes if connection restored quickly

**Pass Criteria:**
Connection loss handled gracefully without crash

---

### Test 9.3: WebRTC Connection Failure

**Objective:** Verify app handles WebRTC connection failure

**Prerequisites:**

- Attempting to establish group call
- Network blocking WebRTC ports

**Steps:**

1. Use firewall or DevTools to block WebRTC traffic
2. Attempt to start group call
3. Wait 30+ seconds for connection timeout
4. Observe error handling

**Expected Results:**

- ✅ Connection state shows "failed"
- ✅ Video feed remains black
- ✅ Error message or warning appears
- ✅ User can end call and retry
- ✅ App doesn't crash
- ✅ Other features (chat, etc.) still work

**Pass Criteria:**
WebRTC failure handled without crashing app

---

### Test 9.4: Browser Tab Closed During Call

**Objective:** Verify cleanup when participant closes browser tab

**Prerequisites:**

- Two-participant active group call

**Steps:**

1. User A has call active
2. User A closes the browser tab (Cmd+W or Ctrl+W)
3. Observe in User B's window

**Expected Results:**

- ✅ All media streams stop
- ✅ Peer connection closes
- ✅ User B's window detects disconnect (within 10 seconds)
- ✅ User B's connection state changes to "disconnected"
- ✅ User B can end call manually
- ✅ No memory leaks or hanging connections

**Pass Criteria:**
Tab closure properly cleans up resources

---

## PART 10: PERFORMANCE TESTING

### Test 10.1: 2-Participant Call Performance

**Objective:** Verify 2-participant call runs smoothly

**Prerequisites:**

- Two users starting group call

**Steps:**

1. Open DevTools Performance tab
2. Start recording performance
3. Initiate group call
4. Wait for connection and record for 30 seconds
5. Stop recording and analyze metrics

**Expected Results:**

- ✅ FPS stays above 30 (smooth video)
- ✅ CPU usage < 40% per participant
- ✅ Memory usage < 150 MB
- ✅ No dropped frames in video
- ✅ Audio remains clear without distortion

**Pass Criteria:**
Performance metrics within acceptable range for 2 participants

---

### Test 10.2: 4-Participant Call Performance

**Objective:** Verify 4-participant call performance

**Prerequisites:**

- Four users in group call

**Steps:**

1. Same as Test 10.1
2. Compare metrics for 4 participants vs 2

**Expected Results:**

- ✅ FPS stays above 24 (acceptable for 4 participants)
- ✅ CPU usage < 60% per participant
- ✅ Memory usage < 250 MB
- ✅ No significant latency increase
- ✅ Audio remains clear

**Pass Criteria:**
Performance acceptable for 4-participant call

---

### Test 10.3: Memory Leak Check

**Objective:** Verify no memory leaks during long calls

**Prerequisites:**

- Ability to run call for 10+ minutes

**Steps:**

1. Take memory snapshot at start of call
2. Run call for 10 minutes with active video/audio
3. Take second memory snapshot
4. Analyze memory growth

**Expected Results:**

- ✅ Memory growth < 50 MB over 10 minutes
- ✅ No accumulation of unused objects
- ✅ Detached DOM nodes < 100
- ✅ Event listeners properly cleaned up
- ✅ Peer connections properly closed

**Pass Criteria:**
No significant memory leaks detected

---

## Test Summary Template

```
Test Case: [Test Name]
Date: [Date]
Tester: [Name]
Status: ✅ PASS / ❌ FAIL

Expected Results:
- [Expected 1]
- [Expected 2]

Actual Results:
- [Actual 1]
- [Actual 2]

Issues Found:
- [Issue 1]
- [Issue 2]

Notes:
[Any additional observations]
```

---

## Regression Testing Checklist

After any code changes, verify:

- [ ] 1-to-1 calls still work (Phase 6)
- [ ] Call history still displays correctly
- [ ] Missed call notifications still work
- [ ] Group calls initiate without errors
- [ ] Multi-peer connections establish
- [ ] Audio/video toggles work
- [ ] Screen sharing functions
- [ ] Recording saves files
- [ ] No new console errors
- [ ] No memory leaks
- [ ] UI remains responsive

---

## Reporting Issues

When reporting test failures, include:

1. Test case ID (e.g., 2.1, 5.3)
2. Expected vs actual behavior
3. Steps to reproduce
4. Browser and OS information
5. Console errors (if any)
6. Network conditions (if relevant)
7. Screenshots or video recording

---

## Test Coverage Summary

- **Initiation**: 3 tests
- **Multi-Peer**: 4 tests
- **Signaling**: 3 tests
- **Audio/Video**: 3 tests
- **Screen Sharing**: 3 tests
- **Recording**: 3 tests
- **Participant Management**: 3 tests
- **Call Management**: 2 tests
- **Error Handling**: 4 tests
- **Performance**: 3 tests

**Total: 31 test cases covering all major features**

---

## Test Environment Setup

### Recommended Setup

- 3-4 computers or virtual machines
- Each with Chrome/Firefox latest version
- All connected to same network
- STUN servers accessible (Google STUN: stun.l.google.com:19302)
- MongoDB running and accessible
- Backend server running on port 5000
- Frontend running on port 5173

### Alternative (Single Machine)

- Use different browser tabs for each "participant"
- Use browser profiles (Chrome) to simulate different users
- Use Virtual Machines for more isolation

### Optional

- Network simulation (DevTools Network tab)
- WebRTC debugging extension
- Browser console for monitoring logs
- Performance monitoring tools

---

## Known Issues & Workarounds

1. **Screen sharing fails on Firefox**: Use Chrome for testing screen share
2. **ICE candidates timeout**: Check firewall is not blocking STUN ports
3. **Audio echo**: Ensure test environment has separate audio devices or headphones
4. **Grid layout overflow**: Maximum 6 participants recommended for mesh topology

---

## Future Test Enhancements

1. Automated test suite with Cypress/Playwright
2. Load testing with 10+ participants (SFU required)
3. Cross-browser compatibility testing
4. Mobile device testing
5. Accessibility testing (A11y)
6. Security testing (CORS, auth validation)
