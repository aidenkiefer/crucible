/**
 * Shared Physics Types
 * Pure, deterministic types for physics calculations
 * No Node-only or Three.js dependencies
 */

export interface Vec2 {
  x: number
  y: number
}

export interface Velocity extends Vec2 {
  dx?: number // Alias for x
  dy?: number // Alias for y
}

export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface Circle {
  center: Vec2
  radius: number
}

export interface Rectangle {
  position: Vec2
  width: number
  height: number
}
