/**
 * Combat Stats Calculations
 * Pure functions for deriving combat stats from base attributes
 */

import { PHYSICS_CONSTANTS } from '../physics'
import type { BaseAttributes, DerivedStats } from './types'

/**
 * Calculate derived stats from base attributes
 * Uses only 5 stats actively: CON, STR, DEX, SPD, DEF
 * (MRES, ARC, FTH reserved for magic system)
 */
export function calculateDerivedStats(base: BaseAttributes): DerivedStats {
  // HP: Base HP + (CON * HP_PER_CONSTITUTION)
  const maxHp =
    PHYSICS_CONSTANTS.BASE_HP +
    base.constitution * PHYSICS_CONSTANTS.HP_PER_CONSTITUTION

  // Stamina: Base Stamina + (CON * STAMINA_PER_CONSTITUTION)
  const maxStamina =
    PHYSICS_CONSTANTS.BASE_STAMINA +
    base.constitution * PHYSICS_CONSTANTS.STAMINA_PER_CONSTITUTION

  // Stamina regen: Base regen (per second)
  const staminaRegen = PHYSICS_CONSTANTS.BASE_STAMINA_REGEN

  // Move speed: Base speed * (1 + SPD / 100)
  // e.g. 50 SPD = 150 * 1.5 = 225 units/second
  const moveSpeed = PHYSICS_CONSTANTS.BASE_MOVE_SPEED * (1 + base.speed / 100)

  // Damage reduction: DEF * DEFENSE_TO_REDUCTION, capped at MAX_DAMAGE_REDUCTION
  // e.g. 50 DEF = 50% reduction, capped at 75%
  const damageReduction = Math.min(
    base.defense * PHYSICS_CONSTANTS.DEFENSE_TO_REDUCTION,
    PHYSICS_CONSTANTS.MAX_DAMAGE_REDUCTION
  )

  return {
    maxHp,
    maxStamina,
    staminaRegen,
    moveSpeed,
    damageReduction,
  }
}

/**
 * Calculate stamina regeneration amount for a given time delta
 */
export function calculateStaminaRegen(
  current: number,
  max: number,
  regenRate: number,
  deltaTimeMs: number
): number {
  const deltaSeconds = deltaTimeMs / 1000
  const regenAmount = regenRate * deltaSeconds
  return Math.min(max, current + regenAmount)
}

/**
 * Check if entity has sufficient stamina for an action
 */
export function hasStamina(current: number, cost: number): boolean {
  return current >= cost
}

/**
 * Calculate stamina after consumption
 */
export function consumeStamina(current: number, cost: number): number {
  return Math.max(0, current - cost)
}
