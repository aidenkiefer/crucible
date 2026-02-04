/**
 * Vector Math
 * Pure, deterministic vector operations
 */

import type { Vec2 } from './types'

/**
 * Normalize a vector to unit length
 */
export function normalize(v: Vec2): Vec2 {
  const mag = magnitude(v)
  if (mag === 0) return { x: 0, y: 0 }
  return {
    x: v.x / mag,
    y: v.y / mag,
  }
}

/**
 * Calculate magnitude (length) of a vector
 */
export function magnitude(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

/**
 * Calculate distance between two points
 */
export function distance(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate squared distance (faster, no sqrt)
 */
export function distanceSquared(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return dx * dx + dy * dy
}

/**
 * Scale a vector by a scalar
 */
export function scale(v: Vec2, scalar: number): Vec2 {
  return {
    x: v.x * scalar,
    y: v.y * scalar,
  }
}

/**
 * Add two vectors
 */
export function add(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  }
}

/**
 * Subtract vector b from vector a
 */
export function subtract(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  }
}

/**
 * Dot product of two vectors
 */
export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

/**
 * Calculate angle from vector
 */
export function angle(v: Vec2): number {
  return Math.atan2(v.y, v.x)
}

/**
 * Calculate angle between two points
 */
export function angleBetween(from: Vec2, to: Vec2): number {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

/**
 * Linear interpolation between two vectors
 */
export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  }
}

/**
 * Clamp a vector to a maximum magnitude
 */
export function clampMagnitude(v: Vec2, maxMag: number): Vec2 {
  const mag = magnitude(v)
  if (mag <= maxMag) return v
  return scale(normalize(v), maxMag)
}
