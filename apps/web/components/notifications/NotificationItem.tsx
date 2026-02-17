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
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-coliseum-sand font-semibold text-sm truncate">
            {title}
          </p>
          <p className="text-coliseum-sand/60 text-xs mt-1">{time}</p>
        </div>
        {!notification.isRead && (
          <div className="w-2 h-2 rounded-full bg-coliseum-bronze flex-shrink-0 mt-2" />
        )}
      </div>
    </button>
  )
}
