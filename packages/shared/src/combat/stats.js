"use strict";
/**
 * Combat Stats Calculations
 * Pure functions for deriving combat stats from base attributes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDerivedStats = calculateDerivedStats;
exports.calculateStaminaRegen = calculateStaminaRegen;
exports.hasStamina = hasStamina;
exports.consumeStamina = consumeStamina;
const physics_1 = require("../physics");
/**
 * Calculate derived stats from base attributes
 * Uses only 5 stats actively: CON, STR, DEX, SPD, DEF
 * (MRES, ARC, FTH reserved for magic system)
 */
function calculateDerivedStats(base) {
    // HP: Base HP + (CON * HP_PER_CONSTITUTION)
    const maxHp = physics_1.PHYSICS_CONSTANTS.BASE_HP +
        base.constitution * physics_1.PHYSICS_CONSTANTS.HP_PER_CONSTITUTION;
    // Stamina: Base Stamina + (CON * STAMINA_PER_CONSTITUTION)
    const maxStamina = physics_1.PHYSICS_CONSTANTS.BASE_STAMINA +
        base.constitution * physics_1.PHYSICS_CONSTANTS.STAMINA_PER_CONSTITUTION;
    // Stamina regen: Base regen (per second)
    const staminaRegen = physics_1.PHYSICS_CONSTANTS.BASE_STAMINA_REGEN;
    // Move speed: Base speed * (1 + SPD / 100)
    // e.g. 50 SPD = 150 * 1.5 = 225 units/second
    const moveSpeed = physics_1.PHYSICS_CONSTANTS.BASE_MOVE_SPEED * (1 + base.speed / 100);
    // Damage reduction: DEF * DEFENSE_TO_REDUCTION, capped at MAX_DAMAGE_REDUCTION
    // e.g. 50 DEF = 50% reduction, capped at 75%
    const damageReduction = Math.min(base.defense * physics_1.PHYSICS_CONSTANTS.DEFENSE_TO_REDUCTION, physics_1.PHYSICS_CONSTANTS.MAX_DAMAGE_REDUCTION);
    return {
        maxHp,
        maxStamina,
        staminaRegen,
        moveSpeed,
        damageReduction,
    };
}
/**
 * Calculate stamina regeneration amount for a given time delta
 */
function calculateStaminaRegen(current, max, regenRate, deltaTimeMs) {
    const deltaSeconds = deltaTimeMs / 1000;
    const regenAmount = regenRate * deltaSeconds;
    return Math.min(max, current + regenAmount);
}
/**
 * Check if entity has sufficient stamina for an action
 */
function hasStamina(current, cost) {
    return current >= cost;
}
/**
 * Calculate stamina after consumption
 */
function consumeStamina(current, cost) {
    return Math.max(0, current - cost);
}
