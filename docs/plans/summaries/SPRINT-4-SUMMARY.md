# Sprint 4 Summary: Weapons & Projectiles

**Status:** ✅ Complete
**Duration:** Sprint 4
**Goal:** Multi-weapon combat system with ranged projectiles

---

## Overview

Sprint 4 implemented a complete multi-weapon combat system with:
1. Shared combat library for pure combat calculations
2. Weapon system foundation with 4 distinct weapon types
3. Server-authoritative projectile simulation
4. Weapon selector UI with keyboard bindings
5. Client-side projectile rendering

---

## What Was Built

### 1. Shared Combat Library ✅

**Goal:** Pure, testable combat calculations separated from server entity management.

**Files Created:**
- `packages/shared/src/combat/types.ts` - Core combat types:
  - `BaseAttributes` - 8 base stats (CON, STR, DEX, SPD, DEF, MR, ARC, FTH)
  - `DerivedStats` - Calculated stats (maxHp, maxStamina, staminaRegen, moveSpeed, damageReduction)
  - `WeaponDefinition` - Weapon config with type, pattern, damage, scaling, costs
  - `ProjectileState` - Projectile entity (pos, vel, damage, owner, lifetime)
  - `WeaponType` enum - Sword, Spear, Bow, Dagger
  - `AttackPattern` enum - MeleeArc, MeleeThrust, Projectile, MeleeQuick

- `packages/shared/src/combat/stats.ts` - Pure stat calculations:
  - `calculateDerivedStats(base: BaseAttributes): DerivedStats`
  - `calculateStaminaRegen(con: number): number`
  - `hasStamina(current: number, cost: number): boolean`
  - `consumeStamina(current: number, cost: number): number`

- `packages/shared/src/combat/damage.ts` - Pure damage calculations:
  - `calculateRawDamage(baseDamage, scaling, stats): number`
  - `calculateFinalDamage(raw, defense): number`
  - `calculateDamage(weapon, attacker, defender): number`
  - `applyDamageToHp(hp, damage): number`
  - `isDead(hp): boolean`

- `packages/shared/src/combat/weapons.ts` - Weapon definitions:
  - `WEAPONS: Record<WeaponType, WeaponDefinition>` - Complete weapon data:
    - **Sword:** MeleeArc, 2.0 range, 90° arc, 15 base damage, STR/DEX scaling (0.6/0.3), 15 stamina, 500ms CD
    - **Spear:** MeleeThrust, 2.5 range, 30° arc, 12 base damage, STR/DEX scaling (0.4/0.5), 12 stamina, 600ms CD
    - **Bow:** Projectile, 10.0 range, 20 base damage, DEX scaling (0.8), 20 stamina, 1000ms CD, 8.0 speed, 1250ms lifetime
    - **Dagger:** MeleeQuick, 1.5 range, 60° arc, 8 base damage, DEX scaling (0.7), 8 stamina, 300ms CD
  - `Weapons` class with static methods: `getWeapon()`, `getAllWeaponTypes()`, `isProjectileWeapon()`

- `packages/shared/src/combat/projectiles.ts` - Pure projectile functions:
  - `createProjectile(id, owner, pos, facing, weapon, damage, time): ProjectileState`
  - `updateProjectilePosition(projectile, deltaTime): Vec2`
  - `isProjectileExpired(projectile, currentTime): boolean`
  - `isProjectileOutOfBounds(pos, arenaSize): boolean`
  - `checkProjectileUnitCollision(pos, radius, unit): boolean`
  - `shouldProjectileHit(projectile, unit, isOwner): boolean`

- `packages/shared/src/combat/index.ts` - Barrel export

**Architecture:**
- **Shared:** Pure calculations (stats, damage, projectiles), weapon definitions, type definitions
- **Server:** Entity management, validation, match state, lifecycle, anti-cheat
- **Client:** UI, rendering, user input, prediction

**Result:**
- Combat logic testable in isolation
- Server uses for authoritative simulation
- Client can use for prediction (future)
- Single source of truth for weapon balance

---

### 2. Weapon System Foundation ✅

**Goal:** Support 4 weapon types with distinct attack patterns.

**Files Updated:**
- `apps/game-server/src/combat/types.ts`:
  - Added `weapon: WeaponType` field to `Combatant`
  - Updated `WeaponConfig` to match shared definition
  - Added Sprint 4 weapons to `WeaponType` enum
  - Updated `AttackPattern` enum

- `apps/game-server/src/combat/damage-calculator.ts`:
  - Rewritten as thin wrapper around shared combat library
  - `DamageCalculator.calculateDamage()` calls `Damage.calculateDamage()`
  - `DamageCalculator.applyDamage()` handles Combatant mutations
  - Legacy weapon config support maintained
  - Uses shared `WEAPONS` constant with hardcoded fallback

- `apps/game-server/src/combat/engine.ts`:
  - **Major refactor** for multi-weapon support:
  - Added `projectiles: Map<string, ProjectileState>` initialization in constructor
  - Completely rewrote `processAttackAction()` to dispatch by weapon attack pattern
  - Added `processMeleeAttack()` for arc/thrust/quick patterns (90+ lines):
    - Pattern-specific hitbox calculation
    - Arc angle and range from weapon definition
    - Collision detection against target
    - Damage calculation and application
  - Added `processProjectileAttack()` for projectile weapons:
    - Spawns projectile using `Projectiles.createProjectile()`
    - Adds to combat state projectiles map
    - Emits `ProjectileSpawned` event
  - Added `updateProjectiles()` method (60+ lines):
    - Updates all projectile positions
    - Checks expiry (lifetime) and bounds
    - Collision detection with both combatants
    - Damage application and projectile removal on hit
    - Removes expired/out-of-bounds projectiles

- `apps/game-server/src/services/match-instance.ts`:
  - Added `equippedWeapon: WeaponType.Sword` to combatants
  - Default weapon for CPU and players

**Result:**
- Engine supports all 4 weapon types
- Attack pattern determines hit detection logic
- Sword: 90° melee arc (short/medium range, high damage)
- Spear: 30° melee thrust (long range, medium damage)
- Bow: Projectile (ranged, high damage, slow)
- Dagger: 60° quick strike (short range, low damage, fast)

---

### 3. Server-Side Projectile System ✅

**Goal:** Server-authoritative projectile simulation with collision detection.

**Files Updated:**
- `apps/game-server/src/combat/types.ts`:
  - Added `projectiles: Map<string, ProjectileState>` to `CombatState`
  - Added `ProjectileSpawned` to `CombatEventType` enum

- `apps/game-server/src/combat/engine.ts` (see above):
  - `processProjectileAttack()` spawns projectiles
  - `updateProjectiles()` simulates physics and collisions
  - Called every tick (20Hz) after action processing

**Implementation Details:**
- Projectile lifecycle:
  1. Spawned by `Bow` weapon attack (processProjectileAttack)
  2. Added to combat state projectiles map with unique ID
  3. Position updated every tick using velocity
  4. Collision checked against both combatants
  5. Damage applied on hit (respects i-frames)
  6. Removed on hit, expiry, or out-of-bounds

- Collision detection:
  - Circle-circle intersection (projectile radius vs combatant)
  - Checks `shouldProjectileHit()` to prevent self-hit
  - Respects invulnerability frames (dodge i-frames)

**Result:**
- Ranged combat working
- Server-authoritative (no client-side hit detection)
- Projectiles physics-based (velocity, lifetime)
- Proper collision with hit/miss feedback

---

### 4. Weapon Selector UI ✅

**Goal:** In-game weapon switching with keyboard bindings.

**Files Created:**
- `apps/web/components/arena/WeaponSelector.tsx` - Weapon selection component:
  - Grid layout with 4 weapon buttons
  - Shows weapon name, key binding (1-4), cooldown, and range type (Melee/Ranged)
  - Green highlight for selected weapon
  - Click to select, keyboard 1-4 to switch

**Files Updated:**
- `apps/web/hooks/useGameInput.ts`:
  - Added `onWeaponChange?: (weaponIndex: number) => void` option
  - 1-4 key handlers trigger weapon switching
  - Prevents repeat events
  - Only fires callback, doesn't mutate input state

- `apps/web/app/match/[matchId]/page.tsx`:
  - Added weapon selection state: `currentWeapon: WeaponType`
  - Added `handleWeaponChange` callback
  - Passes callback to `useGameInput`
  - Renders `<WeaponSelector>` below arena canvas

**Result:**
- Players can switch weapons during combat
- Visual feedback for selected weapon
- Keyboard shortcuts (1-4) for quick switching
- Mouse click option for accessibility

---

### 5. Client-Side Projectile Rendering ✅

**Goal:** Render projectiles with visual effects.

**Files Updated:**
- `apps/web/components/arena/renderer.ts`:
  - Added `drawProjectile(projectile: ProjectileState)` method:
    - Draws amber/orange circle for projectile body
    - Draws trailing line based on velocity direction
    - Draws glow effect around projectile
    - Uses `#fbbf24` (amber) color scheme
    - Scales radius appropriately (10x for visibility)

- `apps/web/components/arena/ArenaCanvas.tsx`:
  - Added projectile rendering loop after combatants:
    ```typescript
    if (combatState.projectiles) {
      for (const projectile of combatState.projectiles.values()) {
        renderer.drawProjectile(projectile)
      }
    }
    ```

- `apps/web/hooks/useRealTimeMatch.ts`:
  - Added projectile array → Map conversion on state receive:
    - Server serializes Map → array for JSON
    - Client converts array → Map for CombatState type
    - Ensures type consistency

- `apps/game-server/src/sockets/match-handlers.ts`:
  - Updated `match:state` emission to include projectiles:
    - Converts projectiles Map to array: `Array.from(state.projectiles.values())`
    - Added to state broadcast payload
    - Sent at 20Hz with other combat state

**Result:**
- Projectiles visible on client
- Smooth rendering at 60 FPS
- Visual feedback for arrow flight
- Trail and glow effects

---

## Files Created (Tree)

```
packages/shared/src/combat/
├── types.ts (weapon, projectile, stat types)
├── stats.ts (pure stat calculations)
├── damage.ts (pure damage calculations)
├── weapons.ts (WEAPONS constant, weapon definitions)
├── projectiles.ts (pure projectile functions)
└── index.ts (barrel export)

apps/web/components/arena/
└── WeaponSelector.tsx (weapon selection UI)
```

---

## Files Updated

```
packages/shared/src/combat/
└── types.ts (Sprint 4 weapon/projectile types)

apps/game-server/src/combat/
├── types.ts (weapon field, projectiles map, events)
├── damage-calculator.ts (uses shared library)
└── engine.ts (multi-weapon dispatch, projectile simulation)

apps/game-server/src/services/
└── match-instance.ts (equipped weapon initialization)

apps/game-server/src/sockets/
└── match-handlers.ts (projectiles in state broadcast)

apps/web/
├── hooks/
│   ├── useGameInput.ts (weapon switching keys)
│   └── useRealTimeMatch.ts (projectile Map conversion)
├── components/arena/
│   ├── renderer.ts (drawProjectile method)
│   └── ArenaCanvas.tsx (projectile rendering loop)
└── app/match/[matchId]/
    └── page.tsx (weapon selector integration)

docs/
└── SPRINT-4-SUMMARY.md (this file)
```

---

## Architecture Decisions

### Shared Combat Library

**Why separate combat calculations:**
- Combat logic testable in isolation
- Client can use for prediction (future)
- Single source of truth for balance
- Server focuses on authority/validation
- No accidental divergence

**What's shared:**
- Stats calculations (derived stats, stamina)
- Damage calculations (raw, scaled, final)
- Weapon definitions (balance tuning)
- Projectile physics (deterministic)
- Type definitions (combat state, weapons)

**What's server-only:**
- Entity lifecycle (spawn/destroy)
- Action validation (cooldowns, stamina checks)
- State mutation (apply damage, modify combatants)
- Match orchestration (tick loop, win conditions)
- Anti-cheat (server authority)

### Multi-Weapon Attack Dispatch

**Pattern-based dispatch:**
```typescript
switch (weapon.attackPattern) {
  case AttackPattern.MeleeArc:
  case AttackPattern.MeleeThrust:
  case AttackPattern.MeleeQuick:
    this.processMeleeAttack(...)
    break
  case AttackPattern.Projectile:
    this.processProjectileAttack(...)
    break
}
```

**Benefits:**
- Weapons defined by behavior, not type
- Easy to add new patterns
- Melee variants share collision logic
- Projectiles use physics simulation

### Projectile Simulation

**Server-authoritative:**
- Projectiles owned by server combat state
- Physics updated every tick (20Hz)
- Collision detection on server
- Client only renders

**Trade-offs:**
- No client-side prediction (acceptable for 20Hz)
- Network latency visible on projectile spawn
- Worth it: No hit validation exploits

### Weapon Balance

**Current values (subject to tuning):**
| Weapon | Range | Damage | Stamina | Cooldown | Pattern | Scaling |
|--------|-------|--------|---------|----------|---------|---------|
| Sword  | 2.0   | 15     | 15      | 500ms    | 90° arc | STR 0.6, DEX 0.3 |
| Spear  | 2.5   | 12     | 12      | 600ms    | 30° thrust | STR 0.4, DEX 0.5 |
| Bow    | 10.0  | 20     | 20      | 1000ms   | Projectile | DEX 0.8 |
| Dagger | 1.5   | 8      | 8       | 300ms    | 60° quick | DEX 0.7 |

**Design goals:**
- Sword: Balanced, medium speed, good for beginners
- Spear: Long reach, narrow arc, positioning-based
- Bow: High damage, slow, skill-based
- Dagger: Fast attacks, low damage, aggressive playstyle

---

## Known Limitations

1. **Weapon Switching:** Currently client-side only. Server doesn't track equipped weapon changes mid-match.
2. **Template Integration:** Uses hardcoded `WEAPONS` constant. Not yet integrated with EquipmentTemplate system (deferred to later sprint).
3. **Projectile Interpolation:** Projectiles rendered at exact server position (20Hz updates). No client-side interpolation/prediction.
4. **Hit Feedback:** No visual/audio feedback for hits yet (particles, sound effects).
5. **Animation:** Weapon animations not yet implemented (sprites show idle animation for all actions).

---

## Next Steps

Sprint 4 complete. Ready for **Sprint 5: Progression & Loot** or **Sprint 6: Multiplayer PvP**.

**Recommended next:**
- Sprint 5: Equipment loot, stats, progression system
- Or Sprint 6: Real PvP matchmaking, lobbies, 1v1 matches

---

## References

- **Sprint 4 plan:** `docs/plans/05-sprint-4-weapons-projectiles.md`
- **Sprint 3.5 summary:** `docs/SPRINT-3.5-SUMMARY.md`
- **Shared combat library:** `packages/shared/src/combat/`
- **Weapon definitions:** `packages/shared/src/combat/weapons.ts`
- **Projectile system:** `packages/shared/src/combat/projectiles.ts`
- **Combat engine:** `apps/game-server/src/combat/engine.ts`
