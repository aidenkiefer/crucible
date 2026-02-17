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
