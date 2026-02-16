import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/gladiators/[gladiatorId]/stats/allocate
 * Allocate available stat points to gladiator stats
 * Sprint 5: Task 7 - Stat Allocation API Endpoint
 */
export async function POST(
  req: Request,
  { params }: { params: { gladiatorId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { allocations } = await req.json()

    if (!allocations || typeof allocations !== 'object') {
      return NextResponse.json(
        { error: 'Allocations object required' },
        { status: 400 }
      )
    }

    // Get gladiator
    const gladiator = await prisma.gladiator.findUnique({
      where: { id: params.gladiatorId },
    })

    if (!gladiator) {
      return NextResponse.json({ error: 'Gladiator not found' }, { status: 404 })
    }

    if (gladiator.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Not your gladiator' }, { status: 403 })
    }

    // Valid stat fields that can be allocated
    const validStats = [
      'constitution',
      'strength',
      'dexterity',
      'speed',
      'defense',
      'magicResist',
      'arcana',
      'faith',
    ] as const

    // Validate allocations
    let totalAllocated = 0
    const validatedAllocations: { [key: string]: number } = {}

    for (const [stat, value] of Object.entries(allocations)) {
      // Check if stat is valid
      if (!validStats.includes(stat as any)) {
        return NextResponse.json(
          { error: `Invalid stat: ${stat}` },
          { status: 400 }
        )
      }

      // Ensure value is a number
      const numValue = Number(value)
      if (isNaN(numValue)) {
        return NextResponse.json(
          { error: `Invalid allocation value for ${stat}: ${value}` },
          { status: 400 }
        )
      }

      // Check for negative values
      if (numValue < 0) {
        return NextResponse.json(
          { error: `Negative allocations not allowed for ${stat}` },
          { status: 400 }
        )
      }

      if (numValue > 0) {
        validatedAllocations[stat] = numValue
        totalAllocated += numValue
      }
    }

    // Check at least one stat has allocation
    if (totalAllocated === 0) {
      return NextResponse.json(
        { error: 'Must allocate at least one stat point' },
        { status: 400 }
      )
    }

    // Check sufficient points
    if (totalAllocated > gladiator.statPointsAvailable) {
      return NextResponse.json(
        {
          error: 'Not enough stat points',
          details: {
            required: totalAllocated,
            available: gladiator.statPointsAvailable,
          },
        },
        { status: 400 }
      )
    }

    // Build update object with increments
    const statUpdates: any = {
      statPointsAvailable: {
        decrement: totalAllocated,
      },
    }

    for (const [stat, value] of Object.entries(validatedAllocations)) {
      statUpdates[stat] = {
        increment: value,
      }
    }

    // Update gladiator using atomic increments
    const updated = await prisma.gladiator.update({
      where: { id: params.gladiatorId },
      data: statUpdates,
    })

    console.log(
      `✨ Gladiator ${params.gladiatorId} allocated ${totalAllocated} stat points:`,
      validatedAllocations
    )

    return NextResponse.json({
      success: true,
      gladiator: updated,
      allocations: validatedAllocations,
      totalAllocated,
    })
  } catch (error) {
    console.error('Error allocating stat points:', error)
    return NextResponse.json(
      { error: 'Failed to allocate stat points' },
      { status: 500 }
    )
  }
}
