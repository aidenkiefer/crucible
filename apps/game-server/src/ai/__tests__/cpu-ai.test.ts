/**
 * CPU AI Tests
 * Tests for the CPU AI decision-making
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CpuAI } from '../cpu-ai'
import {
  Combatant,
  ActionType,
  WeaponType,
} from '../../combat/types'
import { calculateDerivedStats } from '../../combat/damage-calculator'

// ============================================================================
// Test Helpers
// ============================================================================

function createTestCombatant(id: string, overrides?: Partial<Combatant>): Combatant {
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
    id,
    position: { x: 400, y: 300 },
    velocity: { dx: 0, dy: 0 },
    facingAngle: 0,
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
    ...overrides,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('CpuAI', () => {
  let ai: CpuAI
  let cpu: Combatant
  let player: Combatant

  beforeEach(() => {
    ai = new CpuAI()
    cpu = createTestCombatant('cpu', {
      position: { x: 300, y: 300 },
    })
    player = createTestCombatant('player', {
      position: { x: 500, y: 300 },
    })
  })

  describe('Decision Making', () => {
    it('should return null when decision cooldown is active', () => {
      const currentTime = 0
      const action1 = ai.getNextAction(cpu, player, currentTime)
      expect(action1).not.toBeNull()

      // Immediately ask for next action (before cooldown)
      const action2 = ai.getNextAction(cpu, player, currentTime + 50)
      expect(action2).toBeNull() // or returns move action if targetPosition is set
    })

    it('should make new decision after cooldown', () => {
      const currentTime = 0
      const action1 = ai.getNextAction(cpu, player, currentTime)
      expect(action1).not.toBeNull()

      // Wait for cooldown (200ms)
      const action2 = ai.getNextAction(cpu, player, currentTime + 250)
      expect(action2).not.toBeNull()
    })
  })

  describe('Aggressive Strategy', () => {
    beforeEach(() => {
      // High HP triggers aggressive strategy
      cpu.currentHp = cpu.derivedStats.maxHp
    })

    it('should move toward player when far away', () => {
      cpu.position = { x: 100, y: 300 }
      player.position = { x: 500, y: 300 }

      const action = ai.getNextAction(cpu, player, 0)

      expect(action).not.toBeNull()
      expect(action?.type).toBe(ActionType.Move)
      if (action?.type === ActionType.Move) {
        expect(action.direction.x).toBeGreaterThan(0) // Moving right toward player
      }
    })

    it('should attack when in range', () => {
      cpu.position = { x: 380, y: 300 }
      player.position = { x: 420, y: 300 }

      const action = ai.getNextAction(cpu, player, 0)

      // Should attempt to attack or move closer
      expect(action).not.toBeNull()
      // Attack or continue moving
      expect([ActionType.Attack, ActionType.Move]).toContain(action?.type)
    })
  })

  describe('Defensive Strategy', () => {
    beforeEach(() => {
      // Low HP triggers defensive strategy
      cpu.currentHp = cpu.derivedStats.maxHp * 0.2
    })

    it('should move away from player when close', () => {
      cpu.position = { x: 400, y: 300 }
      player.position = { x: 420, y: 300 }

      const action = ai.getNextAction(cpu, player, 0)

      expect(action).not.toBeNull()
      // Should dodge or move away
      expect([ActionType.Dodge, ActionType.Move]).toContain(action?.type)
    })

    it('should dodge when player is very close', () => {
      cpu.position = { x: 400, y: 300 }
      player.position = { x: 410, y: 300 }
      player.currentAction = {
        type: ActionType.Attack,
        startTime: 0,
        endTime: 800,
        cooldownEndTime: 800,
      }

      // Try multiple times due to randomness in dodge decision
      let foundDodge = false
      for (let i = 0; i < 10; i++) {
        const action = ai.getNextAction(cpu, player, i * 250)
        if (action?.type === ActionType.Dodge) {
          foundDodge = true
          break
        }
      }

      // Should have dodged at least once
      expect(foundDodge).toBe(true)
    })
  })

  describe('Opportunistic Strategy', () => {
    beforeEach(() => {
      // Medium HP triggers opportunistic strategy
      cpu.currentHp = cpu.derivedStats.maxHp * 0.5
    })

    it('should balance between attack and defense', () => {
      cpu.position = { x: 400, y: 300 }
      player.position = { x: 450, y: 300 }

      const action = ai.getNextAction(cpu, player, 0)

      expect(action).not.toBeNull()
      // Could be any action
      expect([ActionType.Move, ActionType.Attack, ActionType.Dodge]).toContain(
        action?.type
      )
    })
  })

  describe('Stamina Management', () => {
    it('should not attack when stamina is low', () => {
      cpu.position = { x: 400, y: 300 }
      player.position = { x: 420, y: 300 }
      cpu.currentStamina = 5 // Less than attack cost (15)

      const action = ai.getNextAction(cpu, player, 0)

      expect(action).not.toBeNull()
      expect(action?.type).not.toBe(ActionType.Attack)
    })

    it('should dodge to create space when stamina is low', () => {
      cpu.position = { x: 400, y: 300 }
      player.position = { x: 430, y: 300 }
      cpu.currentStamina = cpu.derivedStats.maxStamina * 0.15

      const action = ai.getNextAction(cpu, player, 0)

      expect(action).not.toBeNull()
      // Should dodge or move away
      expect([ActionType.Dodge, ActionType.Move]).toContain(action?.type)
    })
  })

  describe('Action Creation', () => {
    it('should create valid move actions', () => {
      cpu.position = { x: 200, y: 300 }
      player.position = { x: 600, y: 300 }

      const action = ai.getNextAction(cpu, player, 0)

      if (action?.type === ActionType.Move) {
        // Direction should be normalized
        const magnitude = Math.sqrt(
          action.direction.x ** 2 + action.direction.y ** 2
        )
        expect(magnitude).toBeCloseTo(1, 1)
      }
    })

    it('should create valid attack actions', () => {
      cpu.position = { x: 400, y: 300 }
      player.position = { x: 430, y: 300 }

      const action = ai.getNextAction(cpu, player, 0)

      if (action?.type === ActionType.Attack) {
        // Target direction should be normalized
        const magnitude = Math.sqrt(
          action.targetDirection.x ** 2 + action.targetDirection.y ** 2
        )
        expect(magnitude).toBeCloseTo(1, 1)
      }
    })

    it('should create valid dodge actions', () => {
      cpu.position = { x: 400, y: 300 }
      player.position = { x: 420, y: 300 }
      cpu.currentHp = cpu.derivedStats.maxHp * 0.2 // Low HP

      const action = ai.getNextAction(cpu, player, 0)

      if (action?.type === ActionType.Dodge) {
        // Dodge direction should be normalized
        const magnitude = Math.sqrt(
          action.direction.x ** 2 + action.direction.y ** 2
        )
        expect(magnitude).toBeCloseTo(1, 1)
      }
    })
  })

  describe('Cooldown Handling', () => {
    it('should not attack when attack is on cooldown', () => {
      cpu.position = { x: 400, y: 300 }
      player.position = { x: 420, y: 300 }
      cpu.currentAction = {
        type: ActionType.Attack,
        startTime: 0,
        endTime: 100,
        cooldownEndTime: 1000, // Long cooldown
      }

      const action = ai.getNextAction(cpu, player, 200)

      // Can't attack while on cooldown
      if (action) {
        expect(action.type).not.toBe(ActionType.Attack)
      }
    })
  })
})
