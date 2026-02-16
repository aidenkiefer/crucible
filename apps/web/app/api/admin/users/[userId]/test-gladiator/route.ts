import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { rollWeightedStatsContractStyle } from '@gladiator/shared/src/classes/class-stat-weights'
import { GladiatorClass } from '@gladiator/shared/src/types'

const TEST_TOKEN_ID_MIN = 900_000
const VALID_CLASSES = ['Tank', 'Legionnaire', 'Duelist', 'Mage', 'Monk'] as const

/**
 * POST /api/admin/users/[userId]/test-gladiator
 * Create a test gladiator for the given user (admin only). Same flow as /api/gladiators/test
 * but targets the specified user instead of the session user.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await params
    const body = await req.json()
    const classInput = typeof body.class === 'string' ? body.class.trim() : ''
    if (!VALID_CLASSES.includes(classInput as (typeof VALID_CLASSES)[number])) {
      return NextResponse.json(
        { error: 'Invalid class. Must be one of: Tank, Legionnaire, Duelist, Mage, Monk.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const nextTokenId = await getNextTestTokenId()
    const gladiatorClass = classInput as GladiatorClass
    const stats = rollWeightedStatsContractStyle(gladiatorClass)

    const gladiator = await prisma.gladiator.create({
      data: {
        tokenId: nextTokenId,
        ownerId: user.id,
        class: classInput,
        level: 1,
        xp: 0,
        constitution: stats.constitution,
        strength: stats.strength,
        dexterity: stats.dexterity,
        speed: stats.speed,
        defense: stats.defense,
        magicResist: stats.magicResist,
        arcana: stats.arcana,
        faith: stats.faith,
        skillPointsAvailable: 0,
        statPointsAvailable: 0,
        unlockedSkills: [],
      },
    })

    return NextResponse.json({
      success: true,
      gladiator: {
        id: gladiator.id,
        tokenId: gladiator.tokenId,
        class: gladiator.class,
        name: gladiator.name,
        level: gladiator.level,
        xp: gladiator.xp,
      },
    })
  } catch (error) {
    console.error('Admin create test gladiator failed:', error)
    return NextResponse.json(
      { error: 'Failed to create test gladiator' },
      { status: 500 }
    )
  }
}

async function getNextTestTokenId(): Promise<number> {
  const max = await prisma.gladiator.findFirst({
    where: { tokenId: { gte: TEST_TOKEN_ID_MIN } },
    orderBy: { tokenId: 'desc' },
    select: { tokenId: true },
  })
  return max ? max.tokenId + 1 : TEST_TOKEN_ID_MIN
}
