/**
 * Sprint 5: Progression Service
 * Handles XP rewards, leveling, and stat increases
 */

import { prisma } from '@gladiator/database/src/client'
import { SKILL_POINTS_PER_LEVEL } from '@gladiator/shared'

const MAX_LEVEL = 20

/**
 * Calculate XP required for next level
 * Formula: level * 100 + (level-1) * 50
 * Examples:
 *   Level 1→2: 1*100 + 0*50 = 100 XP
 *   Level 2→3: 2*100 + 1*50 = 250 XP
 *   Level 3→4: 3*100 + 2*50 = 400 XP
 *   Level 10→11: 10*100 + 9*50 = 1450 XP
 */
export function getXPForLevel(level: number): number {
  if (level >= MAX_LEVEL) return Infinity
  return level * 100 + (level - 1) * 50
}

/**
 * Award XP to a gladiator and handle level ups
 * Returns number of levels gained
 */
export async function awardXP(gladiatorId: string, xpAmount: number): Promise<number> {
  const gladiator = await prisma.gladiator.findUnique({
    where: { id: gladiatorId },
  })

  if (!gladiator) {
    throw new Error(`Gladiator ${gladiatorId} not found`)
  }

  if (gladiator.level >= MAX_LEVEL) {
    console.log(`✨ Gladiator ${gladiatorId} is already max level (${MAX_LEVEL})`)
    return 0
  }

  let currentLevel = gladiator.level
  let currentXP = gladiator.xp + xpAmount
  let levelsGained = 0

  // Process level ups
  while (currentLevel < MAX_LEVEL) {
    const xpNeeded = getXPForLevel(currentLevel)

    if (currentXP < xpNeeded) {
      break // Not enough XP to level up
    }

    // Level up!
    currentXP -= xpNeeded
    currentLevel++
    levelsGained++
  }

  if (levelsGained === 0) {
    // No level up, just add XP
    await prisma.gladiator.update({
      where: { id: gladiatorId },
      data: { xp: currentXP },
    })

    console.log(
      `✨ Awarded ${xpAmount} XP to Gladiator ${gladiatorId} (${currentXP}/${getXPForLevel(gladiator.level)} for level ${currentLevel + 1})`
    )
  } else {
    // Level up! Award skill points and stat points (player allocates stats manually)
    const skillPointsGained = levelsGained * SKILL_POINTS_PER_LEVEL
    const statPointsGained = levelsGained * 3

    await prisma.gladiator.update({
      where: { id: gladiatorId },
      data: {
        level: currentLevel,
        xp: currentXP,
        skillPointsAvailable: { increment: skillPointsGained },
        statPointsAvailable: { increment: statPointsGained },
      },
    })

    console.log(
      `🎉 Gladiator ${gladiatorId} leveled up ${levelsGained} time(s)! Now level ${currentLevel} (+${skillPointsGained} skill point(s), +${statPointsGained} stat points to allocate)`
    )
  }

  return levelsGained
}

/**
 * Award XP based on match outcome
 * - Win: 100 XP
 * - Loss: 25 XP
 */
export async function awardMatchXP(gladiatorId: string, isWinner: boolean): Promise<number> {
  const xpAmount = isWinner ? 100 : 25
  return awardXP(gladiatorId, xpAmount)
}
