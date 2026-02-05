import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

const VALID_STATS = [
  'constitution',
  'strength',
  'dexterity',
  'speed',
  'defense',
  'magicResist',
  'arcana',
  'faith',
] as const

/**
 * POST /api/gladiators/[gladiatorId]/stats
 * Spend 1 stat point on a base stat (on level up you get 3 points to allocate)
 */
export async function POST(
  req: Request,
  { params }: { params: { gladiatorId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { stat } = await req.json()

    if (!stat || !VALID_STATS.includes(stat)) {
      return NextResponse.json(
        { error: `Invalid stat. Must be one of: ${VALID_STATS.join(', ')}` },
        { status: 400 }
      )
    }

    const gladiator = await prisma.gladiator.findUnique({
      where: { id: params.gladiatorId },
    })

    if (!gladiator) {
      return NextResponse.json({ error: 'Gladiator not found' }, { status: 404 })
    }

    if (gladiator.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Not your gladiator' }, { status: 403 })
    }

    if (gladiator.statPointsAvailable < 1) {
      return NextResponse.json(
        { error: 'No stat points available to spend' },
        { status: 400 }
      )
    }

    await prisma.gladiator.update({
      where: { id: params.gladiatorId },
      data: {
        statPointsAvailable: { decrement: 1 },
        [stat]: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      stat,
      message: `+1 ${stat}`,
    })
  } catch (error) {
    console.error('Error allocating stat:', error)
    return NextResponse.json(
      { error: 'Failed to allocate stat' },
      { status: 500 }
    )
  }
}
