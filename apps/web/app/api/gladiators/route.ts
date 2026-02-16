import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/gladiators
 * Returns current user's gladiators (for Camp and selection)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gladiators = await prisma.gladiator.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tokenId: true,
        name: true,
        class: true,
        level: true,
        xp: true,
        constitution: true,
        strength: true,
        dexterity: true,
        speed: true,
        defense: true,
        magicResist: true,
        arcana: true,
        faith: true,
        skillPointsAvailable: true,
        statPointsAvailable: true,
        unlockedSkills: true,
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
