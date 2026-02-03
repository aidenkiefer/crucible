# Sprint 4: Progression & Loot Systems

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Gladiators level up, unlock skills, and earn equipment with rarity tiers

**Duration:** Week 4-5
**Prerequisites:** Sprint 3 complete (combat working)

**Architecture:** XP-based leveling, skill tree with 3 branches per class, loot generation engine, crafting system

**Tech Stack:**
- Prisma (progression data)
- TypeScript (loot algorithms)
- React (inventory UI)

---

## System Overview

### Progression Flow
1. Win match → Gain 100 XP
2. Lose match → Gain 25 XP
3. Level up at XP thresholds (Level 2 = 100 XP, Level 3 = 200 XP, etc.)
4. Each level up → +1 skill point + stat increase
5. Spend skill points on skill tree

### Loot Flow
1. Win match → Roll for loot drop (70% chance)
2. Generate item with rarity: Common (70%), Rare (25%), Epic (5%)
3. Item added to inventory
4. Equip or craft items

---

## Task 1: XP and Leveling (2 hours)

### Leveling Service

**File:** `apps/game-server/src/services/progression-service.ts`

```typescript
import { prisma } from '@gladiator/database/src/client'

export class ProgressionService {
  static async awardXP(gladiatorId: string, xpGain: number) {
    const gladiator = await prisma.gladiator.findUnique({
      where: { id: gladiatorId },
    })

    if (!gladiator) throw new Error('Gladiator not found')

    const newXP = gladiator.xp + xpGain
    const xpNeeded = this.getXPForLevel(gladiator.level + 1)

    let newLevel = gladiator.level
    let skillPointsGained = 0

    // Check for level up
    if (newXP >= xpNeeded) {
      newLevel++
      skillPointsGained++
    }

    // Update gladiator
    await prisma.gladiator.update({
      where: { id: gladiatorId },
      data: {
        xp: newXP,
        level: newLevel,
        skillPointsAvailable: { increment: skillPointsGained },
        // Stat increases per level
        strength: { increment: newLevel > gladiator.level ? 2 : 0 },
        agility: { increment: newLevel > gladiator.level ? 2 : 0 },
        endurance: { increment: newLevel > gladiator.level ? 2 : 0 },
        technique: { increment: newLevel > gladiator.level ? 2 : 0 },
      },
    })

    return {
      leveledUp: newLevel > gladiator.level,
      newLevel,
      skillPointsGained,
    }
  }

  static getXPForLevel(level: number): number {
    return level * 100
  }
}
```

---

## Task 2: Skill Tree System (2.5 hours)

### Skill Definitions

**File:** `packages/shared/src/skills/skill-tree.ts`

```typescript
export interface Skill {
  id: string
  name: string
  description: string
  class: 'Duelist' | 'Brute' | 'Assassin'
  tier: 1 | 2 | 3
  requires?: string[] // skill IDs
  effect: SkillEffect
}

export interface SkillEffect {
  type: 'stat_boost' | 'new_ability' | 'passive'
  value: any
}

export const DUELIST_SKILLS: Skill[] = [
  {
    id: 'duelist_precision',
    name: 'Precision Strike',
    description: '+10% critical hit chance',
    class: 'Duelist',
    tier: 1,
    effect: { type: 'passive', value: { critChance: 0.1 } },
  },
  {
    id: 'duelist_parry',
    name: 'Parry Master',
    description: 'Blocking costs 50% less stamina',
    class: 'Duelist',
    tier: 1,
    effect: { type: 'passive', value: { blockCostReduction: 0.5 } },
  },
  {
    id: 'duelist_riposte',
    name: 'Riposte',
    description: 'Counter-attack after successful block',
    class: 'Duelist',
    tier: 2,
    requires: ['duelist_parry'],
    effect: { type: 'new_ability', value: 'riposte' },
  },
]

// Similar for BRUTE_SKILLS, ASSASSIN_SKILLS
```

### Unlock Skill API

**File:** `apps/web/app/api/gladiator/unlock-skill/route.ts`

```typescript
import { prisma } from '@gladiator/database/src/client'
import { SKILLS } from '@gladiator/shared/src/skills/skill-tree'

export async function POST(req: Request) {
  const { gladiatorId, skillId } = await req.json()

  const gladiator = await prisma.gladiator.findUnique({
    where: { id: gladiatorId },
  })

  if (!gladiator) {
    return Response.json({ error: 'Gladiator not found' }, { status: 404 })
  }

  if (gladiator.skillPointsAvailable < 1) {
    return Response.json({ error: 'No skill points available' }, { status: 400 })
  }

  const skill = SKILLS.find(s => s.id === skillId)
  if (!skill) {
    return Response.json({ error: 'Skill not found' }, { status: 404 })
  }

  // Check prerequisites
  if (skill.requires) {
    const hasPrereqs = skill.requires.every(req =>
      gladiator.unlockedSkills.includes(req)
    )
    if (!hasPrereqs) {
      return Response.json({ error: 'Prerequisites not met' }, { status: 400 })
    }
  }

  // Unlock skill
  await prisma.gladiator.update({
    where: { id: gladiatorId },
    data: {
      unlockedSkills: { push: skillId },
      skillPointsAvailable: { decrement: 1 },
    },
  })

  return Response.json({ success: true })
}
```

---

## Task 3: Loot Generation Engine (2 hours)

**File:** `apps/game-server/src/services/loot-service.ts`

```typescript
import { Rarity, EquipmentType } from '@gladiator/shared/src/types'
import { prisma } from '@gladiator/database/src/client'

export class LootService {
  static async generateLoot(winnerId: string): Promise<void> {
    // 70% chance of loot drop
    if (Math.random() > 0.7) {
      console.log('No loot dropped')
      return
    }

    const rarity = this.rollRarity()
    const type = Math.random() < 0.5 ? EquipmentType.Weapon : EquipmentType.Armor
    const item = this.generateItem(type, rarity)

    await prisma.equipment.create({
      data: {
        ownerId: winnerId,
        type,
        rarity,
        name: item.name,
        attackBonus: item.attackBonus,
        defenseBonus: item.defenseBonus,
        speedBonus: item.speedBonus,
      },
    })

    console.log(`✨ Generated ${rarity} ${type}: ${item.name}`)
  }

  private static rollRarity(): Rarity {
    const roll = Math.random()

    if (roll < 0.05) return Rarity.Epic
    if (roll < 0.30) return Rarity.Rare
    return Rarity.Common
  }

  private static generateItem(type: EquipmentType, rarity: Rarity) {
    const multiplier = rarity === Rarity.Epic ? 3 : rarity === Rarity.Rare ? 2 : 1

    if (type === EquipmentType.Weapon) {
      return {
        name: `${rarity} ${this.randomWeaponName()}`,
        attackBonus: 5 * multiplier,
        defenseBonus: null,
        speedBonus: null,
      }
    } else {
      return {
        name: `${rarity} ${this.randomArmorName()}`,
        attackBonus: null,
        defenseBonus: 8 * multiplier,
        speedBonus: -1 * multiplier, // Armor slows you down
      }
    }
  }

  private static randomWeaponName(): string {
    const names = ['Sword', 'Spear', 'Axe', 'Mace', 'Dagger']
    return names[Math.floor(Math.random() * names.length)]
  }

  private static randomArmorName(): string {
    const names = ['Chestplate', 'Helmet', 'Shield', 'Greaves', 'Gauntlets']
    return names[Math.floor(Math.random() * names.length)]
  }
}
```

---

## Task 4: Crafting System (1.5 hours)

### Crafting Rules
- Combine 3 Common → 1 Rare
- Combine 3 Rare → 1 Epic

**File:** `apps/web/app/api/equipment/craft/route.ts`

```typescript
import { prisma } from '@gladiator/database/src/client'
import { Rarity } from '@gladiator/shared/src/types'

export async function POST(req: Request) {
  const { userId, materialIds } = await req.json()

  if (materialIds.length !== 3) {
    return Response.json({ error: 'Need exactly 3 materials' }, { status: 400 })
  }

  const materials = await prisma.equipment.findMany({
    where: {
      id: { in: materialIds },
      ownerId: userId,
    },
  })

  if (materials.length !== 3) {
    return Response.json({ error: 'Invalid materials' }, { status: 400 })
  }

  // Check all same rarity
  const rarity = materials[0].rarity
  if (!materials.every(m => m.rarity === rarity)) {
    return Response.json({ error: 'All materials must be same rarity' }, { status: 400 })
  }

  // Determine output rarity
  let newRarity: Rarity
  if (rarity === Rarity.Common) {
    newRarity = Rarity.Rare
  } else if (rarity === Rarity.Rare) {
    newRarity = Rarity.Epic
  } else {
    return Response.json({ error: 'Cannot craft higher than Epic' }, { status: 400 })
  }

  // Delete materials
  await prisma.equipment.deleteMany({
    where: { id: { in: materialIds } },
  })

  // Create new item
  const newItem = await prisma.equipment.create({
    data: {
      ownerId: userId,
      type: materials[0].type,
      rarity: newRarity,
      name: `Crafted ${newRarity} ${materials[0].type}`,
      attackBonus: materials[0].attackBonus ? materials[0].attackBonus * 1.5 : null,
      defenseBonus: materials[0].defenseBonus ? materials[0].defenseBonus * 1.5 : null,
      speedBonus: materials[0].speedBonus,
    },
  })

  return Response.json({ success: true, item: newItem })
}
```

---

## Task 5: Inventory UI (2 hours)

**File:** `apps/web/app/inventory/page.tsx`

- Grid display of all equipment
- Filter by type and rarity
- Equip/unequip buttons
- Crafting panel (select 3 items, craft button)
- Visual indicators for equipped items

---

## Verification Checklist

- [ ] XP awarded after matches
- [ ] Level up triggers at correct XP
- [ ] Skill points awarded on level up
- [ ] Skill tree displays correctly
- [ ] Skills unlock with prerequisites
- [ ] Loot drops after wins
- [ ] Rarity distribution matches probabilities
- [ ] Crafting combines items correctly
- [ ] Inventory displays all items
- [ ] Equipping items updates Gladiator stats

---

## Next Sprint

**Sprint 5: Multiplayer - Quick Match & Friend Challenges**

See: `docs/plans/06-sprint-5-multiplayer.md`
