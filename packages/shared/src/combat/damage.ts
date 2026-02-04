/**
 * Damage Calculations
 * Pure functions for damage calculation and mitigation
 */

import type { BaseAttributes, DerivedStats, WeaponDefinition, WeaponType } from './types'

/**
 * Calculate raw damage from a weapon attack before defense mitigation
 * Melee weapons scale with STR, ranged weapons scale with DEX
 */
export function calculateRawDamage(
  weapon: WeaponDefinition,
  attackerAttributes: BaseAttributes
): number {
  const baseDamage = weapon.baseDamage

  // Apply weapon scaling
  const strDamage = attackerAttributes.strength * weapon.scaling.strength
  const dexDamage = attackerAttributes.dexterity * weapon.scaling.dexterity
  const scaledDamage = baseDamage + strDamage + dexDamage

  return Math.floor(scaledDamage)
}

/**
 * Calculate final damage after applying target's defense
 */
export function calculateFinalDamage(
  rawDamage: number,
  defenderStats: DerivedStats
): number {
  // Apply damage reduction from defense stat
  const mitigatedDamage = rawDamage * (1 - defenderStats.damageReduction)

  // Minimum 1 damage
  return Math.max(1, Math.floor(mitigatedDamage))
}

/**
 * Calculate complete damage from attacker to defender
 * Combines raw damage calculation and defense mitigation
 */
export function calculateDamage(
  weapon: WeaponDefinition,
  attackerAttributes: BaseAttributes,
  defenderStats: DerivedStats,
  isInvulnerable: boolean = false
): number {
  // No damage if invulnerable (dodge i-frames)
  if (isInvulnerable) {
    return 0
  }

  const rawDamage = calculateRawDamage(weapon, attackerAttributes)
  return calculateFinalDamage(rawDamage, defenderStats)
}

/**
 * Calculate new HP after damage
 */
export function applyDamageToHp(currentHp: number, damage: number): number {
  return Math.max(0, currentHp - damage)
}

/**
 * Check if unit is dead
 */
export function isDead(hp: number): boolean {
  return hp <= 0
}
