# Cross-Class Skill Trees

**Technical reference (how it works, storage, fetching, performance):** [skill-trees-system.md](skill-trees-system.md)

## Overview

Crucible features **6 cross-class skill trees** that all Gladiators can invest in, regardless of class. Each tree offers unique build paths and playstyles, allowing you to customize your gladiator beyond their base class.

Unlike class-locked abilities, these trees are universal — a Duelist can invest in Intellect for arcane power, a Brute can specialize in Instinct for mobility, and an Assassin can explore Valor for defensive tactics.

---

## The Six Trees

### 1. Valor — Durability, Survival, Defensive Spikes
Valor is the tree of endurance and resilience. It focuses on increasing your survivability through bonus health, damage reduction, and defensive abilities that allow you to hold ground and outlast your opponent.

**Playstyle:** Defensive tanks, zone control, sustained combat
**Key strengths:** High HP, damage mitigation, area denial

---

### 2. Instinct — Movement, Dodge Mastery, Tempo Control
Instinct governs agility and reflexes. It enhances dodge roll mechanics, movement speed, and allows you to control the pace of combat by weaving in and out of danger with precision.

**Playstyle:** Mobile strikers, hit-and-run tactics, tempo control
**Key strengths:** Dodge efficiency, movement speed, i-frame mastery

---

### 3. Discipline — Weapon Mastery, Stamina Economy, Precision
Discipline represents martial excellence. It improves weapon scaling, stamina efficiency, and attack precision, rewarding skillful and deliberate combat over brute force.

**Playstyle:** Weapon specialists, stamina-efficient combatants, precision fighters
**Key strengths:** Weapon damage, stamina management, attack accuracy

---

### 4. Intellect — Arcane Power, Mana Loops, Spell Enhancement
Intellect unlocks the arcane path. It increases mana, spell damage, and enables powerful spell combos. Perfect for gladiators who want to integrate magic into their combat style.

**Playstyle:** Spellcasters, hybrid casters, burst damage dealers
**Key strengths:** Mana pool, spell power, arcane synergies

---

### 5. Zeal — Faith Scaling, Sustain, Resilience, Support Aggression
Zeal is the tree of conviction and tenacity. It provides sustain through healing, boosts aggression, and offers faith-based scaling that rewards bold, relentless offense.

**Playstyle:** Aggressive sustain fighters, faith-based builds, pressure combatants
**Key strengths:** Self-healing, sustained aggression, faith scaling

---

### 6. Ferocity — Aggressive Pressure, Execute Windows, Berserker Tempo
Ferocity is the tree of raw offensive power. It focuses on damage bursts, execute mechanics (bonus damage against low-health enemies), and high-tempo aggression that punishes defensive opponents.

**Playstyle:** Berserkers, assassins, all-in offensive builds
**Key strengths:** Burst damage, execute potential, relentless pressure

---

## Skill Point Economy

- **Total skill points:** 20 (earned by level 20)
- **Tier 1-5 skills:** 1 point each
- **Tier 6 capstones:** 2 points each

### Typical Build Patterns

- **Two major trees (capstones):** 8-10 points per tree = 2 capstones
- **One major + one minor:** 10-12 points in one tree (capstone) + 8-10 points in another
- **Hybrid spread:** 6-7 points across 3 trees for versatile builds

Most builds will focus on **2 major trees** with capstones, spending 8-12 points in each, with a few points left over for situational passives in a third tree.

---

## Prerequisites

Skills have **flexible tier-based prerequisites**:

- **Tier 1:** No prerequisites (always available)
- **Tier 2:** Must have unlocked ANY skill from Tier 1
- **Tier 3:** Must have unlocked ANY skill from Tier 2
- **Tier 4:** Must have unlocked ANY skill from Tier 3
- **Tier 5:** Must have unlocked ANY skill from Tier 4
- **Tier 6 (capstones):** Must have unlocked ANY skill from Tier 5

This flexible system allows creative mixing within a tree. You don't need to unlock specific skills — just reach the required tier depth.

---

## Active Abilities

Each tree has **ONE active ability at tier 5**. Active abilities are powerful combat skills that you can trigger during battle.

**Important:** You can unlock **1-2 active abilities maximum** per build (due to the 20-point limit), so choose wisely!

Most builds will have:
- **2 active abilities** (if investing in 2 major trees with capstones)
- **1 active ability** (if spreading points across 3 trees)

All other skills are **passive** — they enhance your stats or grant permanent bonuses.

---

## Example Builds

### Tank Build: Valor + Discipline
**Trees:** Valor (capstone) + Discipline (capstone)
**Points:** 10 Valor, 10 Discipline

**Strategy:**
- **Valor:** Invest in defensive passives (bonus HP, damage reduction) and unlock the Zone of Denial capstone for area control.
- **Discipline:** Focus on stamina efficiency and weapon scaling for sustained weapon damage.

**Result:** A durable control tank with high survivability, weapon prowess, and the ability to hold zones against aggressive opponents.

**Active abilities:** Zone of Denial (Valor), Weapon Mastery active (Discipline)

---

### Mobile Striker: Instinct + Ferocity
**Trees:** Instinct (capstone) + Ferocity (capstone)
**Points:** 10 Instinct, 10 Ferocity

**Strategy:**
- **Instinct:** Max dodge mastery and movement speed, unlock the Perfect Flow capstone for unmatched mobility.
- **Ferocity:** Invest in execute damage and burst potential for devastating chase-down kills.

**Result:** A high-mobility assassin with chase potential, dodge mastery, and the ability to punish wounded enemies.

**Active abilities:** Perfect Flow (Instinct), Blood Surge (Ferocity)

---

### Spellblade: Intellect + Discipline
**Trees:** Intellect (capstone) + Discipline (capstone)
**Points:** 10 Intellect, 10 Discipline

**Strategy:**
- **Intellect:** Invest in spell power, mana pool, and unlock the Spell Weaving capstone for arcane combos.
- **Discipline:** Focus on weapon scaling and precision to maintain strong melee damage.

**Result:** A hybrid caster who weaves weapon strikes and spells together, dealing both physical and arcane damage with versatility.

**Active abilities:** Spell Weaving (Intellect), Weapon Mastery active (Discipline)

---

### Berserker Build: Ferocity + Zeal
**Trees:** Ferocity (capstone) + Zeal (minor investment)
**Points:** 12 Ferocity, 8 Zeal

**Strategy:**
- **Ferocity:** All-in on offensive pressure, execute damage, and the Blood Surge capstone for relentless aggression.
- **Zeal:** Invest in sustain passives (healing, resilience) to stay alive during high-tempo fights.

**Result:** A berserker who trades aggression for sustain, dealing massive damage while staying in the fight longer than pure glass cannons.

**Active abilities:**
- Berserker's Rage (Ferocity) — Damage and speed burst

---

### Arcane Tank: Intellect + Valor
**Trees:** Intellect (capstone) + Valor (capstone)
**Points:** 10 Intellect, 10 Valor

**Strategy:**
- **Intellect:** Invest in spell power and mana for burst arcane damage.
- **Valor:** Focus on HP and damage reduction to survive close-range pressure.

**Result:** A tanky spellcaster who can absorb damage while casting spells, creating a durable mage archetype.

**Active abilities:** Spell Weaving (Intellect), Zone of Denial (Valor)

---

### Tempo Warrior: Instinct + Discipline + Ferocity (Hybrid)
**Trees:** Instinct (no capstone), Discipline (capstone), Ferocity (no capstone)
**Points:** 6 Instinct, 10 Discipline, 4 Ferocity

**Strategy:**
- **Discipline:** Main tree with capstone for weapon mastery and stamina efficiency.
- **Instinct:** Invest in movement and dodge passives for mobility.
- **Ferocity:** Pick up a few execute-damage passives for finishing power.

**Result:** A versatile tempo fighter with mobility, weapon damage, and execute potential — no second capstone, but more flexibility.

**Active abilities:**
- Phase Strike (Instinct) — Next attack ignores mitigation

---

## Tips for Building Your Gladiator

1. **Focus your investment:** Most successful builds invest heavily in 2 trees to unlock capstones. Spreading too thin reduces power spikes.
2. **Plan your active abilities:** You can only have 1-2 active abilities max. Choose trees with actives that complement your playstyle.
3. **Use tier flexibility:** You don't need to unlock every skill in a tier. Pick the passives that fit your build and move up.
4. **Consider synergy:** Some trees pair naturally (Valor + Discipline for tanky fighters, Instinct + Ferocity for mobile assassins).
5. **Experiment:** With only 20 points, every choice matters — but the flexible prerequisites allow creative builds.

---

## Summary

- **6 cross-class trees:** Valor, Instinct, Discipline, Intellect, Zeal, Ferocity
- **20 skill points total** by level 20
- **Flexible prerequisites:** Unlock any skill in a tier to progress to the next
- **1 active ability per tree** at tier 5 (1-2 max per build)
- **Typical builds:** 2 major trees with capstones, or 1 major + 1-2 minor trees

Build your gladiator to match your playstyle — whether you prefer defensive control, mobile strikes, arcane power, or relentless aggression.
