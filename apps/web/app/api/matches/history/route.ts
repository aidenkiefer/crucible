import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

/**
 * GET /api/matches/history
 * Returns match history for the authenticated user
 * Sprint 5: Match Persistence
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const matchType = searchParams.get('type') // 'cpu', 'ranked', 'casual', or null for all
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    const where: any = {
      OR: [
        { player1Id: session.user.id },
        { player2Id: session.user.id },
      ],
      completedAt: { not: null },
    }

    if (matchType) {
      where.matchType = matchType
    }

    // Fetch matches
    const matches = await prisma.match.findMany({
      where,
      orderBy: { completedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        matchType: true,
        winnerId: true,
        durationSeconds: true,
        completedAt: true,
        matchStats: true,
        rewardType: true,
        rewardAmount: true,
        lootBoxTier: true,
        player1Gladiator: {
          select: {
            id: true,
            class: true,
            owner: { select: { username: true } },
          },
        },
        player2Gladiator: {
          select: {
            id: true,
            class: true,
            owner: { select: { username: true } },
          },
        },
        isCpuMatch: true,
      },
    })

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Error fetching match history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch match history' },
      { status: 500 }
    )
  }
}
