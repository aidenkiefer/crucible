/**
 * Client-Side Combat Types
 * Types for real-time combat state received from game server via WebSocket
 */

export interface Vector2D {
  x: number
  y: number
}

export interface ActionState {
  type: string
  startTime: number
  endTime: number
  cooldownEndTime: number
}

export interface DerivedStats {
  hpMax: number
  stamMax: number
  staminaRegen: number
  moveSpeed: number
  damageReduction: number
}

/**
 * Unit state for rendering
 * Matches the format sent by game server over WebSocket
 */
export interface UnitState {
  id: string
  name: string
  pos: Vector2D
  facing: number // radians
  hp: number
  stamina: number
  isInvulnerable: boolean
  currentAction: ActionState | null
  derived: DerivedStats
}

/**
 * Combatant data sent over WebSocket
 */
export interface CombatantData {
  id: string
  position: Vector2D
  facingAngle: number
  currentHp: number
  currentStamina: number
  isAlive: boolean
  isInvulnerable: boolean
  currentAction: ActionState | null
}

/**
 * Combat state received from server at 20Hz via WebSocket
 * Matches the format from match-handlers.ts
 */
export interface CombatState {
  matchId: string
  tickNumber: number
  elapsedTime: number
  combatant1: CombatantData
  combatant2: CombatantData
  winner: string | null
}
