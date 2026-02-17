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
            <button onClick={onClose} className="btn-raised w-full py-2 text-sm">
              Dismiss
            </button>
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
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
        onClick={onClose}
      >
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
