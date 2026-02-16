# Classes & Equipment Identity

## Purpose

Crucible uses classes to provide:

- consistent identity and playstyle distinction
- gear ecosystem differentiation
- long-term meaning at Level 20 (class doesn’t disappear)

The build system must support creativity without making class irrelevant.

---

## The Class DNA Model

Class identity is established by three pillars:

1. **Base stat generation bias**
2. **Class-locked armor**
3. **Class weapons** (plus universal weapons for flexibility)

Skill trees are the primary cross-class customization mechanism.

---

## Classes (5)

- **Tank** — durability, presence, control
- **Legionnaire** — balanced fighter, frontline dominance
- **Duelist** — speed, precision, evasive burst
- **Mage** — arcane damage, mana economy, control
- **Monk** — faith scaling, sustain, resilience, support aggression

These Classes matter as a player’s first decision in building their powerful Gladiator, and affect the base stat generation as follows:

Update: change to the following for balancing:

```jsx
Weight,Duelist,Mage,Monk,Tank,Legionnaire
1.4x,DEX,ARC,FTH,CON,STR
1.3x,SPD,MR,CON,DEF,DEF
1.2x,STR,SPD,SPD,MR,DEX
1.1x,MR,DEX,MR,ARC,CON
1.0x,DEF,FTH,DEX,STR,SPD
0.9x,FTH,CON,DEF,FTH,ARC
0.8x,ARC,DEF,ARC,SPD,FTH
0.7x,CON,STR,STR,DEX,MR
```

[Class Base Stat Odds](Class%20Base%20Stat%20Odds%2030690f09058d8011838aead5a550e251.csv)

---

## Armor Locking Rule (Permanent Identity)

**All armor is class-specific.**

Rationale:

- preserves playstyle distinction at end-game
- prevents “everyone converges into the same meta armor”
- improves PvP readability and counterplay
- creates class-specific loot ecosystems

### Design constraint

Armor bonuses should be impactful but not erase stat investment or skill identity.

---

## Weapons: Class vs Universal

### Class Weapons

- equip restriction: one class only
- full scaling coefficient:
    - **WEAPON_COEFF = 1.00**

Purpose:

- specialization
- peak class synergy
- unique mechanics (eventually)

### Universal Weapons

- equip restriction: none
- reduced scaling coefficient:
    - **WEAPON_COEFF = 0.75–0.85** (target: 0.80 baseline)

Purpose:

- experimentation
- hybrid builds
- creative counterplay options

**Flexibility is traded for lower scaling efficiency.**

---

## Loot Drop Distribution

Chest outcomes:

- 50% weapon
- 50% armor

If weapon:

- 50% class weapon
- 50% universal weapon

Overall distribution:

- **25% class weapon**
- **25% universal weapon**
- **50% armor**

Rationale:

- armor should be common (identity progression)
- weapons provide build expression
- universal weapons remain exciting

---

## Inventory Fatigue Controls

### Salvage Rule (Implemented)

**3 items of a rarity → 1 item of the next tier**

Example:

- 3 common → 1 uncommon
- 3 uncommon → 1 rare

Purpose:

- controls duplicate clutter
- provides deterministic progression
- creates economic sink and loop

### Trading Economy (Planned)

Players can trade and hunt:

- god rolls
- meta items
- rare class weapons
- high-tier armor variants

Purpose:

- long-term engagement
- community market behavior
- prestige gear acquisition pathways

---

## Class Identity Constraints (Balance)

To ensure classes never become meaningless:

- Armor defines a meaningful defensive/utility profile.
- Class weapons must have:
    - higher scaling ceilings OR unique mechanics
- Universal weapons must remain:
    - useful but not optimal for pure specialization

[CRUCIBLE — SYSTEMS WIKI](CRUCIBLE%20%E2%80%94%20SYSTEMS%20WIKI%2030690f09058d80d4a141c77bf182f1c2.md)