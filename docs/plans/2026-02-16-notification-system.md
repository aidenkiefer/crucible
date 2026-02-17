# Notification System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add real gold display and unified notification system to PersistentHUD with user/admin notifications, real-time updates, and admin announcement management.

**Architecture:** Unified Notification table with type discrimination, polling for regular updates, WebSocket for time-sensitive challenges, separate admin announcement UI with batch notification creation.

**Tech Stack:** Prisma, Next.js 14, React 18, TypeScript, Socket.io-client, TailwindCSS

---

## Phase 1: Data Model & Basic API

### Task 1: Add Notification and Announcement Models to Schema

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add NotificationType enum**

Add after existing enums (after ActionCategory):

```prisma
enum NotificationType {
  FRIEND_REQUEST
  CHALLENGE
  ANNOUNCEMENT
  ADMIN_LOG
  MESSAGE // Placeholder for future
}
```

**Step 2: Add Notification model**

Add after UserGold model (around line 193):

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
```

**Step 3: Add Announcement model**

Add after Notification model:

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

**Step 4: Update User model**

Find the User model (around line 11) and add these relations before the closing brace:

```prisma
  // Notification system
  notifications        Notification[] @relation("UserNotifications")
  createdAnnouncements Announcement[] @relation("CreatedAnnouncements")
```

**Step 5: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat(db): add Notification and Announcement models"
```

---

### Task 2: Create and Run Migration

**Files:**
- Create: `packages/database/prisma/migrations/XXXXXX_add_notifications/migration.sql` (auto-generated)

**Step 1: Generate migration**

Run from project root:

```bash
cd packages/database
pnpm prisma migrate dev --name add_notifications
```

Expected output: Migration created and applied successfully

**Step 2: Regenerate Prisma client**

```bash
pnpm prisma generate
```

Expected output: Prisma Client generated successfully

**Step 3: Verify migration**

Check that new tables exist:

```bash
pnpm prisma studio
```

Expected: Notification and Announcement tables visible in Prisma Studio

**Step 4: Commit**

```bash
git add packages/database/prisma/migrations
git commit -m "feat(db): add notifications migration"
```

---

### Task 3: Create Notification Helper Library

**Files:**
- Create: `apps/web/lib/notifications.ts`

**Step 1: Create notification helper file**

Create `apps/web/lib/notifications.ts`:

```typescript
import { prisma } from '@gladiator/database/src/client'
import { NotificationType } from '@prisma/client'

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  data,
  expiresAt,
}: {
  userId: string
  type: NotificationType
  data: Record<string, any>
  expiresAt?: Date
}) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        data,
        expiresAt,
      },
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    // Don't throw - notification creation should not block main operations
  }
}

/**
 * Create notifications for multiple users (batch)
 */
export async function createNotificationsForUsers({
  userIds,
  type,
  data,
}: {
  userIds: string[]
  type: NotificationType
  data: Record<string, any>
}) {
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        data,
      })),
    })
    return userIds.length
  } catch (error) {
    console.error('Failed to create batch notifications:', error)
    return 0
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const now = new Date()
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  })
}
```

**Step 2: Commit**

```bash
git add apps/web/lib/notifications.ts
git commit -m "feat(lib): add notification helper functions"
```

---

### Task 4: Implement GET /api/notifications

**Files:**
- Create: `apps/web/app/api/notifications/route.ts`

**Step 1: Create notifications API route**

Create `apps/web/app/api/notifications/route.ts`:

```typescript
import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { NotificationType } from '@prisma/client'

/**
 * GET /api/notifications
 * Fetch all active notifications for current user
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true'
    const typeFilter = url.searchParams.get('type') as NotificationType | null

    const now = new Date()

    const whereClause: any = {
      userId: session.user.id,
      // Filter out expired challenges
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    }

    if (unreadOnly) {
      whereClause.isRead = false
    }

    if (typeFilter) {
      whereClause.type = typeFilter
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to most recent 50
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    })

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
```

**Step 2: Test the endpoint**

Start dev server and test:

```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

Expected: `{ "notifications": [], "unreadCount": 0 }`

**Step 3: Commit**

```bash
git add apps/web/app/api/notifications/route.ts
git commit -m "feat(api): implement GET /api/notifications"
```

---

### Task 5: Implement POST /api/notifications/mark-read

**Files:**
- Create: `apps/web/app/api/notifications/mark-read/route.ts`

**Step 1: Create mark-read API route**

Create `apps/web/app/api/notifications/mark-read/route.ts`:

```typescript
import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getUnreadCount } from '@/lib/notifications'

/**
 * POST /api/notifications/mark-read
 * Mark notification(s) as read
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationId, markAll } = body

    if (markAll) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      })
    } else if (notificationId) {
      // Mark single notification as read
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }

      if (notification.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      })
    } else {
      return NextResponse.json(
        { error: 'Must provide notificationId or markAll' },
        { status: 400 }
      )
    }

    const unreadCount = await getUnreadCount(session.user.id)

    return NextResponse.json({
      success: true,
      unreadCount,
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/app/api/notifications/mark-read/route.ts
git commit -m "feat(api): implement POST /api/notifications/mark-read"
```

---

### Task 6: Implement GET /api/notifications/unread-count

**Files:**
- Create: `apps/web/app/api/notifications/unread-count/route.ts`

**Step 1: Create unread-count API route**

Create `apps/web/app/api/notifications/unread-count/route.ts`:

```typescript
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getUnreadCount } from '@/lib/notifications'

/**
 * GET /api/notifications/unread-count
 * Lightweight endpoint for polling badge count
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await getUnreadCount(session.user.id)

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/app/api/notifications/unread-count/route.ts
git commit -m "feat(api): implement GET /api/notifications/unread-count"
```

---

### Task 7: Update Friend Request API to Create Notifications

**Files:**
- Modify: `apps/web/app/api/friends/add/route.ts`

**Step 1: Import notification helper**

Add import at top of file:

```typescript
import { createNotification } from '@/lib/notifications'
```

**Step 2: Create notification after friend request**

Find the line `await prisma.friend.create(...)` (around line 40) and add after it:

```typescript
  // Create notification for recipient
  await createNotification({
    userId: friend.id,
    type: 'FRIEND_REQUEST',
    data: {
      friendRequestId: friend.id,
      fromUserId: session.user.id,
      fromUsername: session.user.name || session.user.email || 'Unknown',
    },
  })
```

**Step 3: Commit**

```bash
git add apps/web/app/api/friends/add/route.ts
git commit -m "feat(api): create notification on friend request"
```

---

### Task 8: Update Challenge API to Create Notifications

**Files:**
- Modify: `apps/web/app/api/challenges/create/route.ts`

**Step 1: Import notification helper**

Add import at top of file:

```typescript
import { createNotification } from '@/lib/notifications'
```

**Step 2: Create notification after challenge**

Find the line `const challenge = await prisma.challenge.create(...)` (around line 27) and add after it:

```typescript
  // Create notification for opponent (expires in 30 seconds)
  const expiresAt = new Date(Date.now() + 30 * 1000)
  await createNotification({
    userId: opponentId,
    type: 'CHALLENGE',
    data: {
      challengeId: challenge.id,
      fromUserId: session.user.id,
      fromUsername: session.user.name || session.user.email || 'Unknown',
      gladiatorId: challenge.gladiator1Id,
    },
    expiresAt,
  })
```

**Step 3: Commit**

```bash
git add apps/web/app/api/challenges/create/route.ts
git commit -m "feat(api): create notification on arena challenge"
```

---

## Phase 2: Frontend - Gold & Dropdown

### Task 9: Create Utility Functions

**Files:**
- Create: `apps/web/lib/utils/format.ts`

**Step 1: Create format utility file**

Create `apps/web/lib/utils/format.ts`:

```typescript
/**
 * Format gold with k/M suffixes
 * 1250 → "1.2k"
 * 1250000 → "1.2M"
 */
export function formatGold(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`
  }
  return amount.toString()
}

/**
 * Format relative time
 * "2m ago", "1h ago", "3d ago"
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return `${diffDay}d ago`
}

/**
 * Get notification icon emoji by type
 */
export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'FRIEND_REQUEST':
      return '👥'
    case 'CHALLENGE':
      return '⚔️'
    case 'ANNOUNCEMENT':
      return '📢'
    case 'ADMIN_LOG':
      return '🔧'
    default:
      return '🔔'
  }
}

/**
 * Get notification title by type and data
 */
export function getNotificationTitle(
  type: string,
  data: Record<string, any>
): string {
  switch (type) {
    case 'FRIEND_REQUEST':
      return `Friend request from ${data.fromUsername}`
    case 'CHALLENGE':
      return `Arena challenge from ${data.fromUsername}!`
    case 'ANNOUNCEMENT':
      return data.title || 'New announcement'
    case 'ADMIN_LOG':
      return `${data.performedBy} ${data.action} ${data.entityType}`
    default:
      return 'Notification'
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/lib/utils/format.ts
git commit -m "feat(lib): add notification formatting utilities"
```

---

### Task 10: Create useNotifications Hook

**Files:**
- Create: `apps/web/hooks/useNotifications.ts`

**Step 1: Create hook file**

Create `apps/web/hooks/useNotifications.ts`:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'

interface Notification {
  id: string
  type: string
  isRead: boolean
  data: Record<string, any>
  createdAt: string
  expiresAt?: string | null
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId?: string) => {
    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          notificationId ? { notificationId } : { markAll: true }
        ),
      })

      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
        // Refresh notifications to update read status
        await fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }, [fetchNotifications])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead,
  }
}

/**
 * Hook for polling unread count only (lightweight)
 */
export function useUnreadCount(intervalMs = 5000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count')
        if (res.ok) {
          const data = await res.json()
          setCount(data.count || 0)
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    }

    poll() // Initial fetch
    const interval = setInterval(poll, intervalMs)

    return () => clearInterval(interval)
  }, [intervalMs])

  return count
}
```

**Step 2: Commit**

```bash
git add apps/web/hooks/useNotifications.ts
git commit -m "feat(hooks): add useNotifications and useUnreadCount hooks"
```

---

### Task 11: Update PersistentHUD - Gold Display

**Files:**
- Modify: `apps/web/components/rpg-ui/PersistentHUD.tsx`

**Step 1: Add imports**

Add these imports at the top (after existing imports):

```typescript
import { formatGold } from '@/lib/utils/format'
```

**Step 2: Add gold state**

Add state variable after existing useState declarations (around line 36):

```typescript
  const [gold, setGold] = useState<number | null>(null)
```

**Step 3: Add gold fetch effect**

Add useEffect after the gladiators fetch effect (around line 48):

```typescript
  // Fetch user gold
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/gold/balance')
        .then((res) => res.json())
        .then((data) => setGold(data.balance ?? 0))
        .catch(() => setGold(0))
    } else {
      setGold(null)
    }
  }, [session?.user?.id])
```

**Step 4: Update gold display in JSX**

Find the gold display section (around line 183-189) and replace the hardcoded values:

```tsx
        {/* Gold Display */}
        <div className="flex items-center gap-1 sm:gap-2 panel-inset px-2 sm:px-4 py-1 sm:py-2">
          <span className="text-lg sm:text-2xl">💰</span>
          <span className="text-coliseum-bronze font-bold text-sm sm:text-base">
            {gold !== null ? formatGold(gold) : '---'}
          </span>
        </div>
```

**Step 5: Commit**

```bash
git add apps/web/components/rpg-ui/PersistentHUD.tsx apps/web/lib/utils/format.ts
git commit -m "feat(ui): add real gold display to PersistentHUD"
```

---

### Task 12: Update PersistentHUD - Notification Badge

**Files:**
- Modify: `apps/web/components/rpg-ui/PersistentHUD.tsx`

**Step 1: Add imports**

Add import after existing imports:

```typescript
import { useUnreadCount } from '@/hooks/useNotifications'
```

**Step 2: Add notification state**

Add state after gold state (around line 37):

```typescript
  const unreadCount = useUnreadCount(5000) // Poll every 5 seconds
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
```

**Step 3: Update notification badge**

Find the notification bell button (around line 193-199) and update:

```tsx
        {/* Notifications Bell */}
        <button
          onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
          className="btn-raised w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl relative"
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-600 text-white text-[8px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-coliseum-stone">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
```

**Step 4: Commit**

```bash
git add apps/web/components/rpg-ui/PersistentHUD.tsx
git commit -m "feat(ui): add real notification count polling to PersistentHUD"
```

---

### Task 13: Create NotificationItem Component

**Files:**
- Create: `apps/web/components/notifications/NotificationItem.tsx`

**Step 1: Create component file**

Create directory and file:

```bash
mkdir -p apps/web/components/notifications
```

Create `apps/web/components/notifications/NotificationItem.tsx`:

```typescript
'use client'

import { getNotificationIcon, getNotificationTitle, formatRelativeTime } from '@/lib/utils/format'

interface NotificationItemProps {
  notification: {
    id: string
    type: string
    isRead: boolean
    data: Record<string, any>
    createdAt: string
  }
  onClick: () => void
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const icon = getNotificationIcon(notification.type)
  const title = getNotificationTitle(notification.type, notification.data)
  const time = formatRelativeTime(notification.createdAt)

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 border-b border-coliseum-bronze/20
        hover:bg-coliseum-black/30 transition-colors
        ${!notification.isRead ? 'bg-coliseum-bronze/10' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-2xl flex-shrink-0">{icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-coliseum-sand font-semibold text-sm truncate">
            {title}
          </p>
          <p className="text-coliseum-sand/60 text-xs mt-1">{time}</p>
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="w-2 h-2 rounded-full bg-coliseum-bronze flex-shrink-0 mt-2" />
        )}
      </div>
    </button>
  )
}
```

**Step 2: Commit**

```bash
git add apps/web/components/notifications/NotificationItem.tsx
git commit -m "feat(ui): create NotificationItem component"
```

---

### Task 14: Create NotificationDropdown Component

**Files:**
- Create: `apps/web/components/notifications/NotificationDropdown.tsx`

**Step 1: Create component file**

Create `apps/web/components/notifications/NotificationDropdown.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationItem } from './NotificationItem'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  onNotificationClick: (notification: any) => void
}

export function NotificationDropdown({
  isOpen,
  onClose,
  onNotificationClick,
}: NotificationDropdownProps) {
  const { notifications, unreadCount, loading, markAsRead } = useNotifications()

  if (!isOpen) return null

  const handleMarkAllAsRead = async () => {
    await markAsRead()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown Panel */}
      <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 panel-embossed z-50 max-h-[80vh] flex flex-col border-2 border-coliseum-bronze/40">
        {/* Header */}
        <div className="px-4 py-3 border-b-2 border-coliseum-bronze/40 flex items-center justify-between bg-coliseum-black/50">
          <h3 className="text-coliseum-sand font-bold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-coliseum-bronze text-xs hover:text-coliseum-sand transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="px-4 py-8 text-center text-coliseum-sand/60">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-coliseum-sand/60">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => {
                  onNotificationClick(notification)
                  onClose()
                }}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}
```

**Step 2: Commit**

```bash
git add apps/web/components/notifications/NotificationDropdown.tsx
git commit -m "feat(ui): create NotificationDropdown component"
```

---

### Task 15: Create NotificationModal Component

**Files:**
- Create: `apps/web/components/notifications/NotificationModal.tsx`

**Step 1: Create component file**

Create `apps/web/components/notifications/NotificationModal.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface NotificationModalProps {
  notification: any
  isOpen: boolean
  onClose: () => void
}

export function NotificationModal({
  notification,
  isOpen,
  onClose,
}: NotificationModalProps) {
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Countdown for challenges
  useEffect(() => {
    if (!notification || notification.type !== 'CHALLENGE' || !notification.expiresAt) {
      return
    }

    const updateCountdown = () => {
      const expiresAt = new Date(notification.expiresAt)
      const now = new Date()
      const diffMs = expiresAt.getTime() - now.getTime()
      const diffSec = Math.max(0, Math.floor(diffMs / 1000))
      setCountdown(diffSec)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [notification])

  if (!isOpen || !notification) return null

  const handleAcceptFriendRequest = async () => {
    setProcessing(true)
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: notification.data.fromUserId }),
      })

      if (res.ok) {
        onClose()
        router.refresh()
      } else {
        alert('Failed to accept friend request')
      }
    } catch (error) {
      console.error('Error accepting friend request:', error)
      alert('Failed to accept friend request')
    } finally {
      setProcessing(false)
    }
  }

  const handleAcceptChallenge = async () => {
    if (countdown !== null && countdown <= 0) {
      alert('This challenge has expired')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/challenges/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: notification.data.challengeId }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.matchId) {
          router.push(`/match/${data.matchId}`)
        }
        onClose()
      } else {
        alert('Failed to accept challenge')
      }
    } catch (error) {
      console.error('Error accepting challenge:', error)
      alert('Failed to accept challenge')
    } finally {
      setProcessing(false)
    }
  }

  const renderContent = () => {
    switch (notification.type) {
      case 'FRIEND_REQUEST':
        return (
          <>
            <h2 className="text-coliseum-sand font-bold text-xl mb-4">
              Friend Request from {notification.data.fromUsername}
            </h2>
            <p className="text-coliseum-sand/80 mb-6">
              Wants to add you as a friend
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAcceptFriendRequest}
                disabled={processing}
                className="btn-raised flex-1 py-2 text-sm"
              >
                {processing ? 'Processing...' : 'Accept'}
              </button>
              <button
                onClick={onClose}
                className="btn-raised flex-1 py-2 text-sm bg-coliseum-stone/50"
              >
                Decline
              </button>
            </div>
          </>
        )

      case 'CHALLENGE':
        const isExpired = countdown !== null && countdown <= 0
        return (
          <>
            <h2 className="text-coliseum-sand font-bold text-xl mb-4">
              Arena Challenge from {notification.data.fromUsername}!
            </h2>
            {countdown !== null && (
              <p className="text-coliseum-bronze font-bold mb-4">
                {isExpired ? 'Expired' : `Expires in ${countdown}s`}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleAcceptChallenge}
                disabled={processing || isExpired}
                className="btn-raised flex-1 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Accept'}
              </button>
              <button
                onClick={onClose}
                className="btn-raised flex-1 py-2 text-sm bg-coliseum-stone/50"
              >
                Decline
              </button>
            </div>
          </>
        )

      case 'ANNOUNCEMENT':
        return (
          <>
            <h2 className="text-coliseum-sand font-bold text-xl mb-4">
              {notification.data.title}
            </h2>
            <p className="text-coliseum-sand/80 mb-6 whitespace-pre-wrap">
              {notification.data.message}
            </p>
            <button onClick={onClose} className="btn-raised w-full py-2 text-sm">
              Dismiss
            </button>
          </>
        )

      case 'ADMIN_LOG':
        return (
          <>
            <h2 className="text-coliseum-sand font-bold text-xl mb-4">
              {notification.data.performedBy} {notification.data.action}{' '}
              {notification.data.entityType}
            </h2>
            <pre className="text-coliseum-sand/80 text-xs mb-6 overflow-auto max-h-64 p-3 bg-coliseum-black/50 rounded">
              {JSON.stringify(notification.data.details, null, 2)}
            </pre>
            <div className="flex gap-3">
              {notification.data.entityId && (
                <button
                  onClick={() => {
                    router.push(`/admin/${notification.data.entityType}/${notification.data.entityId}`)
                    onClose()
                  }}
                  className="btn-raised flex-1 py-2 text-sm"
                >
                  View in Admin
                </button>
              )}
              <button onClick={onClose} className="btn-raised flex-1 py-2 text-sm bg-coliseum-stone/50">
                Dismiss
              </button>
            </div>
          </>
        )

      default:
        return (
          <>
            <h2 className="text-coliseum-sand font-bold text-xl mb-4">
              Notification
            </h2>
            <button onClick={onClose} className="btn-raised w-full py-2 text-sm">
              Dismiss
            </button>
          </>
        )
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="panel-embossed p-6 w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {renderContent()}
        </div>
      </div>
    </>
  )
}
```

**Step 2: Commit**

```bash
git add apps/web/components/notifications/NotificationModal.tsx
git commit -m "feat(ui): create NotificationModal component"
```

---

### Task 16: Integrate Dropdown and Modal into PersistentHUD

**Files:**
- Modify: `apps/web/components/rpg-ui/PersistentHUD.tsx`

**Step 1: Add imports**

Add these imports after existing imports:

```typescript
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { NotificationModal } from '@/components/notifications/NotificationModal'
```

**Step 2: Add modal state**

Add state after notificationDropdownOpen (around line 38):

```typescript
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
```

**Step 3: Add dropdown and modal JSX**

Add before the closing `</div>` of the main container (around line 200):

```tsx
      {/* Notification Dropdown */}
      <NotificationDropdown
        isOpen={notificationDropdownOpen}
        onClose={() => setNotificationDropdownOpen(false)}
        onNotificationClick={(notification) => {
          setSelectedNotification(notification)
          setNotificationDropdownOpen(false)
        }}
      />

      {/* Notification Modal */}
      <NotificationModal
        notification={selectedNotification}
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
```

**Step 4: Commit**

```bash
git add apps/web/components/rpg-ui/PersistentHUD.tsx
git commit -m "feat(ui): integrate notification dropdown and modal into PersistentHUD"
```

---

## Phase 3: Admin Announcements

### Task 17: Implement GET /api/admin/announcements

**Files:**
- Create: `apps/web/app/api/admin/announcements/route.ts`

**Step 1: Create admin announcements API route**

Create directory and file:

```bash
mkdir -p apps/web/app/api/admin/announcements
```

Create `apps/web/app/api/admin/announcements/route.ts`:

```typescript
import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/admin/announcements
 * List all announcements (admin only)
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/app/api/admin/announcements/route.ts
git commit -m "feat(api): implement GET /api/admin/announcements"
```

---

### Task 18: Implement POST /api/admin/announcements

**Files:**
- Modify: `apps/web/app/api/admin/announcements/route.ts`

**Step 1: Add POST handler**

Add this function to `apps/web/app/api/admin/announcements/route.ts` after the GET handler:

```typescript
/**
 * POST /api/admin/announcements
 * Create draft announcement (admin only)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { title, message } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({
      id: announcement.id,
      status: 'draft',
    })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/app/api/admin/announcements/route.ts
git commit -m "feat(api): implement POST /api/admin/announcements"
```

---

### Task 19: Implement POST /api/admin/announcements/[id]/publish

**Files:**
- Create: `apps/web/app/api/admin/announcements/[id]/publish/route.ts`

**Step 1: Create publish endpoint**

Create directory and file:

```bash
mkdir -p apps/web/app/api/admin/announcements/[id]/publish
```

Create `apps/web/app/api/admin/announcements/[id]/publish/route.ts`:

```typescript
import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { createNotificationsForUsers } from '@/lib/notifications'

/**
 * POST /api/admin/announcements/[id]/publish
 * Publish announcement to all users (admin only)
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const announcementId = params.id

    // Get announcement
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    })

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    if (announcement.isPublished) {
      return NextResponse.json(
        { error: 'Announcement already published' },
        { status: 400 }
      )
    }

    // Update announcement as published
    await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    })

    // Get all user IDs
    const users = await prisma.user.findMany({
      select: { id: true },
    })

    // Create notifications for all users
    const notificationsSent = await createNotificationsForUsers({
      userIds: users.map((u) => u.id),
      type: 'ANNOUNCEMENT',
      data: {
        announcementId: announcement.id,
        title: announcement.title,
        message: announcement.message,
      },
    })

    return NextResponse.json({
      success: true,
      notificationsSent,
    })
  } catch (error) {
    console.error('Error publishing announcement:', error)
    return NextResponse.json(
      { error: 'Failed to publish announcement' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/app/api/admin/announcements/[id]/publish/route.ts
git commit -m "feat(api): implement POST /api/admin/announcements/[id]/publish"
```

---

### Task 20: Create Admin Announcements Page

**Files:**
- Create: `apps/web/app/admin/announcements/page.tsx`

**Step 1: Create announcements page**

Create directory and file:

```bash
mkdir -p apps/web/app/admin/announcements
```

Create `apps/web/app/admin/announcements/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Announcement {
  id: string
  title: string
  message: string
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  createdBy: {
    name: string | null
    email: string | null
  }
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')
  const router = useRouter()

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin/announcements')
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAnnouncements = announcements.filter((a) => {
    if (filter === 'draft') return !a.isPublished
    if (filter === 'published') return a.isPublished
    return true
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-coliseum-sand">
          Announcements
        </h1>
        <Link
          href="/admin/announcements/new"
          className="btn-raised px-6 py-2 text-sm"
        >
          Create New
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'draft', 'published'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-4 py-2 text-sm font-semibold uppercase transition-all
              ${
                filter === f
                  ? 'btn-pressed bg-coliseum-bronze/20 text-coliseum-bronze'
                  : 'btn-raised text-coliseum-sand/60 hover:text-coliseum-sand'
              }
            `}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Announcements Table */}
      {loading ? (
        <div className="text-center py-12 text-coliseum-sand/60">
          Loading...
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-12 text-coliseum-sand/60">
          No announcements found
        </div>
      ) : (
        <div className="panel-embossed overflow-hidden">
          <table className="w-full">
            <thead className="bg-coliseum-black/50">
              <tr>
                <th className="px-4 py-3 text-left text-coliseum-bronze text-sm font-bold uppercase">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-coliseum-bronze text-sm font-bold uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-coliseum-bronze text-sm font-bold uppercase">
                  Published
                </th>
                <th className="px-4 py-3 text-left text-coliseum-bronze text-sm font-bold uppercase">
                  Author
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAnnouncements.map((announcement) => (
                <tr
                  key={announcement.id}
                  className="border-t border-coliseum-bronze/20 hover:bg-coliseum-black/30 cursor-pointer"
                  onClick={() => router.push(`/admin/announcements/${announcement.id}`)}
                >
                  <td className="px-4 py-3 text-coliseum-sand">
                    {announcement.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`
                        px-2 py-1 text-xs font-bold rounded
                        ${
                          announcement.isPublished
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-yellow-900/50 text-yellow-400'
                        }
                      `}
                    >
                      {announcement.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-coliseum-sand/60 text-sm">
                    {announcement.publishedAt
                      ? new Date(announcement.publishedAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-coliseum-sand/60 text-sm">
                    {announcement.createdBy.name || announcement.createdBy.email}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add apps/web/app/admin/announcements/page.tsx
git commit -m "feat(ui): create admin announcements list page"
```

---

### Task 21: Create Announcement Form Page

**Files:**
- Create: `apps/web/app/admin/announcements/new/page.tsx`

**Step 1: Create new announcement form**

Create directory and file:

```bash
mkdir -p apps/web/app/admin/announcements/new
```

Create `apps/web/app/admin/announcements/new/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewAnnouncementPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  const handleSaveDraft = async () => {
    if (!title.trim() || !message.trim()) {
      alert('Title and message are required')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message }),
      })

      if (res.ok) {
        router.push('/admin/announcements')
      } else {
        alert('Failed to save announcement')
      }
    } catch (error) {
      console.error('Error saving announcement:', error)
      alert('Failed to save announcement')
    } finally {
      setProcessing(false)
    }
  }

  const handlePublishNow = async () => {
    if (!title.trim() || !message.trim()) {
      alert('Title and message are required')
      return
    }

    const userCount = '?' // We don't have this info client-side, just show generic confirmation
    if (!confirm(`Send notification to all users?`)) {
      return
    }

    setProcessing(true)
    try {
      // Create announcement first
      const createRes = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message }),
      })

      if (!createRes.ok) {
        alert('Failed to create announcement')
        setProcessing(false)
        return
      }

      const { id } = await createRes.json()

      // Publish it immediately
      const publishRes = await fetch(`/api/admin/announcements/${id}/publish`, {
        method: 'POST',
      })

      if (publishRes.ok) {
        const data = await publishRes.json()
        alert(`Announcement published to ${data.notificationsSent} users!`)
        router.push('/admin/announcements')
      } else {
        alert('Failed to publish announcement')
      }
    } catch (error) {
      console.error('Error publishing announcement:', error)
      alert('Failed to publish announcement')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-coliseum-sand mb-6">
        Create Announcement
      </h1>

      <div className="panel-embossed p-6 space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-coliseum-bronze font-semibold mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="Announcement title..."
            className="w-full panel-inset px-4 py-2 text-coliseum-sand bg-coliseum-black/50 border border-coliseum-bronze/30"
          />
          <p className="text-coliseum-sand/60 text-xs mt-1">
            {title.length}/100 characters
          </p>
        </div>

        {/* Message Textarea */}
        <div>
          <label className="block text-coliseum-bronze font-semibold mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
            placeholder="Announcement message..."
            className="w-full panel-inset px-4 py-2 text-coliseum-sand bg-coliseum-black/50 border border-coliseum-bronze/30 resize-none"
          />
        </div>

        {/* Preview */}
        <div>
          <label className="block text-coliseum-bronze font-semibold mb-2">
            Preview
          </label>
          <div className="panel-inset p-4 bg-coliseum-black/50">
            <h3 className="text-coliseum-sand font-bold text-lg mb-2">
              {title || 'Title preview...'}
            </h3>
            <p className="text-coliseum-sand/80 whitespace-pre-wrap">
              {message || 'Message preview...'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSaveDraft}
            disabled={processing}
            className="btn-raised flex-1 py-3 text-sm bg-coliseum-stone/50 disabled:opacity-50"
          >
            {processing ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={handlePublishNow}
            disabled={processing}
            className="btn-raised flex-1 py-3 text-sm disabled:opacity-50"
          >
            {processing ? 'Publishing...' : 'Publish Now'}
          </button>
          <button
            onClick={() => router.back()}
            className="btn-raised px-6 py-3 text-sm bg-coliseum-stone/50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add apps/web/app/admin/announcements/new/page.tsx
git commit -m "feat(ui): create announcement form page"
```

---

## Phase 4: Real-time & Polish

### Task 22: Add WebSocket Listener for Challenges

**Files:**
- Modify: `apps/web/hooks/useNotifications.ts`

**Step 1: Add WebSocket import and listener**

Add import at top:

```typescript
import { useSocket } from './useSocket'
```

**Step 2: Add WebSocket listener in useNotifications hook**

Add inside the hook (after fetchNotifications callback):

```typescript
  const socket = useSocket()

  // Listen for real-time challenge notifications
  useEffect(() => {
    if (!socket) return

    const handleChallengeReceived = (data: any) => {
      // Refresh notifications when challenge received
      fetchNotifications()
    }

    socket.on('challenge:received', handleChallengeReceived)

    return () => {
      socket.off('challenge:received', handleChallengeReceived)
    }
  }, [socket, fetchNotifications])
```

**Step 3: Emit challenge event from game server**

Modify `apps/game-server/src/sockets/match-handlers.ts` - find the challenge creation code and add:

```typescript
// After challenge created, emit to opponent
io.to(`user:${opponentId}`).emit('challenge:received', {
  challengeId: challenge.id,
  from: challengerId,
})
```

**Step 4: Commit**

```bash
git add apps/web/hooks/useNotifications.ts
git commit -m "feat(realtime): add WebSocket listener for challenge notifications"
```

---

### Task 23: Add Admin Log Creation on Template Changes

**Files:**
- Modify: `apps/web/app/api/admin/equipment-templates/[id]/route.ts`
- Modify: `apps/web/app/api/admin/action-templates/[id]/route.ts`

**Step 1: Import notification helper**

Add to both files:

```typescript
import { prisma } from '@gladiator/database/src/client'
import { createNotification } from '@/lib/notifications'
```

**Step 2: Add admin log notification in equipment template create**

Find POST handler in `apps/web/app/api/admin/equipment-templates/route.ts` (create handler) and add after template creation:

```typescript
    // Create admin log notification for all admins
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    })

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'ADMIN_LOG',
        data: {
          action: 'created',
          entityType: 'equipment-template',
          entityId: template.id,
          performedBy: session.user.name || session.user.email || 'Admin',
          details: { key: template.key, name: template.name },
        },
      })
    }
```

**Step 3: Repeat for action templates**

Add similar code to `apps/web/app/api/admin/action-templates/route.ts` POST handler:

```typescript
    // Create admin log notification for all admins
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    })

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'ADMIN_LOG',
        data: {
          action: 'created',
          entityType: 'action-template',
          entityId: template.id,
          performedBy: session.user.name || session.user.email || 'Admin',
          details: { key: template.key, name: template.name },
        },
      })
    }
```

**Step 4: Commit**

```bash
git add apps/web/app/api/admin/equipment-templates/route.ts apps/web/app/api/admin/action-templates/route.ts
git commit -m "feat(admin): add admin log notifications for template creation"
```

---

### Task 24: Add Error Handling and Loading States

**Files:**
- Modify: `apps/web/components/rpg-ui/PersistentHUD.tsx`

**Step 1: Add error state for gold**

Add state:

```typescript
  const [goldError, setGoldError] = useState(false)
```

**Step 2: Update gold fetch with error handling**

Modify gold fetch effect:

```typescript
  // Fetch user gold
  useEffect(() => {
    if (session?.user?.id) {
      setGoldError(false)
      fetch('/api/gold/balance')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch gold')
          return res.json()
        })
        .then((data) => setGold(data.balance ?? 0))
        .catch((error) => {
          console.error('Error fetching gold:', error)
          setGoldError(true)
          setGold(0)
        })
    } else {
      setGold(null)
      setGoldError(false)
    }
  }, [session?.user?.id])
```

**Step 3: Update gold display with error state**

```tsx
          <span className="text-coliseum-bronze font-bold text-sm sm:text-base">
            {goldError ? (
              <span className="text-red-400" title="Failed to load gold">
                ---
              </span>
            ) : gold !== null ? (
              formatGold(gold)
            ) : (
              '---'
            )}
          </span>
```

**Step 4: Commit**

```bash
git add apps/web/components/rpg-ui/PersistentHUD.tsx
git commit -m "feat(ui): add error handling for gold display"
```

---

### Task 25: Update Documentation

**Files:**
- Create: `docs/features/notifications.md`

**Step 1: Create notification feature documentation**

Create `docs/features/notifications.md`:

```markdown
# Notification System

## Overview

Unified notification system for Crucible with real-time updates, user/admin notifications, and admin announcement management.

## Features

- **Real Gold Display:** Shows actual user gold balance from database
- **Unified Notifications:** Single dropdown for all notification types
- **User Notifications:** Friend requests, arena challenges, game announcements
- **Admin Notifications:** Activity log for game data changes (templates, bundles)
- **Real-time Updates:** WebSocket for challenges, polling for others
- **Admin Announcements:** UI for creating and publishing game updates

## Notification Types

| Type | Persistence | Real-time | Expiry | User Type |
|------|-------------|-----------|--------|-----------|
| Friend Request | Database | Polling (5s) | Never | User |
| Arena Challenge | Database | WebSocket | 30 seconds | User |
| Announcement | Database | Polling (5s) | Never | User |
| Admin Log | Database | Manual refresh | Never | Admin |

## API Endpoints

### Core Notifications

- **GET /api/notifications** - Fetch all active notifications
- **POST /api/notifications/mark-read** - Mark notification(s) as read
- **GET /api/notifications/unread-count** - Get badge count

### Admin Announcements

- **GET /api/admin/announcements** - List all announcements (admin only)
- **POST /api/admin/announcements** - Create draft announcement (admin only)
- **POST /api/admin/announcements/[id]/publish** - Publish to all users (admin only)

## Database Models

- **Notification** - Stores user notifications with type discrimination
- **Announcement** - Stores admin-created announcements
- **NotificationType** - Enum: FRIEND_REQUEST, CHALLENGE, ANNOUNCEMENT, ADMIN_LOG, MESSAGE

## Components

- **PersistentHUD** - Shows gold and notification badge
- **NotificationDropdown** - Dropdown list of notifications
- **NotificationItem** - Individual notification display
- **NotificationModal** - Action modal for notifications

## Admin Usage

1. Navigate to `/admin/announcements`
2. Click "Create New"
3. Enter title and message
4. Click "Publish Now" to send to all users
5. Or "Save as Draft" to publish later

## Technical Details

- **Polling:** Unread count polled every 5 seconds
- **WebSocket:** Challenge notifications are real-time via `challenge:received` event
- **Expiry:** Challenges expire after 30 seconds
- **Batch Creation:** Announcements create notifications in batch for all users

## Future Enhancements

- Direct messaging system
- Notification preferences (mute types)
- Push notifications (browser/mobile)
- Email digest
```

**Step 2: Commit**

```bash
git add docs/features/notifications.md
git commit -m "docs: add notification system feature documentation"
```

---

## Testing & Verification

### Manual Testing Checklist

**Phase 1: Basic Functionality**
- [ ] Gold display shows real balance
- [ ] Notification badge shows correct unread count
- [ ] Badge updates every 5 seconds via polling
- [ ] Clicking bell opens dropdown
- [ ] Clicking outside closes dropdown

**Phase 2: Friend Requests**
- [ ] Sending friend request creates notification for recipient
- [ ] Clicking notification opens modal
- [ ] Accepting friend request works and dismisses notification
- [ ] Declining friend request dismisses notification
- [ ] Notification marked as read after interaction

**Phase 3: Challenges**
- [ ] Creating challenge creates notification for opponent
- [ ] Challenge notification appears in real-time (WebSocket)
- [ ] Countdown timer shows and updates
- [ ] Accept button disabled when expired
- [ ] Accepting challenge navigates to match
- [ ] Declining challenge dismisses notification

**Phase 4: Admin**
- [ ] Admin sees admin log notifications
- [ ] Regular users don't see admin logs
- [ ] Creating template creates admin log for all admins
- [ ] Admin can create announcements
- [ ] Publishing announcement creates notification for all users
- [ ] Announcement notification shows title and message

**Phase 5: Edge Cases**
- [ ] Expired challenges don't appear in list
- [ ] Mark all as read works
- [ ] Gold display shows "---" on error
- [ ] Notification count handles 10+ correctly (shows "9+")
- [ ] Modal prevents clicks from closing when interacting with content

---

## Final Commit

```bash
git add .
git commit -m "feat: complete notification system implementation

- Add real gold display to PersistentHUD
- Implement unified notification system
- Add friend request and challenge notifications
- Add admin announcement management
- Add WebSocket for real-time challenge notifications
- Add admin log for template creation
- Update documentation
"
```

---

**End of Implementation Plan**
