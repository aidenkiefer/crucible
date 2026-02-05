"use strict";
/**
 * Weapon Definitions
 * Static weapon data with hardcoded fallback
 * TODO: Load from published bundle system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEAPONS = void 0;
exports.getWeapon = getWeapon;
exports.getAllWeaponTypes = getAllWeaponTypes;
const types_1 = require("./types");
// ============================================================================
// Weapon Definitions (Hardcoded Fallback)
// ============================================================================
exports.WEAPONS = {
    [types_1.WeaponType.Sword]: {
        type: types_1.WeaponType.Sword,
        attackPattern: types_1.AttackPattern.MeleeArc,
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
    [types_1.WeaponType.Spear]: {
        type: types_1.WeaponType.Spear,
        attackPattern: types_1.AttackPattern.MeleeThrust,
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
    [types_1.WeaponType.Bow]: {
        type: types_1.WeaponType.Bow,
        attackPattern: types_1.AttackPattern.Projectile,
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
    [types_1.WeaponType.Dagger]: {
        type: types_1.WeaponType.Dagger,
        attackPattern: types_1.AttackPattern.MeleeQuick,
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
};
/**
 * Get weapon definition by type
 * Returns hardcoded fallback; TODO: integrate with bundle system
 */
function getWeapon(type) {
    return exports.WEAPONS[type] || null;
}
/**
 * Get all weapon types
 */
function getAllWeaponTypes() {
    return Object.keys(exports.WEAPONS);
}
