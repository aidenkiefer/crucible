/**
 * Combat System Types
 * Real-time combat at 20Hz (50ms tick rate)
 */

// ============================================================================
// Base Attributes (8 Stats)
// ============================================================================

export interface BaseAttributes {
  constitution: number // HP and Stamina pool
  strength: number     // Melee damage scaling
  dexterity: number    // Ranged damage and accuracy
  speed: number        // Movement speed
  defense: number      // Physical damage mitigation
  magicResist: number  // Magic damage mitigation (Sprint 4+)
  arcana: number       // Arcane magic power (Sprint 4+)
  faith: number        // Faith magic power (Sprint 4+)
}

// ============================================================================
// Derived Stats (Calculated from BaseAttributes)
// ============================================================================

export interface DerivedStats {
  maxHp: number
  maxStamina: number
  staminaRegen: number // per second
  moveSpeed: number    // units per second
  damageReduction: number // percentage (0-1)
}

// ============================================================================
// Position and Movement
// ============================================================================

export interface Vector2D {
  x: number
  y: number
}

export interface Velocity {
  dx: number // velocity in x direction
  dy: number // velocity in y direction
}

// ============================================================================
// Combatant State
// ============================================================================

export interface Combatant {
  id: string
  position: Vector2D
  velocity: Velocity
  facingAngle: number // radians, 0 = right, π/2 = down, π = left, 3π/2 = up

  // Current stats
  currentHp: number
  currentStamina: number

  // Attributes
  baseAttributes: BaseAttributes
  derivedStats: DerivedStats

  // Combat state
  isAlive: boolean
  isInvulnerable: boolean // during dodge roll i-frames
  invulnerabilityEndTime: number // timestamp when i-frames end

  // Weapon (Sprint 4)
  equippedWeapon: WeaponType
  weapon: WeaponType // Alias for currently equipped weapon

  // Action state
  currentAction: ActionState | null
}

// ============================================================================
// Weapon Types
// ============================================================================

export enum WeaponType {
  Sword = 'Sword',
  Spear = 'Spear',    // Sprint 4
  Bow = 'Bow',        // Sprint 4
  Dagger = 'Dagger',  // Sprint 4
}

export interface WeaponConfig {
  type: WeaponType
  damage: number
  range: number // units
  staminaCost: number
  cooldown: number // milliseconds
  attackPattern: AttackPattern
}

export enum AttackPattern {
  MeleeArc = 'MeleeArc',      // Sword: 90° arc in front
  MeleeThrust = 'MeleeThrust', // Spear: narrow cone, longer range
  Projectile = 'Projectile',   // Bow: shoots projectile
  QuickStrike = 'QuickStrike', // Dagger: fast, short range
}

// ============================================================================
// Actions
// ============================================================================

export enum ActionType {
  Move = 'Move',
  Attack = 'Attack',
  Dodge = 'Dodge',
}

export interface ActionState {
  type: ActionType
  startTime: number
  endTime: number
  cooldownEndTime: number
}

export interface MoveAction {
  type: ActionType.Move
  direction: Vector2D // normalized direction vector
}

export interface AttackAction {
  type: ActionType.Attack
  targetDirection: Vector2D // facing direction for attack
}

export interface DodgeAction {
  type: ActionType.Dodge
  direction: Vector2D // direction to dodge roll
}

export type Action = MoveAction | AttackAction | DodgeAction

// ============================================================================
// Combat State
// ============================================================================

// Import ProjectileState from shared
import type { ProjectileState } from '@gladiator/shared/src/combat'

export interface CombatState {
  combatant1: Combatant
  combatant2: Combatant
  tickNumber: number
  elapsedTime: number // milliseconds
  winner: string | null
  arenaSize: Vector2D
  projectiles: Map<string, ProjectileState> // Sprint 4
}

// ============================================================================
// Combat Events
// ============================================================================

export enum CombatEventType {
  ActionPerformed = 'ActionPerformed',
  DamageTaken = 'DamageTaken',
  StaminaConsumed = 'StaminaConsumed',
  StaminaRegenerated = 'StaminaRegenerated',
  Death = 'Death',
  DodgeActivated = 'DodgeActivated',
  InvulnerabilityEnded = 'InvulnerabilityEnded',
  ActionFailed = 'ActionFailed', // e.g. insufficient stamina
  ProjectileSpawned = 'ProjectileSpawned', // Sprint 4
}

export interface CombatEvent {
  type: CombatEventType
  timestamp: number
  combatantId: string
  data?: any
}

// ============================================================================
// Constants (Re-exported from shared physics)
// ============================================================================

import { PHYSICS_CONSTANTS } from '@gladiator/shared/src/physics'

export const COMBAT_CONSTANTS = {
  ...PHYSICS_CONSTANTS,

  // Weapon configs (game-specific, not in shared physics)
  SWORD_CONFIG: {
    type: WeaponType.Sword,
    damage: 20,
    range: 80,
    staminaCost: 15,
    cooldown: 800,
    attackPattern: AttackPattern.MeleeArc,
  } as WeaponConfig,
}
