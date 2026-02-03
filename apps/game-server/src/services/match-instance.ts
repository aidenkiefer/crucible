/**
 * Match Instance
 * Manages a single match's lifecycle and combat simulation at 20Hz
 */

import { CombatEngine } from '../combat/engine'
import { CpuAI } from '../ai/cpu-ai'
import {
  Combatant,
  Action,
  ActionType,
  WeaponType,
  COMBAT_CONSTANTS,
  CombatState,
  CombatEvent,
} from '../combat/types'
import { calculateDerivedStats } from '../combat/damage-calculator'

// ============================================================================
// Types
// ============================================================================

export interface PlayerConfig {
  userId: string
  gladiatorId: string
  stats: {
    constitution: number
    strength: number
    dexterity: number
    speed: number
    defense: number
    magicResist: number
    arcana: number
    faith: number
  }
}

export interface MatchConfig {
  matchId: string
  player1: PlayerConfig
  player2?: PlayerConfig // undefined for CPU matches
  isCpuMatch: boolean
}

export enum MatchStatus {
  Waiting = 'Waiting',
  InProgress = 'InProgress',
  Completed = 'Completed',
}

export interface MatchResult {
  winnerId: string
  duration: number // seconds
  events: CombatEvent[]
}

// ============================================================================
// Match Instance
// ============================================================================

export class MatchInstance {
  private config: MatchConfig
  private engine: CombatEngine
  private cpuAI: CpuAI | null
  private status: MatchStatus
  private tickInterval: NodeJS.Timeout | null
  private pendingActions: Map<string, Action>
  private matchStartTime: number
  private stateSnapshots: CombatState[]
  private allEvents: CombatEvent[]

  constructor(config: MatchConfig) {
    this.config = config
    this.status = MatchStatus.Waiting
    this.tickInterval = null
    this.pendingActions = new Map()
    this.matchStartTime = 0
    this.stateSnapshots = []
    this.allEvents = []

    // Create combatants from player configs
    const combatant1 = this.createCombatant(config.player1)
    const combatant2 = config.isCpuMatch
      ? this.createCpuCombatant()
      : this.createCombatant(config.player2!)

    // Initialize combat engine
    this.engine = new CombatEngine(combatant1, combatant2)

    // Initialize CPU AI if needed
    this.cpuAI = config.isCpuMatch ? new CpuAI() : null
  }

  /**
   * Start the match and begin tick loop
   */
  public start(): void {
    if (this.status !== MatchStatus.Waiting) {
      throw new Error('Match already started')
    }

    this.status = MatchStatus.InProgress
    this.matchStartTime = Date.now()

    // Start tick loop at 20Hz (50ms interval)
    this.tickInterval = setInterval(() => {
      this.processTick()
    }, COMBAT_CONSTANTS.TICK_INTERVAL)

    console.log(`Match ${this.config.matchId} started`)
  }

  /**
   * Stop the match
   */
  public stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }

    if (this.status === MatchStatus.InProgress) {
      this.status = MatchStatus.Completed
    }

    console.log(`Match ${this.config.matchId} stopped`)
  }

  /**
   * Submit an action from a player
   */
  public submitAction(gladiatorId: string, action: Action): void {
    if (this.status !== MatchStatus.InProgress) {
      return
    }

    this.pendingActions.set(gladiatorId, action)
  }

  /**
   * Get current match state
   */
  public getState(): CombatState {
    return this.engine.getState()
  }

  /**
   * Get match status
   */
  public getStatus(): MatchStatus {
    return this.status
  }

  /**
   * Get match result (only available when completed)
   */
  public getResult(): MatchResult | null {
    if (this.status !== MatchStatus.Completed) {
      return null
    }

    const duration = (Date.now() - this.matchStartTime) / 1000
    const winnerId = this.engine.getWinner()

    if (!winnerId) {
      return null
    }

    // Map winner combatant ID to gladiator ID
    const winnerGladiatorId = this.mapCombatantToGladiator(winnerId)

    return {
      winnerId: winnerGladiatorId,
      duration,
      events: this.allEvents,
    }
  }

  /**
   * Get match ID
   */
  public getMatchId(): string {
    return this.config.matchId
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Process a single tick of the match
   */
  private processTick(): void {
    const currentTime = this.engine.getState().elapsedTime
    const actions: Array<{ combatantId: string; action: Action }> = []

    // Get player 1 action
    const p1Action = this.pendingActions.get(this.config.player1.gladiatorId)
    if (p1Action) {
      actions.push({
        combatantId: this.config.player1.gladiatorId,
        action: p1Action,
      })
    }

    // Get player 2 action (CPU or human)
    if (this.config.isCpuMatch && this.cpuAI) {
      const state = this.engine.getState()
      const cpuAction = this.cpuAI.getNextAction(
        state.combatant2,
        state.combatant1,
        currentTime
      )
      if (cpuAction) {
        actions.push({
          combatantId: 'cpu',
          action: cpuAction,
        })
      }
    } else if (this.config.player2) {
      const p2Action = this.pendingActions.get(this.config.player2.gladiatorId)
      if (p2Action) {
        actions.push({
          combatantId: this.config.player2.gladiatorId,
          action: p2Action,
        })
      }
    }

    // Process tick with both actions
    this.engine.processTick(actions)

    // Clear pending actions
    this.pendingActions.clear()

    // Store events
    const events = this.engine.getEvents()
    this.allEvents.push(...events)

    // Store state snapshot every 10 ticks (0.5 seconds)
    if (this.engine.getState().tickNumber % 10 === 0) {
      this.stateSnapshots.push({ ...this.engine.getState() })
    }

    // Check if match is over
    if (this.engine.isMatchOver()) {
      this.stop()
    }
  }

  /**
   * Create a combatant from player config
   */
  private createCombatant(player: PlayerConfig): Combatant {
    const derivedStats = calculateDerivedStats(player.stats)

    return {
      id: player.gladiatorId,
      position: { x: 300, y: 300 }, // Start position (left side)
      velocity: { dx: 0, dy: 0 },
      facingAngle: 0,
      currentHp: derivedStats.maxHp,
      currentStamina: derivedStats.maxStamina,
      baseAttributes: player.stats,
      derivedStats,
      isAlive: true,
      isInvulnerable: false,
      invulnerabilityEndTime: 0,
      equippedWeapon: WeaponType.Sword,
      currentAction: null,
    }
  }

  /**
   * Create a CPU combatant with balanced stats
   */
  private createCpuCombatant(): Combatant {
    const baseAttributes = {
      constitution: 50,
      strength: 50,
      dexterity: 50,
      speed: 50,
      defense: 50,
      magicResist: 50,
      arcana: 50,
      faith: 50,
    }

    const derivedStats = calculateDerivedStats(baseAttributes)

    return {
      id: 'cpu',
      position: { x: 500, y: 300 }, // Start position (right side)
      velocity: { dx: 0, dy: 0 },
      facingAngle: Math.PI, // Facing left
      currentHp: derivedStats.maxHp,
      currentStamina: derivedStats.maxStamina,
      baseAttributes,
      derivedStats,
      isAlive: true,
      isInvulnerable: false,
      invulnerabilityEndTime: 0,
      equippedWeapon: WeaponType.Sword,
      currentAction: null,
    }
  }

  /**
   * Map combatant ID to gladiator ID
   */
  private mapCombatantToGladiator(combatantId: string): string {
    if (combatantId === this.config.player1.gladiatorId) {
      return this.config.player1.gladiatorId
    }
    if (combatantId === 'cpu') {
      return 'cpu'
    }
    if (this.config.player2 && combatantId === this.config.player2.gladiatorId) {
      return this.config.player2.gladiatorId
    }
    return combatantId
  }
}
