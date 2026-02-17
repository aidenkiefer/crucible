# Notification System & Real Gold Display - Design Document

**Date:** 2026-02-16
**Status:** Approved
**Scope:** PersistentHUD gold display + unified notification system (user & admin)

---

## Overview

This design adds a comprehensive notification system to the Crucible app, replacing the hardcoded gold and notification badge in PersistentHUD with real data. The system supports different notification types for regular users (friend requests, challenges, announcements) and admins (game data activity logs), with a hybrid persistence model and real-time updates for time-sensitive notifications.

---

## Goals

1. **Real Gold Display:** Show actual user gold balance from database
2. **Unified Notifications:** Single dropdown for all notification types
3. **User Notifications:** Friend requests, arena challenges, game announcements
4. **Admin Notifications:** Activity log for game data changes (templates, bundles)
5. **Smart Persistence:** Database for important notifications, transient for short-lived ones
6. **Real-time Updates:** WebSocket for challenges, polling for others
7. **Admin Announcements:** UI for creating and publishing game updates

---

## Requirements Summary

### Notification Types

| Type | Persistence | Real-time | Expiry | User Type |
|------|-------------|-----------|--------|-----------|
| Friend Request | Database | Polling (5s) | Never | User |
| Arena Challenge | Database | WebSocket | 30 seconds | User |
| Announcement | Database | Polling (5s) | Never | User |
| Admin Log | Database | Manual refresh | Never | Admin |
| Message | N/A (placeholder) | N/A | N/A | Future |

### Behavior

- **Badge Count:** Total unread notifications (all types)
- **Click Notification:** Open modal with details and action buttons
- **Mark as Read:** Individual or "mark all as read"
- **Challenge Expiry:** Auto-expire after 30 seconds, show countdown timer
- **Admin View:** Admins see admin logs instead of user notifications

---

## Data Model

### Notification Table

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation("UserNotifications", fields: [userId], references: [id], onDelete: Cascade)

  type      NotificationType
  isRead    Boolean  @default(false)

  // Type-specific data stored as JSON:
  // FRIEND_REQUEST: { friendRequestId, fromUserId, fromUsername }
  // CHALLENGE: { challengeId, fromUserId, fromUsername, gladiatorId, expiresAt }
  // ANNOUNCEMENT: { title, message, announcementId }
  // ADMIN_LOG: { action, entityType, entityId, performedBy, details }
  data      Json     @default("{}")

  createdAt DateTime @default(now())
  expiresAt DateTime? // For challenges (30s), null for persistent notifications

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@index([expiresAt]) // For cleanup queries
}

enum NotificationType {
  FRIEND_REQUEST
  CHALLENGE
  ANNOUNCEMENT
  ADMIN_LOG
  MESSAGE // Placeholder for future
}
```

### Announcement Table

```prisma
model Announcement {
  id          String   @id @default(uuid())
  title       String
  message     String   @db.Text
  createdById String
  createdBy   User     @relation("CreatedAnnouncements", fields: [createdById], references: [id])

  isPublished Boolean  @default(false)
  publishedAt DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isPublished, publishedAt])
}
```

### User Model Updates

```prisma
model User {
  // ... existing fields
  notifications        Notification[] @relation("UserNotifications")
  createdAnnouncements Announcement[] @relation("CreatedAnnouncements")
}
```

---

## API Layer

### Core Notification Endpoints

#### GET `/api/notifications`
**Description:** Fetch all active notifications for current user
**Auth:** Required
**Query Params:**
- `unreadOnly=true` (optional)
- `type=FRIEND_REQUEST` (optional)

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "FRIEND_REQUEST",
      "isRead": false,
      "data": { "fromUsername": "player123", "friendRequestId": "uuid" },
      "createdAt": "2026-02-16T10:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

**Logic:**
- Filters out expired challenges: `WHERE expiresAt > now() OR expiresAt IS NULL`
- Orders by `createdAt DESC`

---

#### POST `/api/notifications/mark-read`
**Description:** Mark notification(s) as read
**Auth:** Required
**Body:**
```json
{ "notificationId": "uuid" }
// OR
{ "markAll": true }
```

**Response:**
```json
{ "success": true, "unreadCount": 2 }
```

---

#### GET `/api/notifications/unread-count`
**Description:** Lightweight badge count endpoint (for polling)
**Auth:** Required
**Response:**
```json
{ "count": 5 }
```

---

### Notification Creation (Internal Helpers)

Notifications are created automatically when events occur. Add helper function:

```typescript
// lib/notifications.ts
export async function createNotification({
  userId,
  type,
  data,
  expiresAt
}: {
  userId: string
  type: NotificationType
  data: Record<string, any>
  expiresAt?: Date
}) {
  await prisma.notification.create({
    data: { userId, type, data, expiresAt }
  })
}
```

**Trigger points:**
- `/api/friends/add` → create FRIEND_REQUEST notification for recipient
- `/api/challenges/create` → create CHALLENGE notification (expiresAt = now + 30s)
- Admin template create/update → create ADMIN_LOG for all admins
- Announcement publish → create ANNOUNCEMENT for all users

---

### Admin Announcement Endpoints

#### GET `/api/admin/announcements`
**Description:** List all announcements
**Auth:** Admin only
**Response:**
```json
{
  "announcements": [
    {
      "id": "uuid",
      "title": "New Season Starts!",
      "message": "Season 2 begins...",
      "isPublished": true,
      "publishedAt": "2026-02-15T12:00:00Z"
    }
  ]
}
```

---

#### POST `/api/admin/announcements`
**Description:** Create draft announcement
**Auth:** Admin only
**Body:**
```json
{ "title": "Update Title", "message": "Full message text..." }
```

**Response:**
```json
{ "id": "uuid", "status": "draft" }
```

---

#### POST `/api/admin/announcements/[id]/publish`
**Description:** Publish announcement to all users
**Auth:** Admin only
**Logic:**
1. Set `isPublished = true`, `publishedAt = now()`
2. Create notification for all users:
   ```typescript
   const users = await prisma.user.findMany({ select: { id: true } })
   await prisma.notification.createMany({
     data: users.map(u => ({
       userId: u.id,
       type: 'ANNOUNCEMENT',
       data: { announcementId: id, title, message }
     }))
   })
   ```

**Response:**
```json
{ "success": true, "notificationsSent": 1523 }
```

---

## Frontend Components

### PersistentHUD Updates

**Gold Display:**
```typescript
const [gold, setGold] = useState<number | null>(null)

useEffect(() => {
  fetch('/api/gold/balance')
    .then(r => r.json())
    .then(data => setGold(data.balance))
}, [])

// Render: {gold !== null ? formatGold(gold) : '---'}
// formatGold: 1250 → "1.2k", 1250000 → "1.2M"
```

**Notification Bell:**
```typescript
const [unreadCount, setUnreadCount] = useState(0)
const [dropdownOpen, setDropdownOpen] = useState(false)

// Poll unread count every 5 seconds
useEffect(() => {
  const poll = () => {
    fetch('/api/notifications/unread-count')
      .then(r => r.json())
      .then(data => setUnreadCount(data.count))
  }
  poll()
  const interval = setInterval(poll, 5000)
  return () => clearInterval(interval)
}, [])

// On bell click: setDropdownOpen(!dropdownOpen)
```

---

### NotificationDropdown Component

**Location:** `components/notifications/NotificationDropdown.tsx`

**Structure:**
```tsx
<div className="absolute top-full right-0 w-80 panel-embossed">
  <header>
    <h3>Notifications</h3>
    <button onClick={markAllAsRead}>Mark all as read</button>
  </header>

  <div className="max-h-96 overflow-y-auto">
    {notifications.map(n => (
      <NotificationItem
        key={n.id}
        notification={n}
        onClick={() => setSelectedNotification(n)}
      />
    ))}
  </div>

  {notifications.length === 0 && (
    <div className="text-center">No notifications</div>
  )}
</div>
```

**NotificationItem:**
- Icon based on type (👥 friend, ⚔️ challenge, 📢 announcement, 🔧 admin)
- Title/preview text
- Relative timestamp ("2m ago", "1h ago")
- Unread indicator (dot or highlight background)

---

### NotificationModal Component

**Location:** `components/notifications/NotificationModal.tsx`

**Modal content varies by type:**

**FRIEND_REQUEST:**
```tsx
<Modal>
  <h2>Friend Request from {data.fromUsername}</h2>
  <p>Wants to add you as a friend</p>
  <button onClick={acceptFriendRequest}>Accept</button>
  <button onClick={declineFriendRequest}>Decline</button>
</Modal>
```

**CHALLENGE:**
```tsx
<Modal>
  <h2>Arena Challenge from {data.fromUsername}!</h2>
  <p>Gladiator matchup preview...</p>
  <Countdown expiresAt={data.expiresAt} />
  <button onClick={acceptChallenge} disabled={isExpired}>Accept</button>
  <button onClick={declineChallenge}>Decline</button>
</Modal>
```

**ANNOUNCEMENT:**
```tsx
<Modal>
  <h2>{data.title}</h2>
  <p>{data.message}</p>
  <footer>Posted by Admin • {timestamp}</footer>
  <button onClick={dismiss}>Dismiss</button>
</Modal>
```

**ADMIN_LOG:**
```tsx
<Modal>
  <h2>{data.performedBy} {data.action} {data.entityType}</h2>
  <pre>{JSON.stringify(data.details, null, 2)}</pre>
  <a href={`/admin/${data.entityType}/${data.entityId}`}>View in Admin</a>
  <button onClick={dismiss}>Dismiss</button>
</Modal>
```

---

### Real-time & Polling Strategy

**For Regular Users:**
- Poll `/api/notifications/unread-count` every 5 seconds
- Poll `/api/notifications` when dropdown opens
- WebSocket listener: `socket.on('challenge:received', handleChallenge)`

**For Admins:**
- Same as users for badge count
- Fetch admin logs when dropdown opens: `/api/notifications?type=ADMIN_LOG`
- No WebSocket for admin logs

---

## Admin UI - Announcement Management

### New Admin Page: `/app/admin/announcements/page.tsx`

**Features:**
- Table of all announcements (draft + published)
- Columns: Title, Status, Published Date, Actions
- Filter: All / Drafts / Published
- [Create New] button

**Create/Edit Form: `/app/admin/announcements/new/page.tsx`**
```tsx
<form>
  <input name="title" maxLength={100} />
  <textarea name="message" rows={10} />

  <Preview title={title} message={message} />

  <button type="button" onClick={saveDraft}>Save as Draft</button>
  <button type="submit" onClick={publishNow}>Publish Now</button>
</form>
```

**Publish Flow:**
1. Show confirmation: "Send notification to {userCount} users?"
2. On confirm: POST `/api/admin/announcements/[id]/publish`
3. Success toast: "Announcement published to X users"

---

## Error Handling & Edge Cases

### Notification Creation Failures
- If notification creation fails, log error but don't block main action
- User still gets friend request/challenge created
- Notification can be manually retried or will appear on refresh

### Expired Challenge Cleanup
- API filters: `WHERE expiresAt > now() OR expiresAt IS NULL`
- Optional: Daily cron job to delete expired notifications
- Challenge modal shows countdown, disables "Accept" when expired

### WebSocket Handling
- WebSocket is additive (real-time bonus), not required
- If offline, user sees challenge on next poll/refresh
- Graceful degradation if WebSocket fails

### Permission Checks
- All endpoints check `session.user.id === notification.userId`
- Admin endpoints check `session.user.isAdmin === true`
- Admin logs only visible to admins: `WHERE userId IN (SELECT id FROM User WHERE isAdmin = true)`

### Race Conditions
- Mark as read is idempotent (safe to call multiple times)
- Accept friend/challenge checks current status before proceeding
- If challenge expired between modal open and accept, show error: "Challenge has expired"

### Gold Display Edge Cases
- If UserGold doesn't exist, show 0 (API handles this)
- If API fails, show "---" or cached value with retry
- No real-time updates needed (refresh on gold-changing actions)

---

## Implementation Phases

### Phase 1: Data Model & Basic API
1. Add Notification and Announcement models to schema
2. Run migration
3. Implement core notification endpoints
4. Add notification creation to existing routes (friend, challenge)

### Phase 2: Frontend - Gold & Dropdown
1. Update PersistentHUD gold display
2. Add polling for unread count
3. Build NotificationDropdown component
4. Build NotificationModal component

### Phase 3: Admin Announcements
1. Create `/admin/announcements` page
2. Implement admin announcement endpoints
3. Add publish flow with batch notification creation

### Phase 4: Real-time & Polish
1. Add WebSocket listener for challenges
2. Add admin log creation on template changes
3. Cleanup expired notifications (cron or on-demand)
4. Polish UI, loading states, error handling

---

## Testing Checklist

- [ ] Create friend request → notification appears for recipient
- [ ] Accept/decline friend request → notification dismissed
- [ ] Create challenge → notification appears in real-time
- [ ] Challenge expires after 30s → no longer actionable
- [ ] Admin creates template → admin log notification for all admins
- [ ] Admin publishes announcement → all users get notification
- [ ] Mark as read updates badge count
- [ ] Mark all as read clears all notifications
- [ ] Gold display fetches real balance
- [ ] Polling updates badge count every 5s
- [ ] WebSocket updates work for challenges
- [ ] Admin users see admin logs, regular users don't
- [ ] Expired challenges filtered from API response

---

## Documentation Updates

After implementation, update:
- **API Reference:** Add new endpoints to docs
- **Database Schema Docs:** Document Notification and Announcement models
- **Feature Docs:** Create `docs/features/notifications.md`
- **Admin Guide:** Document announcement creation workflow
- **CHANGELOG:** Add notification system to version history

---

## Future Enhancements (Out of Scope)

- Direct messaging system (currently placeholder)
- Notification preferences (mute types, frequency)
- Push notifications (browser/mobile)
- Email digest for important notifications
- Notification history/archive view
- Rich notifications (images, actions in notification itself)

---

**End of Design Document**
