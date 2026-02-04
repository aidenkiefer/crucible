/**
 * Damage Calculator (Server Wrapper)
 * Thin wrapper around shared combat library
 * Handles server-specific Combatant mutations
 */

import { Stats, Damage } from '@gladiator/shared/src/combat'
import type { BaseAttributes, DerivedStats, WeaponDefinition } from '@gladiator/shared/src/combat'
import { Combatant, WeaponConfig } from './types'

// ============================================================================
// Derived Stats Calculation (Re-exported)
// ============================================================================

export function calculateDerivedStats(base: BaseAttributes): DerivedStats {
  return Stats.calculateDerivedStats(base)
}

// ============================================================================
// Damage Calculation (Combatant-aware wrappers)
// ============================================================================

/**
 * Apply damage to target combatant
 * Returns actual damage dealt (after defense)
 * Mutates target HP and alive state
 */
export function applyDamage(
  attacker: Combatant,
  target: Combatant,
  weapon: WeaponConfig | WeaponDefinition
): number {
  // Check if target is invulnerable (dodge i-frames)
  if (target.isInvulnerable) {
    return 0
  }

  // Convert legacy WeaponConfig to WeaponDefinition if needed
  const weaponDef = isLegacyWeaponConfig(weapon)
    ? convertLegacyWeapon(weapon)
    : weapon

  // Calculate damage using shared library
  const damage = Damage.calculateDamage(
    weaponDef,
    attacker.baseAttributes,
    target.derivedStats,
    target.isInvulnerable
  )

  // Apply damage to HP (mutate)
  target.currentHp = Damage.applyDamageToHp(target.currentHp, damage)

  // Check if target died (mutate)
  if (Damage.isDead(target.currentHp)) {
    target.isAlive = false
  }

  return damage
}

// ============================================================================
// Stamina Management (Combatant-aware wrappers)
// ============================================================================

export function hasStamina(combatant: Combatant, cost: number): boolean {
  return Stats.hasStamina(combatant.currentStamina, cost)
}

export function consumeStamina(combatant: Combatant, cost: number): void {
  combatant.currentStamina = Stats.consumeStamina(combatant.currentStamina, cost)
}

export function regenerateStamina(combatant: Combatant, deltaTime: number): void {
  combatant.currentStamina = Stats.calculateStaminaRegen(
    combatant.currentStamina,
    combatant.derivedStats.maxStamina,
    combatant.derivedStats.staminaRegen,
    deltaTime
  )
}

// ============================================================================
// Stat Initialization
// ============================================================================

export function initializeCombatant(combatant: Combatant): void {
  combatant.currentHp = combatant.derivedStats.maxHp
  combatant.currentStamina = combatant.derivedStats.maxStamina
  combatant.isAlive = true
  combatant.isInvulnerable = false
}

// ============================================================================
// Legacy Weapon Config Support
// ============================================================================

function isLegacyWeaponConfig(weapon: WeaponConfig | WeaponDefinition): weapon is WeaponConfig {
  return 'damage' in weapon && !('baseDamage' in weapon)
}

function convertLegacyWeapon(weapon: WeaponConfig): WeaponDefinition {
  return {
    type: weapon.type,
    attackPattern: weapon.attackPattern,
    range: weapon.range,
    baseDamage: weapon.damage,
    scaling: {
      strength: weapon.type === 'Bow' || weapon.type === 'Dagger' ? 0.2 : 0.6,
      dexterity: weapon.type === 'Bow' || weapon.type === 'Dagger' ? 0.8 : 0.3,
    },
    staminaCost: weapon.staminaCost,
    cooldown: weapon.cooldown,
  }
}
