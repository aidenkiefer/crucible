/**
 * Weapon Definitions
 * Static weapon data with hardcoded fallback
 * TODO: Load from published bundle system
 */

import type { WeaponType, WeaponDefinition, AttackPattern } from './types'

// ============================================================================
// Weapon Definitions (Hardcoded Fallback)
// ============================================================================

export const WEAPONS: Record<WeaponType, WeaponDefinition> = {
  Sword: {
    type: 'Sword',
    attackPattern: 'MeleeArc',
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

  Spear: {
    type: 'Spear',
    attackPattern: 'MeleeThrust',
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

  Bow: {
    type: 'Bow',
    attackPattern: 'Projectile',
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

  Dagger: {
    type: 'Dagger',
    attackPattern: 'MeleeQuick',
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
