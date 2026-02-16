# Skill Tree System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the new cross-class skill tree system with 6 trees (Valor, Instinct, Discipline, Intellect, Zeal, Ferocity) and 90 tier 1-5 skills.

**Architecture:** Replace the existing class-specific skill trees (Duelist, Brute, Assassin, Mage) with cross-class skill trees. Each tree has 6 tiers with 3 choices per tier. Skills are shared across all classes but support different stat-based builds. Update shared skill definitions, API endpoints, and database schema.

**Tech Stack:** TypeScript, Prisma, Next.js API routes, React

---

## Task 1: Update Shared Skill Tree Definitions

**Files:**
- Modify: `packages/shared/src/skills/skill-trees.ts`
- Read: `docs/plans/2026-02-15-skill-tree-tiers-design.md`
- Read: `docs/notion/Skill Tree Database 30690f09058d80b3bcd9cdaac6333b35.csv`

**Step 1: Read the design document and CSV**

Review the skill tree design to understand:
- 6 cross-class trees: Valor, Instinct, Discipline, Intellect, Zeal, Ferocity
- Each tree has 18 skills (tiers 1-5) + 3 capstones (tier 6)
- Flexible prerequisites: any tier N unlocks tier N+1

**Step 2: Update SkillNode interface to support new fields**

In `packages/shared/src/skills/skill-trees.ts`, update the interface:

```typescript
export interface SkillNode {
  id: string
  name: string
  description: string
  tree: 'Valor' | 'Instinct' | 'Discipline' | 'Intellect' | 'Zeal' | 'Ferocity' // NEW: tree name instead of branch
  tier: number // 1-6
  prerequisiteTier?: number // NEW: which tier must be unlocked (flexible prereq)
  statBoosts: Record<string, number>
  cost: number // Skill points required (1 for tiers 1-5, 2 for tier 6)
  effectType?: string // NEW: from CSV (e.g., "Passive Modifier", "Conditional Buff")
  combatBehavior?: string // NEW: from CSV
  buildRole?: string // NEW: from CSV
  duration?: number // NEW: for timed effects
  cooldown?: number // NEW: for active abilities
  isActive?: boolean // NEW: true for active abilities
}
```

**Step 3: Define VALOR tree skills (tiers 1-5)**

Add VALOR skill definitions from the CSV:

```typescript
export const VALOR_SKILLS: SkillNode[] = [
  // Tier 1
  {
    id: 'valor_fortified_body',
    name: 'Fortified Body',
    description: 'Passive: +2 CON',
    tree: 'Valor',
    tier: 1,
    statBoosts: { constitution: 2 },
    cost: 1,
    effectType: 'Passive Modifier',
    buildRole: 'Survivability',
  },
  {
    id: 'valor_iron_skin',
    name: 'Iron Skin',
    description: 'Passive: +2 DEF',
    tree: 'Valor',
    tier: 1,
    statBoosts: { defense: 2 },
    cost: 1,
    effectType: 'Passive Modifier',
    buildRole: 'Survivability',
  },
  {
    id: 'valor_warded_flesh',
    name: 'Warded Flesh',
    description: 'Passive: +1 CON +1 MR',
    tree: 'Valor',
    tier: 1,
    statBoosts: { constitution: 1, magicResist: 1 },
    cost: 1,
    effectType: 'Passive Modifier',
    buildRole: 'Survivability',
  },
  // Tier 2
  {
    id: 'valor_enduring_stamina',
    name: 'Enduring Stamina',
    description: 'Passive: +2 CON +1 STR, +5% stamina pool',
    tree: 'Valor',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { constitution: 2, strength: 1 },
    cost: 1,
    effectType: 'Passive Modifier, Resource Effect',
    combatBehavior: 'Passive: +5% stamina pool',
    buildRole: 'Resource Economy, Survivability',
  },
  {
    id: 'valor_defensive_stance',
    name: 'Defensive Stance',
    description: 'Passive: +2 DEF +1 CON, Take 3% less damage while HP ≥ 70%',
    tree: 'Valor',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { defense: 2, constitution: 1 },
    cost: 1,
    effectType: 'Conditional Buff, Defensive Effect',
    combatBehavior: 'Take 3% less damage while HP ≥ 70%',
    buildRole: 'Survivability',
  },
  {
    id: 'valor_arcane_resistance',
    name: 'Arcane Resistance',
    description: 'Passive: +1 DEF +1 MR +1 CON, +5% magic mitigation',
    tree: 'Valor',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { defense: 1, magicResist: 1, constitution: 1 },
    cost: 1,
    effectType: 'Defensive Effect, Passive Modifier',
    combatBehavior: 'Passive: +5% magic mitigation',
    buildRole: 'Survivability',
  },
  // ... continue for all tiers 3-5 (15 skills total for Valor)
]
```

**Step 4: Define remaining tree skills (INSTINCT, DISCIPLINE, INTELLECT, ZEAL, FEROCITY)**

Follow the same pattern for all 6 trees using the CSV data. Each tree should have 15 skills (tiers 1-5).

**Step 5: Add capstone skills (tier 6)**

The capstones are already defined in the CSV. Add them with tier: 6, cost: 2, prerequisiteTier: 5.

**Step 6: Update SKILL_TREES registry**

```typescript
export const SKILL_TREES: Record<string, SkillNode[]> = {
  Valor: VALOR_SKILLS,
  Instinct: INSTINCT_SKILLS,
  Discipline: DISCIPLINE_SKILLS,
  Intellect: INTELLECT_SKILLS,
  Zeal: ZEAL_SKILLS,
  Ferocity: FEROCITY_SKILLS,
}
```

**Step 7: Update helper functions**

Update `getSkillTree()`, `getSkill()`, and `canUnlockSkill()` to work with the new structure:

```typescript
/**
 * Get skill tree by name
 */
export function getSkillTree(treeName: string): SkillNode[] {
  const tree = SKILL_TREES[treeName]
  if (!tree) {
    throw new Error(`Unknown skill tree: ${treeName}`)
  }
  return tree
}

/**
 * Check if a skill can be unlocked (prerequisite met)
 */
export function canUnlockSkill(
  skillId: string,
  unlockedSkills: string[]
): boolean {
  const skill = getSkill(skillId)
  if (!skill) return false

  // Already unlocked?
  if (unlockedSkills.includes(skillId)) {
    return false
  }

  // Check prerequisite tier
  if (skill.prerequisiteTier) {
    const tree = getSkillTree(skill.tree)
    const prerequisiteMet = tree.some(
      (s) => s.tier === skill.prerequisiteTier && unlockedSkills.includes(s.id)
    )
    if (!prerequisiteMet) {
      return false
    }
  }

  return true
}

/**
 * Get all available trees
 */
export function getAllTreeNames(): string[] {
  return Object.keys(SKILL_TREES)
}

/**
 * Calculate total skill points spent
 */
export function calculateSkillPointsSpent(unlockedSkills: string[]): number {
  return unlockedSkills.reduce((total, skillId) => {
    const skill = getSkill(skillId)
    return total + (skill?.cost || 0)
  }, 0)
}
```

**Step 8: Commit**

```bash
git add packages/shared/src/skills/skill-trees.ts
git commit -m "feat: add cross-class skill trees with 90 new skills

- Replace class-specific trees with 6 cross-class trees
- Add Valor, Instinct, Discipline, Intellect, Zeal, Ferocity trees
- 15 skills per tree (tiers 1-5) + 3 capstones (tier 6)
- Update SkillNode interface with new fields
- Flexible prerequisites: any tier N unlocks tier N+1

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Update Database Schema (if needed)

**Files:**
- Read: `packages/database/prisma/schema.prisma`

**Step 1: Review Gladiator model**

Check if the current schema supports the new skill system:

```prisma
model Gladiator {
  // ...
  unlockedSkills String[] @default([])
  skillPointsAvailable Int @default(0)
  // ...
}
```

**Step 2: Determine if migration is needed**

The existing `unlockedSkills` string array should work for the new system. No schema changes needed unless we want to add skill point tracking.

**Step 3: (Optional) Add skill points tracking**

If we want to track available skill points separately:

```prisma
model Gladiator {
  // ...
  unlockedSkills String[] @default([])
  skillPointsAvailable Int @default(0) // Already exists
  skillPointsSpent Int @default(0) // NEW: for validation
  // ...
}
```

If adding new fields, run:

```bash
npx prisma migrate dev --name add_skill_points_tracking
```

**Step 4: Commit (if schema changed)**

```bash
git add packages/database/prisma/schema.prisma packages/database/prisma/migrations/
git commit -m "feat: add skill points tracking to Gladiator model

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update Skill Unlock API Endpoint

**Files:**
- Modify: `apps/web/app/api/gladiators/[gladiatorId]/skills/unlock/route.ts`
- Read: `packages/shared/src/skills/skill-trees.ts`

**Step 1: Update validation logic**

Modify the unlock endpoint to work with cross-class trees:

```typescript
import { getSkill, canUnlockSkill, calculateSkillPointsSpent } from '@gladiator/shared/skills'

export async function POST(
  request: Request,
  { params }: { params: { gladiatorId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { skillId } = await request.json()

  // Fetch gladiator
  const gladiator = await prisma.gladiator.findUnique({
    where: { id: params.gladiatorId, userId: session.user.id },
  })

  if (!gladiator) {
    return NextResponse.json({ error: 'Gladiator not found' }, { status: 404 })
  }

  // Validate skill exists
  const skill = getSkill(skillId)
  if (!skill) {
    return NextResponse.json({ error: 'Invalid skill' }, { status: 400 })
  }

  // Check if can unlock (prerequisites met)
  if (!canUnlockSkill(skillId, gladiator.unlockedSkills)) {
    return NextResponse.json(
      { error: 'Prerequisites not met or skill already unlocked' },
      { status: 400 }
    )
  }

  // Check skill points available
  const pointsSpent = calculateSkillPointsSpent(gladiator.unlockedSkills)
  const pointsAvailable = gladiator.skillPointsAvailable - pointsSpent

  if (pointsAvailable < skill.cost) {
    return NextResponse.json(
      { error: 'Not enough skill points' },
      { status: 400 }
    )
  }

  // Unlock skill
  const updated = await prisma.gladiator.update({
    where: { id: params.gladiatorId },
    data: {
      unlockedSkills: [...gladiator.unlockedSkills, skillId],
    },
  })

  return NextResponse.json({
    success: true,
    gladiator: updated,
    pointsRemaining: gladiator.skillPointsAvailable - calculateSkillPointsSpent(updated.unlockedSkills),
  })
}
```

**Step 2: Add GET endpoint for tree data**

Create `apps/web/app/api/skill-trees/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getAllTreeNames, getSkillTree } from '@gladiator/shared/skills'

export async function GET() {
  const treeNames = getAllTreeNames()
  const trees = treeNames.reduce((acc, name) => {
    acc[name] = getSkillTree(name)
    return acc
  }, {} as Record<string, any>)

  return NextResponse.json({ trees })
}
```

**Step 3: Commit**

```bash
git add apps/web/app/api/gladiators/[gladiatorId]/skills/unlock/route.ts apps/web/app/api/skill-trees/route.ts
git commit -m "feat: update skill unlock API for cross-class trees

- Validate prerequisites using new flexible tier system
- Add skill point cost checking
- Add GET endpoint for all skill trees

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update Frontend Skill Tree Component

**Files:**
- Modify: `apps/web/components/skills/SkillTree.tsx`
- Read: `packages/shared/src/skills/skill-trees.ts`

**Step 1: Update component to fetch all 6 trees**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { SkillNode } from '@gladiator/shared/skills'

interface SkillTreeProps {
  gladiatorId: string
  unlockedSkills: string[]
  skillPointsAvailable: number
  onSkillUnlock: (skillId: string) => void
}

export function SkillTree({
  gladiatorId,
  unlockedSkills,
  skillPointsAvailable,
  onSkillUnlock,
}: SkillTreeProps) {
  const [trees, setTrees] = useState<Record<string, SkillNode[]>>({})
  const [selectedTree, setSelectedTree] = useState<string>('Valor')

  useEffect(() => {
    fetch('/api/skill-trees')
      .then((res) => res.json())
      .then((data) => setTrees(data.trees))
  }, [])

  const currentTree = trees[selectedTree] || []
  const pointsSpent = unlockedSkills.reduce((total, skillId) => {
    const skill = Object.values(trees)
      .flat()
      .find((s) => s.id === skillId)
    return total + (skill?.cost || 0)
  }, 0)
  const pointsRemaining = skillPointsAvailable - pointsSpent

  return (
    <div className="skill-tree-container">
      {/* Tree selector */}
      <div className="tree-tabs">
        {Object.keys(trees).map((treeName) => (
          <button
            key={treeName}
            onClick={() => setSelectedTree(treeName)}
            className={selectedTree === treeName ? 'active' : ''}
          >
            {treeName}
          </button>
        ))}
      </div>

      {/* Points display */}
      <div className="skill-points">
        Skill Points: {pointsRemaining} / {skillPointsAvailable}
      </div>

      {/* Skill nodes by tier */}
      <div className="skill-tiers">
        {[1, 2, 3, 4, 5, 6].map((tier) => {
          const tierSkills = currentTree.filter((s) => s.tier === tier)
          return (
            <div key={tier} className="tier">
              <h3>Tier {tier}</h3>
              <div className="tier-skills">
                {tierSkills.map((skill) => (
                  <SkillNode
                    key={skill.id}
                    skill={skill}
                    isUnlocked={unlockedSkills.includes(skill.id)}
                    canUnlock={canUnlockSkill(skill, unlockedSkills, currentTree)}
                    onUnlock={() => onSkillUnlock(skill.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function canUnlockSkill(
  skill: SkillNode,
  unlockedSkills: string[],
  tree: SkillNode[]
): boolean {
  if (unlockedSkills.includes(skill.id)) return false

  if (skill.prerequisiteTier) {
    return tree.some(
      (s) => s.tier === skill.prerequisiteTier && unlockedSkills.includes(s.id)
    )
  }

  return true
}

function SkillNode({
  skill,
  isUnlocked,
  canUnlock,
  onUnlock,
}: {
  skill: SkillNode
  isUnlocked: boolean
  canUnlock: boolean
  onUnlock: () => void
}) {
  return (
    <div
      className={`skill-node ${isUnlocked ? 'unlocked' : ''} ${
        canUnlock ? 'available' : 'locked'
      }`}
      onClick={canUnlock && !isUnlocked ? onUnlock : undefined}
    >
      <h4>{skill.name}</h4>
      <p>{skill.description}</p>
      <div className="cost">Cost: {skill.cost}</div>
      {skill.isActive && <span className="active-badge">Active</span>}
    </div>
  )
}
```

**Step 2: Add styles**

Update the component's CSS to handle the new tree structure and 6 trees.

**Step 3: Test in Camp page**

Verify the skill tree component works in `/camp/gladiators/[id]` page.

**Step 4: Commit**

```bash
git add apps/web/components/skills/SkillTree.tsx
git commit -m "feat: update SkillTree component for cross-class trees

- Add tree selector for 6 trees (Valor, Instinct, Discipline, etc.)
- Display skills by tier (1-6)
- Show skill points remaining
- Handle flexible prerequisites

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add Skill Point Grants on Level Up

**Files:**
- Modify: `apps/game-server/src/services/progression.ts`
- Read: `packages/shared/src/constants/index.ts`

**Step 1: Update level-up logic**

Ensure gladiators receive skill points when leveling up:

```typescript
export async function awardXP(
  gladiatorId: string,
  xpAmount: number
): Promise<{ leveledUp: boolean; newLevel?: number }> {
  const gladiator = await prisma.gladiator.findUnique({
    where: { id: gladiatorId },
  })

  if (!gladiator) {
    throw new Error('Gladiator not found')
  }

  const newXP = gladiator.xp + xpAmount
  const newLevel = calculateLevel(newXP)
  const leveledUp = newLevel > gladiator.level

  const updates: any = { xp: newXP }

  if (leveledUp) {
    const levelsGained = newLevel - gladiator.level
    updates.level = newLevel

    // Grant 1 skill point per level
    updates.skillPointsAvailable = gladiator.skillPointsAvailable + levelsGained
  }

  await prisma.gladiator.update({
    where: { id: gladiatorId },
    data: updates,
  })

  return { leveledUp, newLevel: leveledUp ? newLevel : undefined }
}
```

**Step 2: Add constant for skill points per level**

In `packages/shared/src/constants/index.ts`:

```typescript
export const SKILL_POINTS_PER_LEVEL = 1
export const MAX_SKILL_POINTS = 20 // Level 1-20 = 19 level-ups = 19 points + 1 starting = 20
```

**Step 3: Commit**

```bash
git add apps/game-server/src/services/progression.ts packages/shared/src/constants/index.ts
git commit -m "feat: grant skill points on level up

- Award 1 skill point per level
- Update progression service
- Add skill point constants

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Data Migration (Convert Old Skill Trees)

**Files:**
- Create: `packages/database/scripts/migrate-skill-trees.ts`

**Step 1: Write migration script**

Create a script to convert old class-specific skills to new cross-class skills:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateSkillTrees() {
  console.log('Migrating skill trees from class-specific to cross-class...')

  // Get all gladiators
  const gladiators = await prisma.gladiator.findMany()

  for (const gladiator of gladiators) {
    // Clear old skills
    await prisma.gladiator.update({
      where: { id: gladiator.id },
      data: {
        unlockedSkills: [],
        skillPointsAvailable: gladiator.level, // Grant skill points based on level
      },
    })

    console.log(`Reset skills for gladiator ${gladiator.id}`)
  }

  console.log('Migration complete!')
}

migrateSkillTrees()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**Step 2: Run migration**

```bash
cd packages/database
npx tsx scripts/migrate-skill-trees.ts
```

**Step 3: Commit**

```bash
git add packages/database/scripts/migrate-skill-trees.ts
git commit -m "chore: add skill tree migration script

- Reset old class-specific skills
- Grant skill points based on level

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Testing & Validation

**Files:**
- Create: `packages/shared/src/skills/__tests__/skill-trees.test.ts`

**Step 1: Write tests for skill tree functions**

```typescript
import { describe, it, expect } from 'vitest'
import {
  getSkillTree,
  getSkill,
  canUnlockSkill,
  calculateSkillPointsSpent,
  getAllTreeNames,
} from '../skill-trees'

describe('Skill Trees', () => {
  it('should return all 6 tree names', () => {
    const trees = getAllTreeNames()
    expect(trees).toHaveLength(6)
    expect(trees).toContain('Valor')
    expect(trees).toContain('Instinct')
    expect(trees).toContain('Discipline')
    expect(trees).toContain('Intellect')
    expect(trees).toContain('Zeal')
    expect(trees).toContain('Ferocity')
  })

  it('should return Valor tree with 18 skills', () => {
    const tree = getSkillTree('Valor')
    expect(tree).toHaveLength(18) // 15 tiers 1-5 + 3 capstones
  })

  it('should find skill by ID', () => {
    const skill = getSkill('valor_fortified_body')
    expect(skill).toBeDefined()
    expect(skill?.name).toBe('Fortified Body')
    expect(skill?.tier).toBe(1)
  })

  it('should allow unlocking tier 1 skill with no prerequisites', () => {
    const canUnlock = canUnlockSkill('valor_fortified_body', [])
    expect(canUnlock).toBe(true)
  })

  it('should prevent unlocking tier 2 without tier 1', () => {
    const canUnlock = canUnlockSkill('valor_enduring_stamina', [])
    expect(canUnlock).toBe(false)
  })

  it('should allow unlocking tier 2 with any tier 1 unlocked', () => {
    const canUnlock = canUnlockSkill('valor_enduring_stamina', ['valor_fortified_body'])
    expect(canUnlock).toBe(true)
  })

  it('should calculate skill points spent correctly', () => {
    const spent = calculateSkillPointsSpent([
      'valor_fortified_body', // tier 1, cost 1
      'valor_enduring_stamina', // tier 2, cost 1
    ])
    expect(spent).toBe(2)
  })

  it('should count capstone cost as 2 points', () => {
    const spent = calculateSkillPointsSpent([
      'valor_fortified_body', // 1
      'valor_enduring_stamina', // 1
      'valor_battle_scars', // 1
      'valor_steadfast_guard', // 1
      'valor_second_wind', // 1
      'zone_of_denial', // 2 (capstone)
    ])
    expect(spent).toBe(7)
  })
})
```

**Step 2: Run tests**

```bash
cd packages/shared
pnpm test
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add packages/shared/src/skills/__tests__/skill-trees.test.ts
git commit -m "test: add skill tree system tests

- Test tree retrieval
- Test prerequisite validation
- Test skill point calculation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Documentation

**Files:**
- Create: `docs/features/skill-trees-cross-class.md`

**Step 1: Write user-facing documentation**

```markdown
# Cross-Class Skill Trees

## Overview

Crucible features 6 cross-class skill trees that all Gladiators can invest in, regardless of class. Each tree offers unique build paths and playstyles.

## The Six Trees

1. **Valor** — Durability, survival, defensive spikes
2. **Instinct** — Movement, dodge mastery, tempo control
3. **Discipline** — Weapon mastery, stamina economy, precision
4. **Intellect** — Arcane power, mana loops, spell enhancement
5. **Zeal** — Faith scaling, sustain, resilience, support aggression
6. **Ferocity** — Aggressive pressure, execute windows, berserker tempo

## Skill Point Economy

- **Total points:** 20 (by level 20)
- **Tier 1-5 skills:** 1 point each
- **Tier 6 capstones:** 2 points each
- **Typical build:** 2 major trees (capstones) + 1 minor tree

## Prerequisites

Skills have **flexible prerequisites**:
- Tier 1: No prerequisites
- Tier 2+: Must have unlocked ANY skill from the previous tier

This allows creative mixing within a tree.

## Active Abilities

Each tree has ONE active ability at tier 5. Maximum 2-3 active abilities per build.

## Example Builds

### Tank Build: Valor + Discipline
- **Valor:** Defensive passives → Zone of Denial capstone
- **Discipline:** Stamina efficiency → Weapon Mastery
- **Result:** Durable control tank with weapon prowess

### Mobile Striker: Instinct + Ferocity
- **Instinct:** Dodge mastery → Perfect Flow capstone
- **Ferocity:** Execute damage → Blood Surge
- **Result:** High-mobility assassin with chase potential

### Spellblade: Intellect + Discipline
- **Intellect:** Spell power → Spell Weaving capstone
- **Discipline:** Weapon scaling → Master Scaling
- **Result:** Hybrid caster with weapon+spell synergy
```

**Step 2: Commit**

```bash
git add docs/features/skill-trees-cross-class.md
git commit -m "docs: add cross-class skill tree documentation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Final Integration Test

**Step 1: Start dev servers**

```bash
# Terminal 1: Start game server
cd apps/game-server
pnpm dev

# Terminal 2: Start web app
cd apps/web
pnpm dev
```

**Step 2: Manual testing checklist**

1. ✅ Navigate to `/camp/gladiators/[id]`
2. ✅ Verify skill tree UI shows 6 trees
3. ✅ Unlock a tier 1 skill
4. ✅ Verify tier 2 unlocks after tier 1
5. ✅ Verify skill points decrement correctly
6. ✅ Verify stat bonuses apply to gladiator
7. ✅ Level up and verify skill points granted
8. ✅ Test unlocking skills across multiple trees

**Step 3: Fix any issues found**

Address bugs and edge cases discovered during testing.

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete cross-class skill tree system

All 6 trees (Valor, Instinct, Discipline, Intellect, Zeal, Ferocity)
with 90 tier 1-5 skills + 18 capstones integrated and tested.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Completion Checklist

- [ ] Task 1: Update shared skill tree definitions ✓
- [ ] Task 2: Update database schema (if needed) ✓
- [ ] Task 3: Update skill unlock API endpoint ✓
- [ ] Task 4: Update frontend skill tree component ✓
- [ ] Task 5: Add skill point grants on level up ✓
- [ ] Task 6: Data migration script ✓
- [ ] Task 7: Testing & validation ✓
- [ ] Task 8: Documentation ✓
- [ ] Task 9: Final integration test ✓

---

**End of Implementation Plan**
