# DELTA Phase 4 - Testing Guide

**Date**: May 28, 2026  
**Status**: Ready for Testing

---

## 🚀 Quick Start

### Prerequisites

1. Backend and Frontend running locally
2. MongoDB connection active
3. Two browser windows (test 1-to-1 & group chats)

### Start Backend

```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

### Start Frontend

```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:5173
```

---

## ✅ Test Cases

### Test 1: Create 1-to-1 Chat

**Steps**:

1. Sign up User A on Browser 1
2. Sign up User B on Browser 2
3. User A: Click sidebar, search for User B
4. User B appears in search results
5. Click User B to create chat
6. Verify chat appears in chat list

**Expected Result**:

- ✅ Chat created
- ✅ Both users see the chat
- ✅ Chat list shows user name
- ✅ Empty state shows "Start a conversation"

---

### Test 2: Send Message in Real-time

**Steps**:

1. Open 1-to-1 chat on both browsers
2. User A: Type message "Hello from User A"
3. User A: Click Send
4. Verify message appears on both screens instantly

**Expected Result**:

- ✅ Message sent successfully
- ✅ Message appears immediately on both screens
- ✅ Input field clears after send
- ✅ Message shows timestamp
- ✅ Blue color for sent, gray for received

**Socket Events Fired**:

- `send_message` event
- `receive_message` event
- `join_room` event (on chat select)

---

### Test 3: Typing Indicators

**Steps**:

1. Open 1-to-1 chat on both browsers
2. User A: Start typing in message input
3. Watch User B's screen
4. Verify "User A is typing..." appears
5. Wait 2+ seconds without typing
6. Verify indicator disappears

**Expected Result**:

- ✅ "User A is typing..." appears on User B
- ✅ Animated dots show activity
- ✅ Indicator auto-clears after 2 seconds
- ✅ Indicator clears on send

---

### Test 4: Message Timestamps & Dates

**Steps**:

1. Send multiple messages
2. Check timestamps on each message
3. Change system time (or wait for new date)
4. Send message on new date
5. Verify date separator appears

**Expected Result**:

- ✅ Each message shows time (HH:MM format)
- ✅ Date separators show between different days
- ✅ Separator shows: "Today", "Yesterday", or date

---

### Test 5: Create Group Chat

**Steps**:

1. User A: Click "Create Group" button
2. Enter group name: "Test Group"
3. Add User B and other users
4. Click Create Group
5. Verify group appears in chat list

**Expected Result**:

- ✅ Group created successfully
- ✅ Group shows in chat list
- ✅ Group name displays correctly
- ✅ Member count shows (3 members)

---

### Test 6: Group Messaging

**Steps**:

1. Send messages in group chat
2. Verify all members see messages
3. Check sender name appears above each message
4. Verify message color shows who sent it

**Expected Result**:

- ✅ All members receive messages in real-time
- ✅ Sender name shows for other users
- ✅ Own messages show in blue (right)
- ✅ Others' messages show in gray (left)

---

### Test 7: Read Receipts

**Steps**:

1. User A sends message to User B
2. User A: Check message for checkmark
3. User B: Open chat (message appears)
4. User A: Verify checkmark changes to double ✓✓
5. User B: Send message back
6. User A: Verify double checkmark on User B's message

**Expected Result**:

- ✅ Single ✓ when sent
- ✅ Double ✓✓ when recipient opens
- ✅ Read receipt shows for all messages
- ✅ Updates in real-time

**Socket Events**:

- `mark_as_read` event
- `message_read` event

---

### Test 8: Edit Message

**Steps**:

1. User A: Send a message
2. User A: Click message (or right-click - UI dependent)
3. Edit the message content
4. Submit edit
5. Verify "(edited)" indicator appears
6. Verify message content updated on both screens

**Expected Result**:

- ✅ Message content updated
- ✅ "(edited)" indicator shows on message
- ✅ Other user sees update in real-time
- ✅ Edit only allowed within 5 minutes
- ✅ Only sender can edit

**Socket Events**:

- `edit_message` event
- `message_edited` event

---

### Test 9: Delete Message

**Steps**:

1. User A: Send a message
2. User A: Click delete button on message
3. Confirm deletion
4. Verify "This message was deleted" shows
5. Verify deletion appears on both screens

**Expected Result**:

- ✅ Message marked as deleted
- ✅ Shows "This message was deleted"
- ✅ Other user sees deletion in real-time
- ✅ Only sender can delete own messages

**Socket Events**:

- `delete_message` event
- `message_deleted` event

---

### Test 10: Update Group Modal

**Steps**:

1. Open group chat as admin
2. Click group name or options menu
3. Click "Edit Group"
4. UpdateGroupModal should open
5. Verify two tabs: "Info" and "Members"

**Test 10a: Edit Group Info** (Admin Only)

- Change group name
- Update description
- Click Save
- Verify changes applied

**Test 10b: Manage Members**

- View all members
- Admin badge shows on admins
- Promote a member to admin (Shield button)
- Remove a member (Trash button)
- Verify changes applied

**Test 10c: Leave/Delete**

- Click "Leave Group"
- Confirm action
- Verify user removed from group
- (Admin) Click "Delete Group"
- Confirm action
- Verify group deleted

**Expected Result**:

- ✅ Only admin can edit group info
- ✅ Only admin can manage members
- ✅ Any user can leave
- ✅ Confirmation dialogs work
- ✅ Changes update in real-time

---

### Test 11: Online Status in Chat

**Steps**:

1. Open 1-to-1 chat
2. Check chat header for status
3. User B: Go offline (close browser or logout)
4. Verify status changes to "Offline"
5. User B: Come back online
6. Verify status changes to "Active now"

**Expected Result**:

- ✅ Chat header shows online status
- ✅ Updates in real-time
- ✅ Shows "Active now" or "Offline"

---

### Test 12: Multiple Message Load

**Steps**:

1. Send 60+ messages in a chat
2. Scroll up to load earlier messages
3. Verify messages load in chunks
4. Check pagination works (50 per load)

**Expected Result**:

- ✅ Initial load: 50 messages
- ✅ Scroll up loads previous messages
- ✅ No lag or freezing
- ✅ Proper chronological order

---

### Test 13: Socket Reconnection

**Steps**:

1. Open chat and send a message
2. Disconnect internet (or close socket)
3. Wait a few seconds
4. Reconnect internet
5. Send another message
6. Verify message sends successfully

**Expected Result**:

- ✅ Socket reconnects automatically
- ✅ New messages send after reconnect
- ✅ No data loss
- ✅ User informed of connection status

---

### Test 14: Error Handling

**Test 14a: Invalid Message Content**

- Try to send empty message
- Button should be disabled
- Verify no network request

**Test 14b: Chat Not Found**

- Manually edit URL to invalid chat ID
- Verify proper error message
- Verify redirect or error handling

**Test 14c: Unauthorized Access**

- Try to access chat you're not member of
- Verify 403 error from backend
- Verify proper error display

**Expected Result**:

- ✅ Input validation on client
- ✅ Server validation on requests
- ✅ User-friendly error messages
- ✅ No data exposure in errors

---

### Test 15: Dark Mode

**Steps**:

1. Open chat interface
2. Toggle dark mode (if available)
3. Verify all chat components display correctly
4. Check message bubbles, modals, buttons

**Expected Result**:

- ✅ All elements visible in dark mode
- ✅ Proper contrast for readability
- ✅ Colors appropriate for dark theme
- ✅ Modal backgrounds visible

---

## 🐛 Common Issues & Debugging

### Issue: Messages not appearing in real-time

**Debug Steps**:

1. Open browser DevTools → Console
2. Check for Socket.IO errors
3. Verify socket connection: Look for "Socket connected" log
4. Check Network tab for Socket.IO frames
5. Verify chat room join: Look for "User joined chat room" log

**Common Causes**:

- Socket not connected
- Wrong chat room ID
- Network issue
- Backend Socket events not firing

---

### Issue: Typing indicator not showing

**Debug Steps**:

1. Check browser console
2. Look for "User is typing" event
3. Verify message input is being typed
4. Check if typing timeout is working (2 sec)

**Common Causes**:

- typing event not emitting
- Event not reaching other user
- Typing timeout cleared too early

---

### Issue: Read receipts not updating

**Debug Steps**:

1. Send a message
2. Check Socket events in Network tab
3. Look for `mark_as_read` event
4. Look for `message_read` event on recipient

**Common Causes**:

- Mark as read event not emitting
- Socket event broadcast failing
- Store not updating

---

### Issue: Group chat not showing all messages

**Debug Steps**:

1. Check if user is member of group
2. Verify chat ID is correct
3. Check pagination: Are you at the top?
4. Load more messages by scrolling up

**Common Causes**:

- User added to group after some messages sent
- Pagination limit reached
- Need to scroll up to load more

---

## 📊 Socket Events to Monitor

Use browser DevTools → Network → WS to see:

**Chat Events**:

- `join_room` - User joins chat
- `send_message` - Message sent
- `receive_message` - Message received
- `edit_message` - Edit event sent
- `message_edited` - Edit broadcast
- `delete_message` - Delete event sent
- `message_deleted` - Delete broadcast

**Typing Events**:

- `typing` - User typing
- `user_typing` - Typing broadcast
- `stop_typing` - Stop typing
- `user_stopped_typing` - Stop broadcast

**Read Events**:

- `mark_as_read` - Mark read event
- `message_read` - Read receipt
- `mark_chat_as_read` - Bulk mark
- `chat_read` - Bulk read broadcast

---

## ✨ Quality Checklist

After testing, verify:

- [ ] All Socket events fire correctly
- [ ] Messages appear in real-time
- [ ] Typing indicators work
- [ ] Read receipts update
- [ ] Group management works (admin)
- [ ] Error handling works
- [ ] Dark mode displays correctly
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No memory leaks

---

## 🎯 Success Criteria

Phase 4 testing is successful if:

✅ All 15 test cases pass  
✅ No console errors  
✅ Real-time messaging works  
✅ Socket connections stable  
✅ UI responsive & clean  
✅ Dark mode works  
✅ Group management works  
✅ Error handling user-friendly

---

## 📝 Notes for Developers

1. **Test with multiple users**: Open 2+ browser windows
2. **Monitor Network tab**: Watch Socket.IO frames
3. **Check Console**: Look for any errors or warnings
4. **Test edge cases**: Empty chat, many users, etc.
5. **Test on mobile**: Use DevTools device emulation
6. **Test different networks**: Try online/offline
