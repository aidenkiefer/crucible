/**
 * Collision Detection
 * Pure, deterministic collision checks and resolution
 */

import type { Vec2, Circle, Rectangle, BoundingBox } from './types'
import { PHYSICS_CONSTANTS } from './constants'
import * as Vector from './vector'

/**
 * Check if two circles collide
 */
export function circleCollision(
  pos1: Vec2,
  radius1: number,
  pos2: Vec2,
  radius2: number
): boolean {
  const distSq = Vector.distanceSquared(pos1, pos2)
  const radiiSum = radius1 + radius2
  return distSq < radiiSum * radiiSum
}

/**
 * Check if two combatants collide (using body radius)
 */
export function combatantCollision(pos1: Vec2, pos2: Vec2): boolean {
  return circleCollision(
    pos1,
    PHYSICS_CONSTANTS.BODY_RADIUS,
    pos2,
    PHYSICS_CONSTANTS.BODY_RADIUS
  )
}

/**
 * Resolve collision between two circles
 * Returns adjusted positions for both entities
 */
export function resolveCircleCollision(
  pos1: Vec2,
  radius1: number,
  pos2: Vec2,
  radius2: number
): { pos1: Vec2; pos2: Vec2 } {
  const dist = Vector.distance(pos1, pos2)
  const radiiSum = radius1 + radius2

  // No collision
  if (dist >= radiiSum) {
    return { pos1, pos2 }
  }

  // Avoid division by zero
  if (dist < PHYSICS_CONSTANTS.MIN_SEPARATION) {
    // Push apart along arbitrary direction
    return {
      pos1: { x: pos1.x - radiiSum / 2, y: pos1.y },
      pos2: { x: pos2.x + radiiSum / 2, y: pos2.y },
    }
  }

  const overlap = radiiSum - dist
  const direction = {
    x: (pos2.x - pos1.x) / dist,
    y: (pos2.y - pos1.y) / dist,
  }

  // Push both entities apart by half the overlap
  return {
    pos1: {
      x: pos1.x - direction.x * (overlap / 2),
      y: pos1.y - direction.y * (overlap / 2),
    },
    pos2: {
      x: pos2.x + direction.x * (overlap / 2),
      y: pos2.y + direction.y * (overlap / 2),
    },
  }
}

/**
 * Resolve combatant collision
 */
export function resolveCombatantCollision(
  pos1: Vec2,
  pos2: Vec2
): { pos1: Vec2; pos2: Vec2 } {
  return resolveCircleCollision(
    pos1,
    PHYSICS_CONSTANTS.BODY_RADIUS,
    pos2,
    PHYSICS_CONSTANTS.BODY_RADIUS
  )
}

/**
 * Check if point is within attack arc
 */
export function isInAttackArc(
  attackerPos: Vec2,
  attackerFacing: number,
  targetPos: Vec2,
  arcAngle: number
): boolean {
  const directionToTarget = Vector.subtract(targetPos, attackerPos)
  const angleToTarget = Vector.angle(directionToTarget)
  const angleDiff = Math.abs(angleToTarget - attackerFacing)

  // Normalize angle difference to [0, π]
  const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff)

  // Check if within half the arc angle on each side
  return normalizedAngleDiff <= arcAngle / 2
}

/**
 * Check if target is in melee range and arc
 */
export function checkMeleeHit(
  attackerPos: Vec2,
  attackerFacing: number,
  targetPos: Vec2,
  range: number,
  arcAngle: number = Math.PI / 2
): boolean {
  // Check range
  const dist = Vector.distance(attackerPos, targetPos)
  if (dist > range) return false

  // Check arc
  return isInAttackArc(attackerPos, attackerFacing, targetPos, arcAngle)
}

/**
 * Check if point is in bounding box
 */
export function pointInBounds(point: Vec2, bounds: BoundingBox): boolean {
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  )
}

/**
 * Check circle-rectangle collision
 */
export function circleRectCollision(
  circlePos: Vec2,
  radius: number,
  rect: Rectangle
): boolean {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rect.position.x, Math.min(circlePos.x, rect.position.x + rect.width))
  const closestY = Math.max(rect.position.y, Math.min(circlePos.y, rect.position.y + rect.height))

  // Calculate distance from circle center to closest point
  const distSq = Vector.distanceSquared(circlePos, { x: closestX, y: closestY })

  return distSq < radius * radius
}
