/**
 * Damage Calculations
 * Pure functions for damage calculation and mitigation
 */

import type { BaseAttributes, DerivedStats, WeaponDefinition, WeaponType } from './types'

/**
 * Calculate raw damage from a weapon attack before defense mitigation
 * Melee weapons scale with STR, ranged weapons scale with DEX
 * @param weaponCoeff - Weapon coefficient (1.0 for class weapon, 0.8 for universal, default 1.0)
 */
export function calculateRawDamage(
  weapon: WeaponDefinition,
  attackerAttributes: BaseAttributes,
  weaponCoeff: number = 1.0
): number {
  const baseDamage = weapon.baseDamage

  // Apply weapon scaling
  const strDamage = attackerAttributes.strength * weapon.scaling.strength
  const dexDamage = attackerAttributes.dexterity * weapon.scaling.dexterity
  const scaledDamage = baseDamage + strDamage + dexDamage

  // Apply weapon coefficient (class vs universal weapon)
  const finalDamage = scaledDamage * weaponCoeff

  return Math.floor(finalDamage)
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
 * @param weaponCoeff - Weapon coefficient (1.0 for class weapon, 0.8 for universal, default 1.0)
 */
export function calculateDamage(
  weapon: WeaponDefinition,
  attackerAttributes: BaseAttributes,
  defenderStats: DerivedStats,
  isInvulnerable: boolean = false,
  weaponCoeff: number = 1.0
): number {
  // No damage if invulnerable (dodge i-frames)
  if (isInvulnerable) {
    return 0
  }

  const rawDamage = calculateRawDamage(weapon, attackerAttributes, weaponCoeff)
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
