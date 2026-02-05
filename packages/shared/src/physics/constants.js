"use strict";
/**
 * Physics Constants
 * Centralized constants for deterministic physics simulation
 * Shared between server (authoritative) and client (prediction)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHYSICS_CONSTANTS = void 0;
exports.PHYSICS_CONSTANTS = {
    // Tick Rate (Sprint 6: Upgraded to 60Hz simulation)
    TICK_RATE: 60, // Hz (internal simulation rate)
    TICK_INTERVAL: 16.67, // milliseconds (1000 / 60)
    // Broadcast Rate (separate from simulation)
    BROADCAST_RATE: 20, // Hz (client update rate)
    BROADCAST_INTERVAL: 50, // milliseconds (1000 / 20)
    // Arena Dimensions
    ARENA_WIDTH: 800, // units
    ARENA_HEIGHT: 600, // units
    // Movement
    BASE_MOVE_SPEED: 150, // units per second
    SPEED_CAP: 500, // maximum speed (units/s)
    // Dodge Roll
    DODGE_DURATION: 300, // milliseconds
    DODGE_IFRAMES_DURATION: 200, // milliseconds of invulnerability
    DODGE_DISTANCE: 100, // units traveled during roll
    DODGE_STAMINA_COST: 20,
    DODGE_COOLDOWN: 1000, // milliseconds
    // Collision
    BODY_RADIUS: 20, // unit collision radius
    MIN_SEPARATION: 0.1, // minimum separation to avoid divide by zero
    // Stamina
    BASE_STAMINA_REGEN: 10, // per second
    BASE_STAMINA: 100,
    STAMINA_PER_CONSTITUTION: 5,
    // HP
    BASE_HP: 100,
    HP_PER_CONSTITUTION: 10,
    // Defense
    DEFENSE_TO_REDUCTION: 0.01, // 1% reduction per defense point
    MAX_DAMAGE_REDUCTION: 0.75, // max 75% reduction
};
