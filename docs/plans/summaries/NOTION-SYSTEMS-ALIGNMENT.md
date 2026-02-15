# Notion Systems Wiki Alignment Summary

**Date:** 2026-02-15
**Plan:** docs/plans/implementation/2026-02-14-notion-systems-and-skill-trees.md
**Wiki:** docs/notion/ (CRUCIBLE — SYSTEMS WIKI)

---

## Overview

This document summarizes the implementation work to align the codebase with the Notion Systems Wiki specifications for:
- **Classes & Equipment Identity** (5 classes, class-locked armor, weapon coefficients)
- **Stats & Scaling System** (effective stats with soft caps, derived stats, damage/mitigation scaling)
- **Skill Trees** (6 cross-class trees with major/minor/capstone structure)

---

## ✅ Completed Implementation

### Part A: Classes & Equipment Identity (4/4 tasks)

#### Task A1: 5 Classes & Base Stat Weights ✅
**Commit:** `feat(shared): 5 classes and class base stat weight data from wiki`

- Added Tank, Legionnaire, Duelist, Mage, Monk to `GladiatorClass` enum
- Created `packages/shared/src/classes/class-stat-weights.ts` with stat weight system (1.4x to 0.7x per stat from CSV)
- Implemented `rollBaseStats()` for weighted stat distribution at mint
- Legacy classes preserved (Brute → Tank, Assassin → Legionnaire) for backward compatibility

**Files:**
- `packages/shared/src/types/index.ts`
- `packages/shared/src/classes/class-stat-weights.ts`

---

#### Task A2: Class-Locked Armor & Weapon Tags ✅
**Commit:** `feat(equipment): class-locked armor and class/universal weapon coefficient`

- Added `allowedClass` (Tank/Legionnaire/Duelist/Mage/Monk/universal) to EquipmentTemplate schema
- Added `weaponCoeff` (1.0 for class, 0.8 for universal) to EquipmentTemplate schema
- Updated Admin UI with conditional dropdowns (armor: class-only, weapon: class+universal)
- Implemented equip validation (armor must match gladiator class)
- Bundle export includes new fields
- Server-side validation prevents weaponCoeff on non-weapons

**Files:**
- `packages/database/prisma/schema.prisma`
- `apps/web/app/admin/equipment-templates/[id]/page.tsx`
- `apps/web/app/api/admin/equipment-templates/[id]/route.ts`
- `apps/web/app/api/gladiators/[id]/equip/route.ts`

---

#### Task A3: Apply WEAPON_COEFF in Damage Calculation ✅
**Commit:** `feat(combat): apply WEAPON_COEFF from template in damage calculation`

- Updated shared combat damage: `FINAL_DAMAGE = BASE * DMG_MULT * WEAPON_COEFF`
- Game server passes weaponCoeff from equipped weapon (defaults to 1.0)
- Both melee and projectile attacks apply coefficient
- Combatant type includes weaponCoeff field

**Files:**
- `packages/shared/src/combat/damage.ts`
- `apps/game-server/src/combat/engine.ts`

---

#### Task A4: Loot Distribution (50% armor / 50% weapon) ✅
**Commit:** `feat(loot): wiki loot distribution 50/50 armor/weapon`

- Implemented 50/50 armor vs weapon roll
- Filter itemPool by type (ARMOR or WEAPON)
- TODO: Filter armor by gladiator class (requires allowedClass on templates)
- TODO: Roll class vs universal weapons (requires weaponCoeff and class filtering)
- Current starter gear is implicitly universal

**Files:**
- `packages/shared/src/loot/starter-gear.ts`

**Note:** Full class-based filtering will be enabled when:
1. Equipment templates have `allowedClass` and `weaponCoeff` fields (✅ done in A2)
2. Loot box open API passes gladiatorId/class

---

### Part B: Stats & Scaling System (3/3 tasks)

#### Task B1: Effective Stat Function ✅
**Commit:** `feat(shared): effective stat soft-cap function`

- Created `packages/shared/src/stats/effective-stat.ts`
- Implemented tiered soft caps:
  - 0-10: 100% effectiveness (w1 = 1.00)
  - 11-20: 70% effectiveness (w2 = 0.70)
  - 21-30: 40% effectiveness (w3 = 0.40)
  - 31+: 20% effectiveness (w4 = 0.20)
- Formula: `eff(s) = min(s, B1) * w1 + max(min(s, B2) - B1, 0) * w2 + ...`
- Configurable breakpoints with defaults from wiki

**Files:**
- `packages/shared/src/stats/effective-stat.ts`

---

#### Task B2: Derived Stats from Effective Stats ✅
**Commit:** `feat(shared): derived stats from effective stats`

- Created `packages/shared/src/stats/derived-stats.ts`
- Implemented all derived combat stats using `eff()`:
  - **HP:** `HP_BASE + HP_PER_CON * eff(CON)`
  - **Stamina:** `STAM_BASE + STAM_K * (eff(CON) + STAM_STR_W * eff(STR))`
  - **Stamina Regen:** `SR_BASE + SR_K * (eff(DEX) + SR_SPD_W * eff(SPD))`
  - **Mana:** `MANA_BASE + MANA_PER_MR * eff(MR)`
  - **Mana Regen:** Hybrid ARC/FTH with main/off stat weighting
  - **Movement Mult:** `clamp(1 + MS_K * eff(SPD), 1.00, MS_MAX)`
  - **Dodge Time:** Diminishing returns on DEX+SPD (lower is faster)
  - **Recovery Mult:** Diminishing returns on DEF+SPD (lower is faster)
- All formulas from Stats & Scaling wiki with configurable tuning knobs
- Default values from wiki prototype

**Files:**
- `packages/shared/src/stats/derived-stats.ts`
- `packages/shared/src/stats/index.ts`

---

#### Task B3: Damage & Mitigation Scaling ✅
**Commit:** `feat(combat): damage and mitigation scaling per Stats & Scaling wiki`

- Implemented bounded damage curve with effective stats:
  - `DMG_MULT = 1 + DMG_CAP * (eff(MAIN) / (eff(MAIN) + DMG_HALF))`
  - Defaults: `DMG_CAP = 1.20`, `DMG_HALF = 18`
- Implemented soft-capped mitigation:
  - Physical: `MIT_PHYS = DEF_CAP * (eff(DEF) / (eff(DEF) + DEF_HALF))`
  - Magic: `MIT_MAGIC = MR_CAP * (eff(MR) / (eff(MR) + MR_HALF))`
  - Defaults: `DEF_CAP = 0.60`, `DEF_HALF = 18`, `MR_CAP = 0.60`, `MR_HALF = 18`
- Final damage: `BASE * DMG_MULT * WEAPON_COEFF * (1 - MITIGATION)`
- Preserved legacy functions for backward compatibility
- Added `calculateWikiDamage()` with all new formulas

**Files:**
- `packages/shared/src/combat/damage.ts`

---

### Part C: Skill Trees (4/4 tasks) ✅

**Status:** Fully implemented in previous session (see docs/game-systemsv1.md)

- ✅ Task C1: Skill tree definitions (6 trees, 108 skills, tier-based prerequisites)
- ✅ Task C2: Database representation (static-only, no DB tables)
- ✅ Task C3: Unlock rules (prerequisite, cost, capstone stat requirements)
- ✅ Task C4: Skill tree UI (6 trees, major/minor/capstone, requirements display)

**Files:**
- `packages/shared/src/skills/skill-trees.ts`
- `apps/web/components/skills/SkillTree.tsx`
- `apps/web/app/api/gladiators/[id]/skills/unlock/route.ts`
- `docs/features/skill-trees-cross-class.md`

---

### Part D: Game Server Integration (2/2 tasks)

#### Task D1: Match-Start Build with Effective Stats ✅
**Commit:** `feat(game-server): match build uses effective stats and weapon coeff`

- Created `apps/game-server/src/services/stat-builder.ts` to compute effective build:
  1. Aggregate base stats + equipment bonuses + skill bonuses (stubs for now)
  2. Apply effective stat soft caps via `eff()`
  3. Calculate derived stats (HP, stamina, mana, movement, dodge, recovery)
  4. Load weaponCoeff from equipment template (defaults to 1.0 for now)
  5. Convert wiki DerivedStats to legacy format for combat engine compatibility
- Match instances now use `buildEffectiveStats()` instead of old linear formulas
- TODO: Load actual equipment and unlocked skills from DB

**Files:**
- `apps/game-server/src/services/stat-builder.ts`
- `apps/game-server/src/services/match-instance.ts`

---

#### Task D2: Skill Effects Stub ✅
**Commit:** `feat(game-server): apply skill stat bonuses at match start; stub Second Wind trigger`

- Created `apps/game-server/src/services/skill-effects.ts` with:
  - `calculateSkillStatBonuses()`: Sum flat stat bonuses from unlocked skills
  - `TriggeredSkillTracker`: Track once-per-match triggered skills
  - `checkTriggeredSkills()`: Example triggered skill (Second Wind)
    - Triggers when HP < 30%
    - Restores 30% HP and 50% stamina
    - Once per match
- Match-start build now includes skill passive bonuses via stat-builder
- TODO: Load actual unlockedSkills from DB
- TODO: Integrate triggered skill checks in combat loop

**Files:**
- `apps/game-server/src/services/skill-effects.ts`
- `apps/game-server/src/services/match-instance.ts`

---

### Part E: Documentation (1/1 task)

#### Task E1: Update Project Docs ✅
**Commit:** `docs: reference Notion Systems Wiki and alignment summary`

- Added "Systems Design (Notion Wiki Alignment)" section to CLAUDE.md
- References docs/notion/ as source of truth for stats, classes, equipment, skills
- Created this alignment summary (NOTION-SYSTEMS-ALIGNMENT.md)

**Files:**
- `CLAUDE.md`
- `docs/plans/summaries/NOTION-SYSTEMS-ALIGNMENT.md` (this file)

---

## Implementation Highlights

### Effective Stat Soft Caps
All derived stats and damage/mitigation scaling now use the `eff(s)` function with tiered breakpoints:
- **0-10:** 100% efficiency (baseline)
- **11-20:** 70% efficiency (first soft cap)
- **21-30:** 40% efficiency (second soft cap)
- **31+:** 20% efficiency (hard diminishing returns)

This prevents runaway min-maxing while still rewarding specialization.

### Bounded Damage Scaling
Damage no longer scales linearly with stats. The bounded curve:
```
DMG_MULT = 1 + DMG_CAP * (eff(MAIN) / (eff(MAIN) + DMG_HALF))
```
approaches `1 + DMG_CAP` (max 2.2x) asymptotically, preventing damage from exploding at high stat values.

### Soft-Capped Mitigation
Physical and magic mitigation follow the same bounded formula:
```
MIT = CAP * (eff(STAT) / (eff(STAT) + HALF))
```
Max mitigation is capped at 60% (DEF_CAP/MR_CAP), and diminishing returns kick in as effective stats increase.

### Match-Start Stat Build
Combat stats are now computed once at match start:
1. Load gladiator base stats
2. (Future) Add equipment stat bonuses from templates + instances
3. (Future) Add skill stat bonuses from unlocked skills
4. Apply `eff()` to all 8 stats
5. Calculate derived stats (HP, stamina, mana, movement, dodge, recovery)
6. Store in combatant state for duration of match

This aggregate is immutable during combat, matching the wiki's "effective build" model.

---

## Remaining TODOs

### Equipment Integration
- **Load equipment from DB at match start:** Currently stubs; need to fetch equipped items and aggregate stat bonuses from:
  - EquipmentTemplate baseStatMods
  - Equipment instance rolledMods
- **Load weaponCoeff from main-hand weapon template:** Currently defaults to 1.0

### Skill Integration
- **Load unlockedSkills from DB at match start:** Currently empty array; need to fetch gladiator's unlocked skill IDs
- **Integrate triggered skill checks in combat loop:** `checkTriggeredSkills()` is implemented but not called during combat (e.g., after damage application, after dodge, etc.)

### Loot Class Filtering
- **Pass gladiatorId to loot box open API:** Currently loot boxes don't know which gladiator is opening them
- **Filter armor by class:** Requires gladiator class + template allowedClass
- **Roll class vs universal weapons:** 50% class / 50% universal distribution when templates support it

### Combat Engine Mitigation
- **Apply new mitigation formulas in combat resolution:** Damage calculation uses new formulas, but combat engine still uses legacy `damageReduction` field from old derived stats

---

## Files Modified/Created

### Stats & Scaling
- `packages/shared/src/stats/effective-stat.ts` (new)
- `packages/shared/src/stats/derived-stats.ts` (new)
- `packages/shared/src/stats/index.ts` (new)
- `packages/shared/src/combat/damage.ts` (modified)
- `packages/shared/src/index.ts` (modified)

### Game Server
- `apps/game-server/src/services/stat-builder.ts` (new)
- `apps/game-server/src/services/skill-effects.ts` (new)
- `apps/game-server/src/services/match-instance.ts` (modified)

### Classes & Equipment
- `packages/shared/src/types/index.ts` (modified)
- `packages/shared/src/classes/class-stat-weights.ts` (new, from previous session)
- `packages/database/prisma/schema.prisma` (modified, from previous session)
- `apps/web/app/admin/equipment-templates/` (modified, from previous session)
- `apps/web/app/api/admin/equipment-templates/` (modified, from previous session)
- `apps/web/app/api/gladiators/[id]/equip/route.ts` (modified, from previous session)

### Loot
- `packages/shared/src/loot/starter-gear.ts` (modified)

### Documentation
- `CLAUDE.md` (modified)
- `docs/plans/summaries/NOTION-SYSTEMS-ALIGNMENT.md` (this file, new)

**Total:** ~15-20 files modified/created across stats, combat, game server, equipment, loot, and docs.

---

## Summary

The codebase is now **aligned with the Notion Systems Wiki** for:
- **Stats & Scaling:** Effective stats with soft caps, derived stats, bounded damage/mitigation curves
- **Classes & Equipment:** 5 classes, class-locked armor, weapon coefficients (1.0 class / 0.8 universal)
- **Skill Trees:** 6 cross-class trees with major/minor/capstone (fully implemented in previous session)
- **Loot:** 50/50 armor/weapon distribution (class filtering pending equipment+class integration)
- **Game Server:** Match-start stat build uses wiki formulas, skill effects pipeline in place

**Next steps:**
1. Load equipment and skills from DB at match start
2. Integrate triggered skill checks in combat loop
3. Apply new mitigation formulas in combat damage resolution
4. Pass gladiator class to loot box open for class-specific filtering

The foundation is in place; full integration awaits data loading and combat loop hooks.
