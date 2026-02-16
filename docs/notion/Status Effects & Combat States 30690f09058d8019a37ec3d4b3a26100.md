# Status Effects & Combat States

Status effects and combat states are **conditions** that modify combat (damage, movement, resources, control). They are referenced by skill trees, abilities, and weapons (e.g. Disarm, Fatigue, buffs/debuffs). Definitions should live in action/effect config or a dedicated status-effect vocabulary used by the combat engine.

---

## Purpose

- **Buffs** — beneficial (e.g. damage boost, damage reduction, regen). Often conditional or triggered (e.g. “above 70% HP”, “after dodge”).
- **Debuffs** — harmful (e.g. reduced movement, reduced damage, DoT, disarm). Many capstones and major nodes apply or interact with debuffs (e.g. Zone of Denial, Disarm Technique, Frenzy Pressure).
- **Combat states** — e.g. staggered, disarmed, fatigued (stamina regen loss), in i-frames. Engine must track duration and apply rules (recovery speed, mitigation, etc.).

---

## Examples from Skill Trees

- **Disarm** — reduces enemy scaling or recovery (Discipline capstone Disarm Technique).
- **Fatigue** — reduced stamina regen, increased guard-break chance (Ferocity capstone Frenzy Pressure).
- **Damage reduction / conditional DR** — e.g. “above 70% HP: take 10% less damage” (Valor).
- **Control resistance** — Zone of Denial grants personal control resistance.
- **Purge / immunity** — Holy Sanctum (Zeal capstone): immune to status conditions and debuffs, remove enemy buffs.

---

## Implementation Notes

- Effect identity (id/key), duration, stack rules, and whether it’s dispellable should be defined in data (action effectConfig or status-effect templates).
- Combat engine applies effects when resolving actions and each tick (duration decay, trigger checks). Design Constraints & Global Rules require combat to remain readable and predictable, so effect stacking and caps should be explicit.

[CRUCIBLE — SYSTEMS WIKI](CRUCIBLE%20%E2%80%94%20SYSTEMS%20WIKI%2030690f09058d80d4a141c77bf182f1c2.md)