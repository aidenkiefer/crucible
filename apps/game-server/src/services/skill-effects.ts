/**
 * Skill Effects System (Stub/First Pass)
 *
 * Handles:
 * - Passive stat bonuses (already applied at match-start via stat-builder)
 * - Triggered effects (e.g. Second Wind: on HP threshold, restore HP/stamina)
 *
 * Future: Expand to handle all skill tree effects (damage on dodge, crit bonuses, etc.)
 */

import type { BaseStats } from '@gladiator/shared/src/stats'
import { SKILL_TREES, type SkillNode } from '@gladiator/shared/src/skills/skill-trees'

/**
 * Calculate total passive stat bonuses from unlocked skills
 *
 * @param unlockedSkills - Array of skill IDs unlocked by the gladiator
 * @returns Aggregate stat bonuses to apply at match start
 */
export function calculateSkillStatBonuses(unlockedSkills: string[]): Partial<BaseStats> {
  const bonuses: Partial<BaseStats> = {
    STR: 0,
    DEX: 0,
    DEF: 0,
    CON: 0,
    SPD: 0,
    MR: 0,
    ARC: 0,
    FTH: 0,
  }

  for (const skillId of unlockedSkills) {
    const skill = findSkillById(skillId)
    if (!skill || !skill.flatStatBonus) continue

    // Sum flat stat bonuses
    for (const [stat, value] of Object.entries(skill.flatStatBonus)) {
      const statKey = stat as keyof BaseStats
      bonuses[statKey] = (bonuses[statKey] ?? 0) + value
    }
  }

  return bonuses
}

/**
 * Find a skill by ID across all trees
 */
function findSkillById(skillId: string): SkillNode | null {
  for (const tree of SKILL_TREES) {
    const skill = tree.skills.find(s => s.id === skillId)
    if (skill) return skill
  }
  return null
}

/**
 * Triggered skill state tracker (per match)
 */
export class TriggeredSkillTracker {
  private triggeredSkills = new Set<string>()

  /**
   * Check if a skill has already been triggered this match
   */
  hasTriggered(skillId: string): boolean {
    return this.triggeredSkills.has(skillId)
  }

  /**
   * Mark a skill as triggered (once per match)
   */
  markTriggered(skillId: string): void {
    this.triggeredSkills.add(skillId)
  }

  /**
   * Reset all triggered skill flags (for new match)
   */
  reset(): void {
    this.triggeredSkills.clear()
  }
}

/**
 * Check and apply triggered skill effects
 *
 * Example: Second Wind (Valor) - On HP threshold, restore HP/stamina once per match
 *
 * @param combatantId - Combatant ID
 * @param unlockedSkills - Unlocked skill IDs
 * @param currentHp - Current HP
 * @param maxHp - Max HP
 * @param currentStamina - Current stamina
 * @param maxStamina - Max stamina
 * @param tracker - Triggered skill tracker for this match
 * @returns Object with HP/stamina to restore (if triggered), or null
 */
export function checkTriggeredSkills(
  combatantId: string,
  unlockedSkills: string[],
  currentHp: number,
  maxHp: number,
  currentStamina: number,
  maxStamina: number,
  tracker: TriggeredSkillTracker
): { hpRestore?: number; staminaRestore?: number } | null {
  // Example: Second Wind - Restore 30% HP and 50% stamina when HP drops below 30%
  const SECOND_WIND_ID = 'second_wind_valor'
  const SECOND_WIND_THRESHOLD = 0.30
  const SECOND_WIND_HP_RESTORE = 0.30
  const SECOND_WIND_STAMINA_RESTORE = 0.50

  if (
    unlockedSkills.includes(SECOND_WIND_ID) &&
    !tracker.hasTriggered(SECOND_WIND_ID) &&
    currentHp / maxHp < SECOND_WIND_THRESHOLD
  ) {
    tracker.markTriggered(SECOND_WIND_ID)

    return {
      hpRestore: Math.floor(maxHp * SECOND_WIND_HP_RESTORE),
      staminaRestore: Math.floor(maxStamina * SECOND_WIND_STAMINA_RESTORE),
    }
  }

  // Future: Add more triggered skills here (after dodge, on crit, etc.)

  return null
}
