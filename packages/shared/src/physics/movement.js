"use strict";
/**
 * Movement and Position Integration
 * Pure, deterministic position updates
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrate = integrate;
exports.clampToArena = clampToArena;
exports.calculateVelocity = calculateVelocity;
exports.updatePosition = updatePosition;
exports.calculateDodgeVelocity = calculateDodgeVelocity;
const constants_1 = require("./constants");
const Vector = __importStar(require("./vector"));
/**
 * Apply velocity to position for a given delta time
 * Returns new position (does not mutate input)
 */
function integrate(position, velocity, deltaTime) {
    const dt = deltaTime / 1000; // Convert ms to seconds
    return {
        x: position.x + velocity.x * dt,
        y: position.y + velocity.y * dt,
    };
}
/**
 * Clamp position to arena boundaries
 */
function clampToArena(position, arenaWidth = constants_1.PHYSICS_CONSTANTS.ARENA_WIDTH, arenaHeight = constants_1.PHYSICS_CONSTANTS.ARENA_HEIGHT) {
    return {
        x: Math.max(0, Math.min(arenaWidth, position.x)),
        y: Math.max(0, Math.min(arenaHeight, position.y)),
    };
}
/**
 * Calculate velocity from direction and speed
 */
function calculateVelocity(direction, speed) {
    const normalized = Vector.normalize(direction);
    return Vector.scale(normalized, speed);
}
/**
 * Update position with velocity and arena clamping
 * Returns new position
 */
function updatePosition(position, velocity, deltaTime, arenaWidth, arenaHeight) {
    const newPos = integrate(position, velocity, deltaTime);
    return clampToArena(newPos, arenaWidth, arenaHeight);
}
/**
 * Calculate dodge roll velocity
 */
function calculateDodgeVelocity(direction) {
    const dodgeSpeed = (constants_1.PHYSICS_CONSTANTS.DODGE_DISTANCE / constants_1.PHYSICS_CONSTANTS.DODGE_DURATION) * 1000;
    const normalized = Vector.normalize(direction);
    return Vector.scale(normalized, dodgeSpeed);
}
