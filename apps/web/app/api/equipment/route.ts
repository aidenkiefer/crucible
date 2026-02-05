import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

/**
 * GET /api/equipment
 * Returns user's equipment inventory
 * Sprint 5: Task 5 - Equipment Integration
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const equipment = await prisma.equipment.findMany({
      where: {
        ownerId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        equippedBy: {
          select: {
            id: true,
            slot: true,
            gladiator: {
              select: {
                id: true,
                class: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ equipment })
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    )
  }
}
