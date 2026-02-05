# Perks and Abilities System

**Status:** Planned for Post-Demo (Sprint 8+)
**Dependencies:** Sprint 5 (Progression & Loot), Sprint 7 (Polish & Deployment)

---

## Overview

The Perks and Abilities system extends character customization beyond base stats and skill trees, providing unique combat modifiers, passive bonuses, and active abilities that define build variety and strategic depth.

**Core concept:** Equipment and skill tree choices grant perks and abilities that fundamentally change how a Gladiator plays.

---

## System Architecture

### Perks (Passive Modifiers)

**Definition:** Permanent passive bonuses granted by equipment, skill tree nodes, or achievements.

**Implementation:**
- Stored as `grantedPerkIds` on Equipment instances
- Perks reference PerkTemplate definitions (similar to Equipment/Action templates)
- Combat engine applies perk modifiers during derived stat calculation
- Perks stack unless explicitly marked as unique

**Example Perks:**

| Perk ID | Name | Effect | Source |
|---------|------|--------|--------|
| `perk_berserker_fury` | Berserker's Fury | +20% damage when HP < 50% | Brute skill tree |
| `perk_assassin_ambush` | Ambush | +30% damage on first hit | Assassin skill tree |
| `perk_duelist_riposte` | Riposte | 15% chance to counterattack when hit | Duelist skill tree |
| `perk_mage_mana_shield` | Mana Shield | Convert 10% mana to damage absorption | Mage skill tree |
| `perk_armor_piercing` | Armor Piercing | Ignore 20% of target defense | Epic weapons |
| `perk_life_steal` | Life Steal | Heal for 10% of damage dealt | Legendary weapons |

---

### Abilities (Active Skills)

**Definition:** Active combat skills with cooldowns, triggered by player input or AI logic.

**Implementation:**
- Abilities are ActionTemplates with special flags (isAbility, abilitySlot)
- Gladiator loadout has ability slots (Primary, Secondary, Ultimate)
- Equipment or skill trees unlock abilities → player assigns to slots
- Combat engine processes ability actions like attacks/casts

**Example Abilities:**

| Ability ID | Name | Cooldown | Effect | Class |
|-----------|------|----------|--------|-------|
| `ability_charge` | Shield Charge | 12s | Dash forward, stun target 1s | Brute |
| `ability_shadow_step` | Shadow Step | 8s | Teleport behind target | Assassin |
| `ability_blade_flurry` | Blade Flurry | 15s | 3 rapid attacks in 1s | Duelist |
| `ability_fireball` | Fireball | 6s | Ranged projectile, AoE damage | Mage |
| `ability_heal` | Divine Heal | 20s | Restore 30% HP | Faith build |
| `ability_berserk` | Berserk Mode | 30s | +50% damage, -30% defense, 8s duration | Brute |

---

## Data Model (Prisma Schema)

```prisma
model PerkTemplate {
  id          String @id @default(uuid())
  key         String @unique // perk_berserker_fury
  name        String // "Berserker's Fury"
  description String

  // Perk effects (JSON)
  effects     Json // { damageMultiplier: 1.2, condition: "hp < 0.5" }

  tags        String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Gladiator {
  // ... existing fields ...

  // Loadout: Equipped abilities (up to 3 slots)
  loadout Json @default("{}") // { primary: "ability_charge", secondary: "ability_heal", ultimate: null }
}
```

---

## Perk Categories

### 1. Damage Modifiers
- Conditional damage boosts (low HP, full HP, flanking, etc.)
- Armor penetration
- Critical hit chance/damage
- Elemental damage conversion

### 2. Survivability
- Damage reduction
- Life steal/regeneration
- Shield/barrier generation
- Crowd control resistance

### 3. Utility
- Movement speed boosts
- Cooldown reduction
- Stamina/mana regeneration
- Status effect immunity

### 4. Synergy
- Perks that combo with specific weapon types
- Class-specific bonuses
- Stat scaling enhancements

---

## Ability Categories

### 1. Mobility
- Dashes, teleports, charges
- Short cooldowns (6-10s)
- Used for positioning and evasion

### 2. Offensive
- Burst damage skills
- Medium cooldowns (10-15s)
- High impact but require setup

### 3. Defensive
- Shields, heals, immunities
- Long cooldowns (15-25s)
- Survival tools for tough situations

### 4. Ultimate
- Game-changing abilities
- Very long cooldowns (30-60s)
- Defining moments in combat

---

## Integration with Existing Systems

### Sprint 5: Skill Trees
- Skill nodes can grant perks (e.g., "Master Duelist" unlocks `perk_duelist_riposte`)
- Later tiers unlock ability slots

### Sprint 5: Equipment
- Equipment `grantedPerkIds` array populates active perks
- Weapons can grant weapon-specific abilities

### Sprint 6: Multiplayer
- Abilities transmitted via `match:action` events
- Server validates ability cooldowns and costs

### Sprint 7: Polish
- Ability animations and VFX
- Perk tooltips and UI indicators

---

## Demo Scope (Sprint 5)

**In Scope:**
- Data model for perks/abilities (schema, templates)
- Stub perk application (equipment references `grantedPerkIds`, but perks don't affect combat yet)
- Documentation (this file)

**Out of Scope:**
- Active combat integration (Sprint 8+)
- Ability UI and keybindings (Sprint 8+)
- Perk stacking logic and calculations (Sprint 8+)

---

## Post-Demo Roadmap (Sprint 8+)

### Phase 1: Perk Integration
1. Create ~20 foundational perks covering all categories
2. Integrate perk effects into CombatEngine stat calculations
3. Add perks to Epic/Legendary starter gear
4. Skill tree nodes grant perks at higher tiers

### Phase 2: Ability System
1. Define 3-5 abilities per class (12-20 total)
2. Add ability slots to Gladiator loadout
3. Implement ability action processing in CombatEngine
4. UI for ability assignment and keybindings

### Phase 3: Advanced Perks
1. Conditional perks (trigger on events)
2. Stacking perks (diminishing returns)
3. Unique perks (one per build)
4. Set bonuses (multiple equipment from same set)

### Phase 4: Balance & Polish
1. Playtesting and balance passes
2. Visual effects for abilities
3. Tooltips and feedback
4. Meta analysis and tuning

---

## Design Constraints

### 1. Server Authority
- All perk effects calculated server-side
- Client displays tooltips but doesn't apply effects
- Abilities validated by server (cooldown, cost, prerequisites)

### 2. Build Diversity
- No "must-have" perks or abilities
- Multiple viable builds per class
- Encourage experimentation

### 3. Clarity
- Perk/ability descriptions must be clear and specific
- Numbers visible (no hidden stats)
- Combat log shows perk triggers

### 4. Performance
- Perks calculated once at match start (during derived stats)
- Abilities use existing action processing (no special cases)

---

## Open Questions (Post-Demo)

1. **Perk stacking:** Diminishing returns? Hard caps? Additive vs multiplicative?
2. **Ability resource:** Mana, charges, or shared resource pool?
3. **Ultimate abilities:** How to balance without making fights snowball?
4. **Set bonuses:** Worth the complexity? How many items for a set?
5. **Class identity:** Should abilities be class-locked or equipment-locked?

---

## References

- `docs/features/equipment.md` — Equipment templates and stat system
- `docs/data-glossary.md` — JSON conventions for templates
- `packages/shared/src/skills/skill-trees.ts` — Skill tree definitions
- `docs/plans/00-MASTER-PLAN.md` — Overall design philosophy
