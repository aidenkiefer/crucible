/**
 * Input Validator
 * Validates player actions to prevent client-side cheating
 */

import { Action, ActionType, Combatant } from '../combat/types'

export class InputValidator {
  /**
   * Validate action against combatant state
   */
  static validateAction(
    action: Action,
    combatant: Combatant,
    currentTime: number
  ): { valid: boolean; reason?: string } {
    switch (action.type) {
      case ActionType.Attack:
        return this.validateAttack(combatant, currentTime)
      case ActionType.Dodge:
        return this.validateDodge(combatant, currentTime)
      case ActionType.Move:
        return this.validateMove(action)
      default:
        return { valid: false, reason: 'Unknown action type' }
    }
  }

  private static validateAttack(
    combatant: Combatant,
    currentTime: number
  ): { valid: boolean; reason?: string } {
    // Check stamina (weapon-specific costs from combat engine)
    const SWORD_STAMINA_COST = 15
    if (combatant.currentStamina < SWORD_STAMINA_COST) {
      return { valid: false, reason: 'Insufficient stamina' }
    }

    // Check cooldown
    if (combatant.currentAction && combatant.currentAction.cooldownEndTime > currentTime) {
      return { valid: false, reason: 'Action on cooldown' }
    }

    return { valid: true }
  }

  private static validateDodge(
    combatant: Combatant,
    currentTime: number
  ): { valid: boolean; reason?: string } {
    // Check stamina
    const DODGE_STAMINA_COST = 20
    if (combatant.currentStamina < DODGE_STAMINA_COST) {
      return { valid: false, reason: 'Insufficient stamina' }
    }

    // Check cooldown
    if (combatant.currentAction && combatant.currentAction.cooldownEndTime > currentTime) {
      return { valid: false, reason: 'Action on cooldown' }
    }

    return { valid: true }
  }

  private static validateMove(action: any): { valid: boolean; reason?: string } {
    // Validate move direction magnitude (prevent speed hacking)
    if (action.direction) {
      const magnitude = Math.sqrt(action.direction.x ** 2 + action.direction.y ** 2)
      if (magnitude > 1.1) {
        // Allow small floating point error
        return { valid: false, reason: 'Invalid move direction' }
      }
    }

    return { valid: true }
  }
}
