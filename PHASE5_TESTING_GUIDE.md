# Phase 5: Notifications & File Sharing - Testing Guide

## Overview

This document provides comprehensive testing procedures for Phase 5 implementation (Notifications & File Sharing).

---

## Backend Setup

### Prerequisites

1. **Environment Variables (.env)**

   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

2. **Dependencies Installed**

   ```bash
   cd backend
   npm install
   ```

3. **MongoDB Connection**
   - Ensure MongoDB is running
   - Connection string configured in `.env`

4. **Server Running**
   ```bash
   npm start
   # Server should start on http://localhost:5000
   ```

---

## API Testing

### 1. Notification Endpoints

#### 1.1 Get All Notifications (Paginated)

**Endpoint:** `GET /api/notifications`

**Query Parameters:**

- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Test Case:**

```bash
curl -X GET http://localhost:5000/api/notifications?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userId": "user_id",
      "type": "new_message",
      "chatId": "chat_id",
      "messageId": "message_id",
      "triggerUserId": "trigger_user_id",
      "content": "User sent you a message",
      "read": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

#### 1.2 Get Unread Notifications

**Endpoint:** `GET /api/notifications/unread`

**Query Parameters:**

- `limit` (optional, default: 10)

**Test Case:**

```bash
curl -X GET http://localhost:5000/api/notifications/unread?limit=5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 1.3 Get Unread Count

**Endpoint:** `GET /api/notifications/unread-count`

**Test Case:**

```bash
curl -X GET http://localhost:5000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "unreadCount": 3
}
```

#### 1.4 Mark Notification as Read

**Endpoint:** `PUT /api/notifications/:id/read`

**Test Case:**

```bash
curl -X PUT http://localhost:5000/api/notifications/notification_id/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 1.5 Mark All Notifications as Read

**Endpoint:** `PUT /api/notifications/read-all`

**Test Case:**

```bash
curl -X PUT http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 1.6 Delete Notification

**Endpoint:** `DELETE /api/notifications/:id`

**Test Case:**

```bash
curl -X DELETE http://localhost:5000/api/notifications/notification_id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 1.7 Delete All Notifications

**Endpoint:** `DELETE /api/notifications`

**Test Case:**

```bash
curl -X DELETE http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. File Upload Endpoint

#### 2.1 Upload File

**Endpoint:** `POST /api/uploads/file`

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Field: `file` (binary file)

**Allowed File Types:**

- Images: JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX
- Max Size: 10MB

**Test Case (using curl):**

```bash
curl -X POST http://localhost:5000/api/uploads/file \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "delta-chat/...",
    "fileType": "image/jpeg",
    "fileName": "image.jpg",
    "fileSize": 204800
  }
}
```

**Error Response (File Too Large):**

```json
{
  "success": false,
  "message": "File size must not exceed 10MB"
}
```

**Error Response (Invalid Type):**

```json
{
  "success": false,
  "message": "File type not allowed"
}
```

---

## Socket.IO Events Testing

### 3. Notification Socket Events

#### 3.1 Setup Socket Connection

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

#### 3.2 Receive New Notification

**Event:** `new_notification`

**Test Steps:**

1. Connect two users via Socket
2. User 1 sends a message to User 2 in a chat
3. User 2's Socket should receive:

```javascript
socket.on("new_notification", (notification) => {
  console.log("New notification:", notification);
  // Expected: {
  //   type: "new_message",
  //   chatId: "...",
  //   messageId: "...",
  //   content: "...",
  //   triggerUserId: "...",
  //   timestamp: "2024-01-15T10:30:00Z"
  // }
});
```

#### 3.3 Send Notification via Socket

**Event:** `send_notification`

**Test Code:**

```javascript
socket.emit("send_notification", {
  userId: "recipient_user_id",
  type: "new_message",
  chatId: "chat_id",
  content: "You have a new message",
  messageId: "message_id",
});
```

#### 3.4 Send Chat Notification (Group Event)

**Event:** `send_chat_notification`

**Test Code:**

```javascript
socket.emit("send_chat_notification", {
  chatId: "group_chat_id",
  type: "member_added",
  content: "New member joined the group",
  userIds: ["user1_id", "user2_id", "user3_id"],
});
```

#### 3.5 Mark Notification as Read via Socket

**Event:** `notification_read`

**Test Code:**

```javascript
socket.emit("notification_read", "notification_id");

socket.on("notification_marked_read", (data) => {
  console.log("Notification marked as read:", data);
  // Expected: {
  //   notificationId: "...",
  //   readAt: "2024-01-15T10:30:00Z"
  // }
});
```

---

## Frontend Testing

### 4. UI Components

#### 4.1 NotificationBell Component

**Location:** `frontend/src/components/notifications/NotificationBell.jsx`

**Test Steps:**

1. Navigate to chat page
2. Locate NotificationBell icon in chat header
3. Verify unread count badge displays (0 initially)
4. Trigger a notification via API/Socket
5. Badge count should increase
6. Click bell icon to open dropdown
7. View notifications in dropdown
8. Click check icon to mark as read
9. Click X icon to delete notification

**Expected Behavior:**

- ✅ Badge shows unread count
- ✅ Dropdown opens/closes on click
- ✅ Notifications display with icons
- ✅ Timestamps shown (e.g., "5m ago")
- ✅ Mark as read removes from unread list
- ✅ Delete removes notification
- ✅ Real-time updates via Socket

#### 4.2 FileUploadButton Component

**Location:** `frontend/src/components/chat/FileUploadButton.jsx`

**Test Steps:**

1. Open a chat
2. Locate upload button in message input area
3. Click upload button
4. Select a valid file (JPG, PNG, PDF, DOCX)
5. Observe loading spinner during upload
6. Verify file preview appears in input area

**Expected Behavior:**

- ✅ File picker opens on click
- ✅ Loading state shows spinner
- ✅ File preview displays
- ✅ Error shown for invalid file types
- ✅ Error shown for files > 10MB
- ✅ Success message or preview on completion

#### 4.3 FilePreview Component

**Location:** `frontend/src/components/chat/FilePreview.jsx`

**Test Steps:**

1. Upload and send a message with image file
2. Verify image displays inline in message
3. Image should be clickable to open in new tab

**For PDF/Document:**

1. Upload and send PDF or DOCX file
2. Verify document icon and name display
3. File size shown in human-readable format (KB, MB)
4. Click to download file

**Expected Behavior:**

- ✅ Images display as thumbnails
- ✅ PDFs/Documents show with icon
- ✅ File size displayed correctly
- ✅ Download link works
- ✅ Styling matches theme (dark/light)

#### 4.4 SingleChat File Support

**Location:** `frontend/src/components/chat/SingleChat.jsx`

**Test Steps:**

1. Open a chat
2. Upload a file using FileUploadButton
3. Type optional message
4. Click Send
5. Message with file should appear in chat
6. File should be visible inline with message

**Expected Behavior:**

- ✅ File preview shows before sending
- ✅ Can remove file before sending
- ✅ Message sends with file attached
- ✅ File displays in message bubble
- ✅ File is downloadable in received messages

---

## Database Validation

### 5. Notification Collection

**Check Notification Records:**

```javascript
// Connect to MongoDB and run:
db.notifications.find().pretty();

// Expected document structure:
{
  "_id": ObjectId(...),
  "userId": ObjectId(...),
  "type": "new_message",
  "chatId": ObjectId(...),
  "messageId": ObjectId(...),
  "triggerUserId": ObjectId(...),
  "content": "User sent you a message",
  "read": false,
  "readAt": null,
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

**Check Indexes:**

```javascript
db.notifications.getIndexes();

// Should include:
// - userId + read + createdAt (compound index for fast queries)
```

### 6. Message Collection

**Check Message Records with Files:**

```javascript
db.messages.findOne({ fileUrl: { $exists: true } }).pretty();

// Expected document structure with file:
{
  "_id": ObjectId(...),
  "content": "Check this file",
  "sender": ObjectId(...),
  "chat": ObjectId(...),
  "fileUrl": "https://res.cloudinary.com/...",
  "fileType": "image/jpeg",
  "fileName": "screenshot.jpg",
  "fileSize": 204800,
  "readBy": [...],
  "isDeleted": false,
  "createdAt": ISODate(...),
  "updatedAt": ISODate(...)
}
```

---

## End-to-End Testing Scenario

### 7. Complete Workflow Test

**Scenario:** Two users exchange messages with files and notifications

**Steps:**

1. **Setup**
   - User A and User B logged in
   - Both connected to same chat
   - Both Socket connections active

2. **User A sends text message**
   - Message appears in both UIs immediately
   - Notification created for User B

3. **User B uploads file and sends**
   - FileUploadButton clicked
   - File selected and uploaded to Cloudinary
   - Preview shows before sending
   - Message sent with file attached
   - File displays in User A's UI

4. **Notification flow**
   - User A receives notification via Socket
   - NotificationBell badge increments
   - Notification appears in dropdown
   - User A clicks to mark as read
   - Badge count decrements

5. **File interaction**
   - User A downloads file from message
   - File opens successfully
   - File size matches original

**Expected Outcome:**

- ✅ All messages sync in real-time
- ✅ Files upload and display correctly
- ✅ Notifications created and delivered
- ✅ UI updates reflect all changes
- ✅ No errors in console

---

## Performance Testing

### 8. Load Testing Notifications

**Test:** Creating multiple notifications quickly

```bash
# Create 100 notifications rapidly
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/notifications \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "user_id",
      "type": "test",
      "content": "Test notification '$i'"
    }' &
done
wait
```

**Expected:**

- ✅ Response time < 500ms
- ✅ No duplicate entries
- ✅ All notifications stored

### 9. File Upload Performance

**Test:** Upload 50MB file (exceeds limit)

**Expected:**

- ✅ Rejected with error message
- ✅ No partial upload to Cloudinary
- ✅ Clear error message to user

**Test:** Upload 5MB file (within limit)

**Expected:**

- ✅ Upload completes < 10 seconds
- ✅ File URL returned
- ✅ Metadata correct

---

## Error Handling

### 10. Error Scenarios

#### 10.1 Unauthorized Access

```bash
curl http://localhost:5000/api/notifications
# Expected: 401 Unauthorized
```

#### 10.2 Invalid Notification ID

```bash
curl http://localhost:5000/api/notifications/invalid_id/read \
  -X PUT \
  -H "Authorization: Bearer TOKEN"
# Expected: 400 Bad Request or 404 Not Found
```

#### 10.3 File Upload Without Token

```bash
curl -X POST http://localhost:5000/api/uploads/file \
  -F "file=@image.jpg"
# Expected: 401 Unauthorized
```

#### 10.4 Missing Required Fields

```bash
curl -X POST http://localhost:5000/api/notifications \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 Bad Request
```

---

## Checklist

- [ ] All notification endpoints return 200 OK
- [ ] File upload endpoint accepts valid files
- [ ] Files rejected > 10MB
- [ ] Invalid file types rejected
- [ ] Socket events deliver in real-time
- [ ] NotificationBell displays correctly
- [ ] FileUploadButton works
- [ ] FilePreview renders images
- [ ] FilePreview renders documents
- [ ] Message file metadata saved correctly
- [ ] Database indexes present
- [ ] Dark mode styling works
- [ ] Error messages clear and helpful
- [ ] Performance acceptable (< 500ms responses)
- [ ] No console errors

---

## Troubleshooting

### Issue: Cloudinary Upload Fails

**Solution:**

- Verify credentials in .env
- Check file size < 10MB
- Ensure file type is allowed
- Check Cloudinary API limits

### Issue: Notifications Not Received

**Solution:**

- Verify Socket connected
- Check JWT token valid
- Verify userId in database
- Check Socket event listeners registered

### Issue: FilePreview Not Showing

**Solution:**

- Verify fileUrl is valid URL
- Check fileType matches expected types
- Inspect browser console for errors
- Verify CORS settings

### Issue: Badge Count Not Updating

**Solution:**

- Refresh browser
- Check Socket connection active
- Verify fetchUnreadCount called
- Check Store actions dispatched

---

## Documentation

For API documentation, see [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
For deployment guide, see [GETTING_STARTED.md](../GETTING_STARTED.md)
