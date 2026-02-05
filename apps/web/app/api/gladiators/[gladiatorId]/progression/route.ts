import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

/**
 * GET /api/gladiators/[gladiatorId]/progression
 * Returns gladiator's progression stats (level, XP, skill points)
 * Sprint 5: Task 2 - XP & Leveling
 */
export async function GET(
  req: Request,
  { params }: { params: { gladiatorId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gladiator = await prisma.gladiator.findUnique({
      where: { id: params.gladiatorId },
      select: {
        id: true,
        level: true,
        xp: true,
        skillPointsAvailable: true,
        constitution: true,
        strength: true,
        dexterity: true,
        speed: true,
        defense: true,
        magicResist: true,
        arcana: true,
        faith: true,
      },
    })

    if (!gladiator) {
      return NextResponse.json({ error: 'Gladiator not found' }, { status: 404 })
    }

    // Calculate XP needed for next level
    const MAX_LEVEL = 20
    const xpForNextLevel =
      gladiator.level >= MAX_LEVEL
        ? 0
        : gladiator.level * 100 + (gladiator.level - 1) * 50

    return NextResponse.json({
      gladiator: {
        ...gladiator,
        xpForNextLevel,
        isMaxLevel: gladiator.level >= MAX_LEVEL,
      },
    })
  } catch (error) {
    console.error('Error fetching gladiator progression:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progression' },
      { status: 500 }
    )
  }
}
