/**
 * Weapon Definitions
 * Static weapon data with hardcoded fallback
 * TODO: Load from published bundle system
 */

import { WeaponType, AttackPattern } from './types'
import type { WeaponDefinition } from './types'

// ============================================================================
// Weapon Definitions (Hardcoded Fallback)
// ============================================================================

export const WEAPONS: Record<WeaponType, WeaponDefinition> = {
  [WeaponType.Sword]: {
    type: WeaponType.Sword,
    attackPattern: AttackPattern.MeleeArc,
    range: 2.0,
    arcAngle: Math.PI / 2, // 90 degrees
    baseDamage: 15,
    scaling: {
      strength: 0.6,
      dexterity: 0.3,
    },
    staminaCost: 15,
    cooldown: 500,
  },

  [WeaponType.Spear]: {
    type: WeaponType.Spear,
    attackPattern: AttackPattern.MeleeThrust,
    range: 3.5, // Longer range than sword
    lineWidth: 0.5, // Narrow hitbox
    baseDamage: 18,
    scaling: {
      strength: 0.8,
      dexterity: 0.2,
    },
    staminaCost: 18,
    cooldown: 600,
  },

  [WeaponType.Bow]: {
    type: WeaponType.Bow,
    attackPattern: AttackPattern.Projectile,
    range: 1.0, // Spawn distance
    baseDamage: 12,
    scaling: {
      strength: 0.2,
      dexterity: 0.8,
    },
    staminaCost: 12,
    cooldown: 700,
    projectileSpeed: 15, // units/sec
    projectileLifetime: 2000, // 2 seconds
  },

  [WeaponType.Dagger]: {
    type: WeaponType.Dagger,
    attackPattern: AttackPattern.MeleeQuick,
    range: 1.5, // Shorter than sword
    arcAngle: Math.PI / 3, // 60 degrees (narrower)
    baseDamage: 10,
    scaling: {
      strength: 0.3,
      dexterity: 0.7,
    },
    staminaCost: 10,
    cooldown: 300, // Much faster
  },
}

/**
 * Get weapon definition by type
 * Returns hardcoded fallback; TODO: integrate with bundle system
 */
export function getWeapon(type: WeaponType): WeaponDefinition | null {
  return WEAPONS[type] || null
}

/**
 * Get all weapon types
 */
export function getAllWeaponTypes(): WeaponType[] {
  return Object.keys(WEAPONS) as WeaponType[]
}
