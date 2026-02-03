# Sprint 2 Summary: Real-Time Combat System - CPU Battles

**Status:** ✅ Complete
**Duration:** Sprint 2
**Goal:** Players can fight CPU opponents with real-time combat

---

## Overview

Sprint 2 implemented a server-authoritative real-time combat system running at 20Hz (50ms tick rate). The system features continuous WASD movement, physics-based combat, dodge rolls with i-frames, CPU AI with adaptive strategies, and WebSocket-based state synchronization. All 8 gladiator stats were added to the NFT contract and database, with 5 stats (CON, STR, DEX, SPD, DEF) actively used in combat calculations.

---

## What Was Built

### 1. NFT Contract & Database Updates (8 Stats) ✅

**Files Modified:**
- `contracts/contracts/GladiatorNFT.sol`
- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260203134839_add_8_stats_to_gladiator/migration.sql`

**Changes:**
- Expanded Gladiator stats from 4 to 8:
  - **Old:** strength, agility, endurance, technique
  - **New:** constitution, strength, dexterity, speed, defense, magicResist, arcana, faith
- Updated class stat bonuses:
  - **Duelist:** +20 to dexterity, speed, defense
  - **Brute:** +20 to constitution, strength, defense
  - **Assassin:** +20 to dexterity, speed, arcana
- Created database migration (ready to deploy)

**Note:** Only CON, STR, DEX, SPD, DEF are used in Sprint 2 combat. MRES, ARC, FTH reserved for magic system in Sprint 4+.

---

### 2. Combat Engine Core (Real-Time) ✅

**Files Created:**
- `apps/game-server/src/combat/types.ts` - Type definitions with 8-stat system
- `apps/game-server/src/combat/physics.ts` - Movement, collision, dodge physics
- `apps/game-server/src/combat/damage-calculator.ts` - Damage and stat calculations
- `apps/game-server/src/combat/engine.ts` - 20Hz combat simulation engine
- `apps/game-server/src/combat/__tests__/engine.test.ts` - Unit tests (11 test cases)
- `apps/game-server/vitest.config.ts` - Test configuration

**Core Features:**
- **20Hz server tick rate** (50ms intervals) for smooth real-time combat
- **Continuous WASD movement** with velocity-based physics
- **Attack system:**
  - Sword weapon with 90° arc, 80-unit range
  - Damage scales with STR: `base * (1 + STR/100)`
  - Stamina cost: 15, cooldown: 800ms
- **Dodge roll:**
  - 200ms deterministic i-frames (no RNG)
  - Travels 100 units in 300ms
  - Stamina cost: 20, cooldown: 1000ms
- **Stamina system:**
  - Regenerates 10/second (scales with CON)
  - Pool size: 100 + (CON * 5)
- **HP system:**
  - HP pool: 100 + (CON * 10)
  - Defense provides damage reduction up to 75% max
- **Physics:**
  - 800x600 arena with boundary clamping
  - Body collision detection with push-back resolution

**Stat Usage (Sprint 2):**
- CON → HP pool, stamina pool
- STR → Melee damage
- DEX → Ranged damage (Sprint 4+)
- SPD → Movement speed
- DEF → Damage mitigation
- MRES, ARC, FTH → Unused (Sprint 4+)

---

### 3. CPU AI for Real-Time Combat ✅

**Files Created:**
- `apps/game-server/src/ai/cpu-ai.ts` - AI decision-making system
- `apps/game-server/src/ai/__tests__/cpu-ai.test.ts` - Unit tests (8 test cases)

**Features:**
- **3 adaptive strategies:**
  1. **Aggressive (HP > 70%):** Chase and attack when in range
  2. **Defensive (HP < 30%):** Keep distance and dodge threats
  3. **Opportunistic (30-70% HP):** Balance aggression/defense, strafe around player
- **Decision interval:** 200ms (every 4 ticks) to prevent over-reactive behavior
- **Context-aware behaviors:**
  - Dodge when player attacks and close
  - Attack when in range and player vulnerable
  - Manage stamina (avoid actions when low)
  - Respect action cooldowns
- **Movement patterns:**
  - Direct chase (aggressive)
  - Retreat/kiting (defensive)
  - Circular strafing (opportunistic)
  - Perpendicular dodge rolls

---

### 4. Match Management ✅

**Files Created:**
- `apps/game-server/src/services/match-instance.ts` - Single match lifecycle management
- `apps/game-server/src/services/match-manager.ts` - Multi-match orchestration

**MatchInstance Features:**
- Runs combat engine at 20Hz
- Processes player actions via `submitAction()`
- Generates CPU AI actions automatically
- Stores state snapshots every 500ms
- Emits combat events (damage, deaths, dodges)
- Handles match completion and cleanup

**MatchManager Features:**
- Create, start, stop, remove matches
- Track all active matches
- Cleanup completed matches
- Helper functions:
  - `mapGladiatorStats()` - Maps 8 database stats to combat stats
  - `createPlayerConfig()` - Creates player config from gladiator data

---

### 5. WebSocket Real-Time Input Handlers ✅

**Files Created/Modified:**
- `apps/game-server/src/sockets/match-handlers.ts` - Match-specific socket handlers
- `apps/game-server/src/sockets/index.ts` - Updated to integrate match handlers

**WebSocket Events:**

**Client → Server:**
- `match:create` - Create new match (CPU or PvP)
- `match:start` - Start match and begin 20Hz tick loop
- `match:action` - Submit player action (move/attack/dodge)
- `match:join` - Join existing match room
- `match:leave` - Leave match room

**Server → Client:**
- `match:created` - Match created successfully
- `match:started` - Match has started
- `match:state` - Combat state snapshot at 20Hz
- `match:events` - Combat events from current tick
- `match:completed` - Match ended with winner
- `match:error` - Error occurred

**State Broadcasting:**
- Broadcasts at 20Hz to all clients in match room
- Includes: positions, HP, stamina, facing angles, actions, invulnerability status
- Events include: damage taken, actions performed, deaths, dodge activations

---

## Architecture

### 20Hz Server Tick Loop

```
1. Collect actions (player + CPU)
2. Process actions (validate stamina, cooldowns)
3. Update invulnerability (i-frames)
4. Update positions based on velocity
5. Resolve body collisions
6. Regenerate stamina
7. Clear completed actions
8. Check for winner
9. Broadcast state to clients (20Hz)
```

### Server-Client Flow

```
Client                    Game Server
  |                           |
  |-- match:action ---------->|
  |   (WASD input)            |
  |                           | Process tick (50ms)
  |                           | - Player action
  |                           | - CPU AI action
  |                           | - Physics update
  |                           | - Collision check
  |                           | - Damage calculation
  |<-- match:state -----------|
  |   (authoritative state)   |
  |<-- match:events ----------|
  |   (combat events)         |
```

---

## Testing

**Unit Tests:** 19 total test cases
- Combat engine: 11 tests
- CPU AI: 8 tests

**Test Coverage:**
- Initialization, movement, attacks, dodge mechanics
- Stamina regeneration, invulnerability
- Combat events, winner detection
- AI strategy switching, action validation
- Cooldown handling, stamina management

**Run Tests:**
```bash
cd apps/game-server
pnpm test
```

---

## Key Technical Decisions

### 1. Real-Time vs Turn-Based
**Decision:** Real-time combat at 20Hz
**Rationale:** More engaging, skill-based gameplay. 20Hz balances responsiveness with server load.

### 2. Deterministic i-Frames
**Decision:** Dodge roll has fixed 200ms invulnerability
**Rationale:** Skill-based timing instead of RNG. Players learn optimal dodge timing.

### 3. 8 Stats Now, 5 Used
**Decision:** Add all 8 stats to contract/database, use 5 in combat
**Rationale:** Avoid future migration pain. MRES/ARC/FTH ready for magic system.

### 4. AI Decision Interval
**Decision:** AI decides every 200ms (not every tick)
**Rationale:** Prevents jittery/over-reactive AI, creates more natural opponent behavior.

### 5. State Broadcasting
**Decision:** Broadcast full state every 50ms
**Rationale:** Simple, robust synchronization. Can optimize to delta updates later.

---

## Known Limitations

1. **Database migration pending** - Requires `pnpm prisma migrate deploy` when DB accessible
2. **Sword-only combat** - Other weapons (Spear, Bow, Dagger) in Sprint 4
3. **No client prediction** - Frontend will add in Sprint 3
4. **No interpolation** - Frontend will add in Sprint 3
5. **Magic stats unused** - MRES, ARC, FTH reserved for Sprint 4+

---

## Next Steps: Sprint 3

**Frontend - Real-Time Combat UI**

- Canvas-based arena renderer (60 FPS)
- WASD movement input handling
- Mouse aim for facing direction
- Client prediction for player movement
- Interpolation for opponent movement
- HP/stamina bars above units
- Match HUD with cooldown indicators
- Victory/defeat screens

See: `docs/plans/04-sprint-3-frontend-animations.md`

---

## Files Summary

**New Files (15):**
- Combat engine: 5 files
- CPU AI: 2 files
- Match management: 2 files
- WebSocket handlers: 1 file
- Database migration: 1 file
- Test configuration: 1 file
- Test files: 2 files

**Modified Files (4):**
- `contracts/contracts/GladiatorNFT.sol`
- `packages/database/prisma/schema.prisma`
- `apps/game-server/package.json`
- `apps/game-server/src/sockets/index.ts`

---

## Success Criteria

- [x] Real-time combat at 20Hz
- [x] Continuous WASD movement
- [x] Attack system with range/arc detection
- [x] Dodge roll with i-frames
- [x] Stamina regeneration
- [x] CPU AI with adaptive strategies
- [x] WebSocket state broadcasting
- [x] Match lifecycle management
- [x] 8 stats in contract/database
- [x] Unit tests passing

---

**Sprint 2: ✅ COMPLETE**

The combat system is ready for frontend integration in Sprint 3.
