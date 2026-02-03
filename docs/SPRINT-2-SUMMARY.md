# Sprint 2 Summary: Combat System - CPU Battles

**Status:** 📋 Planned
**Duration:** Week 3
**Goal:** Players can fight CPU opponents with animated combat

---

## Overview

Sprint 2 will implement the core combat system, enabling players to battle against CPU opponents. This sprint focuses on server-authoritative combat logic, tick-based action processing, CPU AI decision-making, and match state persistence. The combat system will serve as the foundation for future PvP battles.

---

## Planned Deliverables

### 1. Combat Engine
**Status:** 📋 Planned

**Features:**
- Tick-based combat (1000ms intervals)
- Server-authoritative state management
- Health and stamina systems
- Damage calculation with stat modifiers
- Action validation (stamina costs, cooldowns)
- Win condition detection

**Proposed Architecture:**
```typescript
class CombatEngine {
  processTick(matchState, actions): MatchState
  calculateDamage(attacker, defender, actionType): number
  applyStaminaCost(gladiator, actionType): void
  checkWinCondition(matchState): boolean
}
```

**Combat Stats:**
- Health: 100 (base)
- Stamina: 100 (base, regenerates 10/tick)
- Strength: Affects attack damage
- Agility: Affects dodge chance
- Endurance: Affects stamina pool and regeneration
- Technique: Affects critical hit chance

---

### 2. Action System
**Status:** 📋 Planned

**Actions:**
- **Light Attack** - Low damage, low stamina (15)
- **Heavy Attack** - High damage, high stamina (30)
- **Block** - Reduce incoming damage by 50%, medium stamina (20)
- **Dodge** - Chance to avoid damage based on agility, low stamina (10)

**Action Processing:**
1. Client submits action via WebSocket
2. Server queues action for next tick
3. On tick: validate stamina, apply effects
4. Broadcast updated state to client

**Stamina Management:**
- Actions consume stamina
- Insufficient stamina = action fails, minimal damage dealt
- Stamina regenerates 10 points per tick
- Blocking/dodging reduce stamina regen by 50%

---

### 3. CPU AI System
**Status:** 📋 Planned

**AI Difficulty Levels:**
- **Easy** - Random actions, poor timing
- **Normal** - Basic decision tree
- **Hard** - Advanced tactics, stat-aware decisions

**Decision Tree (Normal AI):**
```
If health < 30%:
  → 60% Block, 30% Dodge, 10% Light Attack
Else if stamina < 20:
  → 100% Block (regen stamina)
Else if opponent.stamina < 20:
  → 70% Heavy Attack, 30% Light Attack
Else:
  → 40% Light Attack, 30% Heavy Attack, 20% Block, 10% Dodge
```

**AI Service:**
```typescript
class CpuAI {
  decideAction(gladiator, opponent, difficulty): Action
  calculateThreatLevel(opponent): number
  shouldPlayDefensive(state): boolean
}
```

---

### 4. Match Manager
**Status:** 📋 Planned

**Responsibilities:**
- Create and destroy match instances
- Manage active matches in memory
- Coordinate tick loops
- Broadcast state updates via WebSocket
- Persist completed matches to database

**Match Lifecycle:**
```
1. CREATE: Player requests CPU match
2. INIT: Load gladiator stats, initialize state
3. START: Begin tick loop
4. TICK: Process actions every 1000ms
5. UPDATE: Broadcast state to client
6. END: Detect win condition
7. SAVE: Persist to database
8. CLEANUP: Remove from memory
```

**Match State:**
```typescript
interface MatchState {
  id: string
  player1: GladiatorState
  player2: GladiatorState
  currentTick: number
  actions: ActionQueue
  winner: string | null
  log: ActionLog[]
}
```

---

### 5. Match Persistence
**Status:** 📋 Planned

**Database Schema:**
```prisma
model Match {
  id                  String   @id @default(uuid())
  player1GladiatorId  String
  player2GladiatorId  String?
  isCpuMatch          Boolean  @default(false)
  winnerId            String?
  matchLog            Json     // Array of actions
  durationSeconds     Int
  createdAt           DateTime @default(now())
}
```

**Match Log Format:**
```json
[
  {
    "tick": 1,
    "player1Action": "LIGHT_ATTACK",
    "player2Action": "BLOCK",
    "player1Damage": 0,
    "player2Damage": 15,
    "player1Health": 100,
    "player2Health": 85,
    "player1Stamina": 85,
    "player2Stamina": 80
  },
  ...
]
```

**Post-Match Processing:**
- Save match to database
- Award XP to participants
- Update gladiator stats
- Generate loot (future sprint)

---

### 6. WebSocket Protocol
**Status:** 📋 Planned

**Client → Server Messages:**
```typescript
// Request CPU match
{
  type: 'REQUEST_CPU_MATCH',
  gladiatorId: string,
  difficulty: 'easy' | 'normal' | 'hard'
}

// Submit action
{
  type: 'SUBMIT_ACTION',
  matchId: string,
  action: 'LIGHT_ATTACK' | 'HEAVY_ATTACK' | 'BLOCK' | 'DODGE'
}
```

**Server → Client Messages:**
```typescript
// Match start
{
  type: 'MATCH_START',
  matchId: string,
  player1: GladiatorSnapshot,
  player2: GladiatorSnapshot
}

// Tick update
{
  type: 'TICK_UPDATE',
  tick: number,
  player1: GladiatorState,
  player2: GladiatorState,
  actions: { player1: Action, player2: Action },
  results: DamageResults
}

// Match end
{
  type: 'MATCH_END',
  winner: 'player1' | 'player2',
  finalState: MatchState,
  xpAwarded: number
}
```

---

## Technical Architecture

### Combat Flow
```
Client → Request Match → Game Server
     ↓
Game Server → Create Match Instance → Memory
     ↓
Match Instance → Start Tick Loop (1000ms)
     ↓
Each Tick:
  1. Get queued actions (Player + CPU)
  2. Validate actions (stamina check)
  3. Calculate damage
  4. Update health/stamina
  5. Broadcast state to client
  6. Check win condition
     ↓
On Win:
  → Save match to database
  → Award XP
  → Cleanup match instance
```

---

## Proposed File Structure

**Game Server:**
```
apps/game-server/src/
├── services/
│   ├── combat-engine.ts        # Core combat logic
│   ├── cpu-ai.ts               # AI decision making
│   ├── match-manager.ts        # Match lifecycle
│   └── progression.ts          # XP and leveling
├── models/
│   ├── MatchState.ts
│   ├── GladiatorState.ts
│   └── Action.ts
└── sockets/
    └── match-handlers.ts       # WebSocket event handlers
```

---

## Combat Balance

**Damage Formulas (Draft):**
```
Light Attack Damage = (Strength * 0.5) + 10
Heavy Attack Damage = (Strength * 1.0) + 20
Critical Hit = Base Damage * (1 + Technique / 100)
Block Reduction = Incoming Damage * 0.5
Dodge Success = Random(0-100) < Agility
```

**Stamina Costs:**
- Light Attack: 15
- Heavy Attack: 30
- Block: 20
- Dodge: 10
- Regen per tick: 10 (base) + (Endurance / 10)

**Tuning Notes:**
- Values subject to change based on playtesting
- Goal: Matches last 10-20 ticks (10-20 seconds)
- Prevent one-strategy dominance (e.g., always block)

---

## Testing Requirements

**Unit Tests:**
- Combat engine damage calculations
- Stamina cost validation
- Win condition detection
- CPU AI decision tree

**Integration Tests:**
- Match creation and lifecycle
- WebSocket message flow
- Database persistence
- XP award calculation

**Manual Testing:**
- Play 10+ matches against each AI difficulty
- Verify combat feels balanced
- Check animations sync with server state
- Ensure no desync issues

---

## Dependencies Required

**Game Server:**
- None (uses existing Socket.io and Prisma)

**Frontend:**
- Will be added in Sprint 3 (combat UI)

---

## Success Criteria

Sprint 2 succeeds if:
1. ✅ Player can request a CPU match
2. ✅ Server creates match instance
3. ✅ CPU AI makes decisions
4. ✅ Combat processes tick-by-tick
5. ✅ Health/stamina update correctly
6. ✅ Winner determined when health reaches 0
7. ✅ Match saved to database
8. ✅ XP awarded to gladiator
9. ✅ No crashes or memory leaks after 100+ matches

---

## Performance Targets

- Match creation: < 100ms
- Tick processing: < 50ms
- WebSocket latency: < 100ms
- Database save: < 200ms
- Memory per match: < 1MB
- Concurrent matches: 100+

---

## Risks & Mitigation

**Risk:** Combat balance issues (one strategy dominates)
- **Mitigation:** Extensive playtesting, tunable constants

**Risk:** Server lag with many concurrent matches
- **Mitigation:** Profile tick loop, optimize calculations

**Risk:** State desync between client/server
- **Mitigation:** Server is source of truth, client interpolates only

**Risk:** CPU AI too predictable or too random
- **Mitigation:** Multiple difficulty levels, tunable weights

---

## Next Sprint

**Sprint 3: Frontend - Combat UI & Animations**

Focus:
- Canvas-based arena renderer
- Gladiator sprite rendering
- Attack/defend/dodge animations
- Health/stamina bars
- Action button UI
- Combat log

See: [Sprint 3 Plan](plans/04-sprint-3-frontend-animations.md)

---

## Notes

This summary represents the planned scope for Sprint 2. Implementation details may change based on technical constraints and feedback from Sprint 1.

Key priorities:
1. Server-authoritative combat (security)
2. Smooth tick-based gameplay (UX)
3. Balanced combat mechanics (fun)
4. Clean WebSocket protocol (scalability)

---

**Sprint 2 Status: 📋 PLANNED**

Ready to begin implementation after Sprint 1 is tested and deployed.
