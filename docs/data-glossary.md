# Database & Game Data Glossary (Crucible)

This glossary explains the **Prisma database schema** and the main “game data” concepts it represents:
- user accounts + social
- gladiators + progression
- equipment instances (player-owned)
- equipment templates + action templates (admin-authored game data)
- match/challenge flows
- loadouts and equipped gear slots

> **Important design intent**
> - **Templates** are game definitions authored via Admin UI and exported to JSON/TS for runtime.
> - **Instances** are player-owned items tracked in the database.
> - Combat runtime should read **published JSON/TS** definitions, not query template tables live.

---

## 1) Enums

### `GameDataStatus`
Status lifecycle for authoring and publishing game-data templates.
- `DRAFT`: editable, not considered “live”
- `PUBLISHED`: validated + exported and safe for runtime consumption
- `DEPRECATED`: old content kept for history / backwards compatibility

### `EquipmentType`
High-level category for a template (not an instance).
- `WEAPON`: grants attack actions
- `ARMOR`: defensive stats and modifiers
- `CATALYST`: enables spellcasting and spell slots (Arcana or Faith)
- `TRINKET`: misc utility items (later)
- `AUGMENT`: socketables / modifiers (later)

### `EquipmentSlot`
Logical equip slot. Used by the equipped-items join table and templates.
- `MAIN_HAND`, `OFF_HAND`
- `HELMET`, `CHEST`, `GAUNTLETS`, `GREAVES`

> Future slots are commented out in schema (rings, amulet, relic, etc.).

### `ActionCategory`
What kind of action a template represents.
- `WEAPON_ATTACK`: weapon-granted attacks (demo core)
- `CAST`: spell cast actions, usually tied to catalysts/spell slots
- `MOBILITY`: dodge, dash, roll (likely universal)
- `UTILITY`: buffs, stance changes, etc.

---

## 2) Core Account & Social Models

### `User`
Represents a player account.
- `id`: UUID primary key
- `email`: login identity
- `walletAddress`: optional blockchain wallet address (unique when present)
- `username`: public identity (unique)
- `createdAt`, `updatedAt`: audit timestamps

**NextAuth tables**
These exist to support authentication sessions:
- `Account`, `Session`, `VerificationToken`

---

### `Friend`
Represents a friendship edge between users (implementation-specific).
Typical usage:
- friend requests / accepted friends list
- social graph for matchmaking and inviting

(See schema for exact fields; treat as “social relationship record.”)

---

## 3) Gladiators & Progression

### `Gladiator`
A player-controlled unit with base stats, progression, and loadout state.

**Identity**
- `id`: UUID
- `tokenId`: numeric unique id (future NFT token id or internal unique id)
- `ownerId`: owning user
- `class`: string (e.g. Duelist/Brute/Assassin).  
  **Demo note:** class is currently a label/stat preset only; class-granted abilities come later.

**Progression**
- `level`: starts at 1
- `xp`: experience points
- `skillPointsAvailable`: points to spend on unlocks
- `unlockedSkills`: `String[]` of skill IDs (these IDs point to static definitions later)

**Base Stats (8)**
These are the “Elden Ring / DnD-ish” attributes:
- `constitution`: scales health + stamina
- `strength`: heavy melee scaling
- `dexterity`: finesse/ranged scaling
- `speed`: affects movement/cooldown pacing (design-dependent)
- `defense`: physical mitigation
- `magicResist`: magic mitigation
- `arcana`: arcane scaling + mana regen
- `faith`: faith scaling + mana regen

**Legacy equipped fields (kept for compatibility)**
- `equippedWeaponId`, `equippedWeapon`
- `equippedArmorId`, `equippedArmor`

> These are “v0” fields. The scalable equip model is `GladiatorEquippedItem` (below).

**Relations**
- `matchesAsP1`, `matchesAsP2`: match participation
- `challengesAsG1`, `challengesAsG2`: challenge participation
- `equippedItems`: **new** slot-based equipped mapping
- `loadout`: optional row containing prepared spell IDs / ability IDs

---

### `GladiatorLoadout`
Stores “between-match choices” (what’s equipped/prepared), separate from what the gladiator permanently knows.

- `id`
- `gladiatorId`: unique (one loadout per gladiator)
- `preparedSpellIds`: ordered list of spell keys/IDs  
  Interpretation: corresponds to catalyst spell slots (slot 0, slot 1, …)
- `equippedAbilityIds`: ordered list of ability keys/IDs  
  Used later when class abilities exist
- `label`: optional name
- `updatedAt`

> **Design rule:** Loadout stores *references*, not behavior. Behavior is defined in JSON/TS templates.

---

## 4) Equipment Instances (Player-Owned Items)

### `Equipment`
Represents a specific owned item instance (inventory object).

**Ownership**
- `id`
- `ownerId`, `owner`: the user who owns it

**Template linkage (new)**
- `templateId`: optional link to `EquipmentTemplate`
- `template`: the template definition (what the item “is”)

**Instance modifiers (new)**
- `rolledMods` (`Json`): rolled affixes / randomized stat rolls  
  Use this for loot box outcomes and per-instance variance.
- `grantedPerkIds` (`String[]`): optional list of perk IDs granted by this instance  
  (Useful if perks can be rolled or minted per-instance.)

**Legacy / transitional fields**
- `type`: string (“Weapon”, “Armor”) — transitional; templates use `EquipmentType`
- `rarity`: string (“Common”, “Rare”, “Epic”) — transitional; templates can define rarity rules
- `name`: string

**Legacy stat columns (nullable)**
- `attackBonus`
- `defenseBonus`
- `speedBonus`

> Long-term: favor `template.baseStatMods` + `equipment.rolledMods` instead of fixed columns.

**Equipping relation**
- `equippedBy`: back-reference list of `GladiatorEquippedItem` rows where this item is equipped.

---

### `GladiatorEquippedItem`
The scalable, slot-based equip mapping. This is the preferred model going forward.

- `id`
- `gladiatorId`
- `slot`: `EquipmentSlot` (MAIN_HAND, HELMET, etc.)
- `equipmentId`

Constraints:
- `@@unique([gladiatorId, slot])` ensures only one item per slot per gladiator.

> Migration path: keep legacy `equippedWeaponId/equippedArmorId` until code is updated,
> then switch fully to `GladiatorEquippedItem`.

---

## 5) Matches & PvP Flow

### `Match`
Represents a resolved or in-progress combat session.
Common semantics (implementation depends on code):
- links to `gladiator1` and `gladiator2` (via relations)
- stores outcome (winner, timestamps, etc.)
- may store replay/log pointers later

(See schema for exact fields; treat as “authoritative match record.”)

---

### `Challenge`
Represents a direct “challenge” invitation between players/gladiators.
Typical semantics:
- challenger vs challenged
- selected gladiators
- pending/accepted/declined states
- used to spawn a `Match`

(See schema for exact fields.)

---

## 6) Game Data Authoring & Publishing Layer (Templates)

This layer exists to support:
- admin UI authoring
- validation
- publishing/versioning
- exporting to JSON/TS runtime bundles

### `GameDataBundle`
Represents a “published set” of game data.
- `id`
- `label`: unique human name (e.g. `demo-v0`, `season-1`)
- `status`: DRAFT/PUBLISHED/DEPRECATED (bundle lifecycle)
- `isActive`: which bundle is currently “live”
- `exportTarget`: where exported files are written (optional)
- `gitCommitSha`: optional commit pointer (if exporting to repo)
- timestamps
- relations:
  - `equipmentTemplates`: templates included in this bundle
  - `actionTemplates`: actions included in this bundle

---

### `EquipmentTemplate`
Defines what an equipment archetype is (the “static definition”).
Instances reference templates.

Key fields:
- `id`
- `key`: canonical identifier used in JSON/TS (unique)
- `name`, `description`
- `status`, `version`
- `type`: `EquipmentType`
- `slot`: `EquipmentSlot`
- `subtype`: string (e.g. `"SWORD"`, `"BOW"`, `"CHEST"`, `"STAFF"`)
- `tags`: string array for search/filtering

**Behavior payload (JSON)**
- `baseStatMods`: template baseline modifiers  
- `scaling`: weapon/catalyst scaling rules  
- `rarityRules`: template-defined roll/rarity constraints (optional early)
- `ui`: icon/sprite keys and presentation data

**Bundle link**
- `bundleId`, `bundle`

**Relations**
- `actions`: join rows linking template → action definitions
- `instances`: reverse link to owned `Equipment` rows

---

### `ActionTemplate`
Defines an action (attack/cast/mobility/utility) in a data-driven way.

Key fields:
- `id`
- `key`: canonical identifier used in runtime
- `name`, `description`
- `status`, `version`
- `category`: `ActionCategory`
- `cooldownMs`
- `castTimeMs`
- `staminaCost`
- `manaCost`

**Behavior payload (JSON)**
- `hitboxConfig`
- `projectileConfig`
- `damageConfig`
- `effectConfig`

**Bundle link**
- `bundleId`, `bundle`

**Relations**
- `equipment`: join rows linking action ↔ equipment templates

---

### `EquipmentTemplateAction`
Join table connecting equipment templates to the actions they grant.
- `equipmentTemplateId`
- `actionTemplateId`
- `sortOrder`: optional ordering for UI/action bar

Constraint:
- `@@unique([equipmentTemplateId, actionTemplateId])`

---

## 7) Action & Attack Vocabulary (Shared Language)

This section standardizes terms so combat data stays consistent.

### “Action”
A thing a player can trigger:
- weapon attack
- cast spell slot
- dash/roll
- stance toggle

Actions have:
- costs (`staminaCost`, `manaCost`)
- timing (`castTimeMs`, `cooldownMs`)
- a behavior definition (`hitboxConfig` / `projectileConfig` / `effectConfig`)

---

### “Attack”
An action that deals damage, usually category `WEAPON_ATTACK` or `CAST`.

Attacks can be:
- **melee hitbox**
- **projectile**
- **AoE zone**
- **beam/line**
- **self-centered burst**

---

## 8) Suggested JSON Shapes (Conventions)

These are recommended shapes for the JSON payload fields. Treat them as “schemas” to validate in code.

### 8.1 `EquipmentTemplate.baseStatMods`

**Example:**

```json
{
  "def": 3,
  "speed": -1,
  "staminaRegenPct": -5
}
```

### 8.2 `EquipmentTemplate.scaling`

Defines how an item’s effectiveness scales with Gladiator stats.

**Example (balanced melee weapon):**

```json
{ "str": 0.6, "dex": 0.4 }
```

**Example (pure Dexterity weapon):**

```json
{ "dex": 1.0 }
```

**Example (Arcana-based catalyst):**

```json
{ "arc": 1.0 }
```


---

### 8.3 `Equipment.rolledMods`

Represents per-instance stat variance and rolled affixes.
This is applied on top of the template’s `baseStatMods`.

**Example:**

```json
{
  "def": 1,
  "speed": 1,
  "perkIds": ["perk:bleed_on_hit"]
}
```

**Use cases:**
- loot box rolls
- rarity scaling
- NFT uniqueness

> This field should always be treated as optional and additive.


---

### 8.4 `ActionTemplate.hitboxConfig`

Defines the spatial behavior of melee or AoE actions.

**Common fields:**
- `shape`: ARC | CIRCLE | RECT | LINE
- `radius` or `width`/`height`
- `angleDeg` (for ARC)
- `range` (distance from origin)
- `offset` (relative spawn position)

**Example (sword arc attack):**

```json
{
  "shape": "ARC",
  "radius": 1.6,
  "angleDeg": 80,
  "range": 1.2
}
```

**Example (circular AoE):**

```json
{
  "shape": "CIRCLE",
  "radius": 2.5
}
```

---

### 8.5 `ActionTemplate.projectileConfig`

Defines how projectile-based actions behave.

**Common fields:**
- `speed`
- `radius` (collision size)
- `ttlMs` (time-to-live)
- `maxRange`
- `pierce` (boolean or count)
- `gravity` (optional)
- `spawnOffset`

**Example (arrow projectile):**

```json
{
  "speed": 12,
  "radius": 0.15,
  "ttlMs": 1200,
  "maxRange": 18
}
```

**Example (magic bolt):**

```json
{
  "speed": 9,
  "radius": 0.25,
  "ttlMs": 1500,
  "pierce": false
}
```

---

### 8.6 `ActionTemplate.damageConfig`

Defines damage calculation and scaling rules.

**Common fields:**
- `base` (flat base damage)
- `type` (PHYSICAL, ARCANE, HOLY, FIRE, etc.)
- `scaling` (stat multipliers)
- `critChance` (optional)
- `critMult` (optional)
- `falloff` (optional)

**Example (physical weapon attack):**

```json
{
  "base": 14,
  "type": "PHYSICAL",
  "scaling": { "str": 0.7 }
}
```

**Example (arcane spell):**

```json
{
  "base": 10,
  "type": "ARCANE",
  "scaling": { "arc": 1.0 }
}
```

---

### 8.7 `ActionTemplate.effectConfig`

Defines non-damage effects applied by an action.

**Common use cases:**
- buffs / debuffs
- status effects
- knockback or pull
- shields or heals
- invulnerability windows

**Example (dodge roll):**

```json
{
  "iframesMs": 200,
  "dashDistance": 3.5
}
```

**Example (holy buff):**

```json
{
  "buff": "holy_power",
  "durationMs": 6000
}
```

---

## 9) Derived Combat Stats (Runtime Convention)

At the start of a match, the server computes an “effective build”:

1. Gladiator base stats
2. `EquipmentTemplate.baseStatMods`
3. `Equipment.rolledMods`
4. Passive perks and conditional effects

**This aggregated stat block is:**
- immutable for the duration of the match
- cached for performance
- the sole input to combat calculations

> Runtime combat code should never query templates or instances mid-match.


---

## 10) Demo Scope Note (Current)

For the demo build:

**Included:**
- Weapon-based combat kits
- Actions granted exclusively by weapons
- Slot-based equipment equipping
- Template-driven stats and behavior

**Explicitly deferred:**
- Class-based ability kits
- Skill trees
- Crafting systems
- Durability
- Economy balancing
- Affix combinatorics

This is intentional and documented to prevent premature system complexity.

---

## 11) Guiding Principles (Do Not Break These)

- No hardcoded equipment slots on Gladiator
- No behavior hidden in conditional code paths
- No runtime dependency on database templates
- Templates define behavior, instances define ownership
- Admin tooling drives content velocity

This glossary is the contract for future gameplay, tooling, and economy work.

