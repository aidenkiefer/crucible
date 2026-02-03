# Combat System — Real-Time Coliseum (ROTMG-inspired) v0.3

> Goal: Define a **server-authoritative real-time** combat model in a free-moving coliseum,
> with WASD/arrow-key movement, ability cooldowns, and stat-driven pacing (Speed/Stamina).
> This replaces the grid / turn-based proposal while preserving the rest of our design intent:
> deterministic outcomes where possible, low server load per match, clean client/server boundaries,
> and extensibility for weapons + spellcasting.

---

## 0) Inspiration & Design Intent

This system is inspired by:
- Free-moving arena combat and “bullet-hell roguelike” feel (think :contentReference[oaicite:0]{index=0} vibes)
- Readable combat with cooldown-driven actions
- Stat-based pacing (SPD/STAM) rather than strict turn order

We are *not* building a full MMO. The demo is **1v1 (or small-room)** coliseum combat with:
- Responsive movement
- Cooldowns + stamina gating
- Clear hitboxes/projectiles
- Server-authoritative resolution (anti-cheat first)

---

## 1) Arena Layout

### 1.1 World Model
- 2D top-down arena (coliseum floor)
- Bounded rectangle with collision walls
- Optional obstacles (pillars) for line-of-sight and skill expression

### 1.2 Coordinate System
- Continuous positions: `pos = { x: float, y: float }`
- Velocity: `vel = { vx: float, vy: float }`
- Facing: either:
  - `angle` (mouse aim) OR
  - directional vector from movement

For demo simplicity:
- Keyboard movement (WASD/arrow keys)
- Mouse aim optional (can aim with last movement direction for v0)

---

## 2) Units & Core Stats (Elden Ring / DnD-ish)

Each Gladiator has **base attributes** and **derived combat stats**.

### 2.1 Base Attributes
- **Constitution (CON)**: scales HP + Stamina
- **Strength (STR)**: scales heavy/melee weapons; stagger potential (later)
- **Dexterity (DEX)**: scales finesse/ranged weapons; improves attack speed (optional)
- **Speed (SPD)**: movement speed and/or cooldown recovery and/or attack windup speed
- **Defense (DEF)**: physical mitigation
- **Magic Resist (MRES)**: magic mitigation
- **Arcana (ARC)**: scales arcane magic damage + mana regen
- **Faith (FTH)**: scales faith/holy magic + mana regen

Optional later:
- **Poise (POI)**: stagger resistance
- **Focus (FOC)**: concentration/status resistance

### 2.2 Derived Stats (suggested baselines)
- `HP_MAX = baseHP + CON * hpScale`
- `STAM_MAX = baseSTAM + CON * stamScale`
- `MANA_MAX = baseMANA + (ARC + FTH) * manaScale` (or split later)
- `MOVE_SPEED = baseMove + SPD * moveScale`
- `STAM_REGEN = baseRegen + CON * regenScale` (optionally + armor penalties)
- `COOLDOWN_MULT = f(SPD)` e.g. `cooldown = baseCooldown * (1 - clamp(SPD*0.01, 0, 0.35))`
  - (SPD reduces cooldowns up to a cap; tune later)

---

## 3) Real-Time Loop & Networking Model

### 3.1 Authority & Anti-Cheat
- Server is authoritative for:
  - positions (final truth)
  - damage
  - hit validation
  - stamina/mana
  - cooldowns
- Client is authoritative only for:
  - input intent
  - local prediction for smoothness (visual only)

### 3.2 Server Tick Rate
Recommended:
- **Server sim tick**: 20–30 Hz for demo
- **Client render**: 60+ FPS
- **Network snapshot send**: 10–20 Hz (deltas preferred)

### 3.3 Client Prediction & Smoothing
- Client predicts its own movement immediately.
- Server sends periodic snapshots:
  - client reconciles by smoothly correcting toward server position.
- Other player movement is rendered via interpolation between snapshots.

### 3.4 Message Types (minimal)
Client → Server:
- `INPUT` (sequence number + pressed keys + aim direction)
- `ACTION_CAST` (ability id + aim + timestamp/sequence)

Server → Client:
- `SNAPSHOT` (positions, hp/stam/mana, cooldowns, statuses)
- `EVENT` (projectile spawned, hit confirmed, damage applied, death)

---

## 4) Movement & Stamina

### 4.1 Movement Controls
- WASD / arrows apply acceleration or direct velocity.
- Movement is continuous, with collisions vs arena walls/obstacles.

### 4.2 Stamina Interaction (demo rules)
We want pacing to depend on STAM + SPD without becoming annoying.

Recommended demo approach:
- Normal movement does **not** drain stamina.
- “Burst mobility” and attacks consume stamina.

Mobility actions:
- **Dodge Roll / Dash**
  - Consumes stamina
  - Has cooldown
  - Grants brief i-frames or damage reduction (deterministic; see §7)

Optional later:
- Sprint drains stamina while held.

---

## 5) Actions & Cooldowns

This replaces the turn-based “one action per round” model.

### 5.1 Universal Actions
- **Basic Attack** (weapon-defined)
- **Dodge Roll / Dash**
- **Guard / Block** (optional for demo; could be hold-to-block)
- **Cast Spell** (if catalyst equipped + spell loaded)

### 5.2 Weapon-Driven Attacks
Weapons define:
- attack pattern (melee arc, thrust line, projectile)
- stamina cost
- windup time (optional for demo)
- cooldown time
- scaling (STR/DEX)

Demo weapon families (keep small):
- Sword (melee arc)
- Spear (long thrust / narrow line)
- Bow (projectile)
- Dagger (fast, short range)

### 5.3 Spellcasting Items & Spell Slots
Spellcasting requires equipping a catalyst:
- Tome / Wand / Staff (Arcana)
- Seal / Talisman (Faith)

Catalysts define:
- number of spell slots
- mana regen modifier
- cast speed modifier (optional)

Spells are “loaded” into slots pre-match.

Magic classes:
- **Faith-based**: incantations, blessings, holy damage, buffs/heals
- **Arcana-based**: other magic (elemental/arcane), projectiles, AoE zones

---

## 6) Combat Feel: Windup, Cooldowns, Cast Time

We need readable combat without desync.

Recommended:
- Abilities have **server-defined**:
  - `castTime` (0–300ms for demo)
  - `cooldown`
  - `staminaCost` and/or `manaCost`
- The server validates cast start and completion.

Client can play windup animation immediately, but the server confirms the actual projectile/hit.

---

## 7) Hit Detection & Determinism

### 7.1 Hit Models
Choose one of these for demo:

**Option A (simplest): Server-side hitboxes only**
- Melee: server checks distance + facing arc at cast time
- Ranged: server simulates projectile and checks collisions

**Option B (hybrid): Client suggests hits, server verifies**
- Faster feel but more complexity; not needed for demo

Recommended: **Option A**.

### 7.2 Dodge / I-frames Without RNG
Avoid random miss. Dodge provides deterministic protection:

Pick one:
- **A)** Dodge grants i-frames for `N ms` (server ignores hits during window)
- **B)** Dodge grants % damage reduction for `N ms`

Option A feels more like action roguelikes, but requires tight server timing.
Option B is easier and still fair.

### 7.3 Damage Types & Mitigation
- Physical damage mitigated by DEF
- Magic/Faith mitigated by MRES (split later if desired)

---

## 8) Resources: Stamina & Mana

### 8.1 Stamina
- Attacks consume stamina.
- Dodge consumes stamina.
- Stamina regenerates over time:
  - `stam += STAM_REGEN * dt`

If stamina is insufficient:
- action fails to start (server rejects), client shows “out of stamina” feedback.

### 8.2 Mana
- Spells consume mana.
- Mana regenerates over time based on ARC/FTH and catalyst modifiers.

---

## 9) Status Effects (Optional for Demo)

Not required, but we should keep the system extensible:
- slow, burn, holy mark, bleed (later)
- represented as:
  - `statusEffects[]` with durations and stacks

---

## 10) Match Rules & Win Conditions

- Match duration: e.g. 3–5 minutes (demo)
- Win by:
  - opponent HP reaches 0
  - or timeout (higher HP% wins; tie = draw)

---

## 11) Server/Client Responsibilities (non-negotiable)

### 11.1 Server
- Simulates movement and collisions
- Validates input limits (speed hacks)
- Executes abilities
- Spawns projectiles
- Applies damage & resources
- Emits authoritative snapshots + events

### 11.2 Client
- Collects input
- Predicts local movement
- Renders animations, effects, UI
- Never decides outcomes

---

## 12) Data Structures (Suggested)

### 12.1 Core Types
- `Vec2 = { x: number, y: number }`

- `UnitState`:
  - ids: `unitId`, `ownerId`
  - base stats: `CON STR DEX SPD DEF MRES ARC FTH`
  - derived: `hpMax stamMax manaMax moveSpeed`
  - current: `hp stam mana`
  - motion: `pos vel`
  - `cooldowns: Record<abilityId, timeRemaining>`
  - `statusEffects[]`
  - `loadout` (weapon/armor/catalyst/spells)

- `ProjectileState`:
  - `projectileId`
  - `ownerUnitId`
  - `pos vel`
  - `radius`
  - `damage`
  - `damageType`
  - `ttl`

### 12.2 Inputs
- `InputFrame`:
  - `seq`
  - `moveX` (-1..1)
  - `moveY` (-1..1)
  - `aim` (Vec2 normalized or angle)
  - `buttons` (attack/dodge/spell1/spell2...)

### 12.3 Events
- `Event` examples:
  - `CAST_STARTED(unitId, abilityId)`
  - `PROJECTILE_SPAWNED(projectileId, owner, pos, vel, radius)`
  - `HIT(targetUnitId, sourceId, amount, type)`
  - `RESOURCE(unitId, hpDelta, stamDelta, manaDelta)`
  - `DEATH(unitId)`
  - `COOLDOWN_UPDATED(unitId, abilityId, timeRemaining)`

---

## 13) Minimal Content Set for Demo

Weapons:
- Sword (melee arc, STR/DEX hybrid)
- Spear (long thrust line, STR)
- Bow (projectile, DEX)

Mobility:
- Dodge Roll (dash with i-frames or DR)

Spells (if implementing spellcasting in demo):
- Arcana: Magic Bolt (projectile), Arcane Burst (small AoE zone)
- Faith: Smite (projectile), Blessing (self buff or small heal)

Armor:
- Light Armor (more move speed / less DEF)
- Heavy Armor (more DEF / less move speed)

---

## 14) Definition of Done (Combat v0.3)

- Players move smoothly with WASD/arrow keys
- Server authoritative movement & collisions
- Cooldowns + stamina gating implemented
- Weapon attacks work (at least 2 weapon families)
- Dodge roll works (turnless real-time dash) with deterministic protection
- Match ends reliably (HP <= 0)
- Events logged for replay/debug

---

## 15) Future Extensions (Not Required for Demo)

- More abilities per weapon
- Full class kits (3–5 abilities)
- Status effects and tile hazards
- Spectator mode & deterministic replays
- Ranked matchmaking and tournament rules
- Advanced spell slot systems and catalysts
