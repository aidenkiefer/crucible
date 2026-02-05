"use strict";
/**
 * Collision Detection
 * Pure, deterministic collision checks and resolution
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
exports.circleCollision = circleCollision;
exports.combatantCollision = combatantCollision;
exports.resolveCircleCollision = resolveCircleCollision;
exports.resolveCombatantCollision = resolveCombatantCollision;
exports.isInAttackArc = isInAttackArc;
exports.checkMeleeHit = checkMeleeHit;
exports.pointInBounds = pointInBounds;
exports.circleRectCollision = circleRectCollision;
const constants_1 = require("./constants");
const Vector = __importStar(require("./vector"));
/**
 * Check if two circles collide
 */
function circleCollision(pos1, radius1, pos2, radius2) {
    const distSq = Vector.distanceSquared(pos1, pos2);
    const radiiSum = radius1 + radius2;
    return distSq < radiiSum * radiiSum;
}
/**
 * Check if two combatants collide (using body radius)
 */
function combatantCollision(pos1, pos2) {
    return circleCollision(pos1, constants_1.PHYSICS_CONSTANTS.BODY_RADIUS, pos2, constants_1.PHYSICS_CONSTANTS.BODY_RADIUS);
}
/**
 * Resolve collision between two circles
 * Returns adjusted positions for both entities
 */
function resolveCircleCollision(pos1, radius1, pos2, radius2) {
    const dist = Vector.distance(pos1, pos2);
    const radiiSum = radius1 + radius2;
    // No collision
    if (dist >= radiiSum) {
        return { pos1, pos2 };
    }
    // Avoid division by zero
    if (dist < constants_1.PHYSICS_CONSTANTS.MIN_SEPARATION) {
        // Push apart along arbitrary direction
        return {
            pos1: { x: pos1.x - radiiSum / 2, y: pos1.y },
            pos2: { x: pos2.x + radiiSum / 2, y: pos2.y },
        };
    }
    const overlap = radiiSum - dist;
    const direction = {
        x: (pos2.x - pos1.x) / dist,
        y: (pos2.y - pos1.y) / dist,
    };
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
    };
}
/**
 * Resolve combatant collision
 */
function resolveCombatantCollision(pos1, pos2) {
    return resolveCircleCollision(pos1, constants_1.PHYSICS_CONSTANTS.BODY_RADIUS, pos2, constants_1.PHYSICS_CONSTANTS.BODY_RADIUS);
}
/**
 * Check if point is within attack arc
 */
function isInAttackArc(attackerPos, attackerFacing, targetPos, arcAngle) {
    const directionToTarget = Vector.subtract(targetPos, attackerPos);
    const angleToTarget = Vector.angle(directionToTarget);
    const angleDiff = Math.abs(angleToTarget - attackerFacing);
    // Normalize angle difference to [0, π]
    const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
    // Check if within half the arc angle on each side
    return normalizedAngleDiff <= arcAngle / 2;
}
/**
 * Check if target is in melee range and arc
 */
function checkMeleeHit(attackerPos, attackerFacing, targetPos, range, arcAngle = Math.PI / 2) {
    // Check range
    const dist = Vector.distance(attackerPos, targetPos);
    if (dist > range)
        return false;
    // Check arc
    return isInAttackArc(attackerPos, attackerFacing, targetPos, arcAngle);
}
/**
 * Check if point is in bounding box
 */
function pointInBounds(point, bounds) {
    return (point.x >= bounds.minX &&
        point.x <= bounds.maxX &&
        point.y >= bounds.minY &&
        point.y <= bounds.maxY);
}
/**
 * Check circle-rectangle collision
 */
function circleRectCollision(circlePos, radius, rect) {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.position.x, Math.min(circlePos.x, rect.position.x + rect.width));
    const closestY = Math.max(rect.position.y, Math.min(circlePos.y, rect.position.y + rect.height));
    // Calculate distance from circle center to closest point
    const distSq = Vector.distanceSquared(circlePos, { x: closestX, y: closestY });
    return distSq < radius * radius;
}
