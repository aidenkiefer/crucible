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
- Class ability kits
- Skill trees
- Deep affix systems
- Crafting
- Durability
- Economy balancing

---

## 9. Guiding Principles (Do Not Break These)

- No hardcoded equipment slots on Gladiator
- No behavior hidden in code branches
- No runtime dependency on DB for combat
- Templates define behavior, instances define ownership
- Admin tooling drives content velocity

This document is the contract for all future loot and equipment work.
