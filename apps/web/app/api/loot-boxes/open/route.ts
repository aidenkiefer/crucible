import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { rollLootBoxItem } from '@gladiator/shared/src/loot/starter-gear'

/**
 * POST /api/loot-boxes/open
 * Opens a loot box and awards random starter gear
 * Sprint 5: Loot Box System
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lootBoxId } = await req.json()

    if (!lootBoxId) {
      return NextResponse.json({ error: 'Loot box ID required' }, { status: 400 })
    }

    // Find loot box
    const lootBox = await prisma.lootBox.findUnique({
      where: { id: lootBoxId },
    })

    if (!lootBox) {
      return NextResponse.json({ error: 'Loot box not found' }, { status: 404 })
    }

    if (lootBox.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Not your loot box' }, { status: 403 })
    }

    if (lootBox.opened) {
      return NextResponse.json({ error: 'Loot box already opened' }, { status: 400 })
    }

    // Roll random item from loot box tier
    const rolledItem = rollLootBoxItem(lootBox.tier)

    // Create Equipment instance (starter gear cannot be crafted or salvaged)
    const equipment = await prisma.equipment.create({
      data: {
        ownerId: session.user.id,
        type: rolledItem.type,
        rarity: 'Common', // Starter gear is always Common
        name: rolledItem.name,
        isStarterGear: true,
        // Store starter gear configuration in rolledMods
        rolledMods: {
          key: rolledItem.key,
          baseStatMods: rolledItem.baseStatMods,
          scaling: rolledItem.scaling || {},
          tags: rolledItem.tags,
          description: rolledItem.description,
          subtype: rolledItem.subtype,
        },
        grantedPerkIds: [], // Starter gear has no perks
        // Legacy stat fields (for backward compatibility)
        attackBonus: rolledItem.baseStatMods.strength || null,
        defenseBonus: rolledItem.baseStatMods.defense || null,
        speedBonus: rolledItem.baseStatMods.speed || null,
      },
    })

    // Mark loot box as opened
    await prisma.lootBox.update({
      where: { id: lootBoxId },
      data: {
        opened: true,
        openedAt: new Date(),
        rewardedEquipmentId: equipment.id,
      },
    })

    console.log(`✨ User ${session.user.id} opened ${lootBox.tier} loot box, received: ${rolledItem.name}`)

    return NextResponse.json({
      success: true,
      equipment: {
        id: equipment.id,
        name: equipment.name,
        type: equipment.type,
        rarity: equipment.rarity,
        rolledMods: equipment.rolledMods,
      },
    })
  } catch (error) {
    console.error('Error opening loot box:', error)
    return NextResponse.json(
      { error: 'Failed to open loot box' },
      { status: 500 }
    )
  }
}
