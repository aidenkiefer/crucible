import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/shop/purchase
 * Purchase a loot box chest with gold
 * Sprint 5: Armory Shop - Gold-to-Chest Transaction
 */

// Server-side chest configuration (prevents client tampering)
const CHEST_CONFIG = {
  wooden: { tier: 'Common', price: 100 },
  stone: { tier: 'Uncommon', price: 250 },
  bronze: { tier: 'Rare', price: 500 },
  platinum: { tier: 'Epic', price: 1000 },
} as const

type ChestId = keyof typeof CHEST_CONFIG

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chestId } = await req.json()

    // Validate chestId
    if (!chestId || typeof chestId !== 'string') {
      return NextResponse.json(
        { error: 'Chest ID required' },
        { status: 400 }
      )
    }

    const validChestIds = ['wooden', 'stone', 'bronze', 'platinum']
    if (!validChestIds.includes(chestId)) {
      return NextResponse.json(
        { error: `Invalid chest ID: ${chestId}. Must be one of: ${validChestIds.join(', ')}` },
        { status: 400 }
      )
    }

    // Look up price/tier from server-side config
    const chestConfig = CHEST_CONFIG[chestId as ChestId]
    const { tier, price } = chestConfig

    // Use Prisma transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Get or create user gold record
      let userGold = await tx.userGold.findUnique({
        where: { userId: session.user!.id },
      })

      if (!userGold) {
        // Create initial gold record if it doesn't exist
        userGold = await tx.userGold.create({
          data: {
            userId: session.user!.id,
            balance: 0,
          },
        })
      }

      // Check if user has enough gold
      if (userGold.balance < price) {
        throw new Error('INSUFFICIENT_GOLD')
      }

      // Deduct gold from user's balance
      const updatedGold = await tx.userGold.update({
        where: { userId: session.user!.id },
        data: {
          balance: {
            decrement: price,
          },
        },
      })

      // Create unopened loot box
      const lootBox = await tx.lootBox.create({
        data: {
          ownerId: session.user!.id,
          tier: tier,
          opened: false,
        },
      })

      return {
        newBalance: updatedGold.balance,
        lootBox,
      }
    })

    console.log(
      `🛒 User ${session.user.id} purchased ${chestId} chest (${tier}) for ${price} gold. New balance: ${result.newBalance}`
    )

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      lootBox: {
        id: result.lootBox.id,
        tier: result.lootBox.tier,
        opened: result.lootBox.opened,
        createdAt: result.lootBox.createdAt,
      },
    })
  } catch (error) {
    console.error('Error purchasing chest:', error)

    // Handle insufficient gold error
    if (error instanceof Error && error.message === 'INSUFFICIENT_GOLD') {
      return NextResponse.json(
        { error: 'Insufficient gold balance' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to purchase chest' },
      { status: 500 }
    )
  }
}
