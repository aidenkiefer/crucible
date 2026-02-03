# Sprint 5: Multiplayer - Quick Match & Friend Challenges

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Players can fight other players in real-time PvP matches

**Duration:** Week 5-6
**Prerequisites:** Sprint 4 complete

**Architecture:** Matchmaking queue, friend system with challenges, dual-client WebSocket synchronization

**Tech Stack:**
- Socket.io (real-time PvP)
- Redis (optional, for queue management)
- Prisma (friend relationships, challenges)

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
