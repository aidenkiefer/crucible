import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { rollWeightedStatsContractStyle } from '@gladiator/shared/src/classes/class-stat-weights'
import { GladiatorClass } from '@gladiator/shared/src/types'

const TEST_TOKEN_ID_MIN = 900_000
const VALID_CLASSES = ['Tank', 'Legionnaire', 'Duelist', 'Mage', 'Monk'] as const

/**
 * POST /api/gladiators/test
 * Create a new test gladiator (off-chain): pick class, roll stats with contract-style
 * weighted algorithm, save to DB. Same flow as on-chain mint (class → stats → DB);
 * naming is then offered in Camp.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const classInput = typeof body.class === 'string' ? body.class.trim() : ''
    if (!VALID_CLASSES.includes(classInput as (typeof VALID_CLASSES)[number])) {
      return NextResponse.json(
        { error: 'Invalid class. Must be one of: Tank, Legionnaire, Duelist, Mage, Monk.' },
        { status: 400 }
      )
    }

    const nextTokenId = await getNextTestTokenId()
    const gladiatorClass = classInput as GladiatorClass
    const stats = rollWeightedStatsContractStyle(gladiatorClass)

    const gladiator = await prisma.gladiator.create({
      data: {
        tokenId: nextTokenId,
        ownerId: session.user.id,
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
        constitution: gladiator.constitution,
        strength: gladiator.strength,
        dexterity: gladiator.dexterity,
        speed: gladiator.speed,
        defense: gladiator.defense,
        magicResist: gladiator.magicResist,
        arcana: gladiator.arcana,
        faith: gladiator.faith,
        skillPointsAvailable: gladiator.skillPointsAvailable,
        statPointsAvailable: gladiator.statPointsAvailable,
        unlockedSkills: gladiator.unlockedSkills,
      },
    })
  } catch (error) {
    console.error('Create test gladiator failed:', error)
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
