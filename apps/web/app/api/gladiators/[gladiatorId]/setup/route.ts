import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { rollWeightedStatsContractStyle } from '@gladiator/shared/src/classes/class-stat-weights'
import { GladiatorClass } from '@gladiator/shared/src/types'

/** tokenId >= TEST_TOKEN_ID_MIN is considered a test gladiator (off-chain, can run setup) */
const TEST_TOKEN_ID_MIN = 900_000

const VALID_CLASSES = ['Tank', 'Legionnaire', 'Duelist', 'Mage', 'Monk'] as const

/**
 * PATCH /api/gladiators/[gladiatorId]/setup
 * For test gladiators (tokenId >= 900000): set class and roll stats using the same
 * weighted algorithm as the on-chain contract. Does not change name or other fields.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { gladiatorId: string } }
) {
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

    const gladiator = await prisma.gladiator.findUnique({
      where: { id: params.gladiatorId },
    })

    if (!gladiator) {
      return NextResponse.json({ error: 'Gladiator not found' }, { status: 404 })
    }

    if (gladiator.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Not your gladiator' }, { status: 403 })
    }

    if (gladiator.tokenId < TEST_TOKEN_ID_MIN) {
      return NextResponse.json(
        { error: 'Only test gladiators (off-chain) can use setup. On-chain mints already have class and stats.' },
        { status: 400 }
      )
    }

    const gladiatorClass = classInput as GladiatorClass
    const seed = typeof body.seed === 'number' ? body.seed : undefined
    const stats = rollWeightedStatsContractStyle(gladiatorClass, seed)

    await prisma.gladiator.update({
      where: { id: params.gladiatorId },
      data: {
        class: classInput,
        constitution: stats.constitution,
        strength: stats.strength,
        dexterity: stats.dexterity,
        speed: stats.speed,
        defense: stats.defense,
        magicResist: stats.magicResist,
        arcana: stats.arcana,
        faith: stats.faith,
      },
    })

    return NextResponse.json({ success: true, class: classInput, stats })
  } catch (error) {
    console.error('Gladiator setup failed:', error)
    return NextResponse.json(
      { error: 'Failed to setup gladiator' },
      { status: 500 }
    )
  }
}
