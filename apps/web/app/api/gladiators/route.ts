import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

/**
 * GET /api/gladiators
 * Returns current user's gladiators (for Camp and selection)
 */
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gladiators = await prisma.gladiator.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tokenId: true,
        class: true,
        level: true,
        xp: true,
        skillPointsAvailable: true,
        statPointsAvailable: true,
      },
    })

    return NextResponse.json({ gladiators })
  } catch (error) {
    console.error('Error fetching gladiators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gladiators' },
      { status: 500 }
    )
  }
}
