# Notification System

The notification system provides real-time notifications for users and admins. It includes friend requests, arena challenges, announcements, and admin activity logs.

## Overview

Notifications are persistent records stored in the database with the following types:

- **FRIEND_REQUEST**: Friend request notifications (stays until accepted/declined)
- **CHALLENGE**: Arena challenge notifications (expires in 30 seconds)
- **ANNOUNCEMENT**: Public announcements from admins to all users
- **ADMIN_LOG**: Admin activity logs (creating/updating game data, visible only to admins)
- **MESSAGE**: Direct messages (reserved for future use)

## Architecture

### Database Models

- **Notification**: Stores notification records with type discrimination via `type` field and polymorphic `data` JSON column
- **Announcement**: Stores draft and published announcements created by admins

### Frontend Components

- **PersistentHUD**: Main UI in header showing gold balance and notification bell with unread badge
- **NotificationDropdown**: Dropdown menu showing list of recent notifications
- **NotificationItem**: Individual notification in the list with icon, title, and timestamp
- **NotificationModal**: Modal dialog for viewing notification details and taking actions (accept/decline)

### Hooks

- **useNotifications**: Manages notification state, polling, and WebSocket listeners
- **useSocket**: Singleton WebSocket connection to game server for real-time updates

## User-Facing Notifications

### Friend Requests

When a user sends a friend request:
1. A FRIEND_REQUEST notification is created for the recipient
2. The notification appears in the dropdown immediately
3. User can accept or decline in the modal
4. Notification persists until user takes action

### Arena Challenges

When a user creates an arena challenge:
1. A CHALLENGE notification is created with 30-second expiration
2. Countdown timer displays in the modal
3. Accept button is disabled when countdown reaches 0
4. Notification automatically expires and disappears from list

### Announcements

When an admin publishes an announcement:
1. ANNOUNCEMENT notifications are created for all users
2. They appear in the dropdown with full title and message
3. Users can dismiss in the modal
4. Announcements persist indefinitely

## Admin Notifications

### Activity Logs

When admins create or modify game data (templates, bundles, etc.):
1. ADMIN_LOG notifications are created for all admin users
2. Logs include action (created/updated/deleted), entity type, and details
3. Admins can view JSON details in the modal
4. Only admins see these notifications

### Admin Panel

The admin panel at `/admin/announcements` allows admins to:

1. **Create announcements**:
   - Navigate to `/admin/announcements/new`
   - Enter title and message
   - Save as draft (not published to users)
   - Preview before publishing

2. **Manage announcements**:
   - List all announcements with filters (all/draft/published)
   - Edit drafts
   - Publish drafts (sends notifications to all users)
   - View creation/publication timestamps

3. **Track admin activity**:
   - Admin log notifications in the notification dropdown
   - See who created/modified what and when

## API Endpoints

### User Notifications

- `GET /api/notifications` - Fetch user's notifications (up to 50 most recent, filters expired challenges)
- `POST /api/notifications/mark-read` - Mark single or all notifications as read
- `GET /api/notifications/unread-count` - Get current unread count (lightweight for polling)

### Admin Announcements

- `GET /api/admin/announcements` - List announcements with optional `published` filter
- `POST /api/admin/announcements` - Create new announcement draft
- `GET /api/admin/announcements/[id]` - Fetch single announcement
- `PUT /api/admin/announcements/[id]` - Update announcement (drafts only)
- `POST /api/admin/announcements/[id]/publish` - Publish announcement to all users

## Real-Time Updates

### Polling (5 second interval)

The PersistentHUD polls the unread count every 5 seconds to update the notification badge without full refreshes.

### WebSocket Events (planned)

- `notification:created` - Broadcast when new notification is created
- Currently uses polling; WebSocket support can be added to reduce latency

## Notification Display

### In PersistentHUD

- **Gold balance**: Shows current user gold (formatted: 1.2k, 1.2M, etc.)
- **Notification bell**: Click to open/close dropdown
- **Unread badge**: Shows count (9+ if more than 9)

### In Dropdown

- List of notifications with icons, titles, and "X minutes ago" timestamps
- "Mark all as read" button appears when unread notifications exist
- Click notification to open type-specific modal

### In Modal

- **FRIEND_REQUEST**: Shows sender name and Accept/Decline buttons
- **CHALLENGE**: Shows sender name with countdown timer, disabled Accept if expired
- **ANNOUNCEMENT**: Shows full title and message with Dismiss button
- **ADMIN_LOG**: Shows action details in JSON format with Dismiss button

## Implementation Details

### Notification Expiration

Challenges expire in 30 seconds via `expiresAt` field. The API filters expired challenges when returning notifications:

```sql
WHERE (expiresAt IS NULL OR expiresAt > NOW())
```

### Admin Action Logging

When admins create/update/delete templates:
1. `logAdminAction()` is called (non-blocking)
2. Fetches list of all admin users
3. Creates ADMIN_LOG notification for each admin
4. Notifications appear in dropdown with entity details

### Starter Gear

Starter gear cannot be created, modified, or deleted (read-only in game data). Admin logs only track user-created/modified equipment.

## Error Handling

- Notification creation failures are non-blocking (wrapped in try-catch)
- Missing session/auth returns 401 Unauthorized
- Invalid IDs return 404 Not Found
- Missing required fields return 400 Bad Request
- Gold display shows "---" if fetch fails
- Announcements page shows "Loading..." state during fetch
- Network errors log to console but don't block the UI

## Future Enhancements

- WebSocket real-time updates (reduce polling latency)
- Notification preferences (mute specific types)
- Notification history/archive
- Notification categories and organization
- Rich notification content (images, links)
- Notification sounds/badges for important types
