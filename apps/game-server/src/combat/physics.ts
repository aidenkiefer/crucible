/**
 * Physics System
 * Handles movement, collision detection, and dodge roll physics
 * Now uses shared physics library for deterministic calculations
 */

import {
  Combatant,
  Vector2D,
  Velocity,
  CombatState,
  COMBAT_CONSTANTS,
  DodgeAction,
} from './types'
import { Vector, Movement, Collision } from '@gladiator/shared/src/physics'

// ============================================================================
// Vector Math (Re-exported from shared)
// ============================================================================

export function normalizeVector(v: Vector2D): Vector2D {
  return Vector.normalize(v)
}

export function vectorMagnitude(v: Vector2D): number {
  return Vector.magnitude(v)
}

export function vectorDistance(a: Vector2D, b: Vector2D): number {
  return Vector.distance(a, b)
}

export function scaleVector(v: Vector2D, scale: number): Vector2D {
  return Vector.scale(v, scale)
}

// ============================================================================
// Movement
// ============================================================================

/**
 * Update combatant position based on velocity
 * Called every tick (50ms)
 * Uses shared Movement library for deterministic integration
 */
export function updatePosition(combatant: Combatant, deltaTime: number): void {
  const velocity = { x: combatant.velocity.dx, y: combatant.velocity.dy }
  const newPos = Movement.updatePosition(
    combatant.position,
    velocity,
    deltaTime,
    COMBAT_CONSTANTS.ARENA_WIDTH,
    COMBAT_CONSTANTS.ARENA_HEIGHT
  )

  combatant.position.x = newPos.x
  combatant.position.y = newPos.y
}

/**
 * Set combatant velocity based on movement direction and their speed stat
 */
export function setVelocity(
  combatant: Combatant,
  direction: Vector2D
): void {
  const normalized = normalizeVector(direction)
  const speed = combatant.derivedStats.moveSpeed

  combatant.velocity.dx = normalized.x * speed
  combatant.velocity.dy = normalized.y * speed

  // Update facing angle if moving
  if (normalized.x !== 0 || normalized.y !== 0) {
    combatant.facingAngle = Math.atan2(normalized.y, normalized.x)
  }
}

/**
 * Stop combatant movement
 */
export function stopMovement(combatant: Combatant): void {
  combatant.velocity.dx = 0
  combatant.velocity.dy = 0
}

// ============================================================================
// Dodge Roll
// ============================================================================

/**
 * Perform a dodge roll in the given direction
 * Sets velocity for the duration and activates i-frames
 * Uses shared Movement library for dodge velocity calculation
 */
export function performDodgeRoll(
  combatant: Combatant,
  action: DodgeAction,
  currentTime: number
): void {
  const dodgeVel = Movement.calculateDodgeVelocity(action.direction)

  // Set velocity for dodge roll
  combatant.velocity.dx = dodgeVel.x
  combatant.velocity.dy = dodgeVel.y

  // Activate i-frames
  combatant.isInvulnerable = true
  combatant.invulnerabilityEndTime =
    currentTime + COMBAT_CONSTANTS.DODGE_IFRAMES_DURATION
}

/**
 * Check if combatant's i-frames have expired and remove invulnerability
 */
export function updateInvulnerability(
  combatant: Combatant,
  currentTime: number
): boolean {
  if (combatant.isInvulnerable && currentTime >= combatant.invulnerabilityEndTime) {
    combatant.isInvulnerable = false
    return true // i-frames ended this tick
  }
  return false
}

// ============================================================================
// Collision Detection
// ============================================================================

/**
 * Check if an attack hits the target
 * Uses shared Collision library for deterministic hit detection
 */
export function checkAttackHit(
  attacker: Combatant,
  target: Combatant,
  attackRange: number,
  attackAngle: number = Math.PI / 2 // 90 degrees for sword arc
): boolean {
  return Collision.checkMeleeHit(
    attacker.position,
    attacker.facingAngle,
    target.position,
    attackRange,
    attackAngle
  )
}

/**
 * Check if two combatants are colliding (body collision)
 * Uses shared Collision library with BODY_RADIUS constant
 */
export function checkCombatantCollision(c1: Combatant, c2: Combatant): boolean {
  return Collision.combatantCollision(c1.position, c2.position)
}

/**
 * Resolve combatant collision by pushing them apart
 * Uses shared Collision library for deterministic resolution
 */
export function resolveCombatantCollision(c1: Combatant, c2: Combatant): void {
  const { pos1, pos2 } = Collision.resolveCombatantCollision(
    c1.position,
    c2.position
  )

  c1.position.x = pos1.x
  c1.position.y = pos1.y
  c2.position.x = pos2.x
  c2.position.y = pos2.y
}
