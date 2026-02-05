import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import {
  determineCraftedRarity,
  determineCraftedType,
  generateCraftedStats,
  generateCraftedName,
  type EquipmentRarity,
} from '@gladiator/shared/src/crafting/crafting-system'

/**
 * POST /api/equipment/craft
 * Craft 3 items into 1 better item (3→1 crafting)
 * Sprint 5: Task 4 - Crafting & Salvaging
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { equipmentIds } = await req.json()

    if (!equipmentIds || !Array.isArray(equipmentIds) || equipmentIds.length !== 3) {
      return NextResponse.json(
        { error: 'Exactly 3 equipment IDs required for crafting' },
        { status: 400 }
      )
    }

    // Verify ownership
    const equipment = await prisma.equipment.findMany({
      where: {
        id: { in: equipmentIds },
        ownerId: session.user.id,
      },
    })

    if (equipment.length !== 3) {
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
        { error: 'Cannot craft with equipped items. Unequip them first.' },
        { status: 400 }
      )
    }

    // Determine crafted item properties
    const rarities = equipment.map((e) => e.rarity as EquipmentRarity)
    const types = equipment.map((e) => e.type)

    const craftedRarity = determineCraftedRarity(rarities)
    const craftedType = determineCraftedType(types)
    const craftedStats = generateCraftedStats(craftedRarity)
    const craftedName = generateCraftedName(craftedType, craftedRarity)

    // Create crafted item and delete source items
    const craftedItem = await prisma.$transaction(async (tx) => {
      // Delete source equipment
      await tx.equipment.deleteMany({
        where: { id: { in: equipmentIds } },
      })

      // Create crafted equipment
      return tx.equipment.create({
        data: {
          ownerId: session.user.id,
          type: craftedType,
          rarity: craftedRarity,
          name: craftedName,
          rolledMods: {
            baseStatMods: craftedStats,
            crafted: true,
            sourceRarities: rarities,
          },
          grantedPerkIds: [],
        },
      })
    })

    console.log(
      `🔨 User ${session.user.id} crafted ${craftedName} (${craftedRarity}) from 3 items`
    )

    return NextResponse.json({
      success: true,
      craftedItem: {
        id: craftedItem.id,
        name: craftedItem.name,
        type: craftedItem.type,
        rarity: craftedItem.rarity,
        rolledMods: craftedItem.rolledMods,
      },
    })
  } catch (error) {
    console.error('Error crafting equipment:', error)
    return NextResponse.json(
      { error: 'Failed to craft equipment' },
      { status: 500 }
    )
  }
}
