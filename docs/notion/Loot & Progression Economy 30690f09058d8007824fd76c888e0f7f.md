# Loot & Progression Economy

This page covers **drop structure**, **salvage**, **crafting**, and how they tie into progression (XP, level, gold). See also Classes & Equipment Identity (loot rationale) and docs/data-glossary (LootBox, UserGold, Match rewards).

---

## Drop Structure

**Chest (loot box) outcome:**

- **50% weapon** → of those: 50% class weapon, 50% universal weapon.
- **50% armor** → class-specific (for the opening gladiator’s class or resolved at open).

**Effective distribution:**

- 25% class weapon  
- 25% universal weapon  
- 50% armor  

Rationale: armor common for identity progression; weapons for build expression; universal weapons stay exciting without dominating.

---

## Salvage System

- **Salvage** — destroy an equipment instance and receive **gold** (amount may depend on rarity/tier). Starter gear cannot be salvaged.
- Purpose: inventory control, gold sink/source, and a path to dispose of duplicate or unwanted rolls.

---

## Crafting (3→1)

- **Rule:** 3 items of a given rarity → 1 item of the next tier (e.g. 3 common → 1 uncommon, 3 uncommon → 1 rare).
- Purpose: control duplicate clutter, deterministic progression, economic loop. Starter gear cannot be crafted or salvaged.

---

## Progression (XP, Level, Gold)

- **XP** — earned from matches (e.g. win 100, loss 25). Curve for level-up: e.g. `level * 100 + (level - 1) * 50`; level cap 20.
- **Level up** — grants +1 skill point, +3 stat points (player allocates to any of 8 stats).
- **Gold** — from salvage; future: crafting costs, loot box purchases, other sinks. Stored in UserGold per user.

---

## Trading Economy (Planned)

- Players may trade and hunt: god rolls, meta items, rare class weapons, high-tier armor.
- Long-term engagement and community market behavior; not required for demo.

[CRUCIBLE — SYSTEMS WIKI](CRUCIBLE%20%E2%80%94%20SYSTEMS%20WIKI%2030690f09058d80d4a141c77bf182f1c2.md)(CRUCIBLE%20%E2%80%94%20SYSTEMS%20WIKI%2030690f09058d80d4a141c77bf182f1c2.md)