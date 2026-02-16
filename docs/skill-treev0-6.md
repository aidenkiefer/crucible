# Crucible PvP Skill System Balance & Design Audit

## Capstones + Pre-Capstone Node Structure (Depth 1–5)

This guide consolidates all balance observations, structural risks, and recommended tuning adjustments across the **entire skill system** — including both:

* Capstone abilities (depth 6)
* Pre-capstone progression nodes (depths 1–5)

The goal is to ensure the system remains:

* competitively fair
* strategically deep
* identity-driven
* readable in PvP
* resistant to dominant meta collapse
* resilient across future content expansion

This document focuses only on **real structural risks**, not theoretical edge cases.

---

# 1. Core Structural Strengths (What is Already Working)

Before addressing concerns, it is important to recognize what is functioning exceptionally well.

### 1.1 One-Choice-Per-Tier Architecture

This is the single most stabilizing rule in the entire system.

It ensures:

* each tree expresses a philosophy, not a toolkit
* internal stacking exploits are impossible
* players commit to identity
* build readability is high in PvP
* balancing is manageable at the cross-tree level

This design choice eliminates most traditional RPG skill tree failure modes.

---

### 1.2 Clear Tree Identity Separation

Each tree occupies a distinct combat axis:

| Tree       | Core Domain                    |
| ---------- | ------------------------------ |
| Valor      | durability & defensive posture |
| Instinct   | mobility & tempo               |
| Discipline | weapon scaling & efficiency    |
| Intellect  | resource & control             |
| Zeal       | sustain & recovery             |
| Ferocity   | pressure & finishing           |

There is minimal thematic overlap.
This is excellent for competitive clarity.

---

### 1.3 Subclass → Tree Alignment is Natural

Stat distributions and tree paths reinforce each other organically.

Players are not forced into builds — they are *guided* into them.

This produces a healthy emergent meta.

---

### 1.4 Capstone Power Distribution is Tight

Power values clustered between 15–18 indicate strong relative parity.

No tree contains an obviously dominant capstone by design alone.

---

# 2. Primary Systemic Risk Categories

These are not isolated skill problems.
They are **mechanical stacking patterns** that can distort PvP.

There are four.

---

## 2.1 Effective Health Stacking (Highest Priority Risk)

Effective health is increased by:

* mitigation
* healing
* resource-based defense
* sustain efficiency
* regeneration
* damage-to-healing conversion

When these scale together, time-to-kill rises exponentially.

This creates:

* stalemates
* low agency duels
* ladder frustration
* “correct but unfun” strategies

### Where it originates

Mostly from cross-tree interaction between:

* Valor nodes (mitigation, stamina durability)
* Zeal nodes (healing amplification, conversion)

Not from any single ability.

### Why this matters

1v1 PvP must maintain a stable kill window.
If durability scaling exceeds burst scaling, aggression becomes irrational.

---

## 2.2 Scaling Amplification (Meta Sensitivity Risk)

Some nodes multiply power rather than add to it.

Most sensitive areas:

* weapon scaling multipliers
* execute damage ramps
* tempo stacking bonuses
* resource efficiency loops

These do not cause imbalance alone — but they amplify everything else.

This makes certain builds disproportionately sensitive to small numeric changes.

---

## 2.3 Resource Suppression Polarity

Resource denial is inherently asymmetric in 1v1.

Reducing opponent options feels stronger than reducing opponent numbers.

If suppression uptime becomes too high:

* fights feel predetermined
* counterplay disappears
* builds become matchup-polarized

This is primarily an Intellect + Ferocity interaction space.

---

## 2.4 Tempo Snowball Loops

Tempo mechanics reward successful combat interaction with increased future power.

Examples:

* dodge → buff
* hit chain → efficiency
* execute → surge

If stacking windows are too long or decay too slow:

early advantage becomes inevitable victory.

This is primarily an Instinct + Ferocity interaction space.

---

# 3. Tree-Specific Tuning Guidance

These are targeted adjustments to prevent systemic risks from manifesting.

---

## 3.1 Valor (Durability Systems)

### Concern

Layered mitigation + resource efficiency can inflate effective health.

### Recommendations

* mitigation sources combine additively, not multiplicatively
* stamina regeneration scales with diminishing returns
* positional defense requires commitment (stance, stationary time, etc.)

Goal: durability must require intentional behavior, not passive stacking.

---

## 3.2 Instinct (Mobility / Tempo Systems)

### Concern

High-skill players may generate exponential advantage via tempo loops.

### Recommendations

* stack-based tempo buffs decay quickly out of combat
* dodge-trigger rewards require actual threat avoidance
* mobility bonuses cannot stack with armor-bypass effects beyond a cap

Goal: reward skill without creating runaway feedback loops.

---

## 3.3 Discipline (Scaling Systems)

### Concern

Scaling multipliers amplify every other offensive mechanic.

### Recommendations

* scaling bonuses taper beyond high stat thresholds
* efficiency nodes cannot eliminate stamina management entirely
* suppression effects target specific attributes, not global damage output

Goal: optimize performance without breaking power ceilings.

---

## 3.4 Intellect (Control / Resource Systems)

### Concern

Resource denial can remove opponent agency.

### Recommendations

* suppression effects are temporary and positional
* sustained denial requires active maintenance
* weaving mechanics require alternating action patterns (no passive buffing)

Goal: control must be interactive, not passive.

---

## 3.5 Zeal (Sustain Systems)

### Concern

Healing loops directly affect match duration.

This is the most sensitive balance domain in the game.

### Recommendations

* healing efficiency decreases during repeated triggers
* damage-to-healing conversion capped per time window
* purification effects remove control but not core counter mechanics

Goal: sustain prolongs fights but cannot prevent resolution.

---

## 3.6 Ferocity (Pressure Systems)

### Concern

Momentum effects can remove comeback potential.

### Recommendations

* momentum buffs decay rapidly when disengaged
* stamina exhaustion cannot fully disable stamina function
* execute scaling remains conditional, not universal

Goal: aggression rewards success without guaranteeing snowball.

---

# 4. Capstone-Level Balance Watchpoints

These are not current problems — only high-leverage combinations to monitor.

1. Sustain durability pairings (Valor + Zeal)
2. Mobility + scaling burst (Instinct + Discipline)
3. Resource denial layering (Intellect + Ferocity)
4. Execute amplification stacking (Ferocity + Discipline)

Each should remain viable but not universally optimal.

---

# 5. Global Stabilization Rules (Recommended)

These four rules will prevent nearly all systemic imbalance.

---

## Rule 1 — Effective Health Diminishing Returns

All mitigation and healing scaling uses diminishing efficiency curves.

---

## Rule 2 — Resource Suppression Limitation

Only one major suppression effect applies at full strength at a time.

---

## Rule 3 — Scaling Ceiling

Total offensive scaling multipliers cannot exceed a defined threshold.

---

## Rule 4 — Tempo Decay

Stacking combat advantages decay quickly outside active engagement.

---

# 6. Overall System Evaluation

Architecture quality: Excellent
Identity clarity: Excellent
Subclass alignment: Excellent
Capstone parity: Strong
Meta resilience: High

Primary tuning axis: durability vs burst pacing

The system is structurally sound.
Balance now depends on numeric curves, not conceptual design.

---

# 7. Final Design Philosophy Recommendation

Crucible is fundamentally a **tempo-driven duel system**.

Healthy matches require:

* survivability to enable interaction
* pressure to force decisions
* control to shape engagement
* burst to resolve fights

None of these should dominate independently.

Balance success should be measured by:

* average duel length stability
* comeback viability
* multiple viable archetypes
* skill expression clarity

If these remain intact, the system will support long-term competitive play.

---
