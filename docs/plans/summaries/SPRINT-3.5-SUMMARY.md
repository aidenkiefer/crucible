# Sprint 3.5 Summary: Frontend Combat UI — Remaining Items

**Status:** ✅ Complete
**Duration:** Sprint 3.5 (gap-filling sprint)
**Goal:** Complete deferred items from Sprint 3 plan

---

## Overview

Sprint 3.5 addressed the gaps between the Sprint 3 plan and what was delivered. The focus was on:
1. Extracting physics to a shared, deterministic library for client prediction
2. Implementing client-side prediction for snappier local player movement
3. Adding mouse click attack bindings (main hand / off hand)
4. Building match creation UI flow
5. Verifying Sprint 3 implementation against the original checklist

---

## What Was Built

### 1. Shared Physics Library ✅

**Goal:** Pure, deterministic physics for both server (authoritative) and client (prediction).

**Files Created:**
- `packages/shared/src/physics/types.ts` - Core types (Vec2, Velocity, BoundingBox, Circle, Rectangle)
- `packages/shared/src/physics/constants.ts` - Centralized constants (TICK_RATE, ARENA_WIDTH, movement/dodge/stamina values)
- `packages/shared/src/physics/vector.ts` - Pure vector math (normalize, magnitude, distance, scale, lerp, clampMagnitude)
- `packages/shared/src/physics/movement.ts` - Integration (integrate, clampToArena, calculateVelocity, calculateDodgeVelocity)
- `packages/shared/src/physics/collision.ts` - Collision detection (circle, combatant, melee hit arc, resolution)
- `packages/shared/src/physics/index.ts` - Barrel export

**Files Updated:**
- `apps/game-server/src/combat/physics.ts` - Now uses shared library (re-exports as wrappers)
- `apps/game-server/src/combat/types.ts` - Imports PHYSICS_CONSTANTS from shared

**Architecture:**
- No Node-only dependencies (works in browser and Node.js)
- Pure functions, no side effects
- Server uses for authoritative simulation
- Client uses for prediction
- Constants in one place prevent drift

---

### 2. Client-Side Prediction ✅

**Goal:** Apply movement locally for player, reconcile with server state for reduced perceived lag.

**Files Created:**
- `apps/web/hooks/useClientPrediction.ts` - Prediction hook with reconciliation:
  - Applies input immediately for local player
  - Reconciles with server state (snap if diff > 2 units, else lerp)
  - Runs at 50ms intervals (matches server tick rate)

**Files Updated:**
- `apps/web/app/match/[matchId]/page.tsx` - Uses prediction hook, passes predicted state to canvas
- `apps/web/components/arena/ArenaCanvas.tsx` - Renders player from predicted state, opponent from interpolated state

**Result:**
- Local player movement feels instant (no 20Hz delay)
- Reconciliation prevents drift from server authority
- Opponent still uses smooth interpolation
- No regression in network behavior

---

### 3. Mouse Click Attack Bindings ✅

**Goal:** Left click for main hand, right click for off hand, slot-based actions for template resolution.

**Files Updated:**
- `apps/web/hooks/useGameInput.ts`:
  - Added `GameAction` interface with `slot` field
  - Left click → `{ type: 'Attack', slot: 'mainHand' }`
  - Right click → `{ type: 'Attack', slot: 'offHand' }`
  - Space → `{ type: 'Attack', slot: 'mainHand' }` (accessibility)
  - Context menu disabled on canvas

- `apps/web/components/arena/MatchHUD.tsx`:
  - Updated cooldown display: "Main Hand [SPACE / L-CLICK]" and "Off Hand [R-CLICK]"
  - Shows both slots with separate indicators
  - Updated controls hint

**Result:**
- Players can attack with left/right click
- Slot information sent to server for template-driven action resolution
- Space key kept for accessibility
- Clean separation of main/off hand actions

---

### 4. Match Creation Flow ✅

**Goal:** Full flow from entry point to match with CPU opponent.

**Files Created:**
- `apps/web/hooks/useCreateMatch.ts` - Creates and starts matches:
  - Emits `match:create` with gladiator stats
  - Waits for `match:created` confirmation
  - Emits `match:start` to begin combat
  - Returns matchId for navigation
  - Error handling with timeout

**Files Updated:**
- `apps/web/app/arena/page.tsx` - Functional arena entry:
  - "Fight CPU Opponent" button
  - Session validation
  - Mock gladiator stats (TODO: load from DB)
  - Navigates to `/match/{matchId}` on success
  - Error display

- `apps/web/app/match/[matchId]/page.tsx` - Updated "Fight Again":
  - Creates new match instead of reload
  - Navigates to new match page
  - Loading state and error handling

**Verified Existing API:**
- `match:create` - Creates match (CPU or PvP)
- `match:start` - Starts match and 20Hz broadcast
- `match:join` / `match:leave` - Room management

**Result:**
- Users can start CPU matches from `/arena`
- "Fight Again" creates fresh match
- Full WebSocket flow working
- Home page already links to arena

---

### 5. Sprint 3 Verification ✅

**Goal:** Verify Sprint 3 implementation against original plan checklist.

**Files Updated:**
- `docs/SPRINT-3-SUMMARY.md` - Added verification section

**Verification Results:**
- ✅ **Sprite Rendering:** All items verified
- ✅ **Real-Time Movement:** All items verified
- ✅ **Combat Actions:** All items verified (including Sprint 3.5 mouse clicks)
- ✅ **Visual Feedback:** All items verified (minor: HP bar color not dynamic)
- ✅ **Match Flow:** All items verified (including Sprint 3.5 match creation)

**Deferred/Minor Issues:**
- HP bar doesn't change to blood red at low HP
- Gladiator data hardcoded (needs DB integration)
- Sprite character key hardcoded to `duelist_base`

---

## Files Created (Tree)

```
packages/shared/src/physics/
├── types.ts
├── constants.ts
├── vector.ts
├── movement.ts
├── collision.ts
└── index.ts

apps/web/hooks/
├── useClientPrediction.ts
└── useCreateMatch.ts
```

---

## Files Updated

```
apps/game-server/src/combat/
├── physics.ts (uses shared library)
└── types.ts (imports PHYSICS_CONSTANTS)

apps/web/
├── hooks/useGameInput.ts (mouse clicks, slot-based actions)
├── components/arena/
│   ├── ArenaCanvas.tsx (uses predicted state)
│   └── MatchHUD.tsx (main/off hand display)
└── app/
    ├── arena/page.tsx (match creation UI)
    └── match/[matchId]/page.tsx (prediction, Fight Again)

docs/
├── SPRINT-3-SUMMARY.md (verification results)
└── SPRINT-3.5-SUMMARY.md (this file)
```

---

## Architecture Decisions

### Shared Physics Library

**Why separate package:**
- Client prediction needs same physics as server
- Deterministic: identical inputs → identical outputs
- No Node-only deps (works in browser)
- Single source of truth for constants

**What moved to shared:**
- Vector math (pure functions)
- Integration/movement (stateless position updates)
- Collision detection (geometric primitives)
- Constants (tick rate, arena size, speeds)

**What stayed in game-server:**
- Match lifecycle and orchestration
- Authoritative state storage
- Combatant entity management
- Action validation and anti-cheat

### Client Prediction

**Implementation:**
- Runs at 50ms intervals (matches server tick)
- Reconciliation threshold: 2 units (snap) vs smooth lerp
- Uses shared physics for consistency
- Only predicts local player (opponent still interpolated)

**Trade-offs:**
- Adds complexity (reconciliation logic)
- Uses more client CPU
- Worth it: Dramatically improves perceived responsiveness

### Slot-Based Actions

**Current approach:**
- Simple slot enum: `'mainHand' | 'offHand'`
- Server resolves slot → action via templates
- Frontend doesn't need to know weapon/action details

**Future (Sprint 4):**
- Server uses EquipmentTemplate to resolve slot → action
- Multiple actions per slot possible
- Client just sends slot + click, server handles rest

---

## Known Limitations

1. **Gladiator Data:** Currently hardcoded mock stats. Need DB integration to load real gladiator.
2. **Character Sprites:** Hardcoded to `duelist_base`. Should drive from gladiator class/type when available.
3. **HP Bar Color:** Doesn't dynamically change to blood red at low HP threshold.
4. **Prediction Reconciliation:** Uses simple snap/lerp. Could be enhanced with history buffer for smoother correction.

---

## Next Steps

Sprint 3.5 complete. Ready for **Sprint 4: Weapons & Projectiles**.

---

## References

- **Sprint 3.5 plan:** `docs/plans/sprint-3.5.md`
- **Sprint 3 summary:** `docs/SPRINT-3-SUMMARY.md`
- **Sprint 3 plan:** `docs/plans/04-sprint-3-frontend-animations.md`
- **Shared physics:** `packages/shared/src/physics/`
