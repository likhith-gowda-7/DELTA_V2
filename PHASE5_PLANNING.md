# DELTA Phase 5 Planning Document

**Date**: May 28, 2026  
**Phase 4 Status**: ✅ 100% Complete  
**Next Phase**: 5 - Notifications & File Sharing  
**Status**: READY TO START

---

## 🎯 Phase 5 Overview

### Phase 5: Notifications & File Sharing

**Focus Areas**:

1. **Notification System** - In-app notifications
2. **File Uploads** - Image/file sharing
3. **Desktop Notifications** - Browser notifications
4. **Message Search** - Enhanced search

**Estimated Scope**: 1,500+ LOC  
**Estimated Duration**: 1 session  
**Complexity**: Medium-High

---

## 📋 Phase 5 Detailed Breakdown

### Feature 1: In-App Notifications

**Purpose**: Notify users of new messages, mentions, and events

**Components Needed**:

- Notification service (backend)
- Notification model (MongoDB)
- Notification API endpoints
- Notification UI components
- Notification store (Zustand)
- Notification sound (optional)

**Implementation Steps**:

1. Create Notification model
   - Fields: user, type, chat, message, read, createdAt
   - Types: new_message, mention, user_joined, etc.

2. Create notification service
   - createNotification(userId, type, chatId, messageId)
   - getNotifications(userId)
   - markAsRead(notificationId)
   - deleteNotification(notificationId)

3. Create API endpoints
   - GET /api/notifications
   - GET /api/notifications/:id
   - PUT /api/notifications/:id/read
   - DELETE /api/notifications/:id

4. Create useNotificationStore (Zustand)
   - State: notifications[], unreadCount
   - Actions: fetchNotifications, markAsRead, deleteNotification

5. Create frontend components
   - NotificationBell - Shows unread count
   - NotificationDropdown - Lists notifications
   - NotificationItem - Individual notification

6. Add Socket.IO events
   - Listen for "new_notification" event
   - Real-time notification display
   - Sound + visual indicator

**Database Schema**:

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: String (enum: ["new_message", "mention", "user_joined"]),
  chatId: ObjectId (ref: Chat),
  messageId: ObjectId (ref: Message),
  content: String,
  read: Boolean,
  createdAt: Date,
  readAt: Date
}
```

**API Endpoints**:

```
GET    /api/notifications              - Get all notifications
GET    /api/notifications/unread-count - Get unread count
PUT    /api/notifications/:id/read     - Mark as read
PUT    /api/notifications/read-all     - Mark all as read
DELETE /api/notifications/:id          - Delete notification
```

**Implementation Priority**: High (Foundation for other features)

---

### Feature 2: File/Image Upload

**Purpose**: Allow users to share images and files

**External Service**: Cloudinary

- Image hosting
- File hosting
- URL generation

**Components Needed**:

- Upload component (React)
- File upload API endpoint
- Cloudinary integration
- File message display
- Progress indicator

**Implementation Steps**:

1. Setup Cloudinary
   - Create account
   - Get API keys
   - Add to backend .env
   - Create cloudinary config file

2. Create upload endpoint
   - Endpoint: POST /api/uploads/image
   - Handle multipart/form-data
   - Validate file type/size
   - Upload to Cloudinary
   - Return secure URL

3. Update Message model
   - Add fileUrl field
   - Add fileType field
   - Support multiple file types

4. Create upload component
   - File input
   - Drag-and-drop support
   - Progress bar
   - Error handling
   - Preview before upload

5. Update message display
   - Show images inline
   - Show file icons for other types
   - Clickable links for download
   - Responsive images

6. Create useFileUpload hook
   - Handle file selection
   - Upload to backend
   - Track progress
   - Handle errors

**Database Changes**:

```javascript
// Message schema addition:
{
  fileUrl: String,        // Cloudinary URL
  fileType: String,       // image/png, application/pdf, etc
  fileName: String,       // Original file name
  fileSize: Number        // Size in bytes
}
```

**API Endpoints**:

```
POST /api/uploads/image  - Upload image
                           Request: multipart/form-data
                           Returns: { url, fileType, fileName, fileSize }
```

**Implementation Priority**: High (Major feature)

---

### Feature 3: Desktop Notifications

**Purpose**: Browser notifications when app is in background

**Implementation Steps**:

1. Check browser support
   - Notification API available
   - Request permission from user

2. Create notification service
   - showDesktopNotification(title, options)
   - Request permission on first app load
   - Cache permission status

3. Trigger notifications for:
   - New message in chat
   - User mentioned
   - Group chat updates
   - User came online

4. Handle notification clicks
   - Focus app window
   - Navigate to relevant chat
   - Mark as read

**Code Example**:

```javascript
// Request permission
Notification.requestPermission();

// Show notification
new Notification("New Message", {
  body: "User A: Hello!",
  icon: userAvatarURL,
  tag: "message-notification",
});
```

**Implementation Priority**: Medium (Nice-to-have)

---

### Feature 4: Enhanced Message Search

**Purpose**: Search messages across and within chats

**Implementation Steps**:

1. Create search endpoint
   - Endpoint: GET /api/messages/search
   - Query params: q (search term), chatId (optional)
   - Return matching messages with context

2. Create frontend search component
   - Search input
   - Results display
   - Navigate to message
   - Highlight matching text

3. Update SingleChat component
   - Add search button
   - Search modal/panel
   - Display search results

4. Database optimization
   - Ensure indexes on content field
   - Consider text index for full-text search

**Search Features**:

- Search within chat
- Search across all chats
- Search by sender
- Search by date range
- Highlight matches

**Implementation Priority**: Low (Nice-to-have)

---

## 🛠️ Technical Implementation Guide

### Backend Implementation Order

1. **First**: Notification Model & Service
   - Create `models/Notification.js`
   - Create `services/notification.service.js`
   - Create `controllers/notificationController.js`
   - Create `routes/notifications.js`

2. **Second**: File Upload Integration
   - Setup Cloudinary in `config/cloudinary.js`
   - Create upload endpoint in `routes/uploads.js`
   - Update Message model with fileUrl/fileType
   - Update messageController to handle files

3. **Third**: Socket.IO Notification Events
   - Add "new_notification" event emitter
   - Broadcast to specific user
   - Listen on client side

4. **Fourth**: Search Enhancement
   - Add text index to Message model
   - Create search service
   - Add search route

### Frontend Implementation Order

1. **First**: Notification Components
   - Create `components/notifications/NotificationBell.jsx`
   - Create `components/notifications/NotificationDropdown.jsx`
   - Create `store/useNotificationStore.js`

2. **Second**: File Upload Component
   - Create `components/chat/FileUploadButton.jsx`
   - Create `hooks/useFileUpload.js`
   - Update SingleChat to use upload component
   - Update message display for files/images

3. **Third**: Desktop Notifications
   - Create `lib/desktopNotifications.js`
   - Request permission on app load
   - Show notifications on message

4. **Fourth**: Search UI
   - Create `components/chat/SearchMessages.jsx`
   - Add search to ChatHeader or SingleChat
   - Display and navigate to results

---

## 📊 Development Checklist

### Notification System

- [ ] Notification model created
- [ ] Notification service created
- [ ] API endpoints created (GET, POST, DELETE, PUT)
- [ ] Backend validation added
- [ ] useNotificationStore created
- [ ] NotificationBell component created
- [ ] NotificationDropdown component created
- [ ] Socket.IO event listener added
- [ ] Real-time notifications working
- [ ] Unread count displayed
- [ ] Mark as read functionality works
- [ ] Delete notification works

### File Upload

- [ ] Cloudinary account setup
- [ ] Cloudinary config created
- [ ] Upload endpoint created
- [ ] File validation implemented
- [ ] Message model updated
- [ ] FileUploadButton component created
- [ ] useFileUpload hook created
- [ ] Message display updated for files
- [ ] Image preview shows inline
- [ ] File icons show for other types
- [ ] Download functionality works
- [ ] Progress indicator shows

### Desktop Notifications

- [ ] Permission request implemented
- [ ] Desktop notification service created
- [ ] Notifications show on new message
- [ ] Notifications clickable
- [ ] App focuses on click
- [ ] Notification sound (optional)

### Search

- [ ] Search endpoint created
- [ ] Text index added to Message
- [ ] SearchMessages component created
- [ ] Search highlighting works
- [ ] Navigate to message works
- [ ] Date range filter (optional)

---

## 🚀 Implementation Tips

### Best Practices

1. **Notifications**
   - Don't spam users with notifications
   - Allow notification preferences
   - Use notification sounds sparingly
   - Clear read notifications

2. **File Uploads**
   - Validate file types
   - Check file size
   - Show progress to user
   - Handle upload errors gracefully
   - Show preview before commit

3. **Desktop Notifications**
   - Request permission early
   - Show clear messages
   - Don't notify too frequently
   - Respect browser permissions

4. **Search**
   - Debounce search input
   - Show results count
   - Pagination for many results
   - Highlight search terms

### Common Pitfalls to Avoid

❌ Storing full file content in database  
✅ Store only file URL and metadata

❌ Uploading files directly to backend  
✅ Use cloud service (Cloudinary)

❌ Showing notifications to all users  
✅ Show only to relevant user

❌ Blocking UI during upload  
✅ Use async/loading states

---

## 📚 Reference Materials

### Cloudinary Documentation

- https://cloudinary.com/documentation
- Signed uploads for security
- Transformation API for image optimization

### Browser Notification API

- https://developer.mozilla.org/en-US/docs/Web/API/Notification
- Service workers for background notifications
- Permission states

### MongoDB Text Search

- Text indexes for full-text search
- Text score for ranking
- Case-insensitive search

---

## ⏱️ Timeline Estimate

| Task                  | Estimate       | Priority    |
| --------------------- | -------------- | ----------- |
| Notification System   | 2-3 hours      | High        |
| File Uploads          | 2-3 hours      | High        |
| Desktop Notifications | 1-2 hours      | Medium      |
| Message Search        | 1-2 hours      | Low         |
| Testing               | 1-2 hours      | High        |
| **Total**             | **7-12 hours** | **Phase 5** |

**Recommended approach**: Complete in one focused session

---

## 🔍 Testing Strategy for Phase 5

### Notification Testing

1. Send message → notification appears
2. Click notification → navigate to chat
3. Mark as read → notification updates
4. Multiple notifications → list shows correctly
5. Delete notification → removed from list

### File Upload Testing

1. Upload image → preview shows
2. Upload file → icon shows
3. Send message with file → broadcasts correctly
4. View file → can download
5. Responsive → works on mobile

### Desktop Notification Testing

1. Request permission → dialog shows
2. Grant permission → notifications show
3. App in background → notification shows
4. Click notification → app focuses
5. Deny permission → no notifications

### Search Testing

1. Search within chat → results show
2. Search across all → results from multiple chats
3. Click result → navigate to message
4. Highlight → matching text highlighted
5. Empty results → "no results" message

---

## 🎯 Definition of Done for Phase 5

✅ All features implemented  
✅ All endpoints tested  
✅ All components working  
✅ No console errors  
✅ Dark mode support  
✅ Mobile responsive  
✅ Comprehensive documentation  
✅ Test cases documented  
✅ Code reviewed

---

## 📝 Documentation Needed for Phase 5

1. **PHASE5_COMPLETE.md** - Completion report
2. **PHASE5_TESTING_GUIDE.md** - Testing procedures
3. **PHASE5_IMPLEMENTATION_CHECKLIST.md** - Verification
4. API documentation updates
5. Component documentation
6. Cloudinary setup guide

---

## 🎉 Next Session Plan

### Phase 5 Session Outline

1. **Setup** (15 min)
   - Cloudinary account
   - API keys
   - Backend config

2. **Notifications** (2 hours)
   - Model & service
   - API endpoints
   - Frontend components
   - Socket.IO integration
   - Testing

3. **File Uploads** (2 hours)
   - Upload endpoint
   - Message updates
   - UI components
   - File display
   - Testing

4. **Polish & Testing** (1-2 hours)
   - Desktop notifications
   - Search (optional)
   - Bug fixes
   - Documentation

---

## ✨ Vision for Phase 5

After Phase 5, users will be able to:

✅ Receive notifications for new messages  
✅ See notification count in UI  
✅ Click notifications to navigate to chat  
✅ Share images and files  
✅ See file previews in chat  
✅ Download shared files  
✅ Get browser desktop notifications  
✅ Search message history

**Total Project Progress**: 85-90% Complete

---

## 🚀 Ready to Start?

Yes! Phase 4 is complete and fully tested. Phase 5 can begin immediately.

**Prerequisites Met**:
✅ Phase 4 stable and working
✅ Architecture proven
✅ Patterns established
✅ All documentation updated
✅ No blockers identified

**Go ahead and start Phase 5!** 🎉

---

**Document Created**: May 28, 2026  
**Status**: READY FOR PHASE 5  
**Next Action**: Begin Phase 5 implementation
