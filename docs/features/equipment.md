# Loot, Equipment, and Ability System — Design Notes (v0.2)

This document defines the **authoritative design direction** for equipment, loot, and abilities.
It reflects current decisions around:
- database-backed templates
- admin tooling
- runtime data flow
- demo scope vs future scope

This is a **design and planning document**, not an implementation spec.

---

## 1. High-Level Philosophy

The system is built around three core principles:

1. **Templates define what items are**
2. **Instances define what players own**
3. **Runtime behavior is driven by static data, not database queries**

The database is used as an **authoring and collaboration layer**, not as the live runtime dependency for combat logic.

---

## 2. Equipment Slots & Equipping Model

### 2.1 Slot-Based Equipping (Extensible)

Gladiators equip items via **logical gear slots**, not hardcoded fields.

Instead of fields like:
- `equippedWeaponId`
- `equippedArmorId`

We model equipment as:
- Gladiator ⟷ Slot ⟷ Equipment Instance

This avoids schema churn and supports future expansion.

---

### 2.2 Canonical Equipment Slots

Initial supported slots:

- `MAIN_HAND`
- `OFF_HAND`
- `HELMET`
- `CHEST`
- `GAUNTLETS`
- `GREAVES`

Planned (not required for demo):

- `RING_1`, `RING_2`
- `AMULET`
- `RELIC`
- `AUGMENT_1`, `AUGMENT_2`

Slots are **data-driven**, not schema-bound.

---

### 2.3 Slot Validation

Equipment templates declare:
- which slot(s) they are compatible with

The equip system enforces:
- one item per slot
- valid slot/type combinations

---

## 3. Weapon-Based Kits (Demo Scope)

### 3.1 Demo Rule

> **For the demo, all active combat actions come from weapons.**

There are:
- no class-based ability kits yet
- no skill trees yet

Weapons define:
- available attacks
- stamina costs
- cooldowns
- hitbox/projectile behavior

---

### 3.2 Future Rule (Post-Demo)

Later:
- Classes grant 1–2 signature abilities
- Classes grant passives
- Weapons remain the primary source of baseline attacks

This split is intentional and documented to avoid rework.

---

## 4. Spells, Abilities, and Loadouts

### 4.1 Static Definitions vs Player Choices

All spells, abilities, and perks are defined as **templates**.

Gladiators store only:
- references to what they know
- references to what they have equipped/prepared

Behavior is resolved at runtime by loading static definitions.

---

### 4.2 Prepared Spells (Spellcasting Equipment)

Spellcasting equipment (tomes, staffs, seals) defines:
- number of spell slots
- magic school (Arcana or Faith)
- casting modifiers

Gladiators prepare spells by assigning **spell IDs** to those slots.

Prepared spells are part of a Gladiator’s **loadout**, not intrinsic identity.

---

### 4.3 Loadout Storage

For early development:
- prepared spells
- equipped abilities

may be stored as structured JSON tied to the Gladiator or loadout entity.

This can be normalized later if needed.

---

## 5. Equipment Templates (Authoring Layer)

### 5.1 Template vs Instance

**EquipmentTemplate**
- Defines the item archetype
- Authored and edited via Admin UI
- Synced to JSON/TS for runtime use

**EquipmentInstance**
- Represents a specific player-owned copy
- Stores rolled stats, rarity, ownership
- References a template

---

### 5.2 EquipmentTemplate Responsibilities

An EquipmentTemplate defines:

- identity and presentation
- equip slot compatibility
- stat modifiers
- scaling rules
- granted actions or abilities
- rarity and affix rules (optional for demo)

It does **not**:
- track ownership
- track current durability
- contain runtime state

---

### 5.3 Flexible Modifier Model

Instead of fixed stat columns, templates use **structured modifier payloads**.

Supported modifier categories:

- **Base stat modifiers**
  - e.g. `{ "def": +3, "speed": -1 }`

- **Scaling rules**
  - e.g. `{ "str": 0.7, "dex": 0.3 }`

- **Granted actions**
  - list of action IDs enabled by this item

- **Passive perks**
  - e.g. bleed-on-hit, stamina reduction, etc.

- **Weapon configuration**
  - hitbox shape
  - projectile behavior
  - stamina cost
  - cooldown
  - damage type

This enables deep behavior without code branching.

---

### 5.4 Rarity & Roll Rules (Future-Facing)

Templates may optionally define:
- allowed rarity tiers
- affix pools
- roll ranges
- drop-only vs mintable flags

These are **template rules**, not instance values.

---

## 6. Action Templates

### 6.1 ActionTemplate Role

Actions define **what happens when a player presses a button**.

Weapons grant actions.
Catalysts grant cast actions.
Classes will later grant signature actions.

Actions are defined independently of equipment instances.

---

### 6.2 ActionTemplate Contains

- identity (key, name)
- category (weapon attack, spell, utility)
- stamina and mana costs
- cooldowns and cast times
- hitbox or projectile configuration
- scaling and damage rules

Actions are static data, mirrored in DB for editing and exported to JSON/TS.

---

## 7. Static Game Data vs Database Storage

### 7.1 Division of Responsibility

**Static Game Data (JSON/TS)**
- equipment templates
- action templates
- spell templates
- perk definitions
- class definitions
- rarity rules

**Database (Dynamic State + Authoring)**
- template drafts and versions
- player-owned equipment instances
- equipped gear
- gladiator progression
- match history

Runtime combat logic **does not query the database for templates**.

---

### 7.2 Authoring & Sync Workflow

1. Developers/designers edit templates via Admin UI
2. Templates are stored in DB as drafts
3. Publishing triggers:
   - validation
   - export to canonical JSON/TS format
   - version tagging
4. Game server loads the published data bundle

The database is a **tooling layer**, not a runtime dependency.

---

## 8. Demo Scope Summary

**Included in Demo**
- Weapon-based combat kits
- Equipment templates in DB
- Action templates in DB
- JSON/TS export for runtime
- Manual content authoring via Admin UI

**Explicitly Deferred**
- Class ability kits (Sprint 8+)
- Deep affix systems (Sprint 8+)
- Durability (Sprint 8+)
- Economy balancing (Sprint 8+)

**Now Implemented (Sprint 5)**
- ✅ Skill trees (4 classes, 4-5 branches each)
- ✅ Crafting (3→1 with rarity upgrades)
- ✅ Salvaging (equipment → Gold)
- ✅ Gold economy (mock for demo, ETH-backed in production)
- ✅ Loot boxes (Wooden tier with starter gear pool)

---

## 9. Sprint 5: Progression & Loot System

### 9.1 Loot Box System

**Implementation:**
- CPU match wins award Wooden Loot Box (80% drop rate)
- Loot boxes contain random starter gear (4 armor sets, 7 weapons)
- Opening consumes the box and creates an Equipment instance
- Equipment references StarterGearItem definitions in shared package

**Starter Gear Pool:**

**Armor (4 sets):**
- Balanced Armor (3 CON, 3 DEF, -1 SPD)
- Heavy Armor (5 CON, 5 DEF, -3 SPD)
- Light Armor (1 CON, 1 DEF, 3 SPD, 2 DEX)
- Mage Robes (4 ARC, 3 MAG_RES, -1 DEF)

**Weapons (7 types):**
- Iron Sword (2 STR, 0.6 STR scaling, 0.3 DEX scaling)
- Training Spear (1 STR, 1 DEF, reach weapon)
- Short Bow (3 DEX, 0.8 DEX scaling, projectile)
- Steel Dagger (2 DEX, 1 SPD, fast attacks)
- Heavy Axe (4 STR, -2 SPD, 0.9 STR scaling)
- War Hammer (3 STR, -1 DEF, armor-breaking)
- Wooden Staff (3 ARC, 1.0 ARC scaling, magic catalyst)

All starter gear is Common rarity with fixed stat bonuses.

---

### 9.2 Crafting System (3→1)

**Rules:**
- Combine 3 equipment items → 1 new item
- Output type determined by majority (or random if tie)
- Output rarity determined by input rarities:
  - All same rarity: 90% chance to upgrade tier
  - Mixed rarities: 50% chance to upgrade from highest tier
- Output stats randomly generated based on rarity tier
- Source items are consumed (deleted)

**Rarity Tiers:**
1. Common (2 stats)
2. Uncommon (3 stats)
3. Rare (4 stats)
4. Epic (5 stats)
5. Legendary (6 stats)

**Example:**
- Craft 3 Common swords → 90% chance for Uncommon sword
- Craft 2 Common + 1 Rare → 50% chance for Epic

---

### 9.3 Salvaging System

**Rules:**
- Destroy equipment → receive Gold
- Salvage values by rarity:
  - Common: 10 Gold
  - Uncommon: 25 Gold
  - Rare: 50 Gold
  - Epic: 100 Gold
  - Legendary: 250 Gold
- Cannot salvage equipped items (must unequip first)

**Gold Economy:**
- Mock implementation for demo (UserGold table)
- Production: ETH-backed (purchase Gold with ETH)
- Used for future systems (marketplace, cosmetics, etc.)

---

### 9.4 XP & Leveling

**Implementation:**
- Win match: 100 XP
- Lose match: 25 XP
- Level cap: 20
- XP curve: `level * 100 + (level-1) * 50`
  - Level 1→2: 100 XP
  - Level 2→3: 250 XP
  - Level 10→11: 1450 XP

**On Level Up:**
- Auto-increment all 8 stats by 1
- Award 1 skill point
- No manual stat allocation (simplified for demo)

---

### 9.5 Skill Trees

**Structure:**
- 4 classes: Duelist, Brute, Assassin, Mage
- 4-5 branches per class
- Each branch covers specific stats
- Tier-based progression (must unlock lower tiers first)
- Skills cost 1 skill point each
- Skills grant permanent stat boosts

**Example Branches:**

**Duelist:**
1. Precision (STR + DEX)
2. Resilience (CON + DEF)
3. Mobility (SPD)
4. Tactics (FAITH)
5. Arcane Defense (MAG_RES + ARC)

**Brute:**
1. Raw Power (STR)
2. Fortress (CON + DEF)
3. Berserker (CON)
4. Intimidation (FAITH)
5. Unstoppable (SPD)

**Assassin:**
1. Shadow Strike (DEX + STR)
2. Agility (SPD)
3. Deadly Precision (DEX)
4. Evasion (DEF)
5. Poison Arts (ARC + CON)

**Mage:**
1. Arcane Power (ARC)
2. Spell Defense (MAG_RES + DEF)
3. Mystic Knowledge (ARC + CON)
4. Battle Mage (STR + DEX)
5. Divine Faith (FAITH + SPD)

---

### 9.6 Match Persistence

**Implementation:**
- Matches now persist to database after completion
- Tracked stats:
  - Damage dealt per player
  - Dodges used per player
  - Attacks landed per player
- Match history API: `/api/matches/history`
- Rewards tracked: loot box tier, amount
- Match log compressed (last 100 events stored)

---

## 10. Guiding Principles (Do Not Break These)

- No hardcoded equipment slots on Gladiator
- No behavior hidden in code branches
- No runtime dependency on DB for combat
- Templates define behavior, instances define ownership
- Admin tooling drives content velocity

This document is the contract for all future loot and equipment work.
