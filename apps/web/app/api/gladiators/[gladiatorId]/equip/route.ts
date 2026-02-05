import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

/**
 * POST /api/gladiators/[gladiatorId]/equip
 * Equip equipment to a gladiator
 * Sprint 5: Task 5 - Equipment Integration
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

    const { equipmentId, slot } = await req.json()

    if (!equipmentId || !slot) {
      return NextResponse.json(
        { error: 'Equipment ID and slot required' },
        { status: 400 }
      )
    }

    // Valid slots: MAIN_HAND, CHEST (for demo)
    if (!['MAIN_HAND', 'CHEST'].includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
    }

    // Verify gladiator ownership
    const gladiator = await prisma.gladiator.findUnique({
      where: { id: params.gladiatorId },
    })

    if (!gladiator || gladiator.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Gladiator not found' }, { status: 404 })
    }

    // Verify equipment ownership
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    })

    if (!equipment || equipment.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    // Check if slot matches equipment type
    if (slot === 'MAIN_HAND' && equipment.type !== 'WEAPON') {
      return NextResponse.json(
        { error: 'Can only equip weapons in MAIN_HAND slot' },
        { status: 400 }
      )
    }
    if (slot === 'CHEST' && equipment.type !== 'ARMOR') {
      return NextResponse.json(
        { error: 'Can only equip armor in CHEST slot' },
        { status: 400 }
      )
    }

    // Unequip existing item in that slot (if any)
    await prisma.gladiatorEquippedItem.deleteMany({
      where: {
        gladiatorId: params.gladiatorId,
        slot,
      },
    })

    // Equip new item
    await prisma.gladiatorEquippedItem.create({
      data: {
        gladiatorId: params.gladiatorId,
        equipmentId,
        slot,
      },
    })

    console.log(
      `⚔️ Gladiator ${params.gladiatorId} equipped ${equipment.name} in ${slot}`
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error equipping item:', error)
    return NextResponse.json(
      { error: 'Failed to equip item' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/gladiators/[gladiatorId]/equip
 * Unequip equipment from a gladiator
 */
export async function DELETE(
  req: Request,
  { params }: { params: { gladiatorId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const slot = searchParams.get('slot')

    if (!slot) {
      return NextResponse.json({ error: 'Slot required' }, { status: 400 })
    }

    // Verify gladiator ownership
    const gladiator = await prisma.gladiator.findUnique({
      where: { id: params.gladiatorId },
    })

    if (!gladiator || gladiator.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Gladiator not found' }, { status: 404 })
    }

    // Unequip item
    await prisma.gladiatorEquippedItem.deleteMany({
      where: {
        gladiatorId: params.gladiatorId,
        slot,
      },
    })

    console.log(`⚔️ Gladiator ${params.gladiatorId} unequipped item from ${slot}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unequipping item:', error)
    return NextResponse.json(
      { error: 'Failed to unequip item' },
      { status: 500 }
    )
  }
}
