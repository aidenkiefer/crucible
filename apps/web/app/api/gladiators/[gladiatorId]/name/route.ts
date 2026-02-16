import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

const MIN_NAME_LENGTH = 1
const MAX_NAME_LENGTH = 32

/**
 * PATCH /api/gladiators/[gladiatorId]/name
 * Set the gladiator's display name once. Cannot be changed after assignment.
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
    const rawName = typeof body.name === 'string' ? body.name.trim() : ''

    if (rawName.length < MIN_NAME_LENGTH) {
      return NextResponse.json(
        { error: 'Name is required and cannot be empty.' },
        { status: 400 }
      )
    }
    if (rawName.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${MAX_NAME_LENGTH} characters or fewer.` },
        { status: 400 }
      )
    }

    const gladiator = await prisma.gladiator.findUnique({
      where: { id: params.gladiatorId },
      select: { id: true, ownerId: true, name: true },
    })

    if (!gladiator) {
      return NextResponse.json({ error: 'Gladiator not found' }, { status: 404 })
    }

    if (gladiator.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Not your gladiator' }, { status: 403 })
    }

    if (gladiator.name != null && gladiator.name !== '') {
      return NextResponse.json(
        { error: 'This gladiator has already been named. Name assignment cannot be changed.' },
        { status: 400 }
      )
    }

    await prisma.gladiator.update({
      where: { id: params.gladiatorId },
      data: { name: rawName },
    })

    return NextResponse.json({ success: true, name: rawName })
  } catch (error) {
    console.error('Failed to set gladiator name:', error)
    return NextResponse.json(
      { error: 'Failed to set name' },
      { status: 500 }
    )
  }
}
