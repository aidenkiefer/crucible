# 5-Class System Implementation

**Date:** 2026-02-15
**Task:** Define 5 Classes and Base-Stat Weights in Shared Data
**Status:** ✅ Complete

---

## Overview

Implemented the 5-class system with weighted base stat generation from the Notion Systems Wiki Class Base Stat Odds CSV.

### New Classes

1. **Tank** (was Brute) - High CON/DEF tank
2. **Legionnaire** (was Assassin) - Physical warrior with STR/DEF/DEX
3. **Duelist** - Fast DEX/SPD fighter (unchanged)
4. **Mage** - Arcane caster with ARC/MR
5. **Monk** - Faith caster with FTH/CON

---

## Implementation

### 1. Updated GladiatorClass Enum

**File:** `packages/shared/src/types/index.ts`

```typescript
export enum GladiatorClass {
  Tank = 'Tank',
  Legionnaire = 'Legionnaire',
  Duelist = 'Duelist',
  Mage = 'Mage',
  Monk = 'Monk',
  // Legacy (deprecated)
  Brute = 'Brute',
  Assassin = 'Assassin',
}
```

**Design decision:** Keep legacy values for backward compatibility during migration.

---

### 2. Created Class Stat Weights Module

**File:** `packages/shared/src/classes/class-stat-weights.ts`

#### Exports:
- `StatKey` type: `'CON' | 'STR' | 'DEX' | 'SPD' | 'DEF' | 'MR' | 'ARC' | 'FTH'`
- `ClassStatWeights` interface: Object with 8 stat weights
- `CLASS_STAT_WEIGHTS` constant: Weights for all classes from CSV
- `getBaseStatWeights(class)`: Get weights for a class
- `rollBaseStats(class, totalPool)`: Deterministic stat distribution
- `rollBaseStatsWithVariance(class, totalPool, variance)`: Random stat distribution
- `statsToDBFormat(weights)`: Convert to DB field names
- `dbStatsToWeights(dbStats)`: Convert from DB format

#### Stat Weights (from CSV):

**Tank:**
- 1.4x: CON
- 1.3x: DEF
- 1.2x: MR
- 1.1x: STR
- 1.0x: ARC
- 0.9x: FTH
- 0.8x: SPD
- 0.7x: DEX

**Legionnaire:**
- 1.4x: STR
- 1.3x: DEF
- 1.2x: DEX
- 1.1x: CON
- 1.0x: SPD
- 0.9x: ARC
- 0.8x: FTH
- 0.7x: MR

**Duelist:**
- 1.4x: DEX
- 1.3x: SPD
- 1.2x: STR
- 1.1x: MR
- 1.0x: DEF
- 0.9x: FTH
- 0.8x: ARC
- 0.7x: CON

**Mage:**
- 1.4x: ARC
- 1.3x: MR
- 1.2x: SPD
- 1.1x: DEX
- 1.0x: FTH
- 0.9x: CON
- 0.8x: DEF
- 0.7x: STR

**Monk:**
- 1.4x: FTH
- 1.3x: CON
- 1.2x: SPD
- 1.1x: MR
- 1.0x: DEX
- 0.9x: DEF
- 0.8x: ARC
- 0.7x: STR

---

### 3. Updated Shared Package Exports

**File:** `packages/shared/src/index.ts`

Added:
```typescript
export * from './classes/class-stat-weights'
```

---

### 4. Updated Prisma Schema Comment

**File:** `packages/database/prisma/schema.prisma`

Updated line 49:
```prisma
class String // Tank, Legionnaire, Duelist, Mage, Monk (legacy: Brute, Assassin)
```

**No schema migration needed** - field is already `String` type.

---

### 5. Created Tests

**File:** `packages/shared/src/classes/__tests__/class-stat-weights.test.ts`

Test coverage:
- ✅ All classes have weights defined
- ✅ All 8 stats present for each class
- ✅ Weight values match CSV (spot checks)
- ✅ `rollBaseStats()` distributes exactly `totalPool` points
- ✅ Stats distributed proportionally to weights
- ✅ Works with different pool sizes
- ✅ Variance produces random but weighted results
- ✅ DB format conversion (round-trip)

---

### 6. Created Migration Documentation

**File:** `docs/migrations/class-system-5-classes.md`

Includes:
- Overview of changes
- Class mapping (Brute → Tank, Assassin → Legionnaire)
- Stat weight details for each class
- Database migration SQL
- Smart contract update options
- Frontend update checklist
- Testing checklist
- Rollback plan
- Timeline

---

## Algorithm: `rollBaseStats()`

1. Get class weights (e.g., Tank: CON 1.4, DEF 1.3, etc.)
2. Calculate total weight sum (8.8 for all classes)
3. Distribute `totalPool` points proportionally:
   - Each stat gets `floor((weight / totalWeight) * totalPool)`
4. Distribute remainder points to highest-weight stats first

**Example: Tank with 50 points**
- Total weight: 8.8
- CON: floor((1.4 / 8.8) * 50) = floor(7.95) = 7 → +1 remainder = **8**
- DEF: floor((1.3 / 8.8) * 50) = floor(7.39) = 7 → +1 remainder = **8**
- MR: floor((1.2 / 8.8) * 50) = floor(6.82) = 6 → +1 remainder = **7**
- STR: floor((1.1 / 8.8) * 50) = floor(6.25) = 6 → **6**
- ARC: floor((1.0 / 8.8) * 50) = floor(5.68) = 5 → +1 remainder = **6**
- FTH: floor((0.9 / 8.8) * 50) = floor(5.11) = 5 → **5**
- SPD: floor((0.8 / 8.8) * 50) = floor(4.55) = 4 → +1 remainder = **5**
- DEX: floor((0.7 / 8.8) * 50) = floor(3.98) = 3 → +1 remainder = **4**

Sum: 8+8+7+6+6+5+5+4 = 49 → 1 remainder → distributed to CON → **50 total** ✅

---

## Usage Examples

### Generate base stats at mint:
```typescript
import { rollBaseStats, statsToDBFormat } from '@gladiator/shared'

const baseStats = rollBaseStats(GladiatorClass.Tank, 50)
const dbStats = statsToDBFormat(baseStats)

await prisma.gladiator.create({
  data: {
    ...
    constitution: dbStats.constitution,
    strength: dbStats.strength,
    // etc.
  }
})
```

### Generate stats with variance (randomness):
```typescript
const stats = rollBaseStatsWithVariance(GladiatorClass.Mage, 50, 0.2)
// 0.2 = ±20% variance on weights
```

### Get weights for UI display:
```typescript
const weights = getBaseStatWeights(GladiatorClass.Duelist)
console.log(`Duelist favors DEX (${weights.DEX}x)`)
```

---

## Next Steps (Not in Scope)

These updates are needed for full 5-class system integration:

### Frontend
- [ ] Update `apps/web/components/mint/MintGladiator.tsx` with new classes
- [ ] Update `apps/web/lib/contracts.ts` enum mapping
- [ ] Update display components (Camp, Arena, etc.)

### Smart Contract
- [ ] Deploy new `GladiatorNFT.sol` with 5-class enum
- [ ] Update `_randomStat()` logic to use class weights
- [ ] Or: Use weights on backend (event listener mapping)

### Database
- [ ] Run SQL migration to map existing gladiators:
  ```sql
  UPDATE "Gladiator" SET class = 'Tank' WHERE class = 'Brute';
  UPDATE "Gladiator" SET class = 'Legionnaire' WHERE class = 'Assassin';
  ```

### Game Server
- [ ] Update CPU AI for new classes (if class-specific behaviors)
- [ ] Update event listener mapping (if keeping old contract)

---

## Files Changed

1. ✅ `packages/shared/src/types/index.ts` - Enum update
2. ✅ `packages/shared/src/classes/class-stat-weights.ts` - New module
3. ✅ `packages/shared/src/classes/__tests__/class-stat-weights.test.ts` - Tests
4. ✅ `packages/shared/src/index.ts` - Export update
5. ✅ `packages/database/prisma/schema.prisma` - Comment update
6. ✅ `docs/migrations/class-system-5-classes.md` - Migration guide
7. ✅ `docs/plans/implementation/2026-02-15-five-class-system-implementation.md` - This doc

---

## Verification

To verify the implementation:

```bash
# Run tests
cd packages/shared
pnpm test class-stat-weights

# Check exports
pnpm build

# Verify types are available
import { GladiatorClass, rollBaseStats } from '@gladiator/shared'
```

---

## Notes

- **No breaking changes** - Legacy class values preserved for migration
- **Type-safe** - Full TypeScript coverage with tests
- **Deterministic** - `rollBaseStats()` always produces same result for same inputs
- **Flexible** - Supports any `totalPool` size (not just 50)
- **CSV-accurate** - Weights match Notion Systems Wiki exactly
- **DB-compatible** - Helper functions for Prisma format conversion

---

## References

- Task: Task A1 from implementation plan
- Source: `docs/notion/Class Base Stat Odds 30690f09058d8011838aead5a550e251.csv`
- Migration guide: `docs/migrations/class-system-5-classes.md`
