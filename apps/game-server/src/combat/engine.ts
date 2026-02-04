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

// Sprint 4: Weapons & Projectiles
import { Weapons, Projectiles, Damage } from '@gladiator/shared/src/combat'
import type { WeaponDefinition, ProjectileState } from '@gladiator/shared/src/combat'
import { v4 as uuidv4 } from 'uuid'

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

    // Initialize default weapons (Sprint 4)
    combatant1.weapon = combatant1.equippedWeapon || WeaponType.Sword
    combatant2.weapon = combatant2.equippedWeapon || WeaponType.Sword

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
      projectiles: new Map(), // Sprint 4
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

    // Step 4.5: Update projectiles (Sprint 4)
    this.updateProjectiles(currentTime)

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
   * Process attack action (Sprint 4: supports all weapon types)
   */
  private processAttackAction(
    combatant: Combatant,
    action: AttackAction,
    currentTime: number
  ): void {
    // Get weapon definition
    const weapon = Weapons.getWeapon(combatant.weapon)
    if (!weapon) {
      console.error(`Unknown weapon type: ${combatant.weapon}`)
      return
    }

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

    // Handle different attack patterns
    switch (weapon.attackPattern) {
      case 'MeleeArc':
      case 'MeleeThrust':
      case 'MeleeQuick':
        this.processMeleeAttack(combatant, weapon, currentTime)
        break
      case 'Projectile':
        this.processProjectileAttack(combatant, weapon, currentTime)
        break
    }

    // Set action state
    combatant.currentAction = {
      type: ActionType.Attack,
      startTime: currentTime,
      endTime: currentTime + weapon.cooldown,
      cooldownEndTime: currentTime + weapon.cooldown,
    }
  }

  /**
   * Process melee attack (arc, thrust, or quick)
   */
  private processMeleeAttack(
    attacker: Combatant,
    weapon: WeaponDefinition,
    currentTime: number
  ): void {
    const target = this.getOpponent(attacker.id)
    if (!target) return

    // Check if attack hits (uses weapon range and arc/line)
    const hit = checkAttackHit(
      attacker,
      target,
      weapon.range,
      weapon.arcAngle || weapon.lineWidth || Math.PI / 2
    )

    if (hit) {
      const damage = applyDamage(attacker, target, weapon)

      if (damage > 0) {
        this.addEvent({
          type: CombatEventType.DamageTaken,
          timestamp: currentTime,
          combatantId: target.id,
          data: { damage, attackerId: attacker.id, weapon: weapon.type },
        })

        // Check if target died
        if (!target.isAlive) {
          this.addEvent({
            type: CombatEventType.Death,
            timestamp: currentTime,
            combatantId: target.id,
            data: { killerId: attacker.id },
          })
        }
      }
    }

    this.addEvent({
      type: CombatEventType.ActionPerformed,
      timestamp: currentTime,
      combatantId: attacker.id,
      data: { action: 'attack', weapon: weapon.type, hit },
    })
  }

  /**
   * Process projectile attack (spawns projectile)
   */
  private processProjectileAttack(
    attacker: Combatant,
    weapon: WeaponDefinition,
    currentTime: number
  ): void {
    // Calculate damage for projectile
    const damage = Damage.calculateRawDamage(weapon, attacker.baseAttributes)

    // Spawn projectile
    const projectile = Projectiles.createProjectile(
      uuidv4(),
      attacker.id,
      attacker.position,
      attacker.facingAngle,
      weapon,
      damage,
      currentTime
    )

    this.state.projectiles.set(projectile.id, projectile)

    this.addEvent({
      type: CombatEventType.ProjectileSpawned,
      timestamp: currentTime,
      combatantId: attacker.id,
      data: { projectileId: projectile.id, weapon: weapon.type },
    })

    this.addEvent({
      type: CombatEventType.ActionPerformed,
      timestamp: currentTime,
      combatantId: attacker.id,
      data: { action: 'attack', weapon: weapon.type, projectile: true },
    })
  }

  /**
   * Update projectiles (movement, lifetime, collisions)
   */
  private updateProjectiles(currentTime: number): void {
    const toRemove: string[] = []
    const deltaTime = COMBAT_CONSTANTS.TICK_INTERVAL

    for (const [id, projectile] of this.state.projectiles.entries()) {
      // Update position
      projectile.pos = Projectiles.updateProjectilePosition(
        projectile.pos,
        projectile.vel,
        deltaTime
      )

      // Check if expired
      if (Projectiles.isProjectileExpired(projectile, currentTime)) {
        toRemove.push(id)
        continue
      }

      // Check if out of bounds
      if (
        Projectiles.isProjectileOutOfBounds(
          projectile.pos,
          this.state.arenaSize.x,
          this.state.arenaSize.y
        )
      ) {
        toRemove.push(id)
        continue
      }

      // Check collision with combatants
      for (const combatant of [this.state.combatant1, this.state.combatant2]) {
        if (!Projectiles.shouldProjectileHit(projectile, combatant.id, combatant.isInvulnerable)) {
          continue
        }

        if (
          Projectiles.checkProjectileUnitCollision(
            projectile.pos,
            projectile.radius,
            combatant.position
          )
        ) {
          // Apply damage
          const finalDamage = Damage.calculateFinalDamage(
            projectile.damage,
            combatant.derivedStats
          )
          combatant.currentHp = Damage.applyDamageToHp(combatant.currentHp, finalDamage)

          if (Damage.isDead(combatant.currentHp)) {
            combatant.isAlive = false
            this.addEvent({
              type: CombatEventType.Death,
              timestamp: currentTime,
              combatantId: combatant.id,
              data: { killerId: projectile.ownerUnitId },
            })
          }

          this.addEvent({
            type: CombatEventType.DamageTaken,
            timestamp: currentTime,
            combatantId: combatant.id,
            data: {
              damage: finalDamage,
              attackerId: projectile.ownerUnitId,
              projectile: true,
            },
          })

          // Remove projectile after hit
          toRemove.push(id)
          break
        }
      }
    }

    // Remove expired/collided projectiles
    for (const id of toRemove) {
      this.state.projectiles.delete(id)
    }
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
