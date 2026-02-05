"use strict";
/**
 * Damage Calculations
 * Pure functions for damage calculation and mitigation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRawDamage = calculateRawDamage;
exports.calculateFinalDamage = calculateFinalDamage;
exports.calculateDamage = calculateDamage;
exports.applyDamageToHp = applyDamageToHp;
exports.isDead = isDead;
/**
 * Calculate raw damage from a weapon attack before defense mitigation
 * Melee weapons scale with STR, ranged weapons scale with DEX
 */
function calculateRawDamage(weapon, attackerAttributes) {
    const baseDamage = weapon.baseDamage;
    // Apply weapon scaling
    const strDamage = attackerAttributes.strength * weapon.scaling.strength;
    const dexDamage = attackerAttributes.dexterity * weapon.scaling.dexterity;
    const scaledDamage = baseDamage + strDamage + dexDamage;
    return Math.floor(scaledDamage);
}
/**
 * Calculate final damage after applying target's defense
 */
function calculateFinalDamage(rawDamage, defenderStats) {
    // Apply damage reduction from defense stat
    const mitigatedDamage = rawDamage * (1 - defenderStats.damageReduction);
    // Minimum 1 damage
    return Math.max(1, Math.floor(mitigatedDamage));
}
/**
 * Calculate complete damage from attacker to defender
 * Combines raw damage calculation and defense mitigation
 */
function calculateDamage(weapon, attackerAttributes, defenderStats, isInvulnerable = false) {
    // No damage if invulnerable (dodge i-frames)
    if (isInvulnerable) {
        return 0;
    }
    const rawDamage = calculateRawDamage(weapon, attackerAttributes);
    return calculateFinalDamage(rawDamage, defenderStats);
}
/**
 * Calculate new HP after damage
 */
function applyDamageToHp(currentHp, damage) {
    return Math.max(0, currentHp - damage);
}
/**
 * Check if unit is dead
 */
function isDead(hp) {
    return hp <= 0;
}
