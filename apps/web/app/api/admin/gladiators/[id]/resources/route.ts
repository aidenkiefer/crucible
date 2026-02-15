import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

/**
 * PATCH /api/admin/gladiators/[id]/resources
 * Update a gladiator's progression resources (admin only). For testing.
 * Body: { level?, xp?, skillPointsAvailable?, statPointsAvailable? }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const updates: {
    level?: number
    xp?: number
    skillPointsAvailable?: number
    statPointsAvailable?: number
  } = {}

  if (typeof body.level === 'number' && body.level >= 1 && body.level <= 20) {
    updates.level = body.level
  }
  if (typeof body.xp === 'number' && body.xp >= 0) {
    updates.xp = body.xp
  }
  if (typeof body.skillPointsAvailable === 'number' && body.skillPointsAvailable >= 0) {
    updates.skillPointsAvailable = body.skillPointsAvailable
  }
  if (typeof body.statPointsAvailable === 'number' && body.statPointsAvailable >= 0) {
    updates.statPointsAvailable = body.statPointsAvailable
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'Provide at least one valid field: level, xp, skillPointsAvailable, statPointsAvailable' },
      { status: 400 }
    )
  }

  const gladiator = await prisma.gladiator.update({
    where: { id },
    data: updates,
  }).catch(() => null)

  if (!gladiator) {
    return NextResponse.json({ error: 'Gladiator not found' }, { status: 404 })
  }

  return NextResponse.json({ gladiator })
}
