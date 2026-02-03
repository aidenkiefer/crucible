# Sprint 2: Combat System - CPU Battles

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Players can fight CPU opponents with tick-based combat mechanics

**Duration:** Week 3
**Prerequisites:** Sprint 1 complete (authentication and NFT minting working)

**Architecture:** Server-authoritative combat engine with 1000ms tick rate, WebSocket communication, CPU AI decision tree

**Tech Stack:**
- Socket.io (real-time communication)
- TypeScript (shared game logic)
- Prisma (match persistence)

---

## Overview

This sprint implements the core combat loop:
1. Player selects Gladiator and starts CPU match
2. Server creates match instance and initializes combat state
3. Every 1000ms (tick), server processes player + CPU actions
4. Combat resolves until one Gladiator reaches 0 HP
5. Match result saved, XP awarded

---

## Task 1: Combat Engine Core

**Owner:** Dev 1
**Time:** 3 hours

**Files:**
- Create: `packages/shared/src/combat/types.ts`
- Create: `packages/shared/src/combat/engine.ts`
- Create: `packages/shared/src/combat/damage-calculator.ts`
- Create: `packages/shared/src/combat/__tests__/engine.test.ts`

### Step 1: Define combat types

**File:** `packages/shared/src/combat/types.ts`

```typescript
export enum CombatAction {
  LightAttack = 'LightAttack',
  HeavyAttack = 'HeavyAttack',
  Block = 'Block',
  Dodge = 'Dodge',
}

export interface CombatantStats {
  health: number
  maxHealth: number
  stamina: number
  maxStamina: number
  strength: number
  agility: number
  endurance: number
  technique: number
}

export interface CombatantState extends CombatantStats {
  id: string
  name: string
  lastAction?: CombatAction
  isBlocking: boolean
  isDodging: boolean
}

export interface CombatState {
  tick: number
  combatant1: CombatantState
  combatant2: CombatantState
  isComplete: boolean
  winnerId?: string
  log: ActionLogEntry[]
}

export interface ActionLogEntry {
  tick: number
  actorId: string
  action: CombatAction
  targetId: string
  damage?: number
  stamina Cost: number
  result: string
  blocked?: boolean
  dodged?: boolean
}

export interface ActionInput {
  combatantId: string
  action: CombatAction
}
```

### Step 2: Create damage calculator

**File:** `packages/shared/src/combat/damage-calculator.ts`

```typescript
import { CombatAction, CombatantState } from './types'

export class DamageCalculator {
  static calculate(
    action: CombatAction,
    attacker: CombatantState,
    defender: CombatantState
  ): { damage: number; blocked: boolean; dodged: boolean } {
    let baseDamage = 0
    let blocked = false
    let dodged = false

    // Base damage calculation
    if (action === CombatAction.LightAttack) {
      baseDamage = 10 + attacker.strength * 0.5
    } else if (action === CombatAction.HeavyAttack) {
      baseDamage = 20 + attacker.strength * 1.0
    }

    // Check if defender is blocking
    if (defender.isBlocking && (action === CombatAction.LightAttack || action === CombatAction.HeavyAttack)) {
      blocked = true
      baseDamage = baseDamage * 0.3 // Block reduces damage by 70%
    }

    // Check if defender dodged
    if (defender.isDodging && (action === CombatAction.LightAttack || action === CombatAction.HeavyAttack)) {
      const dodgeChance = Math.min(0.8, defender.agility / 100)
      if (Math.random() < dodgeChance) {
        dodged = true
        baseDamage = 0
      }
    }

    // Apply defender's endurance (damage reduction)
    const damageReduction = defender.endurance * 0.002 // 0.2% per endurance point
    const finalDamage = Math.max(0, Math.floor(baseDamage * (1 - damageReduction)))

    return { damage: finalDamage, blocked, dodged }
  }

  static getStaminaCost(action: CombatAction): number {
    switch (action) {
      case CombatAction.LightAttack:
        return 10
      case CombatAction.HeavyAttack:
        return 25
      case CombatAction.Block:
        return 5
      case CombatAction.Dodge:
        return 15
      default:
        return 0
    }
  }
}
```

### Step 3: Create combat engine

**File:** `packages/shared/src/combat/engine.ts`

```typescript
import { CombatState, CombatantState, ActionInput, ActionLogEntry, CombatAction } from './types'
import { DamageCalculator } from './damage-calculator'

export class CombatEngine {
  private state: CombatState

  constructor(
    combatant1: Omit<CombatantState, 'isBlocking' | 'isDodging'>,
    combatant2: Omit<CombatantState, 'isBlocking' | 'isDodging'>
  ) {
    this.state = {
      tick: 0,
      combatant1: { ...combatant1, isBlocking: false, isDodging: false },
      combatant2: { ...combatant2, isBlocking: false, isDodging: false },
      isComplete: false,
      log: [],
    }
  }

  getState(): CombatState {
    return { ...this.state }
  }

  processTick(actions: ActionInput[]): CombatState {
    if (this.state.isComplete) {
      return this.getState()
    }

    this.state.tick++

    // Reset blocking/dodging states
    this.state.combatant1.isBlocking = false
    this.state.combatant1.isDodging = false
    this.state.combatant2.isBlocking = false
    this.state.combatant2.isDodging = false

    // Apply stamina regeneration
    this.regenerateStamina()

    // Process actions
    for (const input of actions) {
      this.processAction(input)
    }

    // Check win condition
    this.checkWinCondition()

    return this.getState()
  }

  private processAction(input: ActionInput) {
    const actor = this.getCombatant(input.combatantId)
    const target = this.getOtherCombatant(input.combatantId)

    if (!actor || !target) return

    const staminaCost = DamageCalculator.getStaminaCost(input.action)

    // Check if actor has enough stamina
    if (actor.stamina < staminaCost) {
      this.log({
        tick: this.state.tick,
        actorId: actor.id,
        action: input.action,
        targetId: target.id,
        staminaCost: 0,
        result: 'Insufficient stamina',
      })
      return
    }

    // Deduct stamina
    actor.stamina -= staminaCost

    // Set defensive states
    if (input.action === CombatAction.Block) {
      actor.isBlocking = true
      this.log({
        tick: this.state.tick,
        actorId: actor.id,
        action: input.action,
        targetId: target.id,
        staminaCost,
        result: 'Blocking',
      })
      return
    }

    if (input.action === CombatAction.Dodge) {
      actor.isDodging = true
      this.log({
        tick: this.state.tick,
        actorId: actor.id,
        action: input.action,
        targetId: target.id,
        staminaCost,
        result: 'Dodging',
      })
      return
    }

    // Calculate damage
    const { damage, blocked, dodged } = DamageCalculator.calculate(input.action, actor, target)

    // Apply damage
    target.health = Math.max(0, target.health - damage)

    // Log action
    this.log({
      tick: this.state.tick,
      actorId: actor.id,
      action: input.action,
      targetId: target.id,
      damage,
      staminaCost,
      blocked,
      dodged,
      result: dodged ? 'Dodged!' : blocked ? `Blocked! (${damage} damage)` : `${damage} damage`,
    })

    // Update last action
    actor.lastAction = input.action
  }

  private regenerateStamina() {
    const regenAmount = 10

    this.state.combatant1.stamina = Math.min(
      this.state.combatant1.maxStamina,
      this.state.combatant1.stamina + regenAmount
    )

    this.state.combatant2.stamina = Math.min(
      this.state.combatant2.maxStamina,
      this.state.combatant2.stamina + regenAmount
    )
  }

  private checkWinCondition() {
    if (this.state.combatant1.health <= 0) {
      this.state.isComplete = true
      this.state.winnerId = this.state.combatant2.id
    } else if (this.state.combatant2.health <= 0) {
      this.state.isComplete = true
      this.state.winnerId = this.state.combatant1.id
    }
  }

  private getCombatant(id: string): CombatantState | null {
    if (this.state.combatant1.id === id) return this.state.combatant1
    if (this.state.combatant2.id === id) return this.state.combatant2
    return null
  }

  private getOtherCombatant(id: string): CombatantState | null {
    if (this.state.combatant1.id === id) return this.state.combatant2
    if (this.state.combatant2.id === id) return this.state.combatant1
    return null
  }

  private log(entry: ActionLogEntry) {
    this.state.log.push(entry)
  }
}
```

### Step 4: Write unit tests for combat engine

**File:** `packages/shared/src/combat/__tests__/engine.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { CombatEngine } from '../engine'
import { CombatAction } from '../types'

describe('CombatEngine', () => {
  it('should initialize combat state', () => {
    const engine = new CombatEngine(
      {
        id: 'g1',
        name: 'Gladiator 1',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: 50,
        agility: 50,
        endurance: 50,
        technique: 50,
      },
      {
        id: 'g2',
        name: 'Gladiator 2',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: 50,
        agility: 50,
        endurance: 50,
        technique: 50,
      }
    )

    const state = engine.getState()

    expect(state.tick).toBe(0)
    expect(state.combatant1.health).toBe(100)
    expect(state.combatant2.health).toBe(100)
    expect(state.isComplete).toBe(false)
  })

  it('should process light attack', () => {
    const engine = new CombatEngine(
      {
        id: 'g1',
        name: 'Gladiator 1',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: 60,
        agility: 50,
        endurance: 50,
        technique: 50,
      },
      {
        id: 'g2',
        name: 'Gladiator 2',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: 50,
        agility: 50,
        endurance: 50,
        technique: 50,
      }
    )

    const state = engine.processTick([
      { combatantId: 'g1', action: CombatAction.LightAttack },
    ])

    expect(state.combatant2.health).toBeLessThan(100)
    expect(state.combatant1.stamina).toBe(100) // 100 - 10 + 10 regen
    expect(state.log.length).toBe(1)
    expect(state.log[0].action).toBe(CombatAction.LightAttack)
  })

  it('should block reduce damage', () => {
    const engine = new CombatEngine(
      {
        id: 'g1',
        name: 'Gladiator 1',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: 60,
        agility: 50,
        endurance: 50,
        technique: 50,
      },
      {
        id: 'g2',
        name: 'Gladiator 2',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: 50,
        agility: 50,
        endurance: 50,
        technique: 50,
      }
    )

    // First attack without block
    const state1 = engine.processTick([
      { combatantId: 'g1', action: CombatAction.LightAttack },
    ])
    const damageWithoutBlock = 100 - state1.combatant2.health

    // Reset
    const engine2 = new CombatEngine(
      {
        id: 'g1',
        name: 'Gladiator 1',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: 60,
        agility: 50,
        endurance: 50,
        technique: 50,
      },
      {
        id: 'g2',
        name: 'Gladiator 2',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: 50,
        agility: 50,
        endurance: 50,
        technique: 50,
      }
    )

    // Attack with block
    const state2 = engine2.processTick([
      { combatantId: 'g2', action: CombatAction.Block },
      { combatantId: 'g1', action: CombatAction.LightAttack },
    ])
    const damageWithBlock = 100 - state2.combatant2.health

    expect(damageWithBlock).toBeLessThan(damageWithoutBlock)
  })

  it('should end combat when health reaches 0', () => {
    const engine = new CombatEngine(
      {
        id: 'g1',
        name: 'Gladiator 1',
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: 100,
        agility: 50,
        endurance: 50,
        technique: 50,
      },
      {
        id: 'g2',
        name: 'Gladiator 2',
        health: 10,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        strength: 50,
        agility: 50,
        endurance: 50,
        technique: 50,
      }
    )

    const state = engine.processTick([
      { combatantId: 'g1', action: CombatAction.HeavyAttack },
    ])

    expect(state.isComplete).toBe(true)
    expect(state.winnerId).toBe('g1')
    expect(state.combatant2.health).toBe(0)
  })
})
```

### Step 5: Add test script to shared package

**File:** `packages/shared/package.json` (update)

```json
{
  "scripts": {
    "test": "vitest",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "vitest": "^1.1.0"
  }
}
```

### Step 6: Install vitest and run tests

```bash
cd packages/shared
pnpm add -D vitest
pnpm test
```

Expected: All tests pass

---

## Task 2: CPU AI Decision Tree

**Owner:** Dev 2
**Time:** 2 hours

**Files:**
- Create: `apps/game-server/src/ai/cpu-ai.ts`
- Create: `apps/game-server/src/ai/__tests__/cpu-ai.test.ts`

### Step 1: Create CPU AI

**File:** `apps/game-server/src/ai/cpu-ai.ts`

```typescript
import { CombatAction, CombatantState } from '@gladiator/shared/src/combat/types'

export class CpuAI {
  /**
   * Simple decision tree for CPU opponent
   * Strategy:
   * - If low health (<30%), prioritize blocking
   * - If low stamina (<20), rest (block to regen)
   * - If opponent low health, attack aggressively
   * - Otherwise, balanced mix of attacks and defenses
   */
  static decide(self: CombatantState, opponent: CombatantState): CombatAction {
    const healthPercent = (self.health / self.maxHealth) * 100
    const staminaPercent = (self.stamina / self.maxStamina) * 100
    const opponentHealthPercent = (opponent.health / opponent.maxHealth) * 100

    // Low health: defensive
    if (healthPercent < 30) {
      return Math.random() < 0.7 ? CombatAction.Block : CombatAction.Dodge
    }

    // Low stamina: conserve energy
    if (staminaPercent < 20) {
      return CombatAction.Block // Costs least stamina
    }

    // Opponent low health: finish them
    if (opponentHealthPercent < 30) {
      return Math.random() < 0.7 ? CombatAction.HeavyAttack : CombatAction.LightAttack
    }

    // Balanced strategy
    const rand = Math.random()

    if (rand < 0.35) {
      return CombatAction.LightAttack
    } else if (rand < 0.55) {
      return CombatAction.HeavyAttack
    } else if (rand < 0.75) {
      return CombatAction.Block
    } else {
      return CombatAction.Dodge
    }
  }

  /**
   * More aggressive AI variant
   */
  static decideAggressive(self: CombatantState, opponent: CombatantState): CombatAction {
    const staminaPercent = (self.stamina / self.maxStamina) * 100

    if (staminaPercent < 25) {
      return CombatAction.Block
    }

    const rand = Math.random()

    if (rand < 0.6) {
      return CombatAction.HeavyAttack
    } else if (rand < 0.9) {
      return CombatAction.LightAttack
    } else {
      return CombatAction.Dodge
    }
  }

  /**
   * More defensive AI variant
   */
  static decideDefensive(self: CombatantState, opponent: CombatantState): CombatAction {
    const healthPercent = (self.health / self.maxHealth) * 100

    if (healthPercent < 50) {
      return Math.random() < 0.6 ? CombatAction.Block : CombatAction.Dodge
    }

    const rand = Math.random()

    if (rand < 0.3) {
      return CombatAction.LightAttack
    } else if (rand < 0.45) {
      return CombatAction.HeavyAttack
    } else if (rand < 0.75) {
      return CombatAction.Block
    } else {
      return CombatAction.Dodge
    }
  }
}
```

### Step 2: Write AI tests

**File:** `apps/game-server/src/ai/__tests__/cpu-ai.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { CpuAI } from '../cpu-ai'
import { CombatantState, CombatAction } from '@gladiator/shared/src/combat/types'

describe('CpuAI', () => {
  const createCombatant = (health: number, stamina: number): CombatantState => ({
    id: 'cpu',
    name: 'CPU',
    health,
    maxHealth: 100,
    stamina,
    maxStamina: 100,
    strength: 50,
    agility: 50,
    endurance: 50,
    technique: 50,
    isBlocking: false,
    isDodging: false,
  })

  const opponent: CombatantState = {
    id: 'player',
    name: 'Player',
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    strength: 50,
    agility: 50,
    endurance: 50,
    technique: 50,
    isBlocking: false,
    isDodging: false,
  }

  it('should prioritize defense when low health', () => {
    const cpu = createCombatant(20, 100) // 20% health

    let defensiveActions = 0
    for (let i = 0; i < 100; i++) {
      const action = CpuAI.decide(cpu, opponent)
      if (action === CombatAction.Block || action === CombatAction.Dodge) {
        defensiveActions++
      }
    }

    expect(defensiveActions).toBeGreaterThan(50) // Should be defensive most of the time
  })

  it('should block when low stamina', () => {
    const cpu = createCombatant(100, 15) // 15% stamina

    const action = CpuAI.decide(cpu, opponent)
    expect(action).toBe(CombatAction.Block)
  })

  it('should attack aggressively when opponent low health', () => {
    const cpu = createCombatant(100, 100)
    const lowHealthOpponent = { ...opponent, health: 20 }

    let attackActions = 0
    for (let i = 0; i < 100; i++) {
      const action = CpuAI.decide(cpu, lowHealthOpponent)
      if (action === CombatAction.LightAttack || action === CombatAction.HeavyAttack) {
        attackActions++
      }
    }

    expect(attackActions).toBeGreaterThan(50)
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

## Task 3: Match Management Service

**Owner:** Dev 3
**Time:** 2 hours

**Files:**
- Create: `apps/game-server/src/services/match-manager.ts`
- Create: `apps/game-server/src/services/match-instance.ts`

### Step 1: Create match instance class

**File:** `apps/game-server/src/services/match-instance.ts`

```typescript
import { CombatEngine } from '@gladiator/shared/src/combat/engine'
import { CombatAction, CombatantState } from '@gladiator/shared/src/combat/types'
import { CpuAI } from '../ai/cpu-ai'

export interface MatchConfig {
  matchId: string
  player1: {
    gladiatorId: string
    userId: string
    name: string
    stats: {
      strength: number
      agility: number
      endurance: number
      technique: number
    }
  }
  isCpuMatch: boolean
  cpuDifficulty?: 'normal' | 'aggressive' | 'defensive'
}

export class MatchInstance {
  private engine: CombatEngine
  private config: MatchConfig
  private tickInterval: NodeJS.Timeout | null = null
  private pendingActions: Map<string, CombatAction> = new Map()

  constructor(config: MatchConfig) {
    this.config = config

    const combatant1: Omit<CombatantState, 'isBlocking' | 'isDodging'> = {
      id: config.player1.gladiatorId,
      name: config.player1.name,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      ...config.player1.stats,
    }

    // Create CPU opponent with similar stats
    const combatant2: Omit<CombatantState, 'isBlocking' | 'isDodging'> = {
      id: 'cpu',
      name: 'CPU Opponent',
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      strength: 55,
      agility: 55,
      endurance: 55,
      technique: 55,
    }

    this.engine = new CombatEngine(combatant1, combatant2)
  }

  start(onTick: (state: any) => void, onComplete: (winnerId: string) => void) {
    console.log(`Starting match: ${this.config.matchId}`)

    this.tickInterval = setInterval(() => {
      this.processTick()

      const state = this.engine.getState()
      onTick(state)

      if (state.isComplete) {
        this.stop()
        onComplete(state.winnerId!)
      }
    }, 1000) // 1000ms = 1 second tick rate
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
      console.log(`Stopped match: ${this.config.matchId}`)
    }
  }

  submitAction(gladiatorId: string, action: CombatAction) {
    this.pendingActions.set(gladiatorId, action)
  }

  private processTick() {
    const actions = []

    // Get player action
    const playerAction = this.pendingActions.get(this.config.player1.gladiatorId)
    if (playerAction) {
      actions.push({
        combatantId: this.config.player1.gladiatorId,
        action: playerAction,
      })
    }

    // Get CPU action
    if (this.config.isCpuMatch) {
      const state = this.engine.getState()
      const cpuAction = this.getCpuAction(state.combatant2, state.combatant1)
      actions.push({
        combatantId: 'cpu',
        action: cpuAction,
      })
    }

    // Process tick
    this.engine.processTick(actions)

    // Clear pending actions
    this.pendingActions.clear()
  }

  private getCpuAction(cpu: CombatantState, player: CombatantState): CombatAction {
    switch (this.config.cpuDifficulty) {
      case 'aggressive':
        return CpuAI.decideAggressive(cpu, player)
      case 'defensive':
        return CpuAI.decideDefensive(cpu, player)
      default:
        return CpuAI.decide(cpu, player)
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

    // Create match instance
    const config: MatchConfig = {
      matchId: match.id,
      player1: {
        gladiatorId: gladiator.id,
        userId,
        name: `${gladiator.class} #${gladiator.tokenId}`,
        stats: {
          strength: gladiator.strength,
          agility: gladiator.agility,
          endurance: gladiator.endurance,
          technique: gladiator.technique,
        },
      },
      isCpuMatch: true,
      cpuDifficulty: 'normal',
    }

    const instance = new MatchInstance(config)

    instance.start(
      (state) => {
        // Broadcast state to match room
        this.io.to(match.id).emit('match:tick', state)
      },
      async (winnerId) => {
        // Match complete
        await this.completeMatch(match.id, winnerId)
      }
    )

    this.matches.set(match.id, instance)

    return match.id
  }

  submitAction(matchId: string, gladiatorId: string, action: any) {
    const match = this.matches.get(matchId)
    if (match) {
      match.submitAction(gladiatorId, action)
    }
  }

  private async completeMatch(matchId: string, winnerId: string) {
    const instance = this.matches.get(matchId)
    if (!instance) return

    const finalState = instance.getState()

    // Update match in database
    await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        matchLog: finalState.log as any,
        durationSeconds: finalState.tick,
      },
    })

    // Award XP
    await this.awardXP(matchId, winnerId)

    // Broadcast completion
    this.io.to(matchId).emit('match:complete', { winnerId, finalState })

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

## Task 4: WebSocket Match Events

**Owner:** Dev 3
**Time:** 1.5 hours

**Files:**
- Update: `apps/game-server/src/sockets/index.ts`
- Create: `apps/game-server/src/sockets/match-handlers.ts`

### Step 1: Create match event handlers

**File:** `apps/game-server/src/sockets/match-handlers.ts`

```typescript
import { Socket } from 'socket.io'
import { MatchManager } from '../services/match-manager'

export function setupMatchHandlers(socket: Socket, matchManager: MatchManager) {
  socket.on('match:create-cpu', async ({ userId, gladiatorId }, callback) => {
    try {
      const matchId = await matchManager.createCpuMatch(userId, gladiatorId)

      // Join match room
      socket.join(matchId)

      callback({ success: true, matchId })
    } catch (error: any) {
      console.error('Create CPU match error:', error)
      callback({ success: false, error: error.message })
    }
  })

  socket.on('match:submit-action', ({ matchId, gladiatorId, action }) => {
    matchManager.submitAction(matchId, gladiatorId, action)
  })

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

- [ ] Combat engine processes ticks correctly
- [ ] Damage calculation working (light/heavy attacks)
- [ ] Blocking reduces damage by 70%
- [ ] Dodging works based on agility stat
- [ ] Stamina regenerates each tick
- [ ] Combat ends when health reaches 0
- [ ] Unit tests pass for combat engine
- [ ] CPU AI makes reasonable decisions
- [ ] Match instances start and tick every 1000ms
- [ ] WebSocket events emit combat state
- [ ] Match results saved to database
- [ ] XP awarded after match completion

---

## Next Sprint

**Sprint 3: Frontend - Combat UI & Animations**

See: `docs/plans/04-sprint-3-frontend-animations.md`
