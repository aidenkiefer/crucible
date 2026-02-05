# Sprint 5: Progression & Loot Systems + Match Persistence

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Gladiators level up, unlock skills, and earn equipment; transition from ephemeral to persistent matches

**Duration:** Week 6-7
**Prerequisites:** Sprint 4 complete (weapons & projectiles working)

**Architecture Changes (from Architecture Audit):**
- Transition from ephemeral to persistent matches
- Match results written to DB after completion
- Foundation for disconnect handling (Sprint 6)
- XP/loot awarded from persisted match results

**Architecture:** XP-based leveling, skill tree with 3 branches per class, loot generation engine, crafting system, match persistence layer

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
4. Each level up → +1 skill point + stat increase (apply to **8 stats**: constitution, strength, dexterity, speed, defense, magicResist, arcana, faith — see schema)
5. Spend skill points on skill tree; store unlocked skill **IDs** in `Gladiator.unlockedSkills` (behavior from static definitions)

### Loot Flow
1. Win match → Roll for loot drop (70% chance)
2. Create **Equipment** instance: set `templateId` (reference EquipmentTemplate), `rolledMods` (JSON per **docs/data-glossary.md** §8.3), `grantedPerkIds`, `ownerId`, `type`, `rarity`, `name`
3. Item added to user inventory (Equipment rows)
4. **Equip** via **GladiatorEquippedItem** (slot-based): one row per (gladiatorId, slot). Slots: MAIN_HAND, OFF_HAND, HELMET, CHEST, GAUNTLETS, GREAVES. No hardcoded equippedWeaponId/equippedArmorId in new code.

**References:** **docs/features/equipment.md**, **docs/data-glossary.md** (Equipment, EquipmentTemplate, GladiatorEquippedItem, §8.3 rolledMods), **docs/architecture-audit.md** (match persistence rationale).

---

## Task 0: Match Persistence (3 hours)

**Goal:** Store match results and events to enable XP/loot awards and match history

### Update Match Schema

**File:** `packages/database/prisma/schema.prisma`

Ensure Match model includes:
```prisma
model Match {
  id                  String   @id @default(uuid())
  player1Id           String
  player1GladiatorId  String
  player2Id           String?  // null for CPU
  player2GladiatorId  String?
  isCpuMatch          Boolean  @default(false)
  winnerId            String?  // Set after completion
  matchLog            Json     // Compressed event log
  durationSeconds     Int
  createdAt           DateTime @default(now())
  completedAt         DateTime?

  player1             User     @relation("Player1Matches", fields: [player1Id], references: [id])
  player2             User?    @relation("Player2Matches", fields: [player2Id], references: [id])
}
```

### Persist Match Results

**File:** `apps/game-server/src/services/match-instance.ts` (update)

```typescript
import { prisma } from '@gladiator/database/src/client'

export class MatchInstance {
  // ... existing code ...

  public async stop(): Promise<void> {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }

    if (this.status === MatchStatus.InProgress) {
      this.status = MatchStatus.Completed

      // **NEW: Persist match results to DB**
      await this.persistMatchResult()
    }

    console.log(`Match ${this.config.matchId} stopped`)
  }

  private async persistMatchResult(): Promise<void> {
    const winnerId = this.engine.getWinner()
    const duration = (Date.now() - this.matchStartTime) / 1000

    // Map combatant ID to gladiator ID
    const winnerGladiatorId = this.mapCombatantToGladiator(winnerId || '')

    try {
      // Write match result to database
      await prisma.match.update({
        where: { id: this.config.matchId },
        data: {
          winnerId: winnerGladiatorId,
          durationSeconds: Math.floor(duration),
          completedAt: new Date(),
          // Store compressed event log (for potential replay/debugging)
          matchLog: this.compressEvents(this.allEvents),
        },
      })

      console.log(`Match ${this.config.matchId} persisted: winner=${winnerGladiatorId}`)
    } catch (error) {
      console.error('Failed to persist match result:', error)
      // Don't throw - match is over, just log the error
    }
  }

  private compressEvents(events: CombatEvent[]): any {
    // For demo: just store limited events
    // Future: compress with pako or similar
    return events.slice(-100) // Keep last 100 events
  }
}
```

### Match History API

**File:** `apps/web/app/api/matches/history/route.ts`

```typescript
import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'

export async function GET(req: Request) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { player1Id: session.user.id },
        { player2Id: session.user.id },
      ],
      completedAt: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    take: 20,
    include: {
      player1: { select: { username: true } },
      player2: { select: { username: true } },
    },
  })

  return Response.json({ matches })
}
```

### Match History UI

**File:** `apps/web/app/matches/page.tsx`

- Display list of past matches
- Show winner, duration, date
- Filter by CPU vs PvP
- Click to view details (future: replay)

### Verification

- [ ] Match results persisted after completion
- [ ] Winner ID correctly mapped
- [ ] Match history API returns user's matches
- [ ] Match history UI displays correctly

---

## Task 1: XP and Leveling (2 hours)

**Goal:** Award XP after match completion (uses Task 0 persistence)

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
        constitution: { increment: newLevel > gladiator.level ? 1 : 0 },
        strength: { increment: newLevel > gladiator.level ? 1 : 0 },
        dexterity: { increment: newLevel > gladiator.level ? 1 : 0 },
        speed: { increment: newLevel > gladiator.level ? 1 : 0 },
        defense: { increment: newLevel > gladiator.level ? 1 : 0 },
        magicResist: { increment: newLevel > gladiator.level ? 1 : 0 },
        arcana: { increment: newLevel > gladiator.level ? 1 : 0 },
        faith: { increment: newLevel > gladiator.level ? 1 : 0 },
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

### Award XP After Match Completion

**File:** `apps/game-server/src/services/match-instance.ts` (update `persistMatchResult`)

```typescript
import { ProgressionService } from './progression-service'
import { LootService } from './loot-service' // Task 3

private async persistMatchResult(): Promise<void> {
  const winnerId = this.engine.getWinner()
  const duration = (Date.now() - this.matchStartTime) / 1000

  const winnerGladiatorId = this.mapCombatantToGladiator(winnerId || '')
  const loserGladiatorId = winnerId === this.config.player1.gladiatorId
    ? this.config.player2?.gladiatorId || 'cpu'
    : this.config.player1.gladiatorId

  try {
    // 1. Persist match result
    await prisma.match.update({
      where: { id: this.config.matchId },
      data: {
        winnerId: winnerGladiatorId,
        durationSeconds: Math.floor(duration),
        completedAt: new Date(),
        matchLog: this.compressEvents(this.allEvents),
      },
    })

    // 2. Award XP (winner gets 100, loser gets 25)
    if (winnerGladiatorId && winnerGladiatorId !== 'cpu') {
      await ProgressionService.awardXP(winnerGladiatorId, 100)
    }
    if (loserGladiatorId && loserGladiatorId !== 'cpu') {
      await ProgressionService.awardXP(loserGladiatorId, 25)
    }

    // 3. Award loot (Task 3)
    if (winnerGladiatorId && winnerGladiatorId !== 'cpu') {
      await LootService.generateLoot(winnerGladiatorId)
    }

    console.log(`Match ${this.config.matchId} persisted: winner=${winnerGladiatorId}`)
  } catch (error) {
    console.error('Failed to persist match result:', error)
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
