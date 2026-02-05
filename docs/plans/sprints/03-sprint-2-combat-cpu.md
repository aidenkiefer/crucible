# Sprint 2: Combat System - CPU Battles (Real-Time)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Players can fight CPU opponents with real-time combat mechanics inspired by ROTMG

**Duration:** Week 3
**Prerequisites:** Sprint 1 complete (authentication and NFT minting working)

**Architecture:** Server-authoritative real-time combat engine with 20Hz server tick, continuous movement, WebSocket communication, CPU AI

**Tech Stack:**
- Socket.io (real-time communication)
- TypeScript (shared game logic)
- Prisma (match persistence)

**Key Design Decisions:**
- Real-time combat (not turn-based)
- Continuous 2D movement (WASD/arrow keys)
- Server tick rate: 20Hz (50ms per tick) for demo
- Client prediction for movement smoothness
- Server-authoritative for positions, damage, hits
- Weapon-based combat (Sword for demo)
- Dodge roll with i-frames (deterministic, no RNG)

---

## Overview

This sprint implements the core real-time combat loop:
1. Player selects Gladiator and starts CPU match
2. Server creates match instance in 2D arena
3. Server simulates combat at 20Hz (50ms ticks)
4. Player sends movement input + action commands via WebSocket
5. Server processes physics, attacks, damage
6. Combat resolves when one Gladiator reaches 0 HP
7. Match result saved, XP awarded

**Scope for Sprint 2 (Simplified Real-Time):**
- Continuous WASD movement in bounded arena
- One weapon type (Sword - melee arc attack)
- Dodge roll with i-frames
- Stats: CON, STR, DEX, SPD, DEF (simplified from full combat.md)
- CPU AI for movement and actions
- No projectiles (deferred to Sprint 3+)
- No spellcasting (deferred to Sprint 3+)

**Note on Combat System Design:**
This plan implements the real-time combat system described in `docs/features/combat.md` v0.3, which replaces the original turn-based design. The key differences:
- **Real-time** (not turn-based): 20Hz server tick instead of 1000ms turns
- **Continuous movement**: Free WASD movement instead of grid positions
- **New stat system**: CON, STR, DEX, SPD, DEF (aligned with combat.md)
- **Dodge with i-frames**: Deterministic invulnerability window (no RNG)
- **Server-authoritative physics**: Position, velocity, collision all server-side

Sprint 2 focuses on the **minimum viable real-time combat** with one weapon type. Later sprints will add:
- Additional weapons (Spear, Bow, Dagger) - Sprint 3+
- Spellcasting and catalysts - Sprint 4+
- Projectile simulation - Sprint 3+
- Additional attributes (ARC, FTH, MRES) - Sprint 4+

---

## Task 1: Combat Engine Core (Real-Time)

**Owner:** Dev 1
**Time:** 4 hours

**Files:**
- Create: `packages/shared/src/combat/types.ts`
- Create: `packages/shared/src/combat/engine.ts`
- Create: `packages/shared/src/combat/physics.ts`
- Create: `packages/shared/src/combat/damage-calculator.ts`
- Create: `packages/shared/src/combat/__tests__/engine.test.ts`

### Step 1: Define combat types (Real-Time)

**File:** `packages/shared/src/combat/types.ts`

```typescript
// Vector2
export interface Vec2 {
  x: number
  y: number
}

// Base attributes (from combat.md)
export interface BaseAttributes {
  constitution: number  // CON: HP + Stamina
  strength: number      // STR: Melee damage
  dexterity: number     // DEX: Ranged damage, attack speed
  speed: number         // SPD: Movement speed, cooldown reduction
  defense: number       // DEF: Physical mitigation
}

// Derived combat stats
export interface DerivedStats {
  hpMax: number
  stamMax: number
  moveSpeed: number     // tiles/sec or units/sec
  stamRegen: number     // per second
}

// Unit state (inspired by combat.md §12.1)
export interface UnitState {
  id: string
  name: string

  // Base attributes
  attributes: BaseAttributes

  // Derived stats
  derived: DerivedStats

  // Current resources
  hp: number
  stamina: number

  // Physics
  pos: Vec2
  vel: Vec2
  facing: number        // angle in radians (0 = right, PI/2 = up)

  // Abilities/cooldowns
  cooldowns: Record<string, number>  // abilityId -> time remaining (ms)

  // Status flags
  isInvulnerable: boolean  // i-frames from dodge
  invulnerabilityEndTime: number  // timestamp when i-frames end
}

// Weapon type (simplified for Sprint 2)
export enum WeaponType {
  Sword = 'Sword',      // Melee arc attack
  // Spear, Bow, Dagger deferred to later sprints
}

// Combat actions
export enum CombatAction {
  Attack = 'Attack',    // Basic attack (weapon-dependent)
  Dodge = 'Dodge',      // Dodge roll with i-frames
}

// Input from client
export interface InputFrame {
  seq: number           // Client sequence number
  moveX: number         // -1 to 1
  moveY: number         // -1 to 1
  facing?: number       // Optional aim direction (radians)
  actions: CombatAction[]  // Actions pressed this frame
}

// Combat state (arena match)
export interface CombatState {
  tick: number          // Server tick counter
  timeMs: number        // Match time in ms

  // Arena bounds
  arena: {
    width: number
    height: number
  }

  // Units
  units: Map<string, UnitState>

  // Match status
  isComplete: boolean
  winnerId?: string

  // Event log
  events: CombatEvent[]
}

// Event types (for logging and replay)
export enum CombatEventType {
  HIT = 'HIT',
  DODGE = 'DODGE',
  DEATH = 'DEATH',
  ABILITY_USED = 'ABILITY_USED',
}

export interface CombatEvent {
  tick: number
  type: CombatEventType
  actorId: string
  targetId?: string
  data?: any
}

// Action input (server-side)
export interface ActionInput {
  unitId: string
  action: CombatAction
}
```

### Step 2: Create physics module

**File:** `packages/shared/src/combat/physics.ts`

```typescript
import { Vec2, UnitState } from './types'

export class Physics {
  /**
   * Update unit position based on velocity
   */
  static updatePosition(unit: UnitState, dt: number) {
    unit.pos.x += unit.vel.x * dt
    unit.pos.y += unit.vel.y * dt
  }

  /**
   * Apply movement input to unit velocity
   */
  static applyMovement(unit: UnitState, moveX: number, moveY: number) {
    // Normalize diagonal movement
    const magnitude = Math.sqrt(moveX * moveX + moveY * moveY)
    if (magnitude > 0) {
      const normalized = {
        x: moveX / magnitude,
        y: moveY / magnitude,
      }
      unit.vel.x = normalized.x * unit.derived.moveSpeed
      unit.vel.y = normalized.y * unit.derived.moveSpeed

      // Update facing direction
      unit.facing = Math.atan2(normalized.y, normalized.x)
    } else {
      // No movement input -> stop
      unit.vel.x = 0
      unit.vel.y = 0
    }
  }

  /**
   * Clamp unit position to arena bounds
   */
  static clampToArena(unit: UnitState, arenaWidth: number, arenaHeight: number) {
    const radius = 0.5 // Unit collision radius
    unit.pos.x = Math.max(radius, Math.min(arenaWidth - radius, unit.pos.x))
    unit.pos.y = Math.max(radius, Math.min(arenaHeight - radius, unit.pos.y))

    // Stop velocity if clamped
    if (unit.pos.x <= radius || unit.pos.x >= arenaWidth - radius) {
      unit.vel.x = 0
    }
    if (unit.pos.y <= radius || unit.pos.y >= arenaHeight - radius) {
      unit.vel.y = 0
    }
  }

  /**
   * Check if attacker is in melee range of target
   */
  static isInMeleeRange(attacker: UnitState, target: UnitState, range: number): boolean {
    const dx = target.pos.x - attacker.pos.x
    const dy = target.pos.y - attacker.pos.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    return dist <= range
  }

  /**
   * Check if target is within attack arc
   */
  static isInAttackArc(
    attacker: UnitState,
    target: UnitState,
    arcAngle: number
  ): boolean {
    const dx = target.pos.x - attacker.pos.x
    const dy = target.pos.y - attacker.pos.y
    const angleToTarget = Math.atan2(dy, dx)

    // Normalize angle difference to [-PI, PI]
    let diff = angleToTarget - attacker.facing
    while (diff > Math.PI) diff -= 2 * Math.PI
    while (diff < -Math.PI) diff += 2 * Math.PI

    return Math.abs(diff) <= arcAngle / 2
  }

  /**
   * Distance between two points
   */
  static distance(a: Vec2, b: Vec2): number {
    const dx = b.x - a.x
    const dy = b.y - a.y
    return Math.sqrt(dx * dx + dy * dy)
  }
}
```

### Step 3: Create damage calculator

**File:** `packages/shared/src/combat/damage-calculator.ts`

```typescript
import { UnitState } from './types'

export class DamageCalculator {
  /**
   * Calculate damage for sword attack (melee)
   * Based on combat.md damage formulas
   */
  static calculateMeleeDamage(attacker: UnitState, defender: UnitState): number {
    // Base damage: 10 + STR * 0.5
    const baseDamage = 10 + attacker.attributes.strength * 0.5

    // Apply defender's defense (damage reduction)
    // DEF reduces damage by 0.2% per point
    const damageReduction = defender.attributes.defense * 0.002
    const finalDamage = Math.max(0, Math.floor(baseDamage * (1 - damageReduction)))

    return finalDamage
  }

  /**
   * Get stamina cost for action
   */
  static getStaminaCost(action: string): number {
    switch (action) {
      case 'Attack':
        return 15  // Sword attack
      case 'Dodge':
        return 20  // Dodge roll
      default:
        return 0
    }
  }

  /**
   * Get cooldown duration for action (in ms)
   */
  static getCooldown(action: string): number {
    switch (action) {
      case 'Attack':
        return 500  // 0.5s cooldown
      case 'Dodge':
        return 1000 // 1s cooldown
      default:
        return 0
    }
  }
}
```

### Step 4: Create real-time combat engine

**File:** `packages/shared/src/combat/engine.ts`

```typescript
import {
  CombatState,
  UnitState,
  InputFrame,
  CombatAction,
  CombatEvent,
  CombatEventType,
  BaseAttributes,
  Vec2,
} from './types'
import { Physics } from './physics'
import { DamageCalculator } from './damage-calculator'

export interface CombatEngineConfig {
  arenaWidth: number
  arenaHeight: number
  tickRate: number  // Hz (e.g., 20)
}

export class CombatEngine {
  private state: CombatState
  private config: CombatEngineConfig
  private tickDuration: number  // ms per tick

  constructor(
    unit1: { id: string; name: string; attributes: BaseAttributes; startPos: Vec2 },
    unit2: { id: string; name: string; attributes: BaseAttributes; startPos: Vec2 },
    config: CombatEngineConfig
  ) {
    this.config = config
    this.tickDuration = 1000 / config.tickRate

    // Initialize units
    const units = new Map<string, UnitState>()
    units.set(unit1.id, this.createUnit(unit1.id, unit1.name, unit1.attributes, unit1.startPos))
    units.set(unit2.id, this.createUnit(unit2.id, unit2.name, unit2.attributes, unit2.startPos))

    this.state = {
      tick: 0,
      timeMs: 0,
      arena: {
        width: config.arenaWidth,
        height: config.arenaHeight,
      },
      units,
      isComplete: false,
      events: [],
    }
  }

  private createUnit(
    id: string,
    name: string,
    attributes: BaseAttributes,
    startPos: Vec2
  ): UnitState {
    // Calculate derived stats (formulas from combat.md §2.2)
    const hpMax = 100 + attributes.constitution * 5
    const stamMax = 100 + attributes.constitution * 3
    const moveSpeed = 5 + attributes.speed * 0.1  // units per second
    const stamRegen = 10 + attributes.constitution * 0.5  // per second

    return {
      id,
      name,
      attributes,
      derived: {
        hpMax,
        stamMax,
        moveSpeed,
        stamRegen,
      },
      hp: hpMax,
      stamina: stamMax,
      pos: { ...startPos },
      vel: { x: 0, y: 0 },
      facing: 0,
      cooldowns: {},
      isInvulnerable: false,
      invulnerabilityEndTime: 0,
    }
  }

  getState(): CombatState {
    return this.state
  }

  /**
   * Process one simulation tick
   * dt = time since last tick in seconds (typically 0.05 for 20Hz)
   */
  processTick(inputs: Map<string, InputFrame>, dt: number): CombatState {
    if (this.state.isComplete) {
      return this.state
    }

    this.state.tick++
    this.state.timeMs += dt * 1000

    // 1. Process inputs (movement + actions)
    for (const [unitId, input] of inputs.entries()) {
      const unit = this.state.units.get(unitId)
      if (!unit) continue

      // Apply movement
      Physics.applyMovement(unit, input.moveX, input.moveY)

      // Update facing if provided
      if (input.facing !== undefined) {
        unit.facing = input.facing
      }

      // Process actions
      for (const action of input.actions) {
        this.processAction(unit, action)
      }
    }

    // 2. Update physics (movement)
    for (const unit of this.state.units.values()) {
      Physics.updatePosition(unit, dt)
      Physics.clampToArena(unit, this.state.arena.width, this.state.arena.height)
    }

    // 3. Regenerate stamina
    this.regenerateStamina(dt)

    // 4. Update cooldowns
    this.updateCooldowns(dt * 1000)

    // 5. Update i-frames
    this.updateInvulnerability()

    // 6. Check win condition
    this.checkWinCondition()

    return this.state
  }

  private processAction(unit: UnitState, action: CombatAction) {
    // Check cooldown
    if ((unit.cooldowns[action] ?? 0) > 0) {
      return // Still on cooldown
    }

    const staminaCost = DamageCalculator.getStaminaCost(action)

    // Check stamina
    if (unit.stamina < staminaCost) {
      return // Not enough stamina
    }

    // Deduct stamina
    unit.stamina -= staminaCost

    if (action === CombatAction.Attack) {
      this.processAttack(unit)
    } else if (action === CombatAction.Dodge) {
      this.processDodge(unit)
    }

    // Set cooldown
    unit.cooldowns[action] = DamageCalculator.getCooldown(action)
  }

  private processAttack(attacker: UnitState) {
    // Find target (other unit)
    const target = Array.from(this.state.units.values()).find((u) => u.id !== attacker.id)
    if (!target) return

    // Check melee range (2.0 units for sword)
    const inRange = Physics.isInMeleeRange(attacker, target, 2.0)
    if (!inRange) return

    // Check attack arc (90 degrees for sword)
    const inArc = Physics.isInAttackArc(attacker, target, Math.PI / 2)
    if (!inArc) return

    // Check if target has i-frames
    if (target.isInvulnerable) {
      this.addEvent({
        tick: this.state.tick,
        type: CombatEventType.DODGE,
        actorId: target.id,
        targetId: attacker.id,
      })
      return
    }

    // Calculate damage
    const damage = DamageCalculator.calculateMeleeDamage(attacker, target)

    // Apply damage
    target.hp = Math.max(0, target.hp - damage)

    // Log hit event
    this.addEvent({
      tick: this.state.tick,
      type: CombatEventType.HIT,
      actorId: attacker.id,
      targetId: target.id,
      data: { damage },
    })

    // Log ability used
    this.addEvent({
      tick: this.state.tick,
      type: CombatEventType.ABILITY_USED,
      actorId: attacker.id,
      data: { ability: 'Attack' },
    })
  }

  private processDodge(unit: UnitState) {
    // Grant i-frames for 200ms (deterministic dodge, no RNG)
    unit.isInvulnerable = true
    unit.invulnerabilityEndTime = this.state.timeMs + 200

    // Apply dodge dash (move in facing direction)
    const dashDistance = 3.0  // units
    const dashVelX = Math.cos(unit.facing) * dashDistance
    const dashVelY = Math.sin(unit.facing) * dashDistance

    unit.pos.x += dashVelX
    unit.pos.y += dashVelY

    // Clamp to arena
    Physics.clampToArena(unit, this.state.arena.width, this.state.arena.height)

    // Log dodge
    this.addEvent({
      tick: this.state.tick,
      type: CombatEventType.ABILITY_USED,
      actorId: unit.id,
      data: { ability: 'Dodge' },
    })
  }

  private regenerateStamina(dt: number) {
    for (const unit of this.state.units.values()) {
      const regen = unit.derived.stamRegen * dt
      unit.stamina = Math.min(unit.derived.stamMax, unit.stamina + regen)
    }
  }

  private updateCooldowns(dtMs: number) {
    for (const unit of this.state.units.values()) {
      for (const key in unit.cooldowns) {
        unit.cooldowns[key] = Math.max(0, unit.cooldowns[key] - dtMs)
      }
    }
  }

  private updateInvulnerability() {
    for (const unit of this.state.units.values()) {
      if (unit.isInvulnerable && this.state.timeMs >= unit.invulnerabilityEndTime) {
        unit.isInvulnerable = false
      }
    }
  }

  private checkWinCondition() {
    const units = Array.from(this.state.units.values())
    const deadUnits = units.filter((u) => u.hp <= 0)

    if (deadUnits.length > 0) {
      this.state.isComplete = true
      const winner = units.find((u) => u.hp > 0)
      this.state.winnerId = winner?.id

      for (const dead of deadUnits) {
        this.addEvent({
          tick: this.state.tick,
          type: CombatEventType.DEATH,
          actorId: dead.id,
        })
      }
    }
  }

  private addEvent(event: CombatEvent) {
    this.state.events.push(event)
  }
}
```

### Step 5: Write unit tests for real-time engine

**File:** `packages/shared/src/combat/__tests__/engine.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { CombatEngine } from '../engine'
import { CombatAction, InputFrame, CombatEventType } from '../types'

describe('CombatEngine (Real-Time)', () => {
  it('should initialize combat state with two units', () => {
    const engine = new CombatEngine(
      {
        id: 'g1',
        name: 'Gladiator 1',
        attributes: {
          constitution: 50,
          strength: 60,
          dexterity: 40,
          speed: 50,
          defense: 30,
        },
        startPos: { x: 10, y: 10 },
      },
      {
        id: 'g2',
        name: 'Gladiator 2',
        attributes: {
          constitution: 50,
          strength: 50,
          dexterity: 50,
          speed: 50,
          defense: 30,
        },
        startPos: { x: 30, y: 30 },
      },
      {
        arenaWidth: 50,
        arenaHeight: 50,
        tickRate: 20,
      }
    )

    const state = engine.getState()

    expect(state.tick).toBe(0)
    expect(state.units.size).toBe(2)
    expect(state.isComplete).toBe(false)

    const unit1 = state.units.get('g1')!
    expect(unit1.hp).toBe(unit1.derived.hpMax)
    expect(unit1.pos.x).toBe(10)
    expect(unit1.pos.y).toBe(10)
  })

  it('should process movement input', () => {
    const engine = new CombatEngine(
      {
        id: 'g1',
        name: 'Gladiator 1',
        attributes: { constitution: 50, strength: 50, dexterity: 50, speed: 50, defense: 30 },
        startPos: { x: 10, y: 10 },
      },
      {
        id: 'g2',
        name: 'Gladiator 2',
        attributes: { constitution: 50, strength: 50, dexterity: 50, speed: 50, defense: 30 },
        startPos: { x: 30, y: 30 },
      },
      { arenaWidth: 50, arenaHeight: 50, tickRate: 20 }
    )

    const inputs = new Map<string, InputFrame>()
    inputs.set('g1', {
      seq: 1,
      moveX: 1,
      moveY: 0,
      actions: [],
    })

    const dt = 0.05 // 50ms tick
    engine.processTick(inputs, dt)

    const state = engine.getState()
    const unit1 = state.units.get('g1')!

    // Unit should have moved right
    expect(unit1.pos.x).toBeGreaterThan(10)
    expect(unit1.vel.x).toBeGreaterThan(0)
  })

  it('should process attack and deal damage when in range', () => {
    const engine = new CombatEngine(
      {
        id: 'g1',
        name: 'Gladiator 1',
        attributes: { constitution: 50, strength: 60, dexterity: 50, speed: 50, defense: 30 },
        startPos: { x: 10, y: 10 },
      },
      {
        id: 'g2',
        name: 'Gladiator 2',
        attributes: { constitution: 50, strength: 50, dexterity: 50, speed: 50, defense: 30 },
        startPos: { x: 11, y: 10 }, // 1 unit away (within melee range)
      },
      { arenaWidth: 50, arenaHeight: 50, tickRate: 20 }
    )

    const initialState = engine.getState()
    const initialHp = initialState.units.get('g2')!.hp

    const inputs = new Map<string, InputFrame>()
    inputs.set('g1', {
      seq: 1,
      moveX: 0,
      moveY: 0,
      facing: 0, // facing right (toward g2)
      actions: [CombatAction.Attack],
    })

    engine.processTick(inputs, 0.05)

    const state = engine.getState()
    const unit2 = state.units.get('g2')!

    // Unit 2 should have taken damage
    expect(unit2.hp).toBeLessThan(initialHp)

    // Should have HIT event
    const hitEvents = state.events.filter((e) => e.type === CombatEventType.HIT)
    expect(hitEvents.length).toBeGreaterThan(0)
  })

  it('should grant i-frames on dodge', () => {
    const engine = new CombatEngine(
      {
        id: 'g1',
        name: 'Gladiator 1',
        attributes: { constitution: 50, strength: 60, dexterity: 50, speed: 50, defense: 30 },
        startPos: { x: 10, y: 10 },
      },
      {
        id: 'g2',
        name: 'Gladiator 2',
        attributes: { constitution: 50, strength: 50, dexterity: 50, speed: 50, defense: 30 },
        startPos: { x: 11, y: 10 },
      },
      { arenaWidth: 50, arenaHeight: 50, tickRate: 20 }
    )

    // Unit 2 dodges
    const inputs1 = new Map<string, InputFrame>()
    inputs1.set('g2', {
      seq: 1,
      moveX: 0,
      moveY: 0,
      actions: [CombatAction.Dodge],
    })

    engine.processTick(inputs1, 0.05)

    const stateAfterDodge = engine.getState()
    const unit2AfterDodge = stateAfterDodge.units.get('g2')!

    // Unit 2 should be invulnerable
    expect(unit2AfterDodge.isInvulnerable).toBe(true)

    // Unit 1 attacks during i-frames
    const inputs2 = new Map<string, InputFrame>()
    inputs2.set('g1', {
      seq: 2,
      moveX: 0,
      moveY: 0,
      facing: 0,
      actions: [CombatAction.Attack],
    })

    engine.processTick(inputs2, 0.05)

    const finalState = engine.getState()
    const unit2Final = finalState.units.get('g2')!

    // HP should not have changed (i-frames protected)
    expect(unit2Final.hp).toBe(unit2AfterDodge.hp)

    // Should have DODGE event
    const dodgeEvents = finalState.events.filter((e) => e.type === CombatEventType.DODGE)
    expect(dodgeEvents.length).toBeGreaterThan(0)
  })

  it('should end combat when one unit reaches 0 HP', () => {
    const engine = new CombatEngine(
      {
        id: 'g1',
        name: 'Gladiator 1',
        attributes: { constitution: 50, strength: 100, dexterity: 50, speed: 50, defense: 30 },
        startPos: { x: 10, y: 10 },
      },
      {
        id: 'g2',
        name: 'Gladiator 2',
        attributes: { constitution: 10, strength: 50, dexterity: 50, speed: 50, defense: 10 },
        startPos: { x: 11, y: 10 },
      },
      { arenaWidth: 50, arenaHeight: 50, tickRate: 20 }
    )

    // Attack multiple times until g2 dies
    for (let i = 0; i < 20; i++) {
      const inputs = new Map<string, InputFrame>()
      inputs.set('g1', {
        seq: i,
        moveX: 0,
        moveY: 0,
        facing: 0,
        actions: [CombatAction.Attack],
      })

      engine.processTick(inputs, 0.05)

      const state = engine.getState()
      if (state.isComplete) {
        expect(state.winnerId).toBe('g1')
        const unit2 = state.units.get('g2')!
        expect(unit2.hp).toBe(0)
        return
      }
    }
  })
})
```

### Step 6: Add test scripts

**File:** `packages/shared/package.json` (update)

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vitest": "^1.1.0"
  }
}
```

### Step 7: Run tests

```bash
cd packages/shared
pnpm add -D vitest
pnpm test
```

Expected: All tests pass

---

## Task 2: CPU AI for Real-Time Combat

**Owner:** Dev 2
**Time:** 2.5 hours

**Files:**
- Create: `apps/game-server/src/ai/cpu-ai.ts`
- Create: `apps/game-server/src/ai/__tests__/cpu-ai.test.ts`

### Step 1: Create real-time CPU AI

**File:** `apps/game-server/src/ai/cpu-ai.ts`

```typescript
import { UnitState, InputFrame, CombatAction, Vec2 } from '@gladiator/shared/src/combat/types'
import { Physics } from '@gladiator/shared/src/combat/physics'

export interface AIDecision {
  moveX: number
  moveY: number
  facing: number
  actions: CombatAction[]
}

export class CpuAI {
  private lastDecisionTime: number = 0
  private decisionInterval: number = 200 // Make new decision every 200ms

  /**
   * Generate input for CPU controlled unit
   * Real-time AI needs to decide:
   * 1. Movement direction (moveX, moveY)
   * 2. Facing direction
   * 3. Actions to perform (attack, dodge)
   */
  decide(
    self: UnitState,
    opponent: UnitState,
    currentTime: number
  ): AIDecision {
    const healthPercent = (self.hp / self.derived.hpMax) * 100
    const staminaPercent = (self.stamina / self.derived.stamMax) * 100

    // Calculate distance to opponent
    const distance = Physics.distance(self.pos, opponent.pos)

    // Calculate direction to opponent
    const dx = opponent.pos.x - self.pos.x
    const dy = opponent.pos.y - self.pos.y
    const angleToOpponent = Math.atan2(dy, dx)

    // Always face opponent
    const facing = angleToOpponent

    let moveX = 0
    let moveY = 0
    const actions: CombatAction[] = []

    // Decision tree

    // 1. Low health: retreat and dodge
    if (healthPercent < 30) {
      // Move away from opponent
      const retreatAngle = angleToOpponent + Math.PI // Opposite direction
      moveX = Math.cos(retreatAngle)
      moveY = Math.sin(retreatAngle)

      // Dodge if opponent is close
      if (distance < 3.0 && staminaPercent > 20 && !self.cooldowns[CombatAction.Dodge]) {
        actions.push(CombatAction.Dodge)
      }
    }
    // 2. In melee range: attack or dodge
    else if (distance < 2.5) {
      // Can attack?
      if (staminaPercent > 15 && !self.cooldowns[CombatAction.Attack]) {
        actions.push(CombatAction.Attack)

        // Circle strafe while attacking
        const strafeAngle = angleToOpponent + Math.PI / 2
        moveX = Math.cos(strafeAngle) * 0.5
        moveY = Math.sin(strafeAngle) * 0.5
      }
      // Dodge if can't attack
      else if (staminaPercent > 20 && !self.cooldowns[CombatAction.Dodge]) {
        actions.push(CombatAction.Dodge)

        // Dodge backward
        const retreatAngle = angleToOpponent + Math.PI
        moveX = Math.cos(retreatAngle)
        moveY = Math.sin(retreatAngle)
      }
      // Just move away if no stamina
      else {
        const retreatAngle = angleToOpponent + Math.PI
        moveX = Math.cos(retreatAngle) * 0.7
        moveY = Math.sin(retreatAngle) * 0.7
      }
    }
    // 3. Out of range: approach opponent
    else {
      // Move toward opponent
      moveX = Math.cos(angleToOpponent)
      moveY = Math.sin(angleToOpponent)
    }

    return {
      moveX,
      moveY,
      facing,
      actions,
    }
  }

  /**
   * Aggressive AI variant - always pushes forward
   */
  decideAggressive(
    self: UnitState,
    opponent: UnitState,
    currentTime: number
  ): AIDecision {
    const staminaPercent = (self.stamina / self.derived.stamMax) * 100
    const distance = Physics.distance(self.pos, opponent.pos)

    const dx = opponent.pos.x - self.pos.x
    const dy = opponent.pos.y - self.pos.y
    const angleToOpponent = Math.atan2(dy, dx)

    let moveX = Math.cos(angleToOpponent)
    let moveY = Math.sin(angleToOpponent)
    const actions: CombatAction[] = []

    // Always advance
    if (distance < 2.5 && staminaPercent > 15 && !self.cooldowns[CombatAction.Attack]) {
      actions.push(CombatAction.Attack)
    }

    return {
      moveX,
      moveY,
      facing: angleToOpponent,
      actions,
    }
  }

  /**
   * Defensive AI variant - keeps distance, attacks opportunistically
   */
  decideDefensive(
    self: UnitState,
    opponent: UnitState,
    currentTime: number
  ): AIDecision {
    const healthPercent = (self.hp / self.derived.hpMax) * 100
    const staminaPercent = (self.stamina / self.derived.stamMax) * 100
    const distance = Physics.distance(self.pos, opponent.pos)

    const dx = opponent.pos.x - self.pos.x
    const dy = opponent.pos.y - self.pos.y
    const angleToOpponent = Math.atan2(dy, dx)

    let moveX = 0
    let moveY = 0
    const actions: CombatAction[] = []

    const idealDistance = 3.5 // Keep at medium range

    if (distance < idealDistance) {
      // Too close: back up
      const retreatAngle = angleToOpponent + Math.PI
      moveX = Math.cos(retreatAngle)
      moveY = Math.sin(retreatAngle)

      if (distance < 2.0 && staminaPercent > 20 && !self.cooldowns[CombatAction.Dodge]) {
        actions.push(CombatAction.Dodge)
      }
    } else if (distance > idealDistance + 2) {
      // Too far: approach
      moveX = Math.cos(angleToOpponent) * 0.5
      moveY = Math.sin(angleToOpponent) * 0.5
    } else {
      // Circle strafe at ideal distance
      const strafeAngle = angleToOpponent + Math.PI / 2
      moveX = Math.cos(strafeAngle) * 0.7
      moveY = Math.sin(strafeAngle) * 0.7
    }

    // Attack if in range and safe
    if (distance < 2.5 && healthPercent > 50 && staminaPercent > 15 && !self.cooldowns[CombatAction.Attack]) {
      actions.push(CombatAction.Attack)
    }

    return {
      moveX,
      moveY,
      facing: angleToOpponent,
      actions,
    }
  }
}
```

### Step 2: Write AI tests

**File:** `apps/game-server/src/ai/__tests__/cpu-ai.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { CpuAI } from '../cpu-ai'
import { UnitState, CombatAction } from '@gladiator/shared/src/combat/types'

describe('CpuAI (Real-Time)', () => {
  const createUnit = (
    id: string,
    pos: { x: number; y: number },
    hp: number,
    stamina: number
  ): UnitState => ({
    id,
    name: `Unit ${id}`,
    attributes: {
      constitution: 50,
      strength: 50,
      dexterity: 50,
      speed: 50,
      defense: 30,
    },
    derived: {
      hpMax: 100,
      stamMax: 100,
      moveSpeed: 5,
      stamRegen: 10,
    },
    hp,
    stamina,
    pos,
    vel: { x: 0, y: 0 },
    facing: 0,
    cooldowns: {},
    isInvulnerable: false,
    invulnerabilityEndTime: 0,
  })

  it('should retreat when low health', () => {
    const ai = new CpuAI()
    const cpu = createUnit('cpu', { x: 10, y: 10 }, 20, 100) // 20% health
    const opponent = createUnit('player', { x: 15, y: 10 }, 100, 100)

    const decision = ai.decide(cpu, opponent, 0)

    // Should move away from opponent (moveX should be negative)
    expect(decision.moveX).toBeLessThan(0)

    // Should consider dodging
    expect(decision.actions.includes(CombatAction.Dodge) || decision.moveX < 0).toBe(true)
  })

  it('should approach when out of range', () => {
    const ai = new CpuAI()
    const cpu = createUnit('cpu', { x: 10, y: 10 }, 100, 100)
    const opponent = createUnit('player', { x: 30, y: 10 }, 100, 100) // Far away

    const decision = ai.decide(cpu, opponent, 0)

    // Should move toward opponent (moveX should be positive)
    expect(decision.moveX).toBeGreaterThan(0)
  })

  it('should attack when in melee range', () => {
    const ai = new CpuAI()
    const cpu = createUnit('cpu', { x: 10, y: 10 }, 100, 100)
    const opponent = createUnit('player', { x: 11, y: 10 }, 100, 100) // 1 unit away

    const decision = ai.decide(cpu, opponent, 0)

    // Should attempt attack
    expect(decision.actions.includes(CombatAction.Attack)).toBe(true)
  })

  it('should not attack when on cooldown', () => {
    const ai = new CpuAI()
    const cpu = createUnit('cpu', { x: 10, y: 10 }, 100, 100)
    cpu.cooldowns[CombatAction.Attack] = 500 // On cooldown

    const opponent = createUnit('player', { x: 11, y: 10 }, 100, 100)

    const decision = ai.decide(cpu, opponent, 0)

    // Should NOT attack while on cooldown
    expect(decision.actions.includes(CombatAction.Attack)).toBe(false)
  })

  it('should not attack when low stamina', () => {
    const ai = new CpuAI()
    const cpu = createUnit('cpu', { x: 10, y: 10 }, 100, 10) // 10% stamina
    const opponent = createUnit('player', { x: 11, y: 10 }, 100, 100)

    const decision = ai.decide(cpu, opponent, 0)

    // Should avoid attacking with low stamina
    expect(decision.actions.includes(CombatAction.Attack)).toBe(false)
  })

  it('aggressive AI should always advance', () => {
    const ai = new CpuAI()
    const cpu = createUnit('cpu', { x: 10, y: 10 }, 100, 100)
    const opponent = createUnit('player', { x: 20, y: 10 }, 100, 100)

    const decision = ai.decideAggressive(cpu, opponent, 0)

    // Should always move toward opponent
    expect(decision.moveX).toBeGreaterThan(0)
  })

  it('defensive AI should maintain distance', () => {
    const ai = new CpuAI()
    const cpu = createUnit('cpu', { x: 10, y: 10 }, 100, 100)
    const opponent = createUnit('player', { x: 11, y: 10 }, 100, 100) // Too close

    const decision = ai.decideDefensive(cpu, opponent, 0)

    // Should back away when too close
    expect(decision.moveX).toBeLessThan(0)
  })
})
```

### Step 3: Install vitest in game server

```bash
cd apps/game-server
pnpm add -D vitest
```

### Step 4: Add test script

**File:** `apps/game-server/package.json` (update scripts)

```json
{
  "scripts": {
    "test": "vitest",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### Step 5: Run tests

```bash
pnpm test
```

Expected: AI tests pass

---

## Task 3: Real-Time Match Management

**Owner:** Dev 3
**Time:** 3 hours

**Files:**
- Create: `apps/game-server/src/services/match-manager.ts`
- Create: `apps/game-server/src/services/match-instance.ts`

### Step 1: Create real-time match instance

**File:** `apps/game-server/src/services/match-instance.ts`

```typescript
import { CombatEngine, CombatEngineConfig } from '@gladiator/shared/src/combat/engine'
import { InputFrame, BaseAttributes, CombatAction } from '@gladiator/shared/src/combat/types'
import { CpuAI } from '../ai/cpu-ai'

export interface MatchConfig {
  matchId: string
  player1: {
    gladiatorId: string
    userId: string
    name: string
    attributes: BaseAttributes
  }
  isCpuMatch: boolean
  cpuDifficulty?: 'normal' | 'aggressive' | 'defensive'
}

export class MatchInstance {
  private engine: CombatEngine
  private config: MatchConfig
  private tickInterval: NodeJS.Timeout | null = null
  private cpuAI: CpuAI
  private playerInputs: Map<string, InputFrame> = new Map()
  private sequenceNumber: number = 0
  private lastTickTime: number = 0

  constructor(config: MatchConfig) {
    this.config = config
    this.cpuAI = new CpuAI()

    // Create combat engine with real-time config
    const engineConfig: CombatEngineConfig = {
      arenaWidth: 50,   // 50 units wide
      arenaHeight: 50,  // 50 units tall
      tickRate: 20,     // 20 Hz = 50ms per tick
    }

    this.engine = new CombatEngine(
      {
        id: config.player1.gladiatorId,
        name: config.player1.name,
        attributes: config.player1.attributes,
        startPos: { x: 10, y: 25 }, // Left side of arena
      },
      {
        id: 'cpu',
        name: 'CPU Opponent',
        attributes: {
          constitution: 55,
          strength: 55,
          dexterity: 55,
          speed: 55,
          defense: 35,
        },
        startPos: { x: 40, y: 25 }, // Right side of arena
      },
      engineConfig
    )
  }

  start(onTick: (state: any) => void, onComplete: (winnerId: string) => void) {
    console.log(`🎮 Starting real-time match: ${this.config.matchId}`)

    this.lastTickTime = Date.now()

    // Run at 20 Hz (50ms per tick)
    this.tickInterval = setInterval(() => {
      const now = Date.now()
      const dt = (now - this.lastTickTime) / 1000 // Convert to seconds
      this.lastTickTime = now

      this.processTick(dt)

      const state = this.engine.getState()
      onTick(state)

      if (state.isComplete) {
        this.stop()
        onComplete(state.winnerId!)
      }
    }, 50) // 50ms = 20 Hz
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
      console.log(`🛑 Stopped match: ${this.config.matchId}`)
    }
  }

  /**
   * Submit player input (movement + actions)
   */
  submitInput(gladiatorId: string, input: Partial<InputFrame>) {
    const fullInput: InputFrame = {
      seq: this.sequenceNumber++,
      moveX: input.moveX ?? 0,
      moveY: input.moveY ?? 0,
      facing: input.facing,
      actions: input.actions ?? [],
    }

    this.playerInputs.set(gladiatorId, fullInput)
  }

  private processTick(dt: number) {
    const inputs = new Map<string, InputFrame>()

    // Get player input
    const playerInput = this.playerInputs.get(this.config.player1.gladiatorId)
    if (playerInput) {
      inputs.set(this.config.player1.gladiatorId, playerInput)
    } else {
      // No input from player: send neutral input
      inputs.set(this.config.player1.gladiatorId, {
        seq: this.sequenceNumber++,
        moveX: 0,
        moveY: 0,
        actions: [],
      })
    }

    // Generate CPU input
    if (this.config.isCpuMatch) {
      const state = this.engine.getState()
      const cpuUnit = state.units.get('cpu')!
      const playerUnit = state.units.get(this.config.player1.gladiatorId)!

      const cpuDecision = this.getCpuDecision(cpuUnit, playerUnit)

      inputs.set('cpu', {
        seq: this.sequenceNumber++,
        moveX: cpuDecision.moveX,
        moveY: cpuDecision.moveY,
        facing: cpuDecision.facing,
        actions: cpuDecision.actions,
      })
    }

    // Process tick
    this.engine.processTick(inputs, dt)

    // Clear player inputs (they're consumed each tick)
    this.playerInputs.clear()
  }

  private getCpuDecision(cpu: any, player: any) {
    switch (this.config.cpuDifficulty) {
      case 'aggressive':
        return this.cpuAI.decideAggressive(cpu, player, Date.now())
      case 'defensive':
        return this.cpuAI.decideDefensive(cpu, player, Date.now())
      default:
        return this.cpuAI.decide(cpu, player, Date.now())
    }
  }

  getState() {
    return this.engine.getState()
  }
}
```

### Step 2: Create match manager service

**File:** `apps/game-server/src/services/match-manager.ts`

```typescript
import { Server, Socket } from 'socket.io'
import { MatchInstance, MatchConfig } from './match-instance'
import { prisma } from '@gladiator/database/src/client'
import { BaseAttributes } from '@gladiator/shared/src/combat/types'

export class MatchManager {
  private matches: Map<string, MatchInstance> = new Map()
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  async createCpuMatch(userId: string, gladiatorId: string): Promise<string> {
    // Fetch gladiator data
    const gladiator = await prisma.gladiator.findUnique({
      where: { id: gladiatorId },
      include: { owner: true },
    })

    if (!gladiator || gladiator.ownerId !== userId) {
      throw new Error('Gladiator not found or not owned by user')
    }

    // Create match record in database
    const match = await prisma.match.create({
      data: {
        player1Id: userId,
        player1GladiatorId: gladiatorId,
        isCpuMatch: true,
        matchLog: [],
        durationSeconds: 0,
      },
    })

    // Map Gladiator stats to combat attributes
    // For now: simple mapping (can be refined later)
    const attributes: BaseAttributes = {
      constitution: gladiator.endurance, // Endurance -> CON
      strength: gladiator.strength,      // STR -> STR
      dexterity: gladiator.agility,      // Agility -> DEX
      speed: gladiator.agility,          // Agility -> SPD (for now)
      defense: gladiator.endurance,      // Endurance -> DEF (for now)
    }

    // Create match instance
    const config: MatchConfig = {
      matchId: match.id,
      player1: {
        gladiatorId: gladiator.id,
        userId,
        name: `${gladiator.class} #${gladiator.tokenId}`,
        attributes,
      },
      isCpuMatch: true,
      cpuDifficulty: 'normal',
    }

    const instance = new MatchInstance(config)

    instance.start(
      (state) => {
        // Broadcast state to match room (at 20Hz)
        // Note: We may want to throttle client updates to 10Hz to save bandwidth
        this.io.to(match.id).emit('match:state', state)
      },
      async (winnerId) => {
        // Match complete
        await this.completeMatch(match.id, winnerId)
      }
    )

    this.matches.set(match.id, instance)

    console.log(`✅ Created CPU match ${match.id} for gladiator ${gladiator.id}`)

    return match.id
  }

  /**
   * Submit player input (movement + actions)
   */
  submitInput(matchId: string, gladiatorId: string, input: any) {
    const match = this.matches.get(matchId)
    if (match) {
      match.submitInput(gladiatorId, input)
    }
  }

  private async completeMatch(matchId: string, winnerId: string) {
    const instance = this.matches.get(matchId)
    if (!instance) return

    const finalState = instance.getState()

    // Calculate match duration
    const durationSeconds = Math.floor(finalState.timeMs / 1000)

    // Update match in database
    await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        matchLog: finalState.events as any, // Store events as JSON
        durationSeconds,
      },
    })

    // Award XP
    await this.awardXP(matchId, winnerId)

    // Broadcast completion
    this.io.to(matchId).emit('match:complete', { winnerId, finalState })

    console.log(`✅ Match ${matchId} completed. Winner: ${winnerId}`)

    // Cleanup
    instance.stop()
    this.matches.delete(matchId)
  }

  private async awardXP(matchId: string, winnerId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1Gladiator: true,
      },
    })

    if (!match) return

    const isWinner = match.player1GladiatorId === winnerId
    const xpGain = isWinner ? 100 : 25

    await prisma.gladiator.update({
      where: { id: match.player1GladiatorId },
      data: {
        xp: { increment: xpGain },
      },
    })

    console.log(`✅ Awarded ${xpGain} XP to gladiator ${match.player1GladiatorId}`)
  }
}
```

---

## Task 4: WebSocket Real-Time Input Handlers

**Owner:** Dev 3
**Time:** 2 hours

**Files:**
- Update: `apps/game-server/src/sockets/index.ts`
- Create: `apps/game-server/src/sockets/match-handlers.ts`

### Step 1: Create real-time match handlers

**File:** `apps/game-server/src/sockets/match-handlers.ts`

```typescript
import { Socket } from 'socket.io'
import { MatchManager } from '../services/match-manager'

export function setupMatchHandlers(socket: Socket, matchManager: MatchManager) {
  /**
   * Create CPU match
   */
  socket.on('match:create-cpu', async ({ userId, gladiatorId }, callback) => {
    try {
      const matchId = await matchManager.createCpuMatch(userId, gladiatorId)

      // Join match room
      socket.join(matchId)

      callback({ success: true, matchId })
    } catch (error: any) {
      console.error('❌ Create CPU match error:', error)
      callback({ success: false, error: error.message })
    }
  })

  /**
   * Submit real-time input (movement + actions)
   * Client sends this continuously (e.g., on keydown/keyup, mouse move)
   *
   * Input format:
   * {
   *   matchId: string
   *   gladiatorId: string
   *   input: {
   *     moveX: number (-1 to 1)
   *     moveY: number (-1 to 1)
   *     facing?: number (radians)
   *     actions: string[] (e.g., ['Attack', 'Dodge'])
   *   }
   * }
   */
  socket.on('match:input', ({ matchId, gladiatorId, input }) => {
    matchManager.submitInput(matchId, gladiatorId, input)
  })

  /**
   * Leave match
   */
  socket.on('match:leave', ({ matchId }) => {
    socket.leave(matchId)
  })
}
```

### Step 2: Update socket handlers

**File:** `apps/game-server/src/sockets/index.ts` (update)

```typescript
import { Server, Socket } from 'socket.io'
import { MatchManager } from '../services/match-manager'
import { setupMatchHandlers } from './match-handlers'

export function setupSocketHandlers(io: Server) {
  const matchManager = new MatchManager(io)

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`)

    setupMatchHandlers(socket, matchManager)

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() })
    })
  })
}
```

---

## Verification Checklist

After completing Sprint 2, verify:

**Core Combat Engine:**
- [ ] Combat engine processes ticks at 20Hz (50ms intervals)
- [ ] Units move smoothly with WASD input
- [ ] Movement is bounded by arena walls
- [ ] Sword attack works (melee range + arc check)
- [ ] Dodge roll grants i-frames (200ms invulnerability)
- [ ] Dodge roll dashes unit forward
- [ ] Damage calculation uses STR and DEF stats
- [ ] Stamina regenerates over time
- [ ] Cooldowns prevent ability spam
- [ ] Combat ends when one unit reaches 0 HP
- [ ] Unit tests pass for combat engine
- [ ] Physics tests pass (movement, collisions, range checks)

**CPU AI:**
- [ ] CPU AI generates movement decisions
- [ ] CPU AI approaches when out of range
- [ ] CPU AI attacks when in melee range
- [ ] CPU AI retreats when low health
- [ ] CPU AI respects cooldowns and stamina
- [ ] CPU AI unit tests pass

**Match System:**
- [ ] Match instances start and run at 20Hz
- [ ] Player input is processed each tick
- [ ] CPU input is generated each tick
- [ ] WebSocket emits state snapshots at 20Hz (or throttled to 10Hz)
- [ ] Match results saved to database with event log
- [ ] Match duration calculated correctly (in seconds)
- [ ] XP awarded after match completion

**Integration:**
- [ ] Can create CPU match from frontend
- [ ] Can send movement input via WebSocket
- [ ] Can see both units moving in real-time
- [ ] Can execute attacks and see damage
- [ ] Can dodge and avoid damage during i-frames
- [ ] Match ends when one gladiator dies
- [ ] Victory/defeat screen shows correctly

---

## Notes for Frontend Integration (Sprint 3)

When implementing the frontend combat UI in Sprint 3, keep in mind:

**Client-Side Responsibilities:**
- Capture WASD input and send via `match:input` WebSocket event
- Predict local player movement for smoothness (apply same physics locally)
- Receive server state snapshots at 20Hz (or 10Hz if throttled)
- Reconcile predicted position with server position (smoothly correct)
- Interpolate opponent movement between snapshots for visual smoothness
- Render arena, units, HP bars, stamina bars
- Show attack animations, dodge animations, hit effects

**Input Handling:**
```typescript
// Example client input submission
const input = {
  moveX: 0, // -1 (left) to 1 (right)
  moveY: 0, // -1 (down) to 1 (up)
  facing: Math.atan2(mouseY - playerY, mouseX - playerX), // aim with mouse
  actions: ['Attack'] // or ['Dodge']
}

socket.emit('match:input', { matchId, gladiatorId, input })
```

**State Snapshot:**
Server sends full state at 20Hz (may be throttled to 10Hz):
```typescript
socket.on('match:state', (state) => {
  // state.units: Map<string, UnitState>
  // state.events: CombatEvent[] (for animations)
  // state.isComplete: boolean
})
```

**Prediction & Reconciliation:**
- Client predicts own movement immediately (no lag)
- Server sends authoritative position periodically
- Client smoothly lerps from predicted to server position if there's a mismatch
- For opponent, client interpolates between last 2 server snapshots

See `docs/features/combat.md` §3.3 for full networking model.

---

## Next Sprint

**Sprint 3: Frontend - Combat UI & Real-Time Rendering**

Focus:
- Canvas-based 2D arena renderer
- Client prediction for player movement
- Interpolation for opponent movement
- Attack/dodge animations
- HP/Stamina UI
- Input handling (WASD + mouse aim)

See: `docs/plans/04-sprint-3-frontend-animations.md` (to be updated for real-time)
