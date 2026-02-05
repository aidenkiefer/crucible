import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

/**
 * GET /api/gold/balance
 * Get user's gold balance
 * Sprint 5: Task 4 - Gold Economy
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userGold = await prisma.userGold.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({
      balance: userGold?.balance || 0,
    })
  } catch (error) {
    console.error('Error fetching gold balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gold balance' },
      { status: 500 }
    )
  }
}
