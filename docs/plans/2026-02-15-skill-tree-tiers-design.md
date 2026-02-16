# Skill Tree Tiers Design (Tiers 1-5)

**Date:** 2026-02-15
**Status:** Approved
**Scope:** Design and implementation of 90 beginning+mid tier skills across 6 cross-class skill trees

---

## Overview

This document defines the design for tiers 1-5 of the 6 cross-class skill trees (Valor, Instinct, Discipline, Intellect, Zeal, Ferocity). The 18 capstone skills (tier 6) are already complete.

**Goal:** Create balanced, fun, and unique builds through skill tree progression that supports the 15 emergent subclass archetypes while maintaining clear power scaling and build diversity.

---

## System Architecture

### Skill Point Economy
- **Total skill points:** 20 (by level 20)
- **Node costs:**
  - Tiers 1-5: 1 point each
  - Tier 6 (Capstones): 2 points each
- **Investment model:**
  - 2 major trees (reaching capstones): ~14 points
  - 1 minor tree (partial investment): ~6 points
- **Path to capstone:** 7 points minimum (1+1+1+1+1+2)

### Tree Structure
- **6 trees** × **6 tiers** × **3 choices** = **108 total skills**
- **Flexible prerequisites:** ANY tier N skill unlocks tier N+1 (not path-locked)
- **Choice-driven identity:** Each tier offers 3 distinct flavors supporting different capstone paths

---

## Power Scaling Model

### Power Equivalence Rules
- **Tier 1:** +2-3 stat value (foundation)
- **Tier 2:** +3-4 stat value + small passive
- **Tier 3:** +4-5 stat value + conditional mechanic
- **Tier 4:** +5-7 stat value + impactful mechanic
- **Tier 5:** +8-11 stat value + powerful mechanic (Major nodes)
- **Tier 6:** +12-18 stat value + build-defining mechanic (Capstones)

### Gradual Scaling Approach
- **Tier 1-2:** Simple stat boosts, minimal mechanics
- **Tier 3-4:** Moderate stats, conditional triggers
- **Tier 5:** Large stats, impactful mechanics
- **Tier 6:** Build-defining capstones

---

## Design Principles

### 1. Stat Variety
Each tree favors 2-3 primary stats but offers choices:
- **Valor:** CON, DEF (primary), MR, STR, SPD (secondary)
- **Instinct:** DEX, SPD (primary), CON, STR (secondary)
- **Discipline:** STR, DEX (primary), DEF, CON (secondary)
- **Intellect:** ARC, MR (primary), DEX, SPD, CON (secondary)
- **Zeal:** FTH, CON (primary), STR, DEX, MR (secondary)
- **Ferocity:** STR, SPD (primary), DEF, CON (secondary)

Avoid buffing identical stats every node to maintain build diversity.

### 2. Mechanic Complexity
- **Active abilities:** Maximum 1 per tree at tier 5 (6 total across all trees)
- **Passive mechanics:** Preferred for most nodes
- **Conditional triggers:** Scale in power from tier 3 onward
- **Resource effects:** Support stamina/mana economy builds

### 3. Naming Conventions
- **Tier 1-3:** Practical/literal ("Fortified Body", "Efficient Strikes")
- **Tier 4-6:** Epic/dramatic ("Immovable Bulwark", "Perfect Flow")

### 4. Subclass Support
Designed to support 15 emergent subclass archetypes from stat combinations:
- Fortress, Juggernaut, Sacred Wall (tanks)
- Tempo Striker, Endurance Fencer, Skirmisher (duelists)
- Pure Arcanist, Speed Caster, Battlemage (mages)
- Ascetic Guardian, Mystic Bulwark, Radiant Brawler (monks)
- Weapon Master, War Paladin, Spellblade Commander (legionnaires)

---

## Tree Summaries

### VALOR (Durability, Survival, Defensive Spikes)
**Capstones:** Zone of Denial, Last Bastion, Immutable Core
**Theme:** Tank archetypes with control, counter-damage, and overheal variants

**Tier 1:** Fortified Body, Iron Skin, Warded Flesh
**Tier 2:** Enduring Stamina, Defensive Stance, Arcane Resistance
**Tier 3:** Battle Scars, Unyielding Guard, Vital Recovery
**Tier 4:** Steadfast Guard, Titan's Retaliation, Bastion of Will
**Tier 5:** Second Wind (active), Immovable Bulwark, Aegis of Resolve

---

### INSTINCT (Movement, Dodge, Tempo)
**Capstones:** Hyper Awareness, Phase Reposition, Perfect Flow
**Theme:** Evasive builds with survival reflexes, gap-closing, and momentum stacking

**Tier 1:** Swift Reflexes, Light Step, Balanced Agility
**Tier 2:** Momentum Flow, Evasive Training, Quick Recovery
**Tier 3:** Predatory Movement, Perfect Timing, Fortified Reflexes
**Tier 4:** Phantom Step, Counterstrike Reflex, Adaptive Defense
**Tier 5:** Killer Reflex, Phase Strike (active), Flow State

---

### DISCIPLINE (Weapon Mastery, Stamina Economy)
**Capstones:** Disarm Technique, Endless Chain, Master Scaling
**Theme:** Weapon specialists with disruption, combo sustain, and hybrid scaling

**Tier 1:** Weapon Training, Precision Focus, Balanced Technique
**Tier 2:** Power Strike, Efficient Strikes, Steadfast Blade
**Tier 3:** Relentless Assault, Defensive Mastery, Stamina Conservation
**Tier 4:** Combat Efficiency, Weapon Virtuoso, Berserker Rhythm
**Tier 5:** Weapon Mastery, Endless Momentum, Perfect Execution

---

### INTELLECT (Arcane Power, Mana Loops)
**Capstones:** Reality Distortion, Spell Weaving, Arcane Overload
**Theme:** Casters with zone control, hybrid spellblade, and glass cannon variants

**Tier 1:** Arcane Studies, Mystic Wards, Balanced Attunement
**Tier 2:** Spell Power, Mana Efficiency, Battle Caster
**Tier 3:** Arcane Burst, Spell Resilience, Focused Casting
**Tier 4:** Arcane Feedback, Spell Acceleration, Arcane Fortification
**Tier 5:** Spell Echo, Arcane Supremacy, Spellblade Synergy (active)

---

### ZEAL (Faith, Sustain, Resilience)
**Capstones:** Holy Sanctum, Radiant Conversion, Divine Overflow
**Theme:** Sustain builds with purification, life-steal, and heal-to-damage conversion

**Tier 1:** Divine Favor, Sacred Endurance, Holy Balance
**Tier 2:** Radiant Power, Sacred Vitality, Faithful Defense
**Tier 3:** Holy Fury, Blessed Resilience, Divine Fervor
**Tier 4:** Sacred Retaliation, Righteous Assault, Sanctified Body
**Tier 5:** Divine Resilience, Radiant Surge (active), Holy Conviction

---

### FEROCITY (Aggression, Execute, Berserker)
**Capstones:** Frenzy Pressure, Blood Surge, Predator Momentum
**Theme:** Aggressive builds with anti-tank, chase mechanics, and execute scaling

**Tier 1:** Raw Power, Aggressive Pursuit, Relentless Drive
**Tier 2:** Savage Strength, Hunter's Speed, Brutal Momentum
**Tier 3:** Blood Frenzy, Predatory Instinct, Unrelenting Force
**Tier 4:** Execute Mastery, Rampage, Titan's Fury
**Tier 5:** Primal Instinct, Brutal Finish, Berserker's Rage (active)

---

## Active Abilities Summary

Only 6 active abilities across all trees (1 per tree at tier 5):

1. **Second Wind** (Valor) — Restore HP/stamina, 45s cooldown
2. **Phase Strike** (Instinct) — Next attack ignores mitigation, 6s cooldown
3. **Spellblade Synergy** (Intellect) — Empower weapon/spell chains, 10s buff
4. **Radiant Surge** (Zeal) — Heal + damage buff, 30s cooldown
5. **Berserker's Rage** (Ferocity) — Damage/speed buff with penalty, 45s cooldown
6. **Holy Sanctum** (Zeal Capstone) — Immunity aura, 25s cooldown

Maximum 2-3 active abilities per build (depending on investment).

---

## Balance Considerations

### Cross-Tree Synergies
- Valor + Discipline: Bruiser tanks (CON+STR+DEF)
- Instinct + Discipline: Precision strikers (DEX+SPD weapon masters)
- Intellect + Discipline: Spellblades (ARC+DEX hybrids)
- Zeal + Ferocity: Sustain brawlers (FTH+STR life-steal)
- Valor + Zeal: Sacred walls (CON+FTH defensive healers)

### Power Budget Trade-offs
- Active abilities can have reduced stat bonuses
- Strong mechanics reduce total stat budget
- Tier 5 nodes average +9 stat points equivalent

### Tuning Levers
- Percentage values (damage %, mitigation %, resource %)
- Duration and cooldown timers
- Stack limits on conditional buffs
- Trigger conditions (HP thresholds, hit counts)

---

## Implementation Notes

### Database Storage
Skills stored in `Skill Tree Database.csv` with fields:
- Skill Name, Tree, Skill Level, Effect Type
- Combat Behavior, Build Role, Power Value Estimate
- Flat Stat Bonus, Scaling Mod, Duration, Cooldown
- Depth Tier (1-6), PvP tested, Needs Tuning

### Code Integration
Skills will integrate with existing:
- `packages/shared/src/skills/skill-trees.ts` (SkillNode interface)
- Gladiator progression system (unlocking, stat application)
- Combat stat derivation (effective stats with skill bonuses)

### Testing Priorities
1. **Stat scaling:** Verify soft caps apply correctly to skill bonuses
2. **Conditional triggers:** Test HP/stamina/mana thresholds
3. **Stack mechanics:** Confirm buff stacking and decay timers
4. **Active abilities:** Cooldown tracking, resource costs
5. **Cross-tree builds:** Validate 2+1 investment model works

---

## Success Criteria

✓ **Build diversity:** 6 trees × 3 paths = 18 distinct build archetypes
✓ **Balance:** No single tree dominates all matchups
✓ **Progression:** Smooth power curve from tier 1 → tier 6
✓ **Subclass support:** All 15 subclasses have viable skill paths
✓ **Complexity:** Mechanics scale gradually, not overwhelming early
✓ **Active abilities:** Limited to 6 total, max 2-3 per build

---

## Next Steps

1. **Implementation plan:** Create detailed technical spec for skill system integration
2. **Code implementation:** Update shared skill trees, add tier 1-5 skills
3. **Balance tuning:** Test and adjust percentage values
4. **UI/UX:** Design skill tree visualization showing all 6 tiers
5. **Documentation:** Player-facing skill tree guide

---

**End of Design Document**
