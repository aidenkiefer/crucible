/**
 * CPU AI for Real-Time Combat
 * Decision-making for CPU-controlled combatants
 */

import {
  Combatant,
  Action,
  ActionType,
  Vector2D,
  COMBAT_CONSTANTS,
} from '../combat/types'
import { vectorDistance, normalizeVector } from '../combat/physics'

// ============================================================================
// AI State
// ============================================================================

interface AIState {
  lastDecisionTime: number
  decisionCooldown: number // ms between decisions
  targetPosition: Vector2D | null
  currentStrategy: AIStrategy
}

enum AIStrategy {
  Aggressive = 'Aggressive',   // Move toward player and attack when in range
  Defensive = 'Defensive',     // Keep distance and dodge attacks
  Opportunistic = 'Opportunistic', // Mix of both based on HP
}

// ============================================================================
// CPU AI Controller
// ============================================================================

export class CpuAI {
  private state: AIState

  constructor() {
    this.state = {
      lastDecisionTime: 0,
      decisionCooldown: 200, // Make decision every 200ms (4 ticks)
      targetPosition: null,
      currentStrategy: AIStrategy.Opportunistic,
    }
  }

  /**
   * Get the next action for the CPU combatant
   * Called every tick (50ms)
   */
  public getNextAction(
    cpuCombatant: Combatant,
    playerCombatant: Combatant,
    currentTime: number
  ): Action | null {
    // Only make decisions at intervals (not every tick)
    if (currentTime - this.state.lastDecisionTime < this.state.decisionCooldown) {
      // Continue current action (movement)
      if (this.state.targetPosition) {
        return this.createMoveAction(cpuCombatant, this.state.targetPosition)
      }
      return null
    }

    this.state.lastDecisionTime = currentTime

    // Update strategy based on HP
    this.updateStrategy(cpuCombatant)

    // Make decision based on current state
    return this.makeDecision(cpuCombatant, playerCombatant, currentTime)
  }

  /**
   * Update AI strategy based on current HP
   */
  private updateStrategy(cpu: Combatant): void {
    const hpPercent = cpu.currentHp / cpu.derivedStats.maxHp

    if (hpPercent < 0.3) {
      // Low HP - defensive
      this.state.currentStrategy = AIStrategy.Defensive
    } else if (hpPercent > 0.7) {
      // High HP - aggressive
      this.state.currentStrategy = AIStrategy.Aggressive
    } else {
      // Medium HP - opportunistic
      this.state.currentStrategy = AIStrategy.Opportunistic
    }
  }

  /**
   * Make a decision based on current strategy and combat state
   */
  private makeDecision(
    cpu: Combatant,
    player: Combatant,
    currentTime: number
  ): Action | null {
    const distance = vectorDistance(cpu.position, player.position)
    const attackRange = COMBAT_CONSTANTS.SWORD_CONFIG.range

    // Check if CPU can attack (has stamina, not on cooldown)
    const canAttack = this.canPerformAction(
      cpu,
      COMBAT_CONSTANTS.SWORD_CONFIG.staminaCost,
      currentTime
    )

    // Check if CPU should dodge (player is attacking)
    const shouldDodge = this.shouldDodge(cpu, player, distance)

    // Decision tree based on strategy
    switch (this.state.currentStrategy) {
      case AIStrategy.Aggressive:
        return this.aggressiveStrategy(cpu, player, distance, attackRange, canAttack, shouldDodge)

      case AIStrategy.Defensive:
        return this.defensiveStrategy(cpu, player, distance, shouldDodge)

      case AIStrategy.Opportunistic:
        return this.opportunisticStrategy(cpu, player, distance, attackRange, canAttack, shouldDodge)

      default:
        return null
    }
  }

  /**
   * Aggressive strategy: Close distance and attack
   */
  private aggressiveStrategy(
    cpu: Combatant,
    player: Combatant,
    distance: number,
    attackRange: number,
    canAttack: boolean,
    shouldDodge: boolean
  ): Action | null {
    // Priority 1: Dodge if needed
    if (shouldDodge) {
      return this.createDodgeAction(cpu, player)
    }

    // Priority 2: Attack if in range
    if (distance <= attackRange && canAttack) {
      return this.createAttackAction(cpu, player)
    }

    // Priority 3: Move toward player
    this.state.targetPosition = player.position
    return this.createMoveAction(cpu, player.position)
  }

  /**
   * Defensive strategy: Keep distance and dodge
   */
  private defensiveStrategy(
    cpu: Combatant,
    player: Combatant,
    distance: number,
    shouldDodge: boolean
  ): Action | null {
    const safeDistance = 150

    // Priority 1: Dodge if player is close
    if (shouldDodge || distance < safeDistance) {
      return this.createDodgeAction(cpu, player)
    }

    // Priority 2: Move away from player
    const awayDirection = {
      x: cpu.position.x - player.position.x,
      y: cpu.position.y - player.position.y,
    }
    const normalized = normalizeVector(awayDirection)

    this.state.targetPosition = {
      x: cpu.position.x + normalized.x * 100,
      y: cpu.position.y + normalized.y * 100,
    }

    return this.createMoveAction(cpu, this.state.targetPosition)
  }

  /**
   * Opportunistic strategy: Balance of aggression and defense
   */
  private opportunisticStrategy(
    cpu: Combatant,
    player: Combatant,
    distance: number,
    attackRange: number,
    canAttack: boolean,
    shouldDodge: boolean
  ): Action | null {
    // Priority 1: Dodge if needed
    if (shouldDodge) {
      return this.createDodgeAction(cpu, player)
    }

    // Priority 2: Attack if in range and player is vulnerable
    if (distance <= attackRange && canAttack && !player.isInvulnerable) {
      return this.createAttackAction(cpu, player)
    }

    // Priority 3: Circle around player (strafe)
    const optimalDistance = attackRange * 0.8
    if (distance > optimalDistance * 1.5) {
      // Too far - move closer
      this.state.targetPosition = player.position
      return this.createMoveAction(cpu, player.position)
    } else if (distance < optimalDistance * 0.5) {
      // Too close - back up
      const awayDirection = {
        x: cpu.position.x - player.position.x,
        y: cpu.position.y - player.position.y,
      }
      const normalized = normalizeVector(awayDirection)

      this.state.targetPosition = {
        x: cpu.position.x + normalized.x * 50,
        y: cpu.position.y + normalized.y * 50,
      }
      return this.createMoveAction(cpu, this.state.targetPosition)
    } else {
      // Good distance - strafe around player
      return this.createStrafeAction(cpu, player)
    }
  }

  /**
   * Check if CPU should dodge based on player state
   */
  private shouldDodge(cpu: Combatant, player: Combatant, distance: number): boolean {
    // Don't dodge if already invulnerable
    if (cpu.isInvulnerable) return false

    // Check if player is attacking and close
    if (
      player.currentAction &&
      player.currentAction.type === ActionType.Attack &&
      distance < COMBAT_CONSTANTS.SWORD_CONFIG.range * 1.2
    ) {
      // 30% chance to dodge when player attacks
      return Math.random() < 0.3
    }

    // Low stamina - dodge to create space
    const staminaPercent = cpu.currentStamina / cpu.derivedStats.maxStamina
    if (staminaPercent < 0.2 && distance < 100) {
      return true
    }

    return false
  }

  /**
   * Check if CPU can perform an action (has stamina, not on cooldown)
   */
  private canPerformAction(
    cpu: Combatant,
    staminaCost: number,
    currentTime: number
  ): boolean {
    // Check stamina
    if (cpu.currentStamina < staminaCost) return false

    // Check cooldown
    if (
      cpu.currentAction &&
      currentTime < cpu.currentAction.cooldownEndTime
    ) {
      return false
    }

    return true
  }

  // ============================================================================
  // Action Creators
  // ============================================================================

  private createMoveAction(cpu: Combatant, targetPosition: Vector2D): Action {
    const direction = {
      x: targetPosition.x - cpu.position.x,
      y: targetPosition.y - cpu.position.y,
    }

    return {
      type: ActionType.Move,
      direction: normalizeVector(direction),
    }
  }

  private createAttackAction(cpu: Combatant, player: Combatant): Action {
    const direction = {
      x: player.position.x - cpu.position.x,
      y: player.position.y - cpu.position.y,
    }

    return {
      type: ActionType.Attack,
      targetDirection: normalizeVector(direction),
    }
  }

  private createDodgeAction(cpu: Combatant, player: Combatant): Action {
    // Dodge perpendicular to player's direction
    const toPlayer = {
      x: player.position.x - cpu.position.x,
      y: player.position.y - cpu.position.y,
    }

    // Perpendicular vector (rotate 90 degrees)
    const perpendicular = {
      x: -toPlayer.y,
      y: toPlayer.x,
    }

    // Randomly choose left or right
    const direction = Math.random() < 0.5 ? perpendicular : {
      x: toPlayer.y,
      y: -toPlayer.x,
    }

    return {
      type: ActionType.Dodge,
      direction: normalizeVector(direction),
    }
  }

  private createStrafeAction(cpu: Combatant, player: Combatant): Action {
    // Move in a circular pattern around the player
    const toPlayer = {
      x: player.position.x - cpu.position.x,
      y: player.position.y - cpu.position.y,
    }

    // Perpendicular vector for strafing
    const strafeDirection = {
      x: -toPlayer.y,
      y: toPlayer.x,
    }

    this.state.targetPosition = {
      x: cpu.position.x + strafeDirection.x * 0.1,
      y: cpu.position.y + strafeDirection.y * 0.1,
    }

    return {
      type: ActionType.Move,
      direction: normalizeVector(strafeDirection),
    }
  }
}
