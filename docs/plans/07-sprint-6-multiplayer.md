# Sprint 6: Multiplayer PvP + Production Scaling Infrastructure

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Players can fight other players in real-time PvP; production-ready scaling infrastructure

**Duration:** Week 7-8
**Prerequisites:** Sprint 5 complete (progression & loot working, matches persisted)

**Architecture Changes (from Architecture Audit):**
- Horizontal scaling with Redis pub/sub
- Sticky sessions via socket.io-redis adapter
- 60Hz internal simulation, 20Hz broadcast (improved hit detection)
- Client interpolation improvements
- Input validation and rate limiting
- Disconnect handling with state snapshots
- Match logging for disputes

**Architecture:** Matchmaking queue, friend system with challenges, dual-client WebSocket synchronization, Redis-backed scaling, disconnect handling

**Key Differences from CPU Matches:**
- Two human players sending inputs simultaneously
- Server processes both players' inputs each tick
- Both clients receive same state snapshots
- Latency compensation and input prediction
- No CPU AI

**Tech Stack:**
- Socket.io (real-time PvP)
- Redis (optional, for queue management)
- Prisma (friend relationships, challenges)

**Game data (match start):** When creating a match, load each gladiator's **effective build** once (Gladiator base stats + `EquipmentTemplate.baseStatMods` + `Equipment.rolledMods` + perks). That aggregate is immutable for the match; runtime must not query templates or instances mid-match. See **docs/data-glossary.md** §9 (Derived Combat Stats).

**References:** **docs/architecture-audit.md** (scaling recommendations)

---

## Task 0: Redis Setup & Sticky Sessions (3 hours)

**Goal:** Enable horizontal scaling with Redis pub/sub and sticky sessions

### Install Redis Adapter

```bash
cd apps/game-server
pnpm add socket.io-redis ioredis
```

### Configure Socket.io with Redis

**File:** `apps/game-server/src/index.ts` (update)

```typescript
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

// Create Redis clients
const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
const subClient = pubClient.duplicate()

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  console.log('Redis clients connected')

  // Configure Socket.io with Redis adapter
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL },
    adapter: createAdapter(pubClient, subClient),
  })

  global.io = io

  // ... rest of setup
})
```

### Environment Variables

Add to `.env`:
```
REDIS_URL=redis://localhost:6379  # Local dev
# Production: use Redis Cloud or similar
```

### Sticky Sessions (Deployment - Sprint 7)

**Note:** Sticky sessions configured at load balancer level (NGINX, ALB, etc.)
- Route client to same server based on session ID
- Required for WebSocket connections
- Configuration in Sprint 7 deployment task

### Verification

- [ ] Redis clients connect successfully
- [ ] Socket.io uses Redis adapter
- [ ] Multiple server instances can communicate via Redis pub/sub

---

## Task 0.5: Upgrade Tick Rate to 60Hz (4 hours)

**Goal:** Increase internal simulation to 60Hz for precise hit detection; throttle broadcast to 20Hz

### Update Combat Engine Tick Rate

**File:** `packages/shared/src/physics/constants.ts` (update)

```typescript
export const PHYSICS_CONSTANTS = {
  // Internal simulation rate
  TICK_RATE: 60, // Hz (was 20)
  TICK_INTERVAL: 16.67, // ms (1000/60, was 50)

  // Broadcast rate (separate from simulation)
  BROADCAST_RATE: 20, // Hz
  BROADCAST_INTERVAL: 50, // ms (1000/20)

  // ... rest of constants
}
```

### Throttle State Broadcast

**File:** `apps/game-server/src/sockets/match-handlers.ts` (update)

```typescript
function startStateBroadcast(matchId: string) {
  let ticksSinceLastBroadcast = 0
  const TICKS_PER_BROADCAST = 3 // 60Hz / 20Hz = broadcast every 3 ticks

  const tickInterval = setInterval(() => {
    const match = matchManager.getMatch(matchId)
    if (!match) {
      clearInterval(tickInterval)
      return
    }

    ticksSinceLastBroadcast++

    // Broadcast every 3 ticks (60Hz → 20Hz)
    if (ticksSinceLastBroadcast >= TICKS_PER_BROADCAST) {
      const state = match.getState()
      const status = match.getStatus()

      // Broadcast state to all clients
      global.io?.to(matchId).emit('match:state', {
        matchId,
        tickNumber: state.tickNumber,
        elapsedTime: state.elapsedTime,
        combatant1: { /* ... */ },
        combatant2: { /* ... */ },
        projectiles: Array.from(state.projectiles.values()),
        winner: state.winner,
      })

      ticksSinceLastBroadcast = 0
    }

    // Stop if match complete
    if (status === 'Completed') {
      clearInterval(tickInterval)
      // ... emit match:completed
    }
  }, PHYSICS_CONSTANTS.TICK_INTERVAL) // 16.67ms (60Hz)
}
```

### Update Match Instance

**File:** `apps/game-server/src/services/match-instance.ts` (update)

```typescript
public start(): void {
  if (this.status !== MatchStatus.Waiting) {
    throw new Error('Match already started')
  }

  this.status = MatchStatus.InProgress
  this.matchStartTime = Date.now()

  // Start tick loop at 60Hz (16.67ms interval)
  this.tickInterval = setInterval(() => {
    this.processTick()
  }, COMBAT_CONSTANTS.TICK_INTERVAL) // 16.67ms

  console.log(`Match ${this.config.matchId} started at 60Hz`)
}
```

### Client Interpolation Improvements

**File:** `apps/web/components/arena/ArenaCanvas.tsx` (update)

```typescript
// Update interpolation window for 20Hz broadcasts
const interpolationWindow = 50 // ms (20Hz server broadcast)
const alpha = Math.min(1, timeSinceUpdate / interpolationWindow)

// Interpolate projectiles too
if (combatState.projectiles) {
  for (const projectile of combatState.projectiles.values()) {
    // Interpolate projectile position
    const interpolatedPos = prevProjectile
      ? interpolatePosition(prevProjectile.pos, projectile.pos, alpha)
      : projectile.pos

    renderer.drawProjectile({ ...projectile, pos: interpolatedPos })
  }
}
```

### Verification

- [ ] Server runs combat at 60Hz
- [ ] Clients receive state at 20Hz
- [ ] Hit detection more precise (test melee and projectiles)
- [ ] No performance degradation
- [ ] CPU usage acceptable (~2x increase expected)

---

## Task 0.75: Input Validation & Rate Limiting (2 hours)

**Goal:** Prevent client-side cheating and input flooding

### Input Validator

**File:** `apps/game-server/src/services/input-validator.ts`

```typescript
import { Action, ActionType, Combatant } from '../combat/types'
import { Weapons } from '@gladiator/shared/src/combat'

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
    // Check stamina
    const weapon = Weapons.getWeapon(combatant.weapon)
    if (combatant.currentStamina < weapon.staminaCost) {
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
    if (combatant.currentStamina < 20) {
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
    const magnitude = Math.sqrt(action.direction.x ** 2 + action.direction.y ** 2)
    if (magnitude > 1.1) { // Allow small floating point error
      return { valid: false, reason: 'Invalid move direction' }
    }

    return { valid: true }
  }
}
```

### Rate Limiter

**File:** `apps/game-server/src/services/rate-limiter.ts`

```typescript
export class RateLimiter {
  private inputCounts: Map<string, { count: number; resetTime: number }> = new Map()
  private readonly MAX_INPUTS_PER_SECOND = 120 // Allow up to 120 inputs/sec (2x tick rate)
  private readonly WINDOW_MS = 1000

  checkLimit(clientId: string): boolean {
    const now = Date.now()
    const record = this.inputCounts.get(clientId)

    if (!record || now > record.resetTime) {
      // Start new window
      this.inputCounts.set(clientId, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      })
      return true
    }

    if (record.count >= this.MAX_INPUTS_PER_SECOND) {
      console.warn(`Rate limit exceeded for client ${clientId}`)
      return false
    }

    record.count++
    return true
  }

  cleanup() {
    const now = Date.now()
    for (const [clientId, record] of this.inputCounts.entries()) {
      if (now > record.resetTime + 5000) {
        this.inputCounts.delete(clientId)
      }
    }
  }
}
```

### Apply Validation

**File:** `apps/game-server/src/sockets/match-handlers.ts` (update)

```typescript
import { InputValidator } from '../services/input-validator'
import { RateLimiter } from '../services/rate-limiter'

const rateLimiter = new RateLimiter()

// Cleanup rate limiter every minute
setInterval(() => rateLimiter.cleanup(), 60000)

socket.on('match:action', (payload: SubmitActionPayload) => {
  try {
    // 1. Rate limiting
    if (!rateLimiter.checkLimit(socket.id)) {
      socket.emit('match:error', { message: 'Rate limit exceeded' })
      return
    }

    const match = matchManager.getMatch(payload.matchId)
    if (!match) {
      socket.emit('match:error', { message: 'Match not found' })
      return
    }

    // 2. Input validation
    const state = match.getState()
    const combatant = state.combatant1.id === payload.gladiatorId
      ? state.combatant1
      : state.combatant2

    const validation = InputValidator.validateAction(
      payload.action,
      combatant,
      state.elapsedTime
    )

    if (!validation.valid) {
      console.warn(`Invalid action from ${payload.gladiatorId}: ${validation.reason}`)
      // Still submit (server will reject), but log for anti-cheat
      return
    }

    // 3. Submit action
    match.submitAction(payload.gladiatorId, payload.action)
  } catch (error) {
    console.error('Error submitting action:', error)
    socket.emit('match:error', {
      message: error instanceof Error ? error.message : 'Failed to submit action',
    })
  }
})
```

### Verification

- [ ] Invalid actions rejected (insufficient stamina, cooldown)
- [ ] Rate limiting prevents input flooding
- [ ] Cheating attempts logged
- [ ] Legitimate inputs not affected

---

## Task 0.9: Disconnect Handling (3 hours)

**Goal:** Handle player disconnects with 30s reconnection window

### State Snapshot Service

**File:** `apps/game-server/src/services/disconnect-handler.ts`

```typescript
import { CombatState } from '../combat/types'

interface DisconnectSnapshot {
  matchId: string
  userId: string
  disconnectTime: number
  stateSnapshot: CombatState
}

export class DisconnectHandler {
  private snapshots: Map<string, DisconnectSnapshot> = new Map()
  private readonly RECONNECT_WINDOW_MS = 30000 // 30 seconds

  /**
   * Save snapshot when player disconnects
   */
  onDisconnect(matchId: string, userId: string, state: CombatState): void {
    const key = `${matchId}:${userId}`

    this.snapshots.set(key, {
      matchId,
      userId,
      disconnectTime: Date.now(),
      stateSnapshot: state,
    })

    console.log(`Saved disconnect snapshot for ${userId} in match ${matchId}`)

    // Auto-cleanup after reconnect window
    setTimeout(() => {
      if (this.snapshots.has(key)) {
        console.log(`Reconnect window expired for ${userId}`)
        this.snapshots.delete(key)
        // TODO: Notify match to forfeit player
      }
    }, this.RECONNECT_WINDOW_MS)
  }

  /**
   * Check if player can reconnect
   */
  canReconnect(matchId: string, userId: string): boolean {
    const key = `${matchId}:${userId}`
    const snapshot = this.snapshots.get(key)

    if (!snapshot) return false

    const elapsed = Date.now() - snapshot.disconnectTime
    return elapsed < this.RECONNECT_WINDOW_MS
  }

  /**
   * Get snapshot for reconnection
   */
  getSnapshot(matchId: string, userId: string): CombatState | null {
    const key = `${matchId}:${userId}`
    const snapshot = this.snapshots.get(key)

    if (!snapshot) return null

    // Remove snapshot after retrieval
    this.snapshots.delete(key)
    return snapshot.stateSnapshot
  }

  /**
   * Clean up expired snapshots
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, snapshot] of this.snapshots.entries()) {
      if (now - snapshot.disconnectTime > this.RECONNECT_WINDOW_MS) {
        this.snapshots.delete(key)
      }
    }
  }
}
```

### Handle Disconnect in Match Handlers

**File:** `apps/game-server/src/sockets/match-handlers.ts` (update)

```typescript
import { DisconnectHandler } from '../services/disconnect-handler'

const disconnectHandler = new DisconnectHandler()

// Cleanup every 60 seconds
setInterval(() => disconnectHandler.cleanup(), 60000)

export function setupMatchHandlers(socket: Socket) {
  // ... existing handlers ...

  /**
   * Handle player disconnect
   */
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)

    // Find active matches for this socket
    // (Requires tracking socket → user → matches)
    const userId = socket.data.userId
    const activeMatches = matchManager.getActiveMatchesForUser(userId)

    for (const match of activeMatches) {
      const state = match.getState()

      // Save snapshot
      disconnectHandler.onDisconnect(match.getMatchId(), userId, state)

      // Notify opponent
      global.io?.to(match.getMatchId()).emit('match:player-disconnected', {
        userId,
        reconnectWindowSeconds: 30,
      })

      // Pause match (optional - or continue with CPU AI)
      // match.pause()
    }
  })

  /**
   * Handle reconnection
   */
  socket.on('match:reconnect', (payload: { matchId: string; userId: string }) => {
    if (disconnectHandler.canReconnect(payload.matchId, payload.userId)) {
      const snapshot = disconnectHandler.getSnapshot(payload.matchId, payload.userId)

      if (snapshot) {
        socket.join(payload.matchId)
        socket.emit('match:reconnected', {
          matchId: payload.matchId,
          state: snapshot,
        })

        // Notify opponent
        socket.to(payload.matchId).emit('match:player-reconnected', {
          userId: payload.userId,
        })

        console.log(`Player ${payload.userId} reconnected to match ${payload.matchId}`)
      }
    } else {
      socket.emit('match:error', {
        message: 'Reconnect window expired or match not found',
      })
    }
  })
}
```

### Frontend Reconnection

**File:** `apps/web/hooks/useRealTimeMatch.ts` (update)

```typescript
useEffect(() => {
  if (!socket || !matchId) return

  // ... existing handlers ...

  socket.on('match:player-disconnected', ({ userId, reconnectWindowSeconds }) => {
    // Show reconnection timer
    setReconnectTimer(reconnectWindowSeconds)
  })

  socket.on('match:player-reconnected', ({ userId }) => {
    // Clear reconnection timer
    setReconnectTimer(null)
  })

  // Auto-reconnect on page reload
  if (document.visibilityState === 'visible') {
    socket.emit('match:reconnect', { matchId, userId: gladiatorId })
  }

  return () => {
    socket.off('match:player-disconnected')
    socket.off('match:player-reconnected')
  }
}, [socket, matchId])
```

### Verification

- [ ] Disconnect saves state snapshot
- [ ] Reconnection within 30s works
- [ ] Opponent notified of disconnect/reconnect
- [ ] After 30s, match ends (or CPU takeover)
- [ ] Frontend shows reconnection UI

---

## System Overview

### Quick Match Flow
1. Player clicks "Quick Match"
2. Added to matchmaking queue
3. When 2 players in queue → create match
4. Both players receive match notification
5. Real-time PvP combat begins

### Friend Challenge Flow
1. Player adds friend by username/wallet
2. Friend accepts friend request
3. Player challenges friend to match
4. Friend accepts challenge
5. Match created with both players

---

## Task 1: Friend System (2 hours)

**Note:** Tasks 0-0.9 above implement scaling infrastructure. Tasks 1-6 below implement PvP features.

### Database Schema
Already exists in Sprint 0 (Friend model)

### Add Friend API

**File:** `apps/web/app/api/friends/add/route.ts`

```typescript
import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { friendUsername } = await req.json()

  const friend = await prisma.user.findUnique({
    where: { username: friendUsername },
  })

  if (!friend) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  if (friend.id === session.user.id) {
    return Response.json({ error: 'Cannot add yourself' }, { status: 400 })
  }

  // Check if already friends
  const existing = await prisma.friend.findUnique({
    where: {
      userId_friendId: {
        userId: session.user.id,
        friendId: friend.id,
      },
    },
  })

  if (existing) {
    return Response.json({ error: 'Already friends' }, { status: 400 })
  }

  // Create friend request
  await prisma.friend.create({
    data: {
      userId: session.user.id,
      friendId: friend.id,
      status: 'pending',
    },
  })

  return Response.json({ success: true })
}
```

### Accept Friend Request

**File:** `apps/web/app/api/friends/accept/route.ts`

```typescript
export async function POST(req: Request) {
  const session = await getServerSession()
  const { friendId } = await req.json()

  await prisma.friend.update({
    where: {
      userId_friendId: {
        userId: friendId,
        friendId: session.user.id,
      },
    },
    data: { status: 'accepted' },
  })

  // Create reciprocal friendship
  await prisma.friend.create({
    data: {
      userId: session.user.id,
      friendId: friendId,
      status: 'accepted',
    },
  })

  return Response.json({ success: true })
}
```

---

## Task 2: Challenge System (2 hours)

### Create Challenge API

**File:** `apps/web/app/api/challenges/create/route.ts`

```typescript
export async function POST(req: Request) {
  const session = await getServerSession()
  const { opponentId, gladiatorId, opponentGladiatorId } = await req.json()

  // Verify friendship
  const friendship = await prisma.friend.findFirst({
    where: {
      userId: session.user.id,
      friendId: opponentId,
      status: 'accepted',
    },
  })

  if (!friendship) {
    return Response.json({ error: 'Not friends' }, { status: 400 })
  }

  // Create challenge
  const challenge = await prisma.challenge.create({
    data: {
      challengerId: session.user.id,
      opponentId,
      gladiator1Id: gladiatorId,
      gladiator2Id: opponentGladiatorId,
      status: 'pending',
    },
  })

  return Response.json({ success: true, challengeId: challenge.id })
}
```

### Accept Challenge

**File:** `apps/web/app/api/challenges/accept/route.ts`

```typescript
export async function POST(req: Request) {
  const session = await getServerSession()
  const { challengeId } = await req.json()

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  })

  if (!challenge || challenge.opponentId !== session.user.id) {
    return Response.json({ error: 'Invalid challenge' }, { status: 400 })
  }

  // Create PvP match
  const match = await prisma.match.create({
    data: {
      player1Id: challenge.challengerId,
      player1GladiatorId: challenge.gladiator1Id,
      player2Id: challenge.opponentId,
      player2GladiatorId: challenge.gladiator2Id,
      isCpuMatch: false,
      matchLog: [],
      durationSeconds: 0,
    },
  })

  // Update challenge
  await prisma.challenge.update({
    where: { id: challengeId },
    data: {
      status: 'accepted',
      matchId: match.id,
    },
  })

  return Response.json({ success: true, matchId: match.id })
}
```

---

## Task 3: Matchmaking Queue (2.5 hours)

**File:** `apps/game-server/src/services/matchmaking-service.ts`

```typescript
import { Server } from 'socket.io'
import { prisma } from '@gladiator/database/src/client'

interface QueueEntry {
  userId: string
  gladiatorId: string
  socketId: string
}

export class MatchmakingService {
  private queue: QueueEntry[] = []
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  addToQueue(userId: string, gladiatorId: string, socketId: string) {
    // Remove if already in queue
    this.queue = this.queue.filter(e => e.userId !== userId)

    this.queue.push({ userId, gladiatorId, socketId })
    console.log(`Player ${userId} added to queue (${this.queue.length} in queue)`)

    this.attemptMatch()
  }

  removeFromQueue(userId: string) {
    this.queue = this.queue.filter(e => e.userId !== userId)
    console.log(`Player ${userId} removed from queue`)
  }

  private async attemptMatch() {
    if (this.queue.length < 2) return

    // Simple FIFO matching
    const player1 = this.queue.shift()!
    const player2 = this.queue.shift()!

    console.log(`Matching ${player1.userId} vs ${player2.userId}`)

    try {
      const match = await this.createPvPMatch(player1, player2)

      // Notify both players
      this.io.to(player1.socketId).emit('match:found', { matchId: match.id })
      this.io.to(player2.socketId).emit('match:found', { matchId: match.id })
    } catch (error) {
      console.error('Match creation failed:', error)
      // Re-add to queue
      this.queue.push(player1, player2)
    }
  }

  private async createPvPMatch(player1: QueueEntry, player2: QueueEntry) {
    const match = await prisma.match.create({
      data: {
        player1Id: player1.userId,
        player1GladiatorId: player1.gladiatorId,
        player2Id: player2.userId,
        player2GladiatorId: player2.gladiatorId,
        isCpuMatch: false,
        matchLog: [],
        durationSeconds: 0,
      },
    })

    return match
  }
}
```

---

## Task 4: PvP Match Instance (2 hours)

Update `MatchInstance` to support two human players:

**File:** `apps/game-server/src/services/match-instance.ts` (update)

```typescript
// Modify MatchInstance to handle PvP
export class MatchInstance {
  // ... existing code ...

  constructor(config: MatchConfig) {
    this.config = config

    const combatant1 = this.createCombatant(config.player1)

    const combatant2 = config.isCpuMatch
      ? this.createCpuCombatant()
      : this.createCombatant(config.player2!)

    this.engine = new CombatEngine(combatant1, combatant2)
  }

  private processTick() {
    const actions = []

    // Player 1 action
    const p1Action = this.pendingActions.get(this.config.player1.gladiatorId)
    if (p1Action) {
      actions.push({
        combatantId: this.config.player1.gladiatorId,
        action: p1Action,
      })
    }

    // Player 2 action (CPU or human)
    if (this.config.isCpuMatch) {
      const state = this.engine.getState()
      const cpuAction = this.getCpuAction(state.combatant2, state.combatant1)
      actions.push({
        combatantId: 'cpu',
        action: cpuAction,
      })
    } else {
      const p2Action = this.pendingActions.get(this.config.player2!.gladiatorId)
      if (p2Action) {
        actions.push({
          combatantId: this.config.player2!.gladiatorId,
          action: p2Action,
        })
      }
    }

    this.engine.processTick(actions)
    this.pendingActions.clear()
  }
}
```

---

## Task 5: Quick Match UI (1.5 hours)

**File:** `apps/web/app/quick-match/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useRouter } from 'next/navigation'

export default function QuickMatchPage() {
  const [isSearching, setIsSearching] = useState(false)
  const [selectedGladiator, setSelectedGladiator] = useState<string | null>(null)
  const socket = useSocket()
  const router = useRouter()

  const startSearch = () => {
    if (!selectedGladiator) return

    setIsSearching(true)

    socket?.emit('matchmaking:join', {
      userId: session.user.id,
      gladiatorId: selectedGladiator,
    })

    socket?.on('match:found', ({ matchId }) => {
      router.push(`/match/${matchId}`)
    })
  }

  const cancelSearch = () => {
    socket?.emit('matchmaking:leave')
    setIsSearching(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Quick Match</h1>

      {!isSearching ? (
        <>
          <GladiatorSelector onSelect={setSelectedGladiator} />
          <button
            onClick={startSearch}
            disabled={!selectedGladiator}
            className="w-full py-3 bg-blue-600 text-white rounded"
          >
            Find Match
          </button>
        </>
      ) : (
        <div className="text-center">
          <div className="text-xl mb-4">Searching for opponent...</div>
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <button
            onClick={cancelSearch}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## Task 6: Friends & Challenges UI (2 hours)

**File:** `apps/web/app/friends/page.tsx`

- Friends list with online status
- "Add Friend" button
- Pending friend requests
- "Challenge" button next to each friend
- Active challenges list

---

## Verification Checklist

- [ ] Players can add friends by username
- [ ] Friend requests can be accepted/declined
- [ ] Friends list displays correctly
- [ ] Players can challenge friends
- [ ] Challenge notifications sent
- [ ] Accepting challenge creates PvP match
- [ ] Quick Match adds player to queue
- [ ] Two players matched automatically
- [ ] PvP combat synchronizes correctly
- [ ] Both players can submit actions
- [ ] Match completes and awards XP to both

---

## Next Sprint

**Sprint 6: Polish, Testing & Deployment**

See: `docs/plans/07-sprint-6-deployment.md`
