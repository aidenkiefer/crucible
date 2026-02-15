import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import {
  getSkill,
  canUnlockSkill,
  calculateSkillPointsSpent,
} from '@gladiator/shared/src/skills/skill-trees'

/**
 * POST /api/gladiators/[gladiatorId]/skills/unlock
 * Unlock a skill using skill points
 * Sprint 5: Task 3 - Skill Tree System
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

    const { skillId } = await req.json()

    if (!skillId) {
      return NextResponse.json({ error: 'Skill ID required' }, { status: 400 })
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

    // Get skill definition
    const skill = getSkill(skillId)
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    // Check if can unlock (prerequisite and not already unlocked)
    const unlockedSkills = (gladiator.unlockedSkills as string[]) || []
    if (!canUnlockSkill(skillId, unlockedSkills)) {
      return NextResponse.json(
        { error: 'Cannot unlock skill: prerequisite not met or already unlocked' },
        { status: 400 }
      )
    }

    // Validate available points
    const currentPointsSpent = calculateSkillPointsSpent(unlockedSkills)
    const pointsAvailable = gladiator.skillPointsAvailable

    if (pointsAvailable < skill.cost) {
      return NextResponse.json(
        { error: 'Not enough skill points' },
        { status: 400 }
      )
    }

    // Unlock skill and apply stat boosts
    const statUpdates: any = {
      skillPointsAvailable: gladiator.skillPointsAvailable - skill.cost,
      unlockedSkills: [...unlockedSkills, skillId],
    }

    // Apply stat boosts
    for (const [stat, boost] of Object.entries(skill.statBoosts)) {
      if (stat in gladiator) {
        statUpdates[stat] = (gladiator[stat as keyof typeof gladiator] as number) + boost
      }
    }

    const updated = await prisma.gladiator.update({
      where: { id: params.gladiatorId },
      data: statUpdates,
    })

    console.log(
      `✨ Gladiator ${params.gladiatorId} unlocked skill: ${skill.name} (${skillId})`
    )

    const pointsRemaining = updated.skillPointsAvailable - calculateSkillPointsSpent(updated.unlockedSkills as string[])

    return NextResponse.json({
      success: true,
      gladiator: updated,
      unlockedSkill: skill,
      pointsRemaining,
    })
  } catch (error) {
    console.error('Error unlocking skill:', error)
    return NextResponse.json(
      { error: 'Failed to unlock skill' },
      { status: 500 }
    )
  }
}
