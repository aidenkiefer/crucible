/**
 * Physics System
 * Handles movement, collision detection, and dodge roll physics
 */

import {
  Combatant,
  Vector2D,
  Velocity,
  CombatState,
  COMBAT_CONSTANTS,
  DodgeAction,
} from './types'

// ============================================================================
// Vector Math
// ============================================================================

export function normalizeVector(v: Vector2D): Vector2D {
  const magnitude = Math.sqrt(v.x * v.x + v.y * v.y)
  if (magnitude === 0) return { x: 0, y: 0 }
  return {
    x: v.x / magnitude,
    y: v.y / magnitude,
  }
}

export function vectorMagnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

export function vectorDistance(a: Vector2D, b: Vector2D): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function scaleVector(v: Vector2D, scale: number): Vector2D {
  return { x: v.x * scale, y: v.y * scale }
}

// ============================================================================
// Movement
// ============================================================================

/**
 * Update combatant position based on velocity
 * Called every tick (50ms)
 */
export function updatePosition(combatant: Combatant, deltaTime: number): void {
  const deltaSeconds = deltaTime / 1000

  // Calculate displacement
  const displacement = {
    x: combatant.velocity.dx * deltaSeconds,
    y: combatant.velocity.dy * deltaSeconds,
  }

  // Update position
  combatant.position.x += displacement.x
  combatant.position.y += displacement.y

  // Apply arena boundaries (hard clamp)
  combatant.position.x = Math.max(
    0,
    Math.min(COMBAT_CONSTANTS.ARENA_WIDTH, combatant.position.x)
  )
  combatant.position.y = Math.max(
    0,
    Math.min(COMBAT_CONSTANTS.ARENA_HEIGHT, combatant.position.y)
  )
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
 */
export function performDodgeRoll(
  combatant: Combatant,
  action: DodgeAction,
  currentTime: number
): void {
  const normalized = normalizeVector(action.direction)

  // Calculate dodge speed (distance / duration)
  const dodgeSpeed =
    (COMBAT_CONSTANTS.DODGE_DISTANCE / COMBAT_CONSTANTS.DODGE_DURATION) * 1000

  // Set velocity for dodge roll
  combatant.velocity.dx = normalized.x * dodgeSpeed
  combatant.velocity.dy = normalized.y * dodgeSpeed

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
 * Uses simple distance-based detection for Sprint 2 (Sword only)
 */
export function checkAttackHit(
  attacker: Combatant,
  target: Combatant,
  attackRange: number,
  attackAngle: number = Math.PI / 2 // 90 degrees for sword arc
): boolean {
  // Check if target is in range
  const distance = vectorDistance(attacker.position, target.position)
  if (distance > attackRange) {
    return false
  }

  // Check if target is within attack arc
  const directionToTarget = {
    x: target.position.x - attacker.position.x,
    y: target.position.y - attacker.position.y,
  }

  const angleToTarget = Math.atan2(directionToTarget.y, directionToTarget.x)
  const angleDiff = Math.abs(angleToTarget - attacker.facingAngle)

  // Normalize angle difference to [0, π]
  const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff)

  // Check if within attack arc
  return normalizedAngleDiff <= attackAngle / 2
}

/**
 * Check if two combatants are colliding (body collision)
 * Uses simple circle collision with radius 20 units
 */
export function checkCombatantCollision(c1: Combatant, c2: Combatant): boolean {
  const BODY_RADIUS = 20
  const distance = vectorDistance(c1.position, c2.position)
  return distance < BODY_RADIUS * 2
}

/**
 * Resolve combatant collision by pushing them apart
 */
export function resolveCombatantCollision(c1: Combatant, c2: Combatant): void {
  const BODY_RADIUS = 20
  const distance = vectorDistance(c1.position, c2.position)

  if (distance < BODY_RADIUS * 2 && distance > 0) {
    const overlap = BODY_RADIUS * 2 - distance
    const direction = {
      x: (c2.position.x - c1.position.x) / distance,
      y: (c2.position.y - c1.position.y) / distance,
    }

    // Push both combatants apart by half the overlap
    c1.position.x -= direction.x * overlap / 2
    c1.position.y -= direction.y * overlap / 2
    c2.position.x += direction.x * overlap / 2
    c2.position.y += direction.y * overlap / 2
  }
}
