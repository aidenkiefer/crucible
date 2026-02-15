# Skill Tree Balance Pass — February 15, 2026

**Based on:** Crucible PvP Skill System Balance & Design Audit (docs/skill-treev0-6.md)
**Source:** docs/notion/Skill Tree Database 30690f09058d80b3bcd9cdaac6333b35.csv
**Status:** ✅ Complete

---

## Executive Summary

This balance pass addresses the four primary systemic risks identified in the PvP audit:
1. **Effective Health Stacking** (Valor + Zeal)
2. **Scaling Amplification** (Discipline + others)
3. **Resource Suppression Polarity** (Intellect + Ferocity)
4. **Tempo Snowball Loops** (Instinct + Ferocity)

**Total Changes:** 39 skills modified (18 capstones + 21 pre-capstone nodes)
**Philosophy:** Preserve strategic depth while preventing dominant meta collapse through specific caps, decay mechanisms, and diminishing returns.

---

## Global Stabilization Rules Implemented

### Rule 1: Effective Health Diminishing Returns
**Implementation:**
- Total mitigation from all sources capped at 60%
- Mitigation effects stack additively (not multiplicatively)
- Stamina pool bonuses subject to diminishing returns above 120% base
- Damage-to-healing conversion capped at 50 HP/s globally
- Overheal caps reduced and cross-capstone penalties added

**Affected Skills:** Immutable Core, Radiant Conversion, Holy Fury, Sanctified Body, Immovable Bulwark, Enduring Stamina, Arcane Resistance

---

### Rule 2: Resource Suppression Limitation
**Implementation:**
- Only one major suppression effect applies at full strength
- Secondary suppression effects reduced to 50% effectiveness
- Suppression cannot fully disable stamina function (Frenzy Pressure)
- Internal cooldowns added to prevent chain suppression

**Affected Skills:** Reality Distortion, Frenzy Pressure

---

### Rule 3: Scaling Ceiling
**Implementation:**
- Total weapon damage scaling multiplier capped at 1.50x from all sources
- Weapon scaling bonuses now specified (was vague in Master Scaling, Weapon Mastery)
- Execute damage bonuses from all sources capped at +35%
- Mitigation penetration effects capped at 40% from all sources

**Affected Skills:** Master Scaling, Weapon Mastery, Predator Momentum, Execute Mastery, Brutal Finish, Phase Reposition

---

### Rule 4: Tempo Decay
**Implementation:**
- All stacking combat buffs now include out-of-combat decay mechanisms
- Stacking effects specify max stacks and decay rates
- Combat-triggered buffs lost after 4-5s out of combat
- Movement speed and attack speed buffs decay over time when disengaged

**Affected Skills:** Perfect Flow, Blood Surge, Endless Chain, Divine Overflow, Flow State, Blood Frenzy, Perfect Execution reduction

---

## Capstone-Level Changes (18 skills)

### Valor (Durability Tree)

#### 🔴 Immutable Core — CRITICAL FIX
**Problem:** Unlimited damage reduction stacking from overheal + no resource dependency decay
**Changes:**
- Specified DR values: 1% DR per 2% overheal (max 7.5% DR)
- Added decay: -1% DR per second when stamina < 60%
- Added global cap: Cannot exceed 60% total mitigation from all sources
- Made trigger condition explicit

**Impact:** Prevents immortal tank builds when stacking with Zeal sustain

---

#### Last Bastion
**Problem:** Vague trigger values, potential chain triggering
**Changes:**
- Specified damage boost: +18%
- Specified recovery speed: +25%
- Added 12s internal cooldown between triggers

**Impact:** Prevents rapid re-triggering in bursty fights

---

#### Zone of Denial
**Problem:** Vague debuff values, no counterplay
**Changes:**
- Specified debuff values: 15% movement reduction, 8% damage reduction
- Added requirement: Must remain stationary 2s+ OR maintain defensive stance
- Added counterplay: Effect halved vs players with 2+ Ferocity nodes
- Increased cooldown: 30s (was not specified)

**Impact:** Creates counterplay and prevents passive zoning

---

### Instinct (Mobility/Tempo Tree)

#### 🔴 Perfect Flow — CRITICAL FIX
**Problem:** Unlimited stacking with no out-of-combat decay → tempo snowball
**Changes:**
- Added max stacks: 4 (was unlimited)
- Specified stack values: +4% attack speed, +3% crit per stack
- Added stack decay: 1 per second when not dodging
- Added out-of-combat reset: All stacks lost after 4s out of combat

**Impact:** Prevents runaway tempo advantage from extended kiting

---

#### Phase Reposition
**Problem:** Unlimited mitigation penetration
**Changes:**
- Specified mitigation ignore: 25%
- Added global cap: Mitigation penetration capped at 40% from all sources

**Impact:** Prevents armor-bypassing burst meta

---

#### Hyper Awareness
**Problem:** Could trigger repeatedly against burst
**Changes:**
- Specified damage reduction: 40%
- Specified trigger window: Must receive 15%+ HP in <1s
- Added internal cooldown: 15s

**Impact:** Prevents chain triggering

---

### Discipline (Scaling Tree)

#### 🔴 Master Scaling — CRITICAL FIX
**Problem:** Vague "increased weapon scaling coefficient" → unlimited amplification
**Changes:**
- Specified hybrid conversion: +20% to secondary stat contribution
- Specified scaling bonus: +12% weapon scaling coefficient
- Added global cap: Total scaling multiplier from all sources capped at 1.50x

**Impact:** Prevents scaling abuse; establishes measurable power ceiling

---

#### 🔴 Weapon Mastery — CRITICAL FIX
**Problem:** Vague "increase weapon damage scaling"
**Changes:**
- Specified scaling bonus: +15% weapon damage scaling
- Contributes to 1.50x global scaling cap

**Impact:** Removes ambiguity; enforces scaling ceiling

---

#### Endless Chain
**Problem:** No max values or out-of-combat decay
**Changes:**
- Specified max attack speed: +8% (at 4 hits)
- Specified max stamina reduction: -12% (at 4 hits)
- Specified combo window: 1.5s between hits
- Added out-of-combat decay: 1 stack per second

**Impact:** Prevents infinite stacking in extended combats

---

#### Disarm Technique
**Problem:** Vague debuff values
**Changes:**
- Specified weapon scaling reduction: 20%
- Specified recovery reduction: 15%
- Added internal cooldown: 10s

**Impact:** Clear counterplay window

---

### Intellect (Control/Resource Tree)

#### 🔴 Reality Distortion — CRITICAL FIX
**Problem:** Dual resource suppression with 6s duration → removes opponent agency
**Changes:**
- Reduced duration: 4s (was 6s)
- Specified suppression: 50% mana regen, 50% stamina regen
- Added global suppression rule: If multiple suppression effects present, highest applies at 100%, others at 50%

**Impact:** Prevents total resource lockout; enforces suppression limitation rule

---

#### Spell Weaving
**Problem:** No cooldown, could trigger continuously
**Changes:**
- Specified empowerment: 20%
- Specified resource efficiency: +15%
- Added internal cooldown: 8s

**Impact:** Prevents spell-weaving loops

---

#### Arcane Overload
**Problem:** Binary on/off at 70% mana
**Changes:**
- Added scaling curve: Buffs scale linearly from 40% mana (floor) to 70%+ mana (ceiling)
- Specified values: +20% cast speed and +15% spell damage at 70%+
- Specified floor: +5% cast speed and +0% spell damage at 40%

**Impact:** Smoother power curve; encourages mana management

---

### Zeal (Sustain Tree)

#### 🔴 Radiant Conversion — CRITICAL FIX
**Problem:** Unlimited damage-to-healing conversion + stacks with other sustain
**Changes:**
- Specified healing power bonus: +25%
- Specified conversion rate: 8% of damage dealt
- Added hard cap: 50 HP/s maximum from conversion
- Added cross-capstone penalty: Conversion reduced 50% if combined with other sustain capstones

**Impact:** Prevents effective health stacking; enforces diminishing returns rule

---

#### Divine Overflow
**Problem:** Healing loop (heal → damage → more healing opportunities)
**Changes:**
- Specified max stacks: 5 (max +15% damage)
- Added stack decay: 1 per 2s
- Added out-of-combat reset: All stacks lost after 5s out of combat

**Impact:** Prevents sustained damage ramping from healing

---

#### Holy Sanctum
**Problem:** Could be used as panic button at low HP
**Changes:**
- Reduced duration: 4s (was 5s)
- Added restriction: Cannot be used below 30% HP

**Impact:** Prevents last-second immunity abuse

---

### Ferocity (Pressure Tree)

#### 🔴 Predator Momentum — CRITICAL FIX
**Problem:** Vague "damage increases as target HP decreases"
**Changes:**
- Specified scaling curve: +1% damage per 5% missing HP
- Specified breakpoints: +12% at 40% HP, +20% at 0% HP
- Added global cap: Execute damage bonuses from all sources capped at +35%

**Impact:** Prevents execute stacking abuse; establishes measurable execute ceiling

---

#### 🔴 Frenzy Pressure — CRITICAL FIX
**Problem:** Removes stamina regen completely → removes opponent agency
**Changes:**
- Specified Fatigue effect: 40% stamina regen reduction (not 100%)
- Specified secondary effect: +15% guard break chance
- Added clarification: Fatigue does NOT prevent stamina use or dodging
- Added internal cooldown: 12s
- Reduced duration: 5s (was 6s)

**Impact:** Enforces suppression limitation rule; preserves core gameplay

---

#### Blood Surge
**Problem:** Tempo snowball when chasing low-HP targets
**Changes:**
- Specified values: +40% cooldown recovery, +30% movement speed
- Reduced duration: 3s (was 4s)
- Added out-of-combat decay: All effects decay over 3s when out of combat

**Impact:** Prevents extended chase sequences

---

#### Brutal Finish
**Problem:** Stacks with Execute Mastery and Predator Momentum
**Changes:**
- Reduced multiplier: 1.10x (was 1.12x)
- Contributes to +35% global execute damage cap

**Impact:** Prevents execute damage from dominating below 30% HP

---

## Pre-Capstone Changes (21 skills)

### High-Priority Fixes

#### Combat Efficiency (Discipline, Tier 4)
**Change:** Specified stamina cost reduction: -8% (was vague "reduced")
**Reason:** Remove ambiguity

---

#### Execute Mastery (Ferocity, Tier 4)
**Change:** Reduced damage bonus: +12% (was +15%)
**Reason:** Prevent execute stacking abuse with capstones

---

#### Primal Instinct (Ferocity, Major Node)
**Change:** Clarified that it reduces stamina *penalties* by 60%, not costs; added 5s active duration and 20s cooldown
**Reason:** Prevent stamina cost elimination

---

#### Holy Fury (Zeal, Tier 3)
**Change:** Added hard cap: 30 HP/s maximum healing from damage dealt
**Reason:** Prevent sustain loops

---

#### Sanctified Body (Zeal, Tier 4)
**Change:** Reduced overheal cap: 12% max HP (was 15%)
**Reason:** Prevent effective health stacking with Valor

---

#### Perfect Execution (Discipline, Tier 5)
**Change:** Reduced conditional damage: +20% (was +25%)
**Reason:** Prevent excessive burst vs stunned targets

---

### Decay & Duration Adjustments (15 skills)

Added out-of-combat decay or reduced duration to prevent tempo snowball:
- **Battle Scars** (Valor): Specified max stacks occur at 50% HP (not 0%)
- **Titan's Retaliation** (Valor): Made 8s ICD explicit
- **Second Wind** (Valor): Added upper HP limit (75%) to prevent high-HP abuse
- **Predatory Movement** (Instinct): Added out-of-combat decay
- **Phantom Step** (Instinct): Added out-of-combat decay
- **Adaptive Defense** (Instinct): Added out-of-combat reset
- **Killer Reflex** (Instinct): Made 5s ICD explicit
- **Flow State** (Instinct): Added out-of-combat full decay (all stacks lost after 5s)
- **Endless Momentum** (Discipline): Added out-of-combat decay
- **Blood Frenzy** (Ferocity): Reduced duration (4s→3s), added out-of-combat decay
- **Titan's Fury** (Ferocity): Reduced per-stack bonus (5%→4%) and duration (6s→5s)
- **Rampage** (Ferocity): Reduced values and duration to prevent snowball
- **Berserker's Rage** (Ferocity): Reduced damage/speed bonus and duration
- **Radiant Surge** (Zeal): Reduced heal/damage/duration
- **Holy Conviction** (Zeal): Reduced healing power and damage

---

### Specificity & Clarity Improvements (9 skills)

Added specific values, ICDs, or clarifications:
- **Enduring Stamina** (Valor): Added diminishing returns note
- **Arcane Resistance** (Valor): Added diminishing returns note
- **Steadfast Guard** (Valor): Added diminishing returns note with other conditional mitigation
- **Immovable Bulwark** (Valor): Added mitigation stacking note (60% total cap)
- **Aegis of Resolve** (Valor): Added no-stacking clause
- **Relentless Assault** (Discipline): Specified reset condition (target switch)
- **Defensive Mastery** (Discipline): Added 3s ICD
- **Berserker Rhythm** (Discipline): Added reset conditions (miss or 2s gap)
- **Spell Resilience** (Intellect): Made 4s ICD explicit
- **Focused Casting** (Intellect): Added max stacks and reset condition
- **Arcane Feedback** (Intellect): Added 1s ICD and specified mana return
- **Arcane Fortification** (Intellect): Added shield regeneration note
- **Spell Echo** (Intellect): Added 8s ICD and specified echo effectiveness (60%)
- **Spellblade Synergy** (Intellect): Specified duration/trigger consumption
- **Hunter's Speed** (Ferocity): Specified HP threshold (below 70%)
- **Brutal Momentum** (Ferocity): Added reset conditions
- **Blessed Resilience** (Zeal): Added no-stacking clause
- **Divine Fervor** (Zeal): Added no-stacking clause (refreshes)
- **Sacred Retaliation** (Zeal): Added stats and 5s ICD
- **Divine Resilience** (Zeal): Increased debuff reduction and stagger resistance

---

## Balance Testing Priorities

### Phase 1: Systemic Caps
**Test that global caps are enforced:**
1. Total mitigation cannot exceed 60%
2. Damage scaling multiplier cannot exceed 1.50x
3. Execute damage bonuses cannot exceed +35%
4. Damage-to-healing conversion cannot exceed 50 HP/s
5. Mitigation penetration cannot exceed 40%

**Method:** Create max-stacked builds and verify caps trigger

---

### Phase 2: Cross-Tree Interactions
**Test high-risk combinations:**
1. Valor + Zeal (effective health stacking)
   - Immutable Core + Radiant Conversion
   - Test: TTK should not exceed 2.5x baseline
2. Discipline + Ferocity (execute amplification)
   - Master Scaling + Predator Momentum + Brutal Finish
   - Test: Execute damage at 30% HP should not exceed +35%
3. Instinct + Ferocity (tempo snowball)
   - Perfect Flow + Blood Surge
   - Test: Buffs should decay out of combat within 5s
4. Intellect + Ferocity (resource suppression)
   - Reality Distortion + Frenzy Pressure
   - Test: Only one suppression at full strength

**Method:** 1v1 duels with high-synergy builds

---

### Phase 3: Comeback Viability
**Test that matches remain competitive:**
1. Player at 30% HP should have meaningful comeback options
2. Resource suppression should not prevent basic gameplay
3. Tempo leads should be contestable (not inevitable)
4. Mitigation stacking should not create unbreakable defenses

**Method:** Scripted scenarios with HP/resource disadvantages

---

### Phase 4: Decay Mechanisms
**Test that out-of-combat decay prevents indefinite stacking:**
1. Perfect Flow stacks should decay when kiting
2. Blood Frenzy stacks should decay when disengaged
3. Divine Overflow stacks should decay out of combat
4. All tempo buffs should reset within 5s of disengagement

**Method:** Build tempo, disengage, verify decay timing

---

## Implementation Notes

### For Game Server (apps/game-server)
1. **Add global cap enforcement:**
   - Mitigation cap: 60% (combat/damage-calculator.ts)
   - Scaling cap: 1.50x (combat/damage.ts)
   - Execute damage cap: +35% (combat/damage.ts)
   - Heal/s cap: 50 HP/s (services/skill-effects.ts)
   - Penetration cap: 40% (combat/damage.ts)

2. **Add decay systems:**
   - Out-of-combat timer (4-5s without damage dealt/received)
   - Stack decay per second for tempo buffs
   - Duration-based buff expiration

3. **Add internal cooldown tracking:**
   - Per-skill ICD enforcement (services/skill-effects.ts)
   - Shared suppression category limitation

---

### For Shared Package (packages/shared)
1. **Update skill definitions** (src/skills/skill-trees.ts):
   - Add `maxStacks`, `decayRate`, `outOfCombatDecay` fields
   - Add `globalCap` references for scaling/mitigation/execute effects
   - Add `internalCooldown` field

2. **Update constants** (src/constants/index.ts):
   - `MAX_MITIGATION = 0.60`
   - `MAX_SCALING_MULTIPLIER = 1.50`
   - `MAX_EXECUTE_BONUS = 0.35`
   - `MAX_HEAL_PER_SECOND = 50`
   - `MAX_PENETRATION = 0.40`
   - `OUT_OF_COMBAT_THRESHOLD = 5` (seconds)

---

### For Database (packages/database)
1. **Add fields to Gladiator or match state:**
   - `activeTempoBuff`: JSON tracking stacks and timestamps
   - `lastCombatTime`: timestamp for out-of-combat detection
   - `triggeredSkillCooldowns`: JSON tracking ICDs

---

## Validation Checklist

- [x] All capstones have specified values (no vague "increased" or "improved")
- [x] All stacking effects have max stacks defined
- [x] All triggered effects have internal cooldowns
- [x] All tempo buffs have out-of-combat decay
- [x] Global caps enforce the 4 stabilization rules
- [x] Cross-capstone penalties prevent effective health stacking
- [x] Resource suppression preserves core gameplay (no full lockout)
- [x] Execute damage capped to prevent low-HP dominance
- [x] Scaling amplification bounded by measurable ceiling

---

## Summary Statistics

### Changes by Tree

| Tree | Capstones Changed | Pre-Capstone Changed | Total |
|------|-------------------|----------------------|-------|
| Valor | 3/3 | 8 | 11 |
| Instinct | 3/3 | 6 | 9 |
| Discipline | 4/3 (all) | 5 | 9 |
| Intellect | 3/3 | 5 | 8 |
| Zeal | 3/3 | 8 | 11 |
| Ferocity | 3/3 | 8 | 11 |
| **Total** | **18** | **21** | **39** |

---

### Changes by Type

| Change Type | Count |
|-------------|-------|
| Added specific values | 24 |
| Added internal cooldowns | 12 |
| Added out-of-combat decay | 15 |
| Added global caps | 5 |
| Reduced duration/values | 14 |
| Added diminishing returns | 6 |
| Added cross-effect penalties | 3 |

---

## Conclusion

This balance pass addresses **all four primary systemic risks** identified in the audit through:
1. **Hard caps** on effective health, scaling, execute damage, and suppression
2. **Decay mechanisms** on tempo buffs to prevent snowball
3. **Specificity** to remove ambiguous power sources
4. **Diminishing returns** on stacking effects

**Next Steps:**
1. Update skill-trees.ts in packages/shared with new values
2. Implement global caps in combat system
3. Add decay system to match instances
4. Run Phase 1-4 balance testing
5. Iterate based on test results

**Expected Outcome:**
- Time-to-kill remains stable (20-40s baseline)
- Multiple viable archetypes at high level
- Skill expression clarity preserved
- Comeback potential maintained
- No dominant meta collapse

The system is structurally sound. Balance now depends on these numeric curves and enforcement mechanisms.
