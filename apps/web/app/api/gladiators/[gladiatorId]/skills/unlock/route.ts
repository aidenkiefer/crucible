import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import {
  getSkill,
  canUnlockSkill,
  calculateSkillPointsSpent,
  findSkillById,
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
    const skill = findSkillById(skillId)
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    const unlockedSkills = (gladiator.unlockedSkills as string[]) || []

    // Check if already unlocked
    if (unlockedSkills.includes(skillId)) {
      return NextResponse.json(
        { error: 'Skill already unlocked' },
        { status: 400 }
      )
    }

    // VALIDATION 1: Check sufficient points
    const remaining = gladiator.skillPointsAvailable - gladiator.skillPointsSpent
    if (remaining < skill.cost) {
      return NextResponse.json(
        {
          error: 'Not enough skill points',
          details: {
            required: skill.cost,
            available: remaining,
            total: gladiator.skillPointsAvailable,
            spent: gladiator.skillPointsSpent
          }
        },
        { status: 400 }
      )
    }

    // VALIDATION 2: Check prerequisite tier (must have any tier N-1 skill from same tree)
    if (skill.tier > 1) {
      const prerequisiteTier = skill.tier - 1
      const hasPrerequisite = unlockedSkills.some((unlockedId) => {
        const unlockedSkill = findSkillById(unlockedId)
        return (
          unlockedSkill &&
          unlockedSkill.tree === skill.tree &&
          unlockedSkill.tier === prerequisiteTier
        )
      })

      if (!hasPrerequisite) {
        return NextResponse.json(
          {
            error: `Must unlock a tier ${prerequisiteTier} skill from the ${skill.tree} tree first`,
            details: {
              requiredTier: prerequisiteTier,
              tree: skill.tree
            }
          },
          { status: 400 }
        )
      }
    }

    // VALIDATION 3: Check one-per-tier-per-tree rule
    const hasSkillInSameTierAndTree = unlockedSkills.some((unlockedId) => {
      const unlockedSkill = findSkillById(unlockedId)
      return (
        unlockedSkill &&
        unlockedSkill.tree === skill.tree &&
        unlockedSkill.tier === skill.tier
      )
    })

    if (hasSkillInSameTierAndTree) {
      return NextResponse.json(
        {
          error: `Already have a tier ${skill.tier} skill from the ${skill.tree} tree`,
          details: {
            tier: skill.tier,
            tree: skill.tree
          }
        },
        { status: 400 }
      )
    }

    // Unlock skill and apply stat boosts
    const statUpdates: any = {
      unlockedSkills: [...unlockedSkills, skillId],
      skillPointsSpent: {
        increment: skill.cost
      }
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
      `✨ Gladiator ${params.gladiatorId} unlocked skill: ${skill.name} (${skillId}) for ${skill.cost} points`
    )

    const pointsRemaining = updated.skillPointsAvailable - updated.skillPointsSpent

    return NextResponse.json({
      success: true,
      gladiator: updated,
      unlockedSkill: skill,
      pointsRemaining,
      pointsSpent: updated.skillPointsSpent,
      pointsAvailable: updated.skillPointsAvailable,
    })
  } catch (error) {
    console.error('Error unlocking skill:', error)
    return NextResponse.json(
      { error: 'Failed to unlock skill' },
      { status: 500 }
    )
  }
}
