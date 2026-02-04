/**
 * Shared Combat Types
 * Pure types for combat calculations
 * No server-specific or client-specific dependencies
 */

import type { Vec2 } from '../physics'

// ============================================================================
// Base Attributes (8 Stats from NFT)
// ============================================================================

export interface BaseAttributes {
  constitution: number // HP and Stamina pool
  strength: number // Melee damage scaling
  dexterity: number // Ranged damage and accuracy
  speed: number // Movement speed
  defense: number // Physical damage mitigation
  magicResist: number // Magic damage mitigation (Sprint 4+)
  arcana: number // Arcane magic power (Sprint 4+)
  faith: number // Faith magic power (Sprint 4+)
}

// ============================================================================
// Derived Stats (Calculated from BaseAttributes)
// ============================================================================

export interface DerivedStats {
  maxHp: number
  maxStamina: number
  staminaRegen: number // per second
  moveSpeed: number // units per second
  damageReduction: number // percentage (0-1)
}

// ============================================================================
// Weapon System (Sprint 4)
// ============================================================================

export enum WeaponType {
  Sword = 'Sword',
  Spear = 'Spear',
  Bow = 'Bow',
  Dagger = 'Dagger',
}

export enum AttackPattern {
  MeleeArc = 'MeleeArc', // Sword: short range, wide arc
  MeleeThrust = 'MeleeThrust', // Spear: long range, narrow line
  Projectile = 'Projectile', // Bow: fires projectile
  MeleeQuick = 'MeleeQuick', // Dagger: very short range, fast
}

export interface WeaponDefinition {
  type: WeaponType
  attackPattern: AttackPattern

  // Range/hitbox
  range: number // Max distance for melee, or projectile spawn distance
  arcAngle?: number // For melee arc attacks (radians)
  lineWidth?: number // For thrust attacks

  // Damage
  baseDamage: number
  scaling: {
    strength: number // Damage multiplier from STR
    dexterity: number // Damage multiplier from DEX
  }

  // Resources & timing
  staminaCost: number
  cooldown: number // ms

  // Projectile-specific
  projectileSpeed?: number // units/sec
  projectileLifetime?: number // ms
}

// ============================================================================
// Projectile System (Sprint 4)
// ============================================================================

export interface ProjectileState {
  id: string
  ownerUnitId: string
  pos: Vec2
  vel: Vec2
  radius: number
  damage: number
  damageType: 'physical' | 'magic'
  lifetime: number // ms remaining
  createdAt: number // timestamp
}

// ============================================================================
// Combat State Snapshot (For Client Rendering)
// ============================================================================

export interface Vector2D {
  x: number
  y: number
}

export interface ActionState {
  type: string
  startTime: number
  endTime: number
  cooldownEndTime: number
}

export interface UnitState {
  id: string
  name: string
  pos: Vector2D
  facing: number // radians
  hp: number
  stamina: number
  isInvulnerable: boolean
  currentAction: ActionState | null
  derived: DerivedStats
}

export interface CombatantData {
  id: string
  position: Vector2D
  facingAngle: number
  currentHp: number
  currentStamina: number
  isAlive: boolean
  isInvulnerable: boolean
  currentAction: ActionState | null
}

export interface CombatState {
  matchId: string
  tickNumber: number
  elapsedTime: number
  combatant1: CombatantData
  combatant2: CombatantData
  winner: string | null
}
