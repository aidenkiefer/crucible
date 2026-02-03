/**
 * Damage Calculator
 * Calculates damage, defense, and derived stats
 * Uses only 5 stats for Sprint 2: CON, STR, DEX, SPD, DEF
 * (MRES, ARC, FTH will be used in Sprint 4+ for magic system)
 */

import {
  BaseAttributes,
  DerivedStats,
  Combatant,
  WeaponConfig,
  WeaponType,
  COMBAT_CONSTANTS,
} from './types'

// ============================================================================
// Derived Stats Calculation
// ============================================================================

/**
 * Calculate derived stats from base attributes
 * Only uses 5 stats: CON, STR, DEX, SPD, DEF
 */
export function calculateDerivedStats(base: BaseAttributes): DerivedStats {
  // HP: Base HP + (CON * HP_PER_CONSTITUTION)
  const maxHp =
    COMBAT_CONSTANTS.BASE_HP + base.constitution * COMBAT_CONSTANTS.HP_PER_CONSTITUTION

  // Stamina: Base Stamina + (CON * STAMINA_PER_CONSTITUTION)
  const maxStamina =
    COMBAT_CONSTANTS.BASE_STAMINA +
    base.constitution * COMBAT_CONSTANTS.STAMINA_PER_CONSTITUTION

  // Stamina regen: Base regen (per second)
  const staminaRegen = COMBAT_CONSTANTS.BASE_STAMINA_REGEN

  // Move speed: Base speed * (1 + SPD / 100)
  // e.g. 50 SPD = 150 * 1.5 = 225 units/second
  const moveSpeed = COMBAT_CONSTANTS.BASE_MOVE_SPEED * (1 + base.speed / 100)

  // Damage reduction: DEF * DEFENSE_TO_REDUCTION, capped at MAX_DAMAGE_REDUCTION
  // e.g. 50 DEF = 50% reduction, capped at 75%
  const damageReduction = Math.min(
    base.defense * COMBAT_CONSTANTS.DEFENSE_TO_REDUCTION,
    COMBAT_CONSTANTS.MAX_DAMAGE_REDUCTION
  )

  return {
    maxHp,
    maxStamina,
    staminaRegen,
    moveSpeed,
    damageReduction,
  }
}

// ============================================================================
// Damage Calculation
// ============================================================================

/**
 * Calculate raw damage from an attack before defense mitigation
 * Melee weapons scale with STR, ranged weapons scale with DEX
 */
export function calculateRawDamage(
  attacker: Combatant,
  weapon: WeaponConfig
): number {
  const baseDamage = weapon.damage

  // Determine scaling stat based on weapon type
  let scalingStat: number
  switch (weapon.type) {
    case WeaponType.Sword:
      scalingStat = attacker.baseAttributes.strength
      break
    case WeaponType.Spear:
      scalingStat = attacker.baseAttributes.strength
      break
    case WeaponType.Bow:
      scalingStat = attacker.baseAttributes.dexterity
      break
    case WeaponType.Dagger:
      scalingStat = attacker.baseAttributes.dexterity
      break
    default:
      scalingStat = attacker.baseAttributes.strength
  }

  // Damage scaling: base damage * (1 + scalingStat / 100)
  // e.g. 20 base damage, 70 STR = 20 * 1.7 = 34 damage
  const scaledDamage = baseDamage * (1 + scalingStat / 100)

  return Math.floor(scaledDamage)
}

/**
 * Calculate final damage after applying target's defense
 */
export function calculateFinalDamage(
  rawDamage: number,
  target: Combatant
): number {
  // Apply damage reduction from defense stat
  const mitigatedDamage = rawDamage * (1 - target.derivedStats.damageReduction)

  // Minimum 1 damage
  return Math.max(1, Math.floor(mitigatedDamage))
}

/**
 * Apply damage to target combatant
 * Returns actual damage dealt (after defense)
 */
export function applyDamage(
  attacker: Combatant,
  target: Combatant,
  weapon: WeaponConfig
): number {
  // Check if target is invulnerable (dodge i-frames)
  if (target.isInvulnerable) {
    return 0
  }

  const rawDamage = calculateRawDamage(attacker, weapon)
  const finalDamage = calculateFinalDamage(rawDamage, target)

  // Apply damage to HP
  target.currentHp = Math.max(0, target.currentHp - finalDamage)

  // Check if target died
  if (target.currentHp === 0) {
    target.isAlive = false
  }

  return finalDamage
}

// ============================================================================
// Stamina Management
// ============================================================================

/**
 * Check if combatant has enough stamina for an action
 */
export function hasStamina(combatant: Combatant, cost: number): boolean {
  return combatant.currentStamina >= cost
}

/**
 * Consume stamina for an action
 */
export function consumeStamina(combatant: Combatant, cost: number): void {
  combatant.currentStamina = Math.max(0, combatant.currentStamina - cost)
}

/**
 * Regenerate stamina over time
 * Called every tick (50ms)
 */
export function regenerateStamina(combatant: Combatant, deltaTime: number): void {
  const deltaSeconds = deltaTime / 1000
  const regenAmount = combatant.derivedStats.staminaRegen * deltaSeconds

  combatant.currentStamina = Math.min(
    combatant.derivedStats.maxStamina,
    combatant.currentStamina + regenAmount
  )
}

// ============================================================================
// Stat Initialization
// ============================================================================

/**
 * Initialize a combatant with starting HP and stamina
 */
export function initializeCombatant(combatant: Combatant): void {
  combatant.currentHp = combatant.derivedStats.maxHp
  combatant.currentStamina = combatant.derivedStats.maxStamina
  combatant.isAlive = true
  combatant.isInvulnerable = false
}
