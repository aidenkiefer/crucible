# Skills Polish, Stat Allocation & Armory Shop

**Date:** 2026-02-16
**Status:** Design Complete, Ready for Implementation
**Features:** Skills System Performance & Bug Fixes, Stat Point Allocation UI, Armory Shop Purchase Flow

---

## Overview

Three polish features to improve Camp experience and complete the Armory shop:

1. **Skills System** - Fix performance issues, skill points bug, and enforce progression rules
2. **Stat Allocation UI** - Allow players to spend stat points earned from leveling
3. **Armory Shop** - Implement gold-to-chest purchase flow

---

## Feature 1: Skills System - Performance & Bug Fixes

### Implementation Status (Skill Tree UI – responsive, speedy, smooth)

| Step | Description | Status |
|------|-------------|--------|
| 1 | **SkillTreeContext** – fetch trees once on mount, `useSkillTrees()` hook | ✅ Done (`contexts/SkillTreeContext.tsx`, `layout.tsx` wraps with `SkillTreeProvider`) |
| 2 | **SkillTree** use context instead of fetching | ✅ Done (`SkillTree.tsx` uses `useSkillTrees()`) |
| 3 | **ActiveSkillsGrid** use context instead of fetching | ✅ Done (`ActiveSkillsGrid.tsx` uses `useSkillTrees()`) |
| 4 | **Remove gladiator refetch on Skills tab switch** | ✅ Done (Camp does not refetch when switching to Skills tab) |
| 5 | **Memoize skill tree rendering** | ✅ Done (`SkillTree.tsx` uses `useMemo` for `trees` from context) |
| 6 | **skillPointsSpent** in DB + unlock API validation | ✅ Done (Prisma schema, unlock route uses it; validations 1–3: points, prereq tier, one-per-tier-per-tree) |
| 7 | **Debounce tooltip position calculations (100ms)** | ✅ Done (`SkillTooltip` useEffect uses 100ms timeout + cleanup) |

**Status:** All steps for the skill tree UI are complete. The only remaining item for the “responsive, speedy, smooth” skill tree work is to **debounce tooltip position calculations (100ms)** in `SkillTree.tsx` (the `SkillTooltip` component’s `useEffect` that sets `pos` from `anchorRef`). That will reduce layout thrash when hovering across nodes quickly.

---

### Problems Identified

1. **Performance Issues:**
   - ActiveSkillsGrid fetches all skill trees on every mount (Inventory tab)
   - SkillTree fetches all skill trees when Skills tab opens
   - Camp page refetches gladiators when switching to Skills tab
   - Result: 3+ redundant API calls, sluggish UI

2. **Skill Points Bug:**
   - UI shows 0 remaining points when 4 should remain
   - Root cause: local state drift between SkillTree calculation and server state
   - No `skillPointsSpent` field; frontend recalculates from unlocked skills

3. **Missing Validation:**
   - "One skill per tier per tree" rule not enforced
   - Players can unlock multiple tier 1 skills from same tree (unintended)

### Solution

**Data Model:**
```prisma
model Gladiator {
  skillPointsAvailable Int      @default(0)  // Total earned
  skillPointsSpent     Int      @default(0)  // NEW: Total spent
  unlockedSkills       String[]              // Skill IDs
}
```

**State Management:**
- Create `SkillTreeContext` (apps/web/contexts/SkillTreeContext.tsx)
- Fetch skill trees once on app mount, cache in React Context
- Provide `useSkillTrees()` hook for components
- Eliminates redundant fetches

**Validation (API):**
1. Sufficient points: `skillPointsAvailable - skillPointsSpent >= skill.cost`
2. Tier prerequisite: must have any tier N-1 skill from same tree
3. **One per tier per tree:** prevent unlocking second skill in same tier of same tree

**Performance Fixes:**
- Remove gladiator refetch on Skills tab switch (camp/page.tsx)
- SkillTree and ActiveSkillsGrid use cached trees from Context
- Memoize skill tree rendering
- Debounce tooltip position calculations (100ms)

---

## Feature 2: Stat Point Allocation UI

### Requirements

- Players earn 3 stat points per level (levels 2-20)
- Stat points are non-transferable (bound to gladiator)
- Click Stat Points icon in CharacterSheet → opens allocation UI
- Allocate points to 8 stats: CON, STR, DEX, SPD, DEF, MR, ARC, FTH
- Single transaction: all-or-nothing allocation

### Solution

**Data Model:**
```prisma
model Gladiator {
  // ... existing 8 stat fields
  statPointsAvailable Int @default(0)  // NEW: Earned from leveling
}
```

**Level-Up Logic:**
- Modify `apps/game-server/src/services/progression.ts`
- On level-up (levels 2-20): `statPointsAvailable += 3`
- Level 1 → 2 grants first 3 stat points

**UI Component:**
- `StatAllocationModal.tsx` - modal overlay with stat grid
- Each stat: current value, +/- buttons, pending change indicator
- Header: remaining points counter
- Footer: Cancel / Allocate button
- Opens when clicking Stat Points icon in CharacterSheet

**API Endpoint:**
- `POST /api/gladiators/[id]/stats/allocate`
- Body: `{ allocations: { constitution: 2, strength: 1, ... } }`
- Validation: sum <= available, no negatives, ownership check
- Transaction: increment stats, decrement statPointsAvailable

**Data Flow:**
```
User clicks Stat Points icon
  ↓
Modal opens with local state (pending allocations)
  ↓
User adjusts stats with +/- buttons
  ↓
Clicks "Allocate"
  ↓
POST /api/gladiators/[id]/stats/allocate
  ↓
API validates and updates gladiator
  ↓
Frontend refetches, modal closes
```

---

## Feature 3: Armory Shop - Purchase Flow

### Current State

- Shop UI complete at `/shop` with 4 chest tiers
- Gold balance fetching works
- Purchase button has TODO (line 89 in shop/page.tsx)
- Loot box opening system works

### Missing Piece

- API endpoint to handle gold → chest transaction
- Need atomic operation: deduct gold + create loot box

### Solution

**Server-Side Configuration:**
```typescript
const CHEST_CONFIG = {
  wooden: { tier: 'Common', price: 100 },
  stone: { tier: 'Uncommon', price: 250 },
  bronze: { tier: 'Rare', price: 500 },
  platinum: { tier: 'Epic', price: 1000 },
}
```

**API Endpoint:**
- `POST /api/shop/purchase`
- Body: `{ chestId: 'wooden' | 'stone' | 'bronze' | 'platinum' }`
- Server looks up price/tier (prevent client tampering)
- Atomic transaction:
  1. Check gold balance
  2. Deduct from UserGold
  3. Create LootBox record
  4. Return new balance + loot box

**Frontend:**
- Optimistic UI update (instant feedback)
- Deduct gold locally, call API
- On success: sync with server balance
- On error: rollback local state, show error toast

**Data Flow:**
```
User clicks "Purchase"
  ↓
Optimistic: goldBalance -= price
  ↓
POST /api/shop/purchase { chestId }
  ↓
API: Prisma transaction (deduct gold + create loot box)
  ↓
Success: sync balance, show success message
Error: rollback optimistic update, show error
  ↓
User goes to Camp → Inventory → sees new loot box
  ↓
Opens loot box (existing flow)
```

---

## API Endpoints

### Modified: `/api/gladiators/[id]/skills/unlock`

**New Validation:**
```typescript
// 1. Sufficient points
const remaining = gladiator.skillPointsAvailable - gladiator.skillPointsSpent
if (remaining < skill.cost) {
  return 400 'Insufficient skill points'
}

// 2. Prerequisite tier
if (skill.tier > 1) {
  const hasPrereq = gladiator.unlockedSkills.some(id => {
    const s = findSkillById(id)
    return s?.tree === skill.tree && s?.tier === skill.tier - 1
  })
  if (!hasPrereq) return 400 'Missing prerequisite'
}

// 3. One per tier per tree (NEW)
const hasSameTierTree = gladiator.unlockedSkills.some(id => {
  const s = findSkillById(id)
  return s?.tree === skill.tree && s?.tier === skill.tier
})
if (hasSameTierTree) return 400 'Already have skill in this tier'

// Update
await prisma.gladiator.update({
  data: {
    unlockedSkills: { push: skillId },
    skillPointsSpent: { increment: skill.cost }
  }
})
```

### New: `/api/gladiators/[id]/stats/allocate`

```typescript
POST /api/gladiators/[id]/stats/allocate
Body: { allocations: { constitution?: number, strength?: number, ... } }

// Validate
const total = Object.values(allocations).reduce((sum, n) => sum + n, 0)
if (total > gladiator.statPointsAvailable) return 400
if (Object.values(allocations).some(n => n < 0)) return 400

// Update
const updates = { statPointsAvailable: { decrement: total } }
for (const [stat, value] of Object.entries(allocations)) {
  if (value > 0) updates[stat] = { increment: value }
}

await prisma.gladiator.update({ where: { id }, data: updates })
```

### New: `/api/shop/purchase`

```typescript
POST /api/shop/purchase
Body: { chestId: 'wooden' | 'stone' | 'bronze' | 'platinum' }

const config = CHEST_CONFIG[chestId] // Server-side lookup

await prisma.$transaction(async (tx) => {
  // 1. Check gold
  const userGold = await tx.userGold.findUnique({ where: { userId } })
  if (userGold.balance < config.price) throw 'INSUFFICIENT_GOLD'

  // 2. Deduct gold
  const updated = await tx.userGold.update({
    where: { userId },
    data: { balance: { decrement: config.price } }
  })

  // 3. Create loot box
  const lootBox = await tx.lootBox.create({
    data: { ownerId: userId, tier: config.tier, opened: false }
  })

  return { newBalance: updated.balance, lootBox }
})
```

---

## Components

### New Components

1. **SkillTreeContext** (apps/web/contexts/SkillTreeContext.tsx)
   - Fetches skill trees once on mount
   - Provides `useSkillTrees()` hook
   - Caches trees in React Context

2. **StatAllocationModal** (apps/web/components/camp/StatAllocationModal.tsx)
   - Modal overlay for stat allocation
   - +/- buttons for 8 stats
   - Remaining points counter
   - Allocate/Cancel buttons

### Modified Components

1. **apps/web/app/layout.tsx**
   - Wrap app in `<SkillTreeProvider>`

2. **apps/web/app/camp/page.tsx**
   - Remove gladiator refetch on Skills tab switch (lines 85-87)

3. **apps/web/components/skills/SkillTree.tsx**
   - Use `useSkillTrees()` instead of fetching
   - Sync local state with props (fix skill points bug)

4. **apps/web/components/camp/ActiveSkillsGrid.tsx**
   - Use `useSkillTrees()` instead of fetching

5. **apps/web/components/rpg-ui/CharacterSheet.tsx**
   - Add click handler to Stat Points display
   - Opens `<StatAllocationModal>`

6. **apps/web/app/shop/page.tsx**
   - Replace TODO in `handlePurchase` with actual API call
   - Add optimistic UI update + rollback logic

---

## Database Migration

```prisma
// packages/database/prisma/schema.prisma

model Gladiator {
  // ... existing fields
  skillPointsAvailable Int      @default(0)
  skillPointsSpent     Int      @default(0)  // NEW
  statPointsAvailable  Int      @default(0)  // NEW
  unlockedSkills       String[]
}
```

**Migration:**
```bash
cd packages/database
npx prisma migrate dev --name add_skill_stat_points
```

**Backfill (Optional):**
- Calculate `skillPointsSpent` for existing gladiators based on `unlockedSkills`
- Script: `packages/database/scripts/backfill-skill-points-spent.ts`

---

## Game Server Changes

**Progression Service:**
```typescript
// apps/game-server/src/services/progression.ts

export async function awardXP(gladiatorId: string, xpAmount: number) {
  const gladiator = await prisma.gladiator.findUnique({ where: { id: gladiatorId } })

  const newXP = gladiator.xp + xpAmount
  const newLevel = calculateLevel(newXP)
  const leveledUp = newLevel > gladiator.level

  const updates: any = { xp: newXP, level: newLevel }

  if (leveledUp && newLevel >= 2 && newLevel <= 20) {
    updates.statPointsAvailable = { increment: 3 }  // NEW
    updates.skillPointsAvailable = { increment: 1 } // Existing
  }

  await prisma.gladiator.update({ where: { id: gladiatorId }, data: updates })
}
```

---

## Error Handling

### Skills System
- **Client:** Toast notifications for unlock failures, loading states prevent double-clicks
- **Server:** 400 for validation errors (insufficient points, missing prereq, duplicate tier), 401/403 for auth

### Stat Allocation
- **Client:** Disable "Allocate" if no changes, show error toast on failure, keep modal open for retry
- **Server:** 400 for invalid allocations (sum > available, negative values), 403 for ownership

### Shop Purchase
- **Client:** Optimistic update + rollback on error, error toast with clear message
- **Server:** 400 for insufficient gold (before transaction), automatic rollback on transaction failure

---

## Testing Strategy

### Skills System
**Unit:**
- `findSkillById()` helper
- Validation logic (points, prerequisite, one-per-tier-per-tree)

**Integration:**
- Unlock skill with valid prereq → success
- Unlock without prereq → 400
- Unlock second skill in same tier/tree → 400
- Verify `skillPointsSpent` increments

**Manual:**
- Give 8 points, unlock 2 skills → verify 6 remaining (not 0)
- Try second tier 1 skill in same tree → blocked

### Stat Allocation
**Integration:**
- Allocate within limit → success
- Allocate over limit → 400
- Verify stats increase, points decrease

**Manual:**
- Level up → verify +3 stat points
- Open modal, allocate all → verify stats updated
- Try to allocate with 0 points → button disabled

### Shop Purchase
**Integration:**
- Purchase with sufficient gold → loot box created, gold deducted
- Purchase with insufficient gold → 400, no changes
- Verify loot box in inventory, can be opened

**Manual:**
- Give 1000g, purchase all tiers → verify gold decreases
- Check Camp inventory → loot boxes present
- Open boxes → equipment awarded

---

## Performance Optimizations

1. **Skill Tree Caching:** Single fetch on app mount, shared across components
2. **Remove Redundant Refetches:** No gladiator refetch on tab switch
3. **Debounce Tooltips:** 100ms delay on position calculations
4. **Memoization:** `useMemo` for skill tree rendering
5. **Optimistic UI:** Shop purchases feel instant

---

## Implementation Order

1. **Skills Performance** (can start immediately)
   - Add SkillTreeContext
   - Update components to use context
   - Remove refetch on tab switch

2. **Skills Bug Fix** (depends on migration)
   - Migration: add `skillPointsSpent`
   - Update unlock API with validation
   - Sync local state in SkillTree

3. **Stat Allocation** (depends on migration)
   - Migration: add `statPointsAvailable`
   - Update progression service
   - Create StatAllocationModal
   - Add API endpoint

4. **Shop Purchase** (independent, can start immediately)
   - Create `/api/shop/purchase` endpoint
   - Update shop page with real purchase logic
   - Add optimistic UI

---

## Estimated Effort

- **Skills Performance:** 2-3 tickets
- **Skills Bug & Validation:** 2 tickets
- **Stat Allocation:** 3 tickets
- **Shop Purchase:** 2 tickets

**Total:** 8-10 tickets

---

## Success Criteria

**Skills:**
- [ ] Camp Skills tab loads instantly (no redundant fetches)
- [ ] Skill points bug fixed (correct remaining count)
- [ ] Cannot unlock second skill in same tier of same tree
- [ ] Prerequisite enforcement works correctly

**Stat Allocation:**
- [ ] Click Stat Points icon → modal opens
- [ ] Allocate points → stats increase, points decrease
- [ ] Level-up grants +3 stat points (levels 2-20)

**Shop:**
- [ ] Purchase chest → gold deducted, loot box created
- [ ] Loot box appears in Camp inventory
- [ ] Open loot box → equipment awarded
- [ ] Error handling: insufficient gold shows clear message

---

## Notes

- All three features are independent except Skills bug fix depends on migration
- Shop purchase can be implemented in parallel with Skills/Stats work
- Performance improvements should be noticeable immediately after SkillTreeContext is added
- Stat allocation UI should match existing modal patterns (loot box opening, etc.)

---

**Next Steps:** Create implementation plan with detailed tickets following `claude-workflow-opt.md` spec/ticket pattern.
