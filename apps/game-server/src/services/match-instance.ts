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
  CombatEventType,
} from '../combat/types'
import { calculateDerivedStats } from '../combat/damage-calculator'
import { prisma } from '@gladiator/database/src/client'
import { awardMatchXP } from './progression'

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

// Sprint 5: Match stats tracking
interface MatchStats {
  damageDealt: { player1: number; player2: number }
  dodgesUsed: { player1: number; player2: number }
  attacksLanded: { player1: number; player2: number }
}

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

  // Sprint 5: Stats tracking
  private matchStats: MatchStats = {
    damageDealt: { player1: 0, player2: 0 },
    dodgesUsed: { player1: 0, player2: 0 },
    attacksLanded: { player1: 0, player2: 0 },
  }

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

    // Start tick loop at 60Hz (16.67ms interval) - Sprint 6
    this.tickInterval = setInterval(() => {
      this.processTick()
    }, COMBAT_CONSTANTS.TICK_INTERVAL)

    console.log(`Match ${this.config.matchId} started at 60Hz`)
  }

  /**
   * Stop the match
   */
  public async stop(): Promise<void> {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }

    if (this.status === MatchStatus.InProgress) {
      this.status = MatchStatus.Completed

      // Sprint 5: Persist match results and award rewards
      await this.persistMatchResult()
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

  /**
   * Check if a user is participating in this match
   * Sprint 6: Used for disconnect handling
   */
  public hasUser(userId: string): boolean {
    if (this.config.player1.userId === userId) {
      return true
    }
    if (this.config.player2 && this.config.player2.userId === userId) {
      return true
    }
    return false
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

    // Sprint 5: Track stats from events
    this.trackStats(events)

    // Store state snapshot every 10 ticks (0.5 seconds)
    if (this.engine.getState().tickNumber % 10 === 0) {
      this.stateSnapshots.push({ ...this.engine.getState() })
    }

    // Check if match is over
    if (this.engine.isMatchOver()) {
      // Note: stop() is now async, but called without await here
      // Match cleanup happens asynchronously after combat ends
      this.stop().catch(err => {
        console.error(`Failed to persist match ${this.config.matchId}:`, err)
      })
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
      weapon: WeaponType.Sword,
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
      weapon: WeaponType.Sword,
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

  // ============================================================================
  // Sprint 5: Match Persistence & Stats Tracking
  // ============================================================================

  /**
   * Track stats from combat events
   */
  private trackStats(events: CombatEvent[]): void {
    for (const event of events) {
      const isPlayer1 = event.combatantId === this.config.player1.gladiatorId

      switch (event.type) {
        case CombatEventType.DamageTaken:
          // Damage dealt by the OTHER player
          if (isPlayer1) {
            this.matchStats.damageDealt.player2 += event.data?.damage || 0
          } else if (event.combatantId !== 'cpu') {
            this.matchStats.damageDealt.player1 += event.data?.damage || 0
          }
          break

        case CombatEventType.DodgeActivated:
          if (isPlayer1) {
            this.matchStats.dodgesUsed.player1++
          } else if (event.combatantId !== 'cpu') {
            this.matchStats.dodgesUsed.player2++
          }
          break

        case CombatEventType.ActionPerformed:
          if (event.data?.actionType === ActionType.Attack) {
            if (isPlayer1) {
              this.matchStats.attacksLanded.player1++
            } else if (event.combatantId !== 'cpu') {
              this.matchStats.attacksLanded.player2++
            }
          }
          break
      }
    }
  }

  /**
   * Persist match result to database with rewards
   */
  private async persistMatchResult(): Promise<void> {
    const winnerId = this.engine.getWinner()
    const duration = (Date.now() - this.matchStartTime) / 1000

    if (!winnerId) {
      console.error(`Match ${this.config.matchId} ended without winner`)
      return
    }

    const winnerGladiatorId = this.mapCombatantToGladiator(winnerId)
    const loserGladiatorId = winnerId === this.config.player1.gladiatorId
      ? (this.config.player2?.gladiatorId || 'cpu')
      : this.config.player1.gladiatorId

    try {
      // Calculate reward (Sprint 5: 80% chance for Wooden Loot Box on CPU wins)
      let rewardType: string | null = null
      let rewardAmount = 0
      let lootBoxTier: string | null = null

      if (this.config.isCpuMatch && winnerGladiatorId !== 'cpu') {
        // 80% chance for loot box
        if (Math.random() < 0.80) {
          rewardType = 'loot_box_key'
          rewardAmount = 1
          lootBoxTier = 'wooden'
        }
      }

      // Update match in database
      await prisma.match.update({
        where: { id: this.config.matchId },
        data: {
          winnerId: winnerGladiatorId,
          durationSeconds: Math.floor(duration),
          completedAt: new Date(),
          matchStats: this.matchStats as any,
          rewardType,
          rewardAmount,
          lootBoxTier,
          // Store compressed event log (last 100 events)
          matchLog: this.compressEvents(this.allEvents),
        },
      })

      // Award loot box if applicable
      if (rewardType === 'loot_box_key' && lootBoxTier) {
        await this.awardLootBox(winnerGladiatorId, lootBoxTier)
      }

      // Award XP (Sprint 5: Task 2)
      // Winner gets 100 XP, loser gets 25 XP
      if (winnerGladiatorId !== 'cpu') {
        await awardMatchXP(winnerGladiatorId, true)
      }
      if (loserGladiatorId !== 'cpu') {
        await awardMatchXP(loserGladiatorId, false)
      }

      console.log(`Match ${this.config.matchId} persisted: winner=${winnerGladiatorId}, reward=${rewardType}`)
    } catch (error) {
      console.error('Failed to persist match result:', error)
      // Don't throw - match is over, just log the error
    }
  }

  /**
   * Compress events for storage (last 100 events only)
   */
  private compressEvents(events: CombatEvent[]): any {
    // For demo: just store last 100 events
    // Future: Use pako or similar for compression
    return events.slice(-100)
  }

  /**
   * Award loot box to winner (Task 1 will implement this properly)
   */
  private async awardLootBox(gladiatorId: string, tier: string): Promise<void> {
    if (gladiatorId === 'cpu') return

    try {
      // Get user ID from gladiator
      const gladiator = await prisma.gladiator.findUnique({
        where: { id: gladiatorId },
        select: { ownerId: true },
      })

      if (!gladiator) {
        console.error(`Gladiator ${gladiatorId} not found for loot box reward`)
        return
      }

      // Create loot box
      await prisma.lootBox.create({
        data: {
          ownerId: gladiator.ownerId,
          tier,
          opened: false,
        },
      })

      console.log(`✨ Awarded ${tier} loot box to user ${gladiator.ownerId}`)
    } catch (error) {
      console.error('Failed to award loot box:', error)
    }
  }
}
