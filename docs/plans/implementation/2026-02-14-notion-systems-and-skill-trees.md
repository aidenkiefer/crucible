# Notion Systems Wiki & Skill Tree Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the codebase with the Notion Systems Wiki (docs/notion): implement or plan Classes & Equipment Identity, Stats & Scaling System, and the new cross-class Skill Trees design, including skill tree data for the database and runtime.

**Architecture:** Wiki is source of truth. Changes span: (1) shared packages (stats, combat, skills), (2) game server (effective stats, WEAPON_COEFF, class checks), (3) database/Prisma (classes, template fields, optional skill-tree tables), (4) frontend (Camp, skill tree UI). Skill trees move from per-class branches to 6 shared trees (Valor, Instinct, Discipline, Intellect, Zeal, Ferocity) with major/minor/capstone and stat requirements; skill definitions can live in code/JSON first, with optional DB backing later.

**Tech Stack:** TypeScript, Prisma, Next.js, Express, packages/shared (physics, combat, loot, skills). Data sources: docs/notion/*.md, docs/notion/Skill Tree Database *.csv, docs/notion/Capstone Skill Requirements *.csv, docs/notion/Class Base Stat Odds *.csv.

---

## Reference Documents

| Doc | Purpose |
|-----|--------|
| docs/notion/CRUCIBLE — SYSTEMS WIKI *.md | Wiki homepage; links to all systems |
| docs/notion/Classes & Equipment Identity *.md | 5 classes, class-locked armor, class vs universal weapons, WEAPON_COEFF, loot split |
| docs/notion/Stats & Scaling System *.md | 8 stats, effective stat formula, soft caps, derived stats (HP, stamina, mana, mitigation, damage), tuning knobs |
| docs/notion/Skill Trees *.md | 6 trees, 2 major + 1 minor model, capstones (3 per tree), power equivalence, depth tiers |
| docs/notion/Skill Tree Database *.csv | Rows: Skill Name, Tree, Skill Level, Effect Type, Combat Behavior, Flat Stat Bonus, Scaling Mod, Duration, Cooldown, Depth Tier, etc. |
| docs/notion/Capstone Skill Requirements *.csv | Min/Max stat requirements per capstone |
| docs/notion/Class Base Stat Odds *.csv | Weight per stat per class (1.4x down to 0.7x) for base stat generation |
| INDEX.md | File layout; apps/game-server, apps/web, packages/shared, packages/database |
| docs/data-glossary.md | Prisma schema, Gladiator, Equipment, templates, slots, progression |

---

## Current State vs Wiki

- **Classes:** Code has 4 classes (Duelist, Brute, Assassin, Mage in packages/shared/src/types and skill-trees.ts). Wiki specifies 5: Tank, Legionnaire, Duelist, Mage, Monk. Brute/Assassin need mapping or replacement.
- **Stats & scaling:** Combat uses raw stats; wiki defines effective-stat soft caps (0–10: 100%, 11–20: 70%, 21–30: 40%, 31+: 20%) and full derived formulae (HP, stamina, mana, movement, dodge, recovery, damage, mitigation). These are not fully implemented.
- **Equipment:** No class restriction or WEAPON_COEFF in templates yet. Armor is not class-locked in data. Loot drop split (25/25/50) may not be encoded.
- **Skill trees:** Code has per-class trees (Duelist, Brute, Assassin, Mage) with branches and tiers; wiki has 6 cross-class trees (Valor, Instinct, Discipline, Intellect, Zeal, Ferocity) with major/minor/capstone and capstone stat requirements. Skill Tree Database CSV and Capstone Skill Requirements CSV define the new nodes.

---

## Part A: Classes & Equipment Identity

### Task A1: Define 5 classes and base-stat weights in shared data

**Files:**
- Create or modify: `packages/shared/src/types/index.ts` (GladiatorClass enum)
- Create: `packages/shared/src/classes/class-stat-weights.ts` (or under existing constants path)
- Modify: Any seed/mint logic that sets gladiator class (e.g. `packages/database/prisma/seed-test-gladiator.ts`, game-server gladiator sync)

**Steps:**
1. Add/enum classes: Tank, Legionnaire, Duelist, Mage, Monk. Deprecate or map Brute → Tank, Assassin → (Legionnaire or keep for migration).
2. Implement base stat generation from Class Base Stat Odds CSV: for each of 8 stats, apply weight (1.4x–0.7x) per class when rolling or assigning base stats at mint/creation. Expose a function `getBaseStatWeights(class: GladiatorClass): Record<StatKey, number>` and a helper that returns rolled base stats given class (e.g. 50 pool at L1, distributed by weights).
3. Update Prisma schema if Gladiator.class is an enum: add new enum values; migration to map old class strings to new ones.
4. Commit: "feat(shared): 5 classes and class base stat weight data from wiki"

### Task A2: Class-locked armor and class/universal weapon tags

**Files:**
- Modify: `packages/database/prisma/schema.prisma` — EquipmentTemplate: add optional `allowedClass` (string or enum[]) and `weaponCoeff` (Float, optional; 1.0 = class, 0.80 = universal)
- Modify: Bundle export types and export pipeline to include these fields (e.g. `apps/web/lib/admin/exporter.ts`, shared bundle types)
- Modify: Admin UI equipment template form to edit allowedClass (single class or "universal") and weaponCoeff for WEAPON type
- Modify: Equip validation in `apps/web/app/api/gladiators/[gladiatorId]/equip/route.ts` (or equivalent): when equipping, check template.allowedClass matches gladiator class (or is universal). Reject if armor and class mismatch.

**Steps:**
1. Add DB/Prisma field(s) for class restriction (armor: one class; weapon: one class or "universal") and optional weaponCoeff. Default weaponCoeff 1.0 for class, 0.80 for universal.
2. Export these in published bundle JSON.
3. Add Admin UI fields for class restriction and weapon coefficient.
4. Enforce at equip: armor must match gladiator class; weapon must match class or be universal.
5. Commit: "feat(equipment): class-locked armor and class/universal weapon coefficient"

### Task A3: Apply WEAPON_COEFF in damage calculation

**Files:**
- Modify: `packages/shared` combat/damage (e.g. damage scaling or calculator) to accept weaponCoeff (default 1.0)
- Modify: `apps/game-server/src/combat/damage-calculator.ts` (or equivalent) to pass template weaponCoeff into shared damage formula. Ensure FINAL_DAMAGE = BASE * DMG_MULT * WEAPON_COEFF per wiki.

**Steps:**
1. Locate where weapon damage is computed (shared + game server).
2. Add weaponCoeff parameter; multiply final damage by it. Load coeff from match build (template) for the attacker’s main-hand weapon.
3. Commit: "feat(combat): apply WEAPON_COEFF from template in damage calculation"

### Task A4: Loot distribution (25% class weapon / 25% universal / 50% armor)

**Files:**
- Modify: `packages/shared/src/loot` (or game-server loot service) — loot table or roll logic: on weapon roll, 50% class weapon / 50% universal; on armor roll, class-specific. Ensure overall 50% armor / 50% weapon at open.

**Steps:**
1. Identify where loot box open rolls equipment type (weapon vs armor) and which template.
2. Implement: 50% weapon / 50% armor; if weapon, 50% class / 50% universal (filter templates by gladiator class and tag). Armor only from gladiator’s class.
3. Commit: "feat(loot): wiki loot distribution 25/25/50 and class-specific armor"

---

## Part B: Stats & Scaling System

### Task B1: Effective stat function in shared

**Files:**
- Create: `packages/shared/src/stats/effective-stat.ts` (or under existing stats path)
- Implement: `eff(s: number, breakpoints?: { B1, B2, B3, w1, w2, w3, w4 }): number` per wiki formula. Default breakpoints 10, 20, 30 and weights 1, 0.7, 0.4, 0.2.

**Steps:**
1. Add function with tests (e.g. eff(5)=5, eff(15) in range, eff(25) diminished).
2. Export from package. Use in next tasks for all derived stats.
3. Commit: "feat(shared): effective stat soft-cap function"

### Task B2: Derived stats (HP, stamina, mana, movement, dodge, recovery)

**Files:**
- Create or extend: `packages/shared/src/stats/derived-stats.ts`
- Implement: HP, STAMINA, STAM_REGEN, MANA, MANA_REGEN, MOVE_MULT, DODGE_TIME, REC_MULT using effective stats and wiki defaults (HP_BASE, HP_PER_CON, STAM_BASE, STAM_K, etc.). Each takes a stats object and optional tuning params.
- Modify: `apps/game-server` combat or match-instance to build combatant stats from these helpers at match start (from gladiator base + equipment + skills), so server uses derived values.

**Steps:**
1. Implement each formula from Stats & Scaling page; use eff() for every stat input.
2. Add unit tests for one or two formulae (e.g. HP at CON 10 vs 20).
3. Wire game server to compute and use derived stats for combat (HP, stamina, mana, movement, dodge, recovery).
4. Commit: "feat(shared): derived stats from effective stats; game server uses them"

### Task B3: Damage and mitigation scaling

**Files:**
- Modify: shared damage scaling to use effective main stat and bounded curve: DMG_MULT = 1 + DMG_CAP * (eff(MAIN) / (eff(MAIN) + DMG_HALF)), DMG_CAP=1.20, DMG_HALF=18.
- Implement mitigation: MIT_PHYS = DEF_CAP * eff(DEF)/(eff(DEF)+DEF_HALF), same for MR. Apply FINAL = RAW * (1 - MIT) after damage type.

**Steps:**
1. Replace or add damage scaling path with wiki formula; use eff() for main stat.
2. Add physical/magic mitigation and apply in damage resolution (game server).
3. Commit: "feat(combat): damage and mitigation scaling per Stats & Scaling wiki"

---

## Part C: Skill Trees — Data and Schema

### Task C1: Skill tree source data (JSON/TS from CSV)

**Files:**
- Create: `packages/shared/src/skills/skill-tree-definitions.ts` (or JSON + loader) containing the full tree from Skill Tree Database CSV and Capstone Skill Requirements CSV.
- Structure: trees (Valor, Instinct, Discipline, Intellect, Zeal, Ferocity); nodes with id, name, tree, skillLevel (Major/Minor/Capstone), depthTier (1–6), prerequisite, cost, flatStatBonus, scalingMod, duration, cooldown, effectType, combatBehavior, capstoneMinStats, capstoneMaxStats (from Capstone CSV). Normalize names (e.g. "Zone of Denial" → id "zone_of_denial_valor").

**Steps:**
1. Parse both CSVs (or hand-author TS) into a single structure. Add stable `id` per node; link capstones to min/max stat requirements by name.
2. Export getSkillTree(treeName), getSkill(id), getCapstoneRequirements(skillId). Preserve backward compatibility with existing unlock API (unlockedSkills as string[]).
3. Commit: "feat(skills): skill tree definitions from wiki CSV and capstone requirements"

### Task C2: Database representation (optional but recommended)

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Option A: Add `SkillDefinition` (or reuse static only). Option B: No new tables; keep definitions in code/JSON and only store `unlockedSkills: String[]` on Gladiator. If Option A: table with id, tree, skillLevel, depthTier, cost, statBonuses (JSON), capstoneMinStats (JSON), capstoneMaxStats (JSON), prerequisiteId, etc. Seed from same source as shared definitions.

**Steps:**
1. Decide: static-only (code/JSON) vs DB-backed skill definitions. If DB: add migration, seed script from shared definitions or CSV import.
2. If DB: add API or bundle export to expose skill definitions for Camp UI; otherwise Camp keeps using shared package.
3. Commit: "feat(db): optional SkillDefinition model and seed from wiki data" or "docs: skill tree remains static; DB stores only unlockedSkills"

### Task C3: Unlock rules (prerequisite, cost, capstone stat requirements)

**Files:**
- Modify: `packages/shared/src/skills/skill-trees.ts` (or new file) to implement canUnlockSkill(skillId, unlockedSkills, gladiatorStats?) for new tree model. For capstones, require capstoneMinStats (e.g. CON 16, DEF 12) to be met by gladiator’s current stats; optionally capstoneMaxStats for “peak effectiveness” display only.
- Modify: `apps/web/app/api/gladiators/[gladiatorId]/skills/unlock/route.ts`: call canUnlockSkill with gladiator stats when present; enforce cost and prerequisites.

**Steps:**
1. Implement canUnlockSkill: prerequisite chain, cost (skill points), and for capstones check gladiator stats >= capstoneMinStats (from Capstone Skill Requirements).
2. Update unlock API to pass gladiator stats and validate before deducting points and adding to unlockedSkills.
3. Commit: "feat(skills): capstone min stat requirements and unlock validation"

### Task C4: Skill tree UI (2 major + 1 minor, 3 capstones per tree)

**Files:**
- Modify: `apps/web/components/skills/SkillTree.tsx` and related UI to consume new 6-tree structure. Show trees: Valor, Instinct, Discipline, Intellect, Zeal, Ferocity. Per tree: show major/minor/capstone nodes; capstones show min stat requirements; allow selecting 2 trees as “major” and 1 as “minor” (or infer from spend). Display 3 capstone choices per tree; only one selectable per tree.

**Steps:**
1. Replace or extend current class-based tree UI with tree selector and 6 trees. Use getSkillTree() and getSkill() from shared definitions.
2. Show capstone requirements (min stats) on nodes; gray out or warn if gladiator doesn’t meet.
3. Enforce “2 major + 1 minor” and “1 capstone per tree” in UI (and optionally in unlock API).
4. Commit: "feat(camp): skill tree UI for 6 trees, major/minor/capstone and requirements"

---

## Part D: Game Server Integration

### Task D1: Match-start build with effective stats and weapon coeff

**Files:**
- Modify: `apps/game-server/src/services/match-instance.ts` (or combat bootstrap): at match start, for each gladiator load base stats, equipment (with template), unlocked skills. Compute derived stats (HP, stamina, mana, move, dodge, recovery) via shared derived-stats; compute damage scaling and mitigation constants; attach weaponCoeff from main-hand template. Store in combatant state so 60Hz sim uses these values.

**Steps:**
1. Call shared derived-stats and damage/mitigation helpers with gladiator’s effective build (base + equipment + skill stat bonuses).
2. Apply effective stat function to all 8 stats before feeding to derived formulae.
3. Commit: "feat(game-server): match build uses effective stats and weapon coeff"

### Task D2: Skill effects (passive/triggered) — stub or first pass

**Files:**
- Modify: combat engine or match-instance to read unlockedSkills and apply passive stat bonuses (already in build if you sum them at match start). For triggered effects (e.g. “after dodge: +crit”), add hooks or event points; implement one or two as stub (e.g. Second Wind: on HP threshold, restore HP/stamina once per match) so pipeline is in place.

**Steps:**
1. Ensure match-start build sums all flat stat bonuses from unlocked skills into the effective build.
2. Add a simple triggered skill (e.g. Second Wind) in combat: check trigger condition, apply effect once per match, set flag. Expand later.
3. Commit: "feat(game-server): apply skill stat bonuses at match start; stub Second Wind trigger"

---

## Part E: Documentation and Review

### Task E1: Update project docs to reference wiki

**Files:**
- Modify: `CLAUDE.md` or `docs/architecture.md`: add a line that design intent for stats, classes, equipment, and skills is documented in docs/notion (CRUCIBLE — SYSTEMS WIKI) and that implementation should align.
- Optional: Add `docs/plans/summaries/NOTION-SYSTEMS-ALIGNMENT.md` summarizing what was implemented (classes, effective stats, weapon coeff, skill tree source data, DB/API/UI changes).

**Steps:**
1. Add pointer to wiki in CLAUDE.md or architecture.
2. Optionally write a short alignment summary after implementation.
3. Commit: "docs: reference Notion Systems Wiki and alignment summary"

---

## Execution Order

- **Phase 1 (foundation):** A1 (classes + weights), B1 (effective stat), B2 (derived stats), C1 (skill tree definitions).
- **Phase 2 (equipment & combat):** A2 (class armor/weapon tags), A3 (WEAPON_COEFF in damage), B3 (damage/mitigation), D1 (match-start build).
- **Phase 3 (skills):** C2 (DB if desired), C3 (unlock rules), C4 (UI), D2 (skill effects stub).
- **Phase 4 (loot & polish):** A4 (loot distribution), E1 (docs).

---

## Skill Tree Database Snapshot (for implementation)

- **Source:** docs/notion/Skill Tree Database 30690f09058d80b3bcd9cdaac6333b35.csv (and _all.csv if different).
- **Capstone requirements:** docs/notion/Capstone Skill Requirements 30790f09058d802c83c3c9f7c81a4927.csv — columns Name, Skill Tree, Min Stats, Max Stats, Notes. Use to gate capstone unlock and display “peak effectiveness” in UI.
- **Ids:** Derive stable ids from "Skill Name" + tree (e.g. zone_of_denial_valor, second_wind_valor). Keep compatibility with existing unlockedSkills string array.

---

Plan complete. Implement in the order above; run tests and migrations as per project norms. For full execution workflow use **executing-plans** or **subagent-driven-development** as appropriate.
