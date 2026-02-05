/**
 * Combat Engine Tests
 * Tests for the real-time combat system
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CombatEngine } from '../engine'
import {
  Combatant,
  ActionType,
  COMBAT_CONSTANTS,
  WeaponType,
} from '../types'
import { calculateDerivedStats } from '../damage-calculator'

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

describe('CombatEngine', () => {
  let engine: CombatEngine
  let player: Combatant
  let opponent: Combatant

  beforeEach(() => {
    player = createTestCombatant('player1', {
      position: { x: 300, y: 300 },
    })
    opponent = createTestCombatant('player2', {
      position: { x: 500, y: 300 },
    })
    engine = new CombatEngine(player, opponent)
  })

  describe('Initialization', () => {
    it('should initialize with both combatants alive', () => {
      const state = engine.getState()
      expect(state.combatant1.isAlive).toBe(true)
      expect(state.combatant2.isAlive).toBe(true)
    })

    it('should initialize at tick 0', () => {
      const state = engine.getState()
      expect(state.tickNumber).toBe(0)
      expect(state.elapsedTime).toBe(0)
    })

    it('should have no winner initially', () => {
      expect(engine.getWinner()).toBeNull()
      expect(engine.isMatchOver()).toBe(false)
    })
  })

  describe('Movement', () => {
    it('should update position when moving', () => {
      const initialX = engine.getState().combatant1.position.x

      // Move right for 1 tick
      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Move,
            direction: { x: 1, y: 0 },
          },
        },
      ])

      const finalX = engine.getState().combatant1.position.x
      expect(finalX).toBeGreaterThan(initialX)
    })

    it('should update facing angle when moving', () => {
      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Move,
            direction: { x: 1, y: 0 }, // Move right
          },
        },
      ])

      const facingAngle = engine.getState().combatant1.facingAngle
      expect(facingAngle).toBe(0) // 0 radians = right
    })

    it('should clamp position to arena boundaries', () => {
      // Try to move far off the left edge
      const state = engine.getState()
      state.combatant1.position.x = 10

      for (let i = 0; i < 10; i++) {
        engine.processTick([
          {
            combatantId: 'player1',
            action: {
              type: ActionType.Move,
              direction: { x: -1, y: 0 },
            },
          },
        ])
      }

      expect(state.combatant1.position.x).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Attack', () => {
    it('should deal damage when in range', () => {
      const state = engine.getState()
      const initialHp = state.combatant2.currentHp

      // Place combatants close to each other
      state.combatant1.position = { x: 400, y: 300 }
      state.combatant2.position = { x: 420, y: 300 }

      // Attack
      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Attack,
            targetDirection: { x: 1, y: 0 },
          },
        },
      ])

      const events = engine.getEvents()
      const damageEvent = events.find(e => e.type === 'DamageTaken')

      expect(damageEvent).toBeDefined()
      expect(state.combatant2.currentHp).toBeLessThan(initialHp)
    })

    it('should not deal damage when out of range', () => {
      const state = engine.getState()
      const initialHp = state.combatant2.currentHp

      // Place combatants far apart
      state.combatant1.position = { x: 100, y: 300 }
      state.combatant2.position = { x: 500, y: 300 }

      // Attack
      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Attack,
            targetDirection: { x: 1, y: 0 },
          },
        },
      ])

      expect(state.combatant2.currentHp).toBe(initialHp)
    })

    it('should consume stamina when attacking', () => {
      const state = engine.getState()
      const initialStamina = state.combatant1.currentStamina

      // Place combatants close
      state.combatant1.position = { x: 400, y: 300 }
      state.combatant2.position = { x: 420, y: 300 }

      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Attack,
            targetDirection: { x: 1, y: 0 },
          },
        },
      ])

      expect(state.combatant1.currentStamina).toBeLessThan(initialStamina)
    })

    it('should fail attack when stamina is insufficient', () => {
      const state = engine.getState()
      state.combatant1.currentStamina = 5 // Less than sword cost (15)

      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Attack,
            targetDirection: { x: 1, y: 0 },
          },
        },
      ])

      const events = engine.getEvents()
      const failEvent = events.find(e => e.type === 'ActionFailed')

      expect(failEvent).toBeDefined()
      expect(failEvent?.data.reason).toBe('insufficient_stamina')
    })

    it('should kill combatant when HP reaches 0', () => {
      const state = engine.getState()
      state.combatant2.currentHp = 1 // Very low HP

      // Place close together and attack
      state.combatant1.position = { x: 400, y: 300 }
      state.combatant2.position = { x: 420, y: 300 }

      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Attack,
            targetDirection: { x: 1, y: 0 },
          },
        },
      ])

      expect(state.combatant2.isAlive).toBe(false)
      expect(engine.isMatchOver()).toBe(true)
      expect(engine.getWinner()).toBe('player1')
    })
  })

  describe('Dodge Roll', () => {
    it('should activate invulnerability during dodge', () => {
      const state = engine.getState()

      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Dodge,
            direction: { x: 1, y: 0 },
          },
        },
      ])

      expect(state.combatant1.isInvulnerable).toBe(true)
    })

    it('should not take damage during i-frames', () => {
      const state = engine.getState()
      const initialHp = state.combatant2.currentHp

      // Place close together
      state.combatant1.position = { x: 400, y: 300 }
      state.combatant2.position = { x: 420, y: 300 }

      // Player 2 dodges, Player 1 attacks
      engine.processTick([
        {
          combatantId: 'player2',
          action: {
            type: ActionType.Dodge,
            direction: { x: -1, y: 0 },
          },
        },
      ])

      // Attack while dodging
      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Attack,
            targetDirection: { x: 1, y: 0 },
          },
        },
      ])

      // Should not take damage
      expect(state.combatant2.currentHp).toBe(initialHp)
    })

    it('should consume stamina when dodging', () => {
      const state = engine.getState()
      const initialStamina = state.combatant1.currentStamina

      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Dodge,
            direction: { x: 1, y: 0 },
          },
        },
      ])

      expect(state.combatant1.currentStamina).toBe(
        initialStamina - COMBAT_CONSTANTS.DODGE_STAMINA_COST
      )
    })

    it('should remove invulnerability after i-frames duration', () => {
      const state = engine.getState()

      // Activate dodge
      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Dodge,
            direction: { x: 1, y: 0 },
          },
        },
      ])

      expect(state.combatant1.isInvulnerable).toBe(true)

      // Wait for i-frames to expire (200ms = 4 ticks at 50ms each)
      for (let i = 0; i < 5; i++) {
        engine.processTick([])
      }

      expect(state.combatant1.isInvulnerable).toBe(false)
    })
  })

  describe('Stamina Regeneration', () => {
    it('should regenerate stamina over time', () => {
      const state = engine.getState()
      state.combatant1.currentStamina = 50

      const initialStamina = state.combatant1.currentStamina

      // Process 20 ticks (1 second at 20Hz)
      for (let i = 0; i < 20; i++) {
        engine.processTick([])
      }

      expect(state.combatant1.currentStamina).toBeGreaterThan(initialStamina)
    })

    it('should not exceed max stamina', () => {
      const state = engine.getState()
      const maxStamina = state.combatant1.derivedStats.maxStamina

      // Process many ticks
      for (let i = 0; i < 100; i++) {
        engine.processTick([])
      }

      expect(state.combatant1.currentStamina).toBeLessThanOrEqual(maxStamina)
    })
  })

  describe('Tick Processing', () => {
    it('should increment tick number each tick', () => {
      expect(engine.getState().tickNumber).toBe(0)

      engine.processTick([])
      expect(engine.getState().tickNumber).toBe(1)

      engine.processTick([])
      expect(engine.getState().tickNumber).toBe(2)
    })

    it('should increment elapsed time correctly', () => {
      expect(engine.getState().elapsedTime).toBe(0)

      engine.processTick([])
      expect(engine.getState().elapsedTime).toBe(COMBAT_CONSTANTS.TICK_INTERVAL)

      engine.processTick([])
      expect(engine.getState().elapsedTime).toBe(
        COMBAT_CONSTANTS.TICK_INTERVAL * 2
      )
    })
  })

  describe('Events', () => {
    it('should emit ActionPerformed event for successful actions', () => {
      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Move,
            direction: { x: 1, y: 0 },
          },
        },
      ])

      const events = engine.getEvents()
      const actionEvent = events.find(e => e.type === 'ActionPerformed')

      expect(actionEvent).toBeDefined()
      expect(actionEvent?.combatantId).toBe('player1')
    })

    it('should emit DamageTaken event when damage is dealt', () => {
      const state = engine.getState()
      state.combatant1.position = { x: 400, y: 300 }
      state.combatant2.position = { x: 420, y: 300 }

      engine.processTick([
        {
          combatantId: 'player1',
          action: {
            type: ActionType.Attack,
            targetDirection: { x: 1, y: 0 },
          },
        },
      ])

      const events = engine.getEvents()
      const damageEvent = events.find(e => e.type === 'DamageTaken')

      expect(damageEvent).toBeDefined()
      expect(damageEvent?.combatantId).toBe('player2')
      expect(damageEvent?.data.damage).toBeGreaterThan(0)
    })
  })
})
