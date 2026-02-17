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
