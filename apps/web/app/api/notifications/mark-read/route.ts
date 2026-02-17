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
