import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/equipment
 * Returns user's equipment inventory
 * Sprint 5: Task 5 - Equipment Integration
 * Option 1: Enriched with displayName and iconUrl from templates
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
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
        template: {
          select: {
            name: true,
            ui: true,
          },
        },
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

    // Enrich each equipment item with displayName and iconUrl
    const enrichedEquipment = equipment.map((item) => {
      const template = item.template
      const ui = template?.ui as any

      // Resolve displayName: ui.displayName > template.name > item.name
      const displayName = ui?.displayName || template?.name || item.name

      // Resolve iconUrl: only if template.ui.icon exists and source is LOCAL_PUBLIC
      let iconUrl: string | undefined
      if (ui?.icon?.source === 'LOCAL_PUBLIC' && ui?.icon?.path) {
        iconUrl = ui.icon.path
      }

      // Return item with enriched fields
      return {
        ...item,
        displayName,
        ...(iconUrl && { iconUrl }),
      }
    })

    return NextResponse.json({ equipment: enrichedEquipment })
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    )
  }
}
