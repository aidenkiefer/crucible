/**
 * Movement and Position Integration
 * Pure, deterministic position updates
 */

import type { Vec2 } from './types'
import { PHYSICS_CONSTANTS } from './constants'
import * as Vector from './vector'

/**
 * Apply velocity to position for a given delta time
 * Returns new position (does not mutate input)
 */
export function integrate(
  position: Vec2,
  velocity: Vec2,
  deltaTime: number
): Vec2 {
  const dt = deltaTime / 1000 // Convert ms to seconds
  return {
    x: position.x + velocity.x * dt,
    y: position.y + velocity.y * dt,
  }
}

/**
 * Clamp position to arena boundaries
 */
export function clampToArena(
  position: Vec2,
  arenaWidth: number = PHYSICS_CONSTANTS.ARENA_WIDTH,
  arenaHeight: number = PHYSICS_CONSTANTS.ARENA_HEIGHT
): Vec2 {
  return {
    x: Math.max(0, Math.min(arenaWidth, position.x)),
    y: Math.max(0, Math.min(arenaHeight, position.y)),
  }
}

/**
 * Calculate velocity from direction and speed
 */
export function calculateVelocity(direction: Vec2, speed: number): Vec2 {
  const normalized = Vector.normalize(direction)
  return Vector.scale(normalized, speed)
}

/**
 * Update position with velocity and arena clamping
 * Returns new position
 */
export function updatePosition(
  position: Vec2,
  velocity: Vec2,
  deltaTime: number,
  arenaWidth?: number,
  arenaHeight?: number
): Vec2 {
  const newPos = integrate(position, velocity, deltaTime)
  return clampToArena(newPos, arenaWidth, arenaHeight)
}

/**
 * Calculate dodge roll velocity
 */
export function calculateDodgeVelocity(direction: Vec2): Vec2 {
  const dodgeSpeed =
    (PHYSICS_CONSTANTS.DODGE_DISTANCE / PHYSICS_CONSTANTS.DODGE_DURATION) * 1000
  const normalized = Vector.normalize(direction)
  return Vector.scale(normalized, dodgeSpeed)
}
