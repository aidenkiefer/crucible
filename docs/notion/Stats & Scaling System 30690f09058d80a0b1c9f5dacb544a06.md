# Stats & Scaling System

## Stats & Scaling System

## Purpose

This page defines the complete stat model for Crucible:

- what stats exist
- how they scale from Level 1 → 20
- how soft caps prevent runaway min-maxing
- which derived combat values stats produce
- the tuning knobs we’ll use for balance

This page is the “physics engine” of build power.

---

## Base Stats (8)

**STR (Strength)**

Affects physical damage scaling and contributes to stamina pool.

**DEX (Dexterity)**

Affects stamina regeneration, dodge responsiveness, precision-oriented build scaling.

**DEF (Defense)**

Affects physical mitigation and contributes to recovery speed (how quickly actions recover).

**CON (Constitution)**

Affects HP and is the primary contributor to stamina pool.

**SPD (Speed)**

Affects movement multiplier, dodge duration, recovery speed, stamina regen contribution.

**MR (Magic Resist)**

Affects mana pool and magic mitigation.

**ARC (Arcana)**

Primary arcane damage scaling and primary mana regen path.

**FTH (Faith)**

Primary divine damage scaling and alternate mana regen path.

---

## Leveling & Stat Budget

- Level range: **1–20**
- Starting base stat pool at Level 1: **50**
- Stat points per level: **+3**
- Total base stat pool at Level 20:
    
    **50 + (19 × 3) = 107**
    

### Design intent

- Players get meaningful control over the build over time.
- Decisions remain flexible all the way to Level 20.
- Build identity emerges progressively, not front-loaded.

---

## Expected Stat Envelope (Balance Assumptions)

All formulae and balance targets assume Level-20 builds fall in these ranges:

- **Typical stat values:** 5–25
- **Specialized builds:** 30–40 in a primary stat (with soft-capped effectiveness)

This envelope is used to ensure scaling doesn’t explode at end-game.

---

## Effective Stat Model (Tiered Soft Caps)

All derived stat calculations use **effective stats**, not raw stats.

### Breakpoints and marginal efficiency

- **0–10:** 100% effectiveness
- **11–20:** 70% effectiveness
- **21–30:** 40% effectiveness
- **31+:** 20% effectiveness

### Effective stat function

Let `s` be a base stat value.

```
B1 =10, B2 =20, B3 =30
w1 =1.00, w2 =0.70, w3 =0.40, w4 =0.20

eff(s) =min(s, B1) * w1
+max(min(s, B2) - B1,0) * w2
+max(min(s, B3) - B2,0) * w3
+max(s - B3,0) * w4
```

### Why this exists

- Specialization is rewarded (build identity)
- But marginal gains shrink (balance stability)
- Prevents “one-stat solves everything” meta
- Makes gear and skill effects easier to tune

---

## Power Growth Target

From Level 1 → Level 20 (ignoring gear tier upgrades), the system targets:

**2.2× – 2.6× overall power growth**

This keeps PvP readable and prevents level-cap inflation.

---

## Derived Stats (Core Combat Outputs)

These are the combat values produced by stats.

### HP

```
HP = HP_BASE + HP_PER_CON * eff(CON)
```

Defaults (prototype):

- HP_BASE = 100
- HP_PER_CON = 8

---

### Mana Pool

```
MANA = MANA_BASE + MANA_PER_MR * eff(MR)
```

Defaults:

- MANA_BASE = 60
- MANA_PER_MR = 6

---

### Movement Speed Multiplier

```
MOVE_MULT = clamp(1 + MS_K * eff(SPD),1.00, MS_MAX)MOVE_SPEED = MOVE_BASE * MOVE_MULT
```

Defaults:

- MOVE_BASE = 1.0
- MS_K = 0.015
- MS_MAX = 1.45

---

### Stamina Pool

```
STAMINA = STAM_BASE + STAM_K * (eff(CON) + STAM_STR_W * eff(STR))
```

Defaults:

- STAM_BASE = 80
- STAM_K = 5
- STAM_STR_W = 0.70

---

### Stamina Regen

```
STAM_REGEN = SR_BASE + SR_K * (eff(DEX) + SR_SPD_W * eff(SPD))
```

Defaults:

- SR_BASE = 5.0
- SR_K = 0.18
- SR_SPD_W = 0.80

---

### Mana Regen (ARC/FTH hybrid-aware)

```
MAGIC_MAIN = max(eff(ARC), eff(FTH))MAGIC_OFF  = min(eff(ARC), eff(FTH))MANA_REGEN = MR_BASE + MR_K * (MAGIC_MAIN + MR_OFF_W * MAGIC_OFF)
```

Defaults:

- MR_BASE = 2.5
- MR_K = 0.16
- MR_OFF_W = 0.35

---

### Dodge Duration

Dodge “speed” is modeled as reduced dodge duration, clamped.

```
DODGE_TIME = clamp(
  DODGE_BASE / (1 + DODGE_K * (eff(DEX) + eff(SPD))),
  DODGE_MIN,
  DODGE_BASE
)
```

Defaults:

- DODGE_BASE = 0.55s
- DODGE_MIN = 0.35s
- DODGE_K = 0.03

---

### Recovery Multiplier (Attack / action recovery)

Lower is faster; clamped.

```
REC_MULT = clamp(
  1 / (1 + REC_K * (eff(DEF) + REC_SPD_W * eff(SPD))),
  REC_MIN,
  1.00
)
```

Defaults:

- REC_K = 0.02
- REC_SPD_W = 0.60
- REC_MIN = 0.70

---

## Damage Scaling (Core Rule)

Damage uses a **bounded scaling curve** so it never blows up linearly.

For any damage source that scales on one stat (STR/DEX/ARC/FTH):

```
MAIN_E = eff(MAIN_STAT)DMG_MULT =1 + DMG_CAP * (MAIN_E / (MAIN_E + DMG_HALF))FINAL_DAMAGE = BASE_DAMAGE * DMG_MULT * WEAPON_COEFF
```

Defaults:

- DMG_CAP = 1.20
- DMG_HALF = 18

---

## Mitigation Scaling (DEF / MR)

Mitigation uses diminishing returns and a hard cap.

Physical mitigation:

```
MIT_PHYS = DEF_CAP * (eff(DEF) / (eff(DEF) + DEF_HALF))
```

Magic mitigation:

```
MIT_MAGIC = MR_CAP * (eff(MR) / (eff(MR) + MR_HALF))
```

Defaults:

- DEF_CAP = 0.60, DEF_HALF = 18
- MR_CAP = 0.60, MR_HALF = 18

Damage after mitigation:

```
FINAL = RAW * (1 - MIT)
```

---

## Global Tuning Knobs

These are the intended balance dials:

- soft cap breakpoints + weights
- DMG_CAP / DMG_HALF
- DEF_CAP / DEF_HALF and MR_CAP / MR_HALF
- HP_PER_CON, STAM_K, MS_K, regen coefficients
- clamp limits (MS_MAX, DODGE_MIN, REC_MIN)

---

## Design Outcomes (What this system guarantees)

- Specialization works, but doesn’t spiral
- Builds remain diverse at Level 20
- Class gear identity is not erased by stat dumping
- Skill tree power can be meaningful without breaking balance
- PvP math stays tunable and testable

[CRUCIBLE — SYSTEMS WIKI](CRUCIBLE%20%E2%80%94%20SYSTEMS%20WIKI%2030690f09058d80d4a141c77bf182f1c2.md)