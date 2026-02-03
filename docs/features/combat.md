# Combat System — Grid Tactics v0.2

> Goal: Define a deterministic, server-authoritative, turn/tick-based combat model
> using a compact battle grid (4x3), with meaningful positioning, weapon-driven
> attacks, and two schools of magic (Faith + Arcana). Designed for the demo and
> easy future evolution.

---

## 0) Inspiration & Design Intent

This system is loosely inspired by For The King II’s battle grid concept:
- Characters occupy discrete tiles on a small battle grid
- Positioning affects range/targeting
- Attacks reference simple grid patterns (rows/columns/small AoEs)

We are *not* trying to clone FTK2 exactly.
We’re using “small-grid tactics” as a foundation.

Key demo constraints:
- Deterministic resolution (server is source of truth)
- Low bandwidth: client receives state snapshots + events, renders smoothly
- Simple action set first, expand later (skills, AoEs, tile effects)

---

## 1) Arena Grid Layout

### 1.1 Grid Dimensions
Total battle grid is **4 rows x 3 columns**:

- Rows represent depth from player A’s side toward player B’s side.
- Columns represent **left / middle / right** lanes.

Coordinates:
- `row ∈ {0,1,2,3}` where `0` is the **front row for Player A**, and `3` is the **front row for Player B**
- `col ∈ {0,1,2}` where `0=left`, `1=middle`, `2=right`

### 1.2 Spawn Positions
Default spawn for each player:
- **Player A spawns at `(0,1)`**
- **Player B spawns at `(3,1)`**

This means:
- Both players start “front + middle”
- Players can reposition anywhere: front/back + left/middle/right

### 1.3 Ownership / Side Definitions
Define "side" by rows:
- Player A “half”: rows `0–1`
- Player B “half”: rows `2–3`

(For demo, we can keep midline crossing rules simple; see §6.)

### 1.4 Occupancy Rules
- Exactly 1 unit per tile.
- Units cannot overlap.
- Movement requires destination tile to be empty.

---

## 2) Units & Core Stats (Elden Ring / DnD-ish)

Each Gladiator has **base attributes** and **derived combat stats**.

### 2.1 Base Attributes (Primary)
- **Constitution (CON)**: scales HP + Stamina
- **Strength (STR)**: scales heavy/melee weapons, some stagger effects
- **Dexterity (DEX)**: scales finesse weapons, ranged weapons, dodge effectiveness (optional)
- **Speed (SPD)**: initiative/turn order; may also affect move distance (optional)
- **Defense (DEF)**: physical mitigation
- **Magic Resist (MRES)**: magic mitigation (general)
- **Arcana (ARC)**: scales sorcery/arcane magic damage + mana regen
- **Faith (FTH)**: scales incantations/holy/buffs + mana regen

Suggested optional additions (not required for demo, but good to keep in mind):
- **Focus (FOC)**: status resistance / concentration (anti-interrupt)
- **Poise (POI)**: stagger resistance / stability
- **Luck (LCK)**: affects crit chance or loot (probably exclude from demo)

### 2.2 Derived Stats
- **HP Max**: `HP = baseHP + CON * hpScale`
- **Stamina Max (STAM)**: `STAM = baseSTAM + CON * stamScale`
- **Mana Max (MANA)**: `MANA = baseMANA + (ARC + FTH) * manaScale` (or separate pools later)
- **Mana Regen**: per round, based on equipped catalyst + ARC/FTH
- **Physical Power**:
  - STR scaling for heavy weapons
  - DEX scaling for finesse/ranged weapons
- **Magic Power**:
  - ARC scaling for “Arcana spells”
  - FTH scaling for “Faith spells”

### 2.3 Combat State
- `pos` (row, col)
- `alive` (bool)
- `cooldowns` (per action/ability/spell)
- `statusEffects[]` (optional for demo)
- `equippedLoadout` (weapon/armor/catalyst/spell slots)

---

## 3) Turn Structure (Tick-Based / Turn-Based Hybrid)

This model fits a 1000ms tick loop and can also be expressed as strict turns.

### 3.1 High-level loop
Combat proceeds in **Rounds**.
Each round has:

1. **Intent Phase** (clients submit action)
2. **Resolve Phase** (server resolves deterministically)
3. **Broadcast Phase** (server sends events + updated state)

### 3.2 Timing
- Default tick interval: **1000ms**
- Client must submit an action before the deadline.
- If no action arrives: server chooses a fallback (e.g., "Guard" or "Wait").

### 3.3 Initiative (Order)
For v0.2:
- Resolve actions in descending `SPD`.
- Tie-breakers:
  1) higher current STAM
  2) stable deterministic tie-break (unitId ascending)

---

## 4) Actions (v0.2)

Each round, a unit may choose **one** action.
Actions can be:
- **Universal** (available to all)
- **Weapon-driven** (depends on equipped weapon)
- **Spell-driven** (depends on equipped catalyst with loaded spells)

### 4.1 Universal Actions
#### Move
- Move to an adjacent tile (N/S/E/W).
- Costs STAM (tunable; default -1).
- Cannot move into occupied tiles.

#### Guard / Block
- Reduces damage taken until next round.
- Optional: regenerate STAM or reduce stamina costs next round.

#### Dodge Roll (Turn-Consuming)
- Dodge Roll **consumes your turn**.
- You may dodge into **any empty tile within Dodge Range**, farther than normal Move.
- Grants a temporary “Evasion” window for the resolution step.

Dodge is intentionally powerful but costs your whole turn.

---

### 4.2 Weapon-Driven Attacks
Attack options depend on equipped weapon(s).
Examples:
- Sword: Slash (light), Thrust (heavy)
- Spear: Poke (melee 2), Sweep (row AoE)
- Bow: Single Shot (ranged line), Volley (small AoE)
- Dagger: Quick Stab (low stamina), Backstep Strike (movement+attack later)

For the demo:
- Implement 2–3 weapon families max
- Each family provides:
  - Light attack
  - Heavy attack
  - Optional special (later)

Each attack has:
- `staminaCost`
- `baseDamage`
- `scaling` (STR vs DEX vs mixed)
- `pattern` (see §5)
- `damageType` (physical / holy / arcane / etc.)

---

### 4.3 Spellcasting (Catalyst-Driven)
Spells are available only when a **spellcasting item** is equipped:
- Tome
- Wand
- Staff
- (later: holy seal / talisman)

Spellcasting items have **spell slots**.
Players “load” known spells into these slots before combat (or between rounds later).

Spellcasting constraints:
- Casting a spell consumes your turn.
- Costs `MANA`.
- Some spells may also cost STAM (optional).

Two magic classes:
- **Faith-based**: incantations, blessings, holy damage, buffs, heals
- **Arcana-based**: sorcery/arcane magic, elemental or raw magic damage

For demo:
- Implement 2 spells per class (4 total)
- Keep patterns simple (single target + small AoE)

---

## 5) Targeting, Range, and Patterns

All attacks/spells target tiles via patterns for clarity and easy extension.

### 5.1 Distance Metrics
- Use **Manhattan distance** for simplicity:
  - `dist = |r1-r2| + |c1-c2|`

### 5.2 Patterns (Initial Set)
Represent patterns as a set of offsets relative to an origin tile.

#### MELEE_1 (Adjacent)
Hits a target in N/S/E/W adjacent tile.

#### MELEE_2 (Extended)
Hits a target within Manhattan distance ≤ 2.

#### RANGED_LINE
From caster/attacker, choose a direction; hits the first enemy encountered up to `RANGE`.

#### RANGED_ANY
Target any enemy tile within a max distance (or entire grid for demo if needed).

#### AOE_CROSS
Centered on a target tile: center + N/S/E/W neighbors.

#### AOE_2x2 / AOE_2x3
Anchored on target tile; affects a small rectangle.

### 5.3 Line-of-Sight (Optional)
For demo, skip LoS.
Later: LoS blocks ranged line attacks if a unit is in the way.

### 5.4 Friendly Fire
For demo: no friendly fire.
Later: allow for certain AoEs.

---

## 6) Movement Rules & Midline Crossing

### 6.1 Move
- Adjacent only (N/S/E/W)

### 6.2 Dodge Roll
- Consumes turn
- Can move to **any tile within Dodge Range** (default Manhattan distance ≤ 3)
- Must land on an empty tile
- Grants temporary evasion modifier during Resolve Phase

### 6.3 Midline Crossing (Demo Rule)
For v0.2 demo:
- Midline crossing is allowed (players can occupy any tile) **OR**
- Midline crossing is restricted (players cannot enter opponent half)

Pick one for demo simplicity:
- Recommended: **allow full-grid movement**, because it enables more interesting positioning with minimal extra code.
- If restricted, enforce row bounds per player side.

---

## 7) Damage Types, Mitigation, and Determinism

### 7.1 Damage Types
- **Physical**: mitigated by DEF
- **Magic (Arcana)**: mitigated by MRES (or later ArcRes)
- **Holy/Faith**: mitigated by MRES (or later HolyRes)

### 7.2 Damage Formula (Simple)
- `raw = baseDamage + scalingContribution`
- `mitigated = max(1, raw - mitigationStat)`
- Apply guard/dodge effects
- Subtract from HP

Scaling contribution examples:
- STR weapon: `STR * strScale`
- DEX weapon: `DEX * dexScale`
- Arcana spell: `ARC * arcScale`
- Faith spell: `FTH * fthScale`

### 7.3 Deterministic Evasion
Avoid RNG in demo.
Dodge works as:
- If you Dodge Roll this round:
  - You gain a fixed “evasion” effect (e.g., reduce incoming damage by X% or nullify the first hit)
  - AND you reposition

Choose one for v0.2 demo:
- **Option A (simplest):** Dodge nullifies the first incoming hit this round.
- **Option B:** Dodge reduces damage taken by a fixed %.

---

## 8) Stamina & Mana

### 8.1 Stamina
- Light attacks cost STAM
- Heavy attacks cost more STAM
- Move costs small STAM
- Dodge costs moderate STAM and consumes turn

If STAM insufficient:
- Action is downgraded to Guard/Wait or disallowed.

### 8.2 Mana
- Spells cost MANA
- Mana regen occurs each round based on catalyst and ARC/FTH
- If MANA insufficient, spell cannot be cast

---

## 9) Equipment & Loadouts

### 9.1 Loadout Slots (Demo)
- Weapon (required)
- Armor (optional, can affect DEF / MRES)
- Catalyst (optional; enables spells)
- Spell Slots (owned by catalyst)

### 9.2 Weapon Scaling Rules
Weapons define scaling:
- STR-weighted
- DEX-weighted
- Hybrid (rare)
- Catalyst scaling for ARC/FTH

### 9.3 Spell Slots
Spellcasting items have:
- `slotCount` (e.g., 2 for demo)
- `loadedSpells[]` (selected from known spells)

---

## 10) Server/Client Responsibilities

### 10.1 Server (Authoritative)
- Validates legality:
  - cooldowns
  - stamina/mana
  - tile occupancy
  - range/pattern targeting
- Resolves actions in SPD order
- Produces:
  - Updated MatchState
  - CombatEvents[] for animation/replay/debug

### 10.2 Client (Rendering + UX)
- Renders grid and units
- Highlights legal moves and target tiles based on equipped actions/spells
- Sends ActionIntent
- Animates via CombatEvents
- Interpolates state for smoothness

---

## 11) Data Structures (Suggested)

### 11.1 Core Types
- `TileCoord = { row: 0|1|2|3, col: 0|1|2 }`

- `MatchState`:
  - `roundNumber`
  - `units: UnitState[]`
  - `tileEffects` (optional)
  - `modeConfig` (tick duration, dodge range, etc.)

- `UnitState`:
  - `unitId`
  - `ownerId`
  - base attributes: `CON, STR, DEX, SPD, DEF, MRES, ARC, FTH`
  - derived: `hpMax, stamMax, manaMax`
  - current: `hp, stam, mana`
  - `pos`
  - `cooldowns`
  - `statusEffects`
  - `loadout` (weapon/armor/catalyst/spells)

### 11.2 Action Intent
- `ActionIntent`:
  - `unitId`
  - `actionType` (MOVE, GUARD, DODGE, WEAPON_ATTACK, CAST_SPELL)
  - `toTile?` (move/dodge destination)
  - `attackId?` (weapon attack identifier)
  - `spellId?` (spell identifier)
  - `targetTile?` or `targetUnitId?`
  - `submittedAt` (client timestamp for UX only)

### 11.3 Combat Events
Events are the contract between server + renderer:
- `MOVE(unitId, from, to)`
- `DODGE(unitId, from, to, evasionType)`
- `ATTACK(unitId, attackId, targetUnitId, damage, damageType)`
- `CAST(unitId, spellId, targetTile, affectedUnitIds[], damageMap?)`
- `GUARD(unitId)`
- `RESOURCE(unitId, hpDelta, stamDelta, manaDelta)`
- `DEATH(unitId)`

---

## 12) Minimal Content Set for Demo

Recommended initial content:
- Weapons:
  - Sword (STR/DEX hybrid, melee 1)
  - Spear (STR, melee 2)
  - Bow (DEX, ranged line)
- Catalysts:
  - Staff (Arcana)
  - Tome/Seal (Faith)
- Spells (2 Arcana, 2 Faith):
  - Arcana: Magic Bolt (single target), Arcane Burst (AOE_CROSS)
  - Faith: Smite (single target holy), Blessing (self-buff or small heal)

---

## 13) Definition of Done (Combat v0.2)

- Grid renders and updates correctly (4x3)
- Spawn positions match: Player A (0,1), Player B (3,1)
- Legal action highlighting works (Move, Dodge, weapon attacks, spells)
- Server resolves deterministically and validates all intents
- CombatEvents drive smooth animations and a replay log
- Match ends reliably (HP <= 0)

---

## 14) Future Extensions (Not Required for Demo)

- Additional stats (Poise, Focus), status effects, stagger/interrupts
- Tile effects (fire, traps, buffs)
- Advanced spellcasting (channels, lines, cones)
- Class skill trees
- Ranked ladders & tournaments
- Non-crypto onboarding
