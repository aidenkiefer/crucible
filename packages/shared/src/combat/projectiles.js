"use strict";
/**
 * Projectile System
 * Pure functions for projectile spawning, movement, and collision
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSpawnPosition = calculateSpawnPosition;
exports.calculateProjectileVelocity = calculateProjectileVelocity;
exports.createProjectile = createProjectile;
exports.updateProjectilePosition = updateProjectilePosition;
exports.isProjectileExpired = isProjectileExpired;
exports.isProjectileOutOfBounds = isProjectileOutOfBounds;
exports.checkProjectileUnitCollision = checkProjectileUnitCollision;
exports.shouldProjectileHit = shouldProjectileHit;
const physics_1 = require("../physics");
// ============================================================================
// Projectile Spawning
// ============================================================================
/**
 * Calculate spawn position for projectile
 * Returns position in front of unit based on facing and weapon range
 */
function calculateSpawnPosition(unitPos, facing, spawnDistance) {
    return {
        x: unitPos.x + Math.cos(facing) * spawnDistance,
        y: unitPos.y + Math.sin(facing) * spawnDistance,
    };
}
/**
 * Calculate projectile velocity based on facing and speed
 */
function calculateProjectileVelocity(facing, speed) {
    return {
        x: Math.cos(facing) * speed,
        y: Math.sin(facing) * speed,
    };
}
/**
 * Create projectile state
 * Pure function - doesn't add to any collection
 */
function createProjectile(id, ownerUnitId, unitPos, facing, weapon, damage, currentTime) {
    if (!weapon.projectileSpeed || !weapon.projectileLifetime) {
        throw new Error(`Weapon ${weapon.type} does not support projectiles`);
    }
    const pos = calculateSpawnPosition(unitPos, facing, weapon.range);
    const vel = calculateProjectileVelocity(facing, weapon.projectileSpeed);
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
    };
}
// ============================================================================
// Projectile Movement
// ============================================================================
/**
 * Update projectile position based on velocity
 * Returns new position
 */
function updateProjectilePosition(pos, vel, deltaTime) {
    const dt = deltaTime / 1000; // Convert to seconds
    return {
        x: pos.x + vel.x * dt,
        y: pos.y + vel.y * dt,
    };
}
/**
 * Check if projectile has expired
 */
function isProjectileExpired(projectile, currentTime) {
    const age = currentTime - projectile.createdAt;
    return age >= projectile.lifetime;
}
/**
 * Check if projectile is out of bounds
 */
function isProjectileOutOfBounds(pos, arenaWidth, arenaHeight) {
    return pos.x < 0 || pos.x > arenaWidth || pos.y < 0 || pos.y > arenaHeight;
}
// ============================================================================
// Projectile Collision
// ============================================================================
/**
 * Check if projectile collides with a unit
 * Uses circle-circle collision with unit radius 0.5
 */
function checkProjectileUnitCollision(projectilePos, projectileRadius, unitPos, unitRadius = 0.5) {
    return physics_1.Collision.circleCollision(projectilePos, projectileRadius, unitPos, unitRadius);
}
/**
 * Check if projectile should hit a unit
 * Includes owner and invulnerability checks
 */
function shouldProjectileHit(projectile, unitId, isInvulnerable) {
    // Don't hit owner
    if (unitId === projectile.ownerUnitId) {
        return false;
    }
    // Don't hit invulnerable targets
    if (isInvulnerable) {
        return false;
    }
    return true;
}
