'use client'

import { useEffect, useState } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  duration?: number
}

interface SlideNotificationProps {
  notifications: Notification[]
  onDismiss: (id: string) => void
}

export function SlideNotification({ notifications, onDismiss }: SlideNotificationProps) {
  return (
    <div className="fixed top-[100px] right-6 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification
  onDismiss: (id: string) => void
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => {
      setIsVisible(true)
    })

    // Auto dismiss
    const duration = notification.duration || 3000
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(notification.id), 150) // Wait for slide out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [notification, onDismiss])

  const typeStyles = {
    success: 'border-green-500/50 bg-green-900/30',
    warning: 'border-amber-500/50 bg-amber-900/30',
    error: 'border-red-500/50 bg-red-900/30',
    info: 'border-coliseum-bronze/50 bg-coliseum-black/80',
  }

  const typeIcons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ',
  }

  return (
    <div
      className={`
        panel-embossed p-4 border-2 transition-all duration-150
        ${typeStyles[notification.type]}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[400px] opacity-0'}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{typeIcons[notification.type]}</span>
        <p className="text-coliseum-sand text-sm flex-1">{notification.message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onDismiss(notification.id), 150)
          }}
          className="text-coliseum-sand/60 hover:text-coliseum-sand text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}
