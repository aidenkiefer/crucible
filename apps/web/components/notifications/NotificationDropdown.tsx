'use client'

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

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 panel-embossed z-50 max-h-[80vh] flex flex-col border-2 border-coliseum-bronze/40">
        <div className="px-4 py-3 border-b-2 border-coliseum-bronze/40 flex items-center justify-between bg-coliseum-black/50">
          <h3 className="text-coliseum-sand font-bold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAsRead()}
              className="text-coliseum-bronze text-xs hover:text-coliseum-sand transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
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
