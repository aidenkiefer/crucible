"use strict";
/**
 * Vector Math
 * Pure, deterministic vector operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = normalize;
exports.magnitude = magnitude;
exports.distance = distance;
exports.distanceSquared = distanceSquared;
exports.scale = scale;
exports.add = add;
exports.subtract = subtract;
exports.dot = dot;
exports.angle = angle;
exports.angleBetween = angleBetween;
exports.lerp = lerp;
exports.clampMagnitude = clampMagnitude;
/**
 * Normalize a vector to unit length
 */
function normalize(v) {
    const mag = magnitude(v);
    if (mag === 0)
        return { x: 0, y: 0 };
    return {
        x: v.x / mag,
        y: v.y / mag,
    };
}
/**
 * Calculate magnitude (length) of a vector
 */
function magnitude(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}
/**
 * Calculate distance between two points
 */
function distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
}
/**
 * Calculate squared distance (faster, no sqrt)
 */
function distanceSquared(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
}
/**
 * Scale a vector by a scalar
 */
function scale(v, scalar) {
    return {
        x: v.x * scalar,
        y: v.y * scalar,
    };
}
/**
 * Add two vectors
 */
function add(a, b) {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
    };
}
/**
 * Subtract vector b from vector a
 */
function subtract(a, b) {
    return {
        x: a.x - b.x,
        y: a.y - b.y,
    };
}
/**
 * Dot product of two vectors
 */
function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}
/**
 * Calculate angle from vector
 */
function angle(v) {
    return Math.atan2(v.y, v.x);
}
/**
 * Calculate angle between two points
 */
function angleBetween(from, to) {
    return Math.atan2(to.y - from.y, to.x - from.x);
}
/**
 * Linear interpolation between two vectors
 */
function lerp(a, b, t) {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
    };
}
/**
 * Clamp a vector to a maximum magnitude
 */
function clampMagnitude(v, maxMag) {
    const mag = magnitude(v);
    if (mag <= maxMag)
        return v;
    return scale(normalize(v), maxMag);
}
