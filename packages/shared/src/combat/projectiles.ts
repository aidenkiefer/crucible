/**
 * Projectile System
 * Pure functions for projectile spawning, movement, and collision
 */

import type { Vec2 } from '../physics'
import { Vector, Collision } from '../physics'
import type { ProjectileState, WeaponDefinition } from './types'

// ============================================================================
// Projectile Spawning
// ============================================================================

/**
 * Calculate spawn position for projectile
 * Returns position in front of unit based on facing and weapon range
 */
export function calculateSpawnPosition(
  unitPos: Vec2,
  facing: number,
  spawnDistance: number
): Vec2 {
  return {
    x: unitPos.x + Math.cos(facing) * spawnDistance,
    y: unitPos.y + Math.sin(facing) * spawnDistance,
  }
}

/**
 * Calculate projectile velocity based on facing and speed
 */
export function calculateProjectileVelocity(
  facing: number,
  speed: number
): Vec2 {
  return {
    x: Math.cos(facing) * speed,
    y: Math.sin(facing) * speed,
  }
}

/**
 * Create projectile state
 * Pure function - doesn't add to any collection
 */
export function createProjectile(
  id: string,
  ownerUnitId: string,
  unitPos: Vec2,
  facing: number,
  weapon: WeaponDefinition,
  damage: number,
  currentTime: number
): ProjectileState {
  if (!weapon.projectileSpeed || !weapon.projectileLifetime) {
    throw new Error(`Weapon ${weapon.type} does not support projectiles`)
  }

  const pos = calculateSpawnPosition(unitPos, facing, weapon.range)
  const vel = calculateProjectileVelocity(facing, weapon.projectileSpeed)

  return {
    id,
    ownerUnitId,
    pos,
    vel,
    radius: 0.3,
    damage,
    damageType: 'physical',
    lifetime: weapon.projectileLifetime,
    createdAt: currentTime,
  }
}

// ============================================================================
// Projectile Movement
// ============================================================================

/**
 * Update projectile position based on velocity
 * Returns new position
 */
export function updateProjectilePosition(
  pos: Vec2,
  vel: Vec2,
  deltaTime: number
): Vec2 {
  const dt = deltaTime / 1000 // Convert to seconds
  return {
    x: pos.x + vel.x * dt,
    y: pos.y + vel.y * dt,
  }
}

/**
 * Check if projectile has expired
 */
export function isProjectileExpired(
  projectile: ProjectileState,
  currentTime: number
): boolean {
  const age = currentTime - projectile.createdAt
  return age >= projectile.lifetime
}

/**
 * Check if projectile is out of bounds
 */
export function isProjectileOutOfBounds(
  pos: Vec2,
  arenaWidth: number,
  arenaHeight: number
): boolean {
  return pos.x < 0 || pos.x > arenaWidth || pos.y < 0 || pos.y > arenaHeight
}

// ============================================================================
// Projectile Collision
// ============================================================================

/**
 * Check if projectile collides with a unit
 * Uses circle-circle collision with unit radius 0.5
 */
export function checkProjectileUnitCollision(
  projectilePos: Vec2,
  projectileRadius: number,
  unitPos: Vec2,
  unitRadius: number = 0.5
): boolean {
  return Collision.circleCollision(
    projectilePos,
    projectileRadius,
    unitPos,
    unitRadius
  )
}

/**
 * Check if projectile should hit a unit
 * Includes owner and invulnerability checks
 */
export function shouldProjectileHit(
  projectile: ProjectileState,
  unitId: string,
  isInvulnerable: boolean
): boolean {
  // Don't hit owner
  if (unitId === projectile.ownerUnitId) {
    return false
  }

  // Don't hit invulnerable targets
  if (isInvulnerable) {
    return false
  }

  return true
}
