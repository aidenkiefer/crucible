import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

/**
 * GET /api/loot-boxes
 * Returns user's loot box inventory
 * Sprint 5: Loot Box System
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lootBoxes = await prisma.lootBox.findMany({
      where: {
        ownerId: session.user.id,
      },
      orderBy: [
        { opened: 'asc' }, // Unopened first
        { createdAt: 'desc' },
      ],
      include: {
        rewardedEquipment: {
          select: {
            id: true,
            name: true,
            type: true,
            rarity: true,
          },
        },
      },
    })

    return NextResponse.json({ lootBoxes })
  } catch (error) {
    console.error('Error fetching loot boxes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loot boxes' },
      { status: 500 }
    )
  }
}
