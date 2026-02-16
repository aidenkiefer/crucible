# Combat Framework

Combat is **server-authoritative**: the game server runs the simulation at 60Hz and broadcasts state to clients at 20Hz (50ms). Clients send input via `match:action`; the server validates cooldowns, stamina, and movement, then resolves hits and damage.

---

## Combat Structure

Combat is governed by:

- **Action timing** — cast time, recovery, cooldowns (see Stats & Scaling for recovery multiplier from DEF/SPD).
- **Stamina economy** — physical actions (attacks, dodge) consume stamina; pool and regen scale from CON/STR and DEX/SPD (see Stats & Scaling).
- **Mana economy** — spells consume mana; pool and regen scale from MR and ARC/FTH (see Stats & Scaling).
- **Dodge windows** — dodge grants temporary invulnerability (i-frames); duration scales with DEX + SPD (shorter = faster dodge).
- **Recovery delays** — post-action recovery is reduced by DEF and SPD (recovery multiplier in Stats & Scaling).
- **Mitigation curves** — physical (DEF) and magic (MR) use diminishing-return formulae with caps (see Stats & Scaling).
- **Skill triggers** — many skill-tree mechanics fire on triggers (e.g. after dodge, on hit, when HP threshold).

---

## Action Types

- **Light attack** — weapon primary; stamina cost, short recovery, no/long cooldown.
- **Heavy attack** — weapon secondary or charged; higher damage, higher stamina/recovery.
- **Dodge** — mobility; stamina cost, i-frames, duration/recovery from DEX/SPD.
- **Block** — (if implemented) defensive stance; reduces incoming damage, may cost stamina.
- **Cast** — spell actions from catalyst/loadout; mana cost, cast time, cooldown.

Weapons define their own attack actions (Sword, Spear, Bow, Dagger in demo). Actions are authored as ActionTemplates and linked to EquipmentTemplates; runtime resolves behavior from published bundles.

---

## Resource Systems

- **Stamina** — fuels physical actions (attacks, dodge). Pool from CON + STR; regen from DEX + SPD. Depletion blocks physical actions until regen.
- **Mana** — fuels spells. Pool from MR; regen from ARC/FTH (hybrid-aware: main = max(ARC,FTH), off = min). Depletion blocks casting.

Regen occurs continuously over time (tick-based on server). Regen rates and pool sizes use **effective stats** (soft-capped) per Stats & Scaling.

---

## Dodge Mechanics

- Dodge grants **temporary invulnerability** (i-frames) for a fixed window.
- **Dodge duration** (how long the dodge “lasts”) is reduced by higher DEX + SPD (faster dodge = less time locked in animation).
- Formula and defaults (DODGE_BASE, DODGE_MIN, DODGE_K) are in Stats & Scaling System.
- Many Instinct-tree skills key off “successful dodge” (attack avoided during i-frames).

---

## Relationship to Other Systems

- **Stats & Scaling System** — defines all formulae for HP, stamina, mana, movement, mitigation, damage scaling, and effective-stat soft caps.
- **Weapons System** — which weapons exist, class vs universal, WEAPON_COEFF.
- **Abilities & Spells** — cast actions, loadouts, mana costs.
- **Status Effects & Combat States** — debuffs, buffs, conditions that interact with combat (stagger, disarm, etc.).
- **Skill Trees** — passive and triggered effects that modify combat (e.g. Second Wind, Killer Reflex).

[CRUCIBLE — SYSTEMS WIKI](CRUCIBLE%20%E2%80%94%20SYSTEMS%20WIKI%2030690f09058d80d4a141c77bf182f1c2.md)(CRUCIBLE%20%E2%80%94%20SYSTEMS%20WIKI%2030690f09058d80d4a141c77bf182f1c2.md)