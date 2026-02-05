import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { calculateSalvageValue } from '@gladiator/shared/src/crafting/crafting-system'

/**
 * POST /api/equipment/salvage
 * Salvage equipment for Gold
 * Sprint 5: Task 4 - Crafting & Salvaging
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { equipmentIds } = await req.json()

    if (!equipmentIds || !Array.isArray(equipmentIds) || equipmentIds.length === 0) {
      return NextResponse.json(
        { error: 'Equipment IDs array required' },
        { status: 400 }
      )
    }

    // Verify ownership and calculate total gold
    const equipment = await prisma.equipment.findMany({
      where: {
        id: { in: equipmentIds },
        ownerId: session.user.id,
      },
    })

    if (equipment.length !== equipmentIds.length) {
      return NextResponse.json(
        { error: 'Some equipment not found or not owned by you' },
        { status: 403 }
      )
    }

    // Check if any equipment is currently equipped
    const equippedCount = await prisma.gladiatorEquippedItem.count({
      where: {
        equipmentId: { in: equipmentIds },
      },
    })

    if (equippedCount > 0) {
      return NextResponse.json(
        { error: 'Cannot salvage equipped items. Unequip them first.' },
        { status: 400 }
      )
    }

    // Calculate total salvage value
    const totalGold = equipment.reduce((sum, item) => {
      return sum + calculateSalvageValue(item.rarity as any)
    }, 0)

    // Delete equipment and award gold
    await prisma.$transaction(async (tx) => {
      // Delete equipment
      await tx.equipment.deleteMany({
        where: { id: { in: equipmentIds } },
      })

      // Award gold (create or update UserGold)
      await tx.userGold.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          balance: totalGold,
        },
        update: {
          balance: { increment: totalGold },
        },
      })
    })

    console.log(
      `♻️ User ${session.user.id} salvaged ${equipment.length} items for ${totalGold} gold`
    )

    return NextResponse.json({
      success: true,
      goldAwarded: totalGold,
      itemsSalvaged: equipment.length,
    })
  } catch (error) {
    console.error('Error salvaging equipment:', error)
    return NextResponse.json(
      { error: 'Failed to salvage equipment' },
      { status: 500 }
    )
  }
}
