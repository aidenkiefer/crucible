/**
 * Combat Engine
 * Server-authoritative real-time combat simulation at 20Hz
 */

import {
  Combatant,
  CombatState,
  Action,
  ActionType,
  MoveAction,
  AttackAction,
  DodgeAction,
  ActionState,
  CombatEvent,
  CombatEventType,
  Vector2D,
  COMBAT_CONSTANTS,
  WeaponType,
} from './types'

import {
  updatePosition,
  setVelocity,
  stopMovement,
  performDodgeRoll,
  updateInvulnerability,
  checkAttackHit,
  checkCombatantCollision,
  resolveCombatantCollision,
} from './physics'

import {
  applyDamage,
  hasStamina,
  consumeStamina,
  regenerateStamina,
  initializeCombatant,
} from './damage-calculator'

// ============================================================================
// Combat Engine
// ============================================================================

export class CombatEngine {
  private state: CombatState
  private events: CombatEvent[]

  constructor(combatant1: Combatant, combatant2: Combatant) {
    // Initialize combatants
    initializeCombatant(combatant1)
    initializeCombatant(combatant2)

    this.state = {
      combatant1,
      combatant2,
      tickNumber: 0,
      elapsedTime: 0,
      winner: null,
      arenaSize: {
        x: COMBAT_CONSTANTS.ARENA_WIDTH,
        y: COMBAT_CONSTANTS.ARENA_HEIGHT,
      },
    }

    this.events = []
  }

  /**
   * Process a single tick of the combat simulation
   * Called every 50ms (20Hz)
   */
  public processTick(actions: Array<{ combatantId: string; action: Action }>): void {
    this.events = [] // Clear previous tick events
    const currentTime = this.state.elapsedTime

    // Step 1: Process actions from both combatants
    for (const { combatantId, action } of actions) {
      const combatant = this.getCombatant(combatantId)
      if (!combatant || !combatant.isAlive) continue

      this.processAction(combatant, action, currentTime)
    }

    // Step 2: Update invulnerability status (i-frames)
    this.updateInvulnerabilities(currentTime)

    // Step 3: Update positions based on velocity
    updatePosition(this.state.combatant1, COMBAT_CONSTANTS.TICK_INTERVAL)
    updatePosition(this.state.combatant2, COMBAT_CONSTANTS.TICK_INTERVAL)

    // Step 4: Check and resolve body collisions
    if (checkCombatantCollision(this.state.combatant1, this.state.combatant2)) {
      resolveCombatantCollision(this.state.combatant1, this.state.combatant2)
    }

    // Step 5: Regenerate stamina
    regenerateStamina(this.state.combatant1, COMBAT_CONSTANTS.TICK_INTERVAL)
    regenerateStamina(this.state.combatant2, COMBAT_CONSTANTS.TICK_INTERVAL)

    // Step 6: Update action states (remove completed actions)
    this.updateActionStates(currentTime)

    // Step 7: Check for winner
    this.checkWinner()

    // Update tick counter and elapsed time
    this.state.tickNumber++
    this.state.elapsedTime += COMBAT_CONSTANTS.TICK_INTERVAL
  }

  /**
   * Process a single action from a combatant
   */
  private processAction(
    combatant: Combatant,
    action: Action,
    currentTime: number
  ): void {
    // Check if combatant is currently performing an action
    if (combatant.currentAction && currentTime < combatant.currentAction.endTime) {
      this.addEvent({
        type: CombatEventType.ActionFailed,
        timestamp: currentTime,
        combatantId: combatant.id,
        data: { reason: 'action_in_progress' },
      })
      return
    }

    // Check cooldown
    if (
      combatant.currentAction &&
      currentTime < combatant.currentAction.cooldownEndTime
    ) {
      this.addEvent({
        type: CombatEventType.ActionFailed,
        timestamp: currentTime,
        combatantId: combatant.id,
        data: { reason: 'cooldown_active' },
      })
      return
    }

    switch (action.type) {
      case ActionType.Move:
        this.processMoveAction(combatant, action, currentTime)
        break
      case ActionType.Attack:
        this.processAttackAction(combatant, action, currentTime)
        break
      case ActionType.Dodge:
        this.processDodgeAction(combatant, action, currentTime)
        break
    }
  }

  /**
   * Process movement action
   */
  private processMoveAction(
    combatant: Combatant,
    action: MoveAction,
    currentTime: number
  ): void {
    setVelocity(combatant, action.direction)

    this.addEvent({
      type: CombatEventType.ActionPerformed,
      timestamp: currentTime,
      combatantId: combatant.id,
      data: { action: 'move', direction: action.direction },
    })
  }

  /**
   * Process attack action
   */
  private processAttackAction(
    combatant: Combatant,
    action: AttackAction,
    currentTime: number
  ): void {
    const weapon = COMBAT_CONSTANTS.SWORD_CONFIG // Only sword in Sprint 2

    // Check stamina
    if (!hasStamina(combatant, weapon.staminaCost)) {
      this.addEvent({
        type: CombatEventType.ActionFailed,
        timestamp: currentTime,
        combatantId: combatant.id,
        data: { reason: 'insufficient_stamina' },
      })
      return
    }

    // Consume stamina
    consumeStamina(combatant, weapon.staminaCost)
    this.addEvent({
      type: CombatEventType.StaminaConsumed,
      timestamp: currentTime,
      combatantId: combatant.id,
      data: { amount: weapon.staminaCost },
    })

    // Update facing direction
    combatant.facingAngle = Math.atan2(
      action.targetDirection.y,
      action.targetDirection.x
    )

    // Check if attack hits
    const target = this.getOpponent(combatant.id)
    if (!target) return

    const hit = checkAttackHit(combatant, target, weapon.range)

    if (hit) {
      const damage = applyDamage(combatant, target, weapon)

      this.addEvent({
        type: CombatEventType.DamageTaken,
        timestamp: currentTime,
        combatantId: target.id,
        data: { damage, attackerId: combatant.id },
      })

      // Check if target died
      if (!target.isAlive) {
        this.addEvent({
          type: CombatEventType.Death,
          timestamp: currentTime,
          combatantId: target.id,
          data: { killerId: combatant.id },
        })
      }
    }

    // Set action state
    combatant.currentAction = {
      type: ActionType.Attack,
      startTime: currentTime,
      endTime: currentTime + weapon.cooldown,
      cooldownEndTime: currentTime + weapon.cooldown,
    }

    this.addEvent({
      type: CombatEventType.ActionPerformed,
      timestamp: currentTime,
      combatantId: combatant.id,
      data: { action: 'attack', hit },
    })
  }

  /**
   * Process dodge action
   */
  private processDodgeAction(
    combatant: Combatant,
    action: DodgeAction,
    currentTime: number
  ): void {
    // Check stamina
    if (!hasStamina(combatant, COMBAT_CONSTANTS.DODGE_STAMINA_COST)) {
      this.addEvent({
        type: CombatEventType.ActionFailed,
        timestamp: currentTime,
        combatantId: combatant.id,
        data: { reason: 'insufficient_stamina' },
      })
      return
    }

    // Consume stamina
    consumeStamina(combatant, COMBAT_CONSTANTS.DODGE_STAMINA_COST)
    this.addEvent({
      type: CombatEventType.StaminaConsumed,
      timestamp: currentTime,
      combatantId: combatant.id,
      data: { amount: COMBAT_CONSTANTS.DODGE_STAMINA_COST },
    })

    // Perform dodge roll
    performDodgeRoll(combatant, action, currentTime)

    // Set action state
    combatant.currentAction = {
      type: ActionType.Dodge,
      startTime: currentTime,
      endTime: currentTime + COMBAT_CONSTANTS.DODGE_DURATION,
      cooldownEndTime: currentTime + COMBAT_CONSTANTS.DODGE_COOLDOWN,
    }

    this.addEvent({
      type: CombatEventType.DodgeActivated,
      timestamp: currentTime,
      combatantId: combatant.id,
      data: { direction: action.direction },
    })

    this.addEvent({
      type: CombatEventType.ActionPerformed,
      timestamp: currentTime,
      combatantId: combatant.id,
      data: { action: 'dodge' },
    })
  }

  /**
   * Update invulnerability status for both combatants
   */
  private updateInvulnerabilities(currentTime: number): void {
    if (updateInvulnerability(this.state.combatant1, currentTime)) {
      this.addEvent({
        type: CombatEventType.InvulnerabilityEnded,
        timestamp: currentTime,
        combatantId: this.state.combatant1.id,
      })
    }

    if (updateInvulnerability(this.state.combatant2, currentTime)) {
      this.addEvent({
        type: CombatEventType.InvulnerabilityEnded,
        timestamp: currentTime,
        combatantId: this.state.combatant2.id,
      })
    }
  }

  /**
   * Update action states (clear completed actions)
   */
  private updateActionStates(currentTime: number): void {
    if (
      this.state.combatant1.currentAction &&
      currentTime >= this.state.combatant1.currentAction.endTime
    ) {
      // Clear action (but keep cooldown)
      if (this.state.combatant1.currentAction.type === ActionType.Dodge) {
        // Stop dodge roll velocity after duration
        stopMovement(this.state.combatant1)
      }
    }

    if (
      this.state.combatant2.currentAction &&
      currentTime >= this.state.combatant2.currentAction.endTime
    ) {
      if (this.state.combatant2.currentAction.type === ActionType.Dodge) {
        stopMovement(this.state.combatant2)
      }
    }
  }

  /**
   * Check if there's a winner
   */
  private checkWinner(): void {
    if (!this.state.combatant1.isAlive) {
      this.state.winner = this.state.combatant2.id
    } else if (!this.state.combatant2.isAlive) {
      this.state.winner = this.state.combatant1.id
    }
  }

  /**
   * Get current combat state
   */
  public getState(): CombatState {
    return this.state
  }

  /**
   * Get events from the last tick
   */
  public getEvents(): CombatEvent[] {
    return this.events
  }

  /**
   * Check if match is over
   */
  public isMatchOver(): boolean {
    return this.state.winner !== null
  }

  /**
   * Get winner ID
   */
  public getWinner(): string | null {
    return this.state.winner
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getCombatant(id: string): Combatant | null {
    if (this.state.combatant1.id === id) return this.state.combatant1
    if (this.state.combatant2.id === id) return this.state.combatant2
    return null
  }

  private getOpponent(id: string): Combatant | null {
    if (this.state.combatant1.id === id) return this.state.combatant2
    if (this.state.combatant2.id === id) return this.state.combatant1
    return null
  }

  private addEvent(event: CombatEvent): void {
    this.events.push(event)
  }
}
