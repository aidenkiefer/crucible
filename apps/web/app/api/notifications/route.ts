import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

type NotificationType = 'FRIEND_REQUEST' | 'CHALLENGE' | 'ANNOUNCEMENT' | 'ADMIN_LOG'

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
