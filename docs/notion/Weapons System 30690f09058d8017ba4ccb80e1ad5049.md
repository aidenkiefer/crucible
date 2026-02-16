# Weapons System

Weapons are equipment that grant **attack actions** (melee and/or projectile). They scale damage from stats and from a **weapon coefficient** that depends on whether the weapon is **class** or **universal**. See Classes & Equipment Identity for class vs universal rules and loot distribution.

---

## Implemented Weapons (Demo)

- **Sword** — melee, primary stat STR (or weapon-defined).
- **Spear** — melee with reach.
- **Bow** — projectile, primary stat DEX.
- **Dagger** — melee, fast, precision-oriented.

Each is defined by an EquipmentTemplate (type WEAPON, slot MAIN_HAND or OFF_HAND) and linked to ActionTemplates for light/heavy attacks. Hitbox and projectile config live in action payloads; combat engine uses shared physics and combat packages.

---

## Damage Scaling (Weapons)

- **Base damage** comes from the action/weapon definition.
- **Stat scaling** uses the bounded scaling curve in Stats & Scaling: `DMG_MULT = 1 + DMG_CAP * (eff(MAIN_STAT) / (eff(MAIN_STAT) + DMG_HALF))`.
- **WEAPON_COEFF** multiplies the result:
  - **Class weapon** (equip restricted to one class): WEAPON_COEFF = 1.00.
  - **Universal weapon** (any class): WEAPON_COEFF = 0.75–0.85 (target baseline 0.80).

So: `FINAL_DAMAGE = BASE_DAMAGE * DMG_MULT * WEAPON_COEFF`. Universal weapons trade flexibility for lower peak damage.

---

## Equip Rules

- **Class weapons** — only equippable by the class they are tied to (template or tag defines `allowedClass` or equivalent). Full scaling.
- **Universal weapons** — equippable by any class; reduced coefficient. Enables hybrid builds and counterplay without overshadowing class identity.

Slot: typically MAIN_HAND or OFF_HAND; validation is slot-based (one item per slot, template must allow that slot).

---

## Relationship to Other Systems

- **Classes & Equipment Identity** — class vs universal split, loot 50% weapon (50% class / 50% universal).
- **Stats & Scaling System** — damage formula, effective stats, DMG_CAP/DMG_HALF.
- **Combat Framework** — action resolution, stamina cost, recovery, projectiles.

[CRUCIBLE — SYSTEMS WIKI](CRUCIBLE%20%E2%80%94%20SYSTEMS%20WIKI%2030690f09058d80d4a141c77bf182f1c2.md)