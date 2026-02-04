import { Vec2 } from '@gladiator/shared/src/combat/types'

export interface InterpolatedState {
  pos: Vec2
  facing: number
}

/**
 * Interpolate between two positions for smooth movement
 */
export function interpolatePosition(
  from: Vec2,
  to: Vec2,
  alpha: number
): Vec2 {
  return {
    x: from.x + (to.x - from.x) * alpha,
    y: from.y + (to.y - from.y) * alpha,
  }
}

/**
 * Interpolate angle (handles wraparound)
 */
export function interpolateAngle(
  from: number,
  to: number,
  alpha: number
): number {
  let diff = to - from
  // Normalize to [-PI, PI]
  while (diff > Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI

  return from + diff * alpha
}

/**
 * Smooth lerp for reconciliation
 */
export function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha
}
