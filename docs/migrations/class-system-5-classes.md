# Class System Migration: 4 → 5 Classes

## Overview

Migration from the original 4-class system (Duelist, Brute, Assassin, Mage) to the new 5-class system from the Notion Systems Wiki (Tank, Legionnaire, Duelist, Mage, Monk).

**Date:** 2026-02-15
**Source:** Notion Systems Wiki > Class Base Stat Odds CSV

---

## Changes

### Class Enum Update

**Before:**
```typescript
enum GladiatorClass {
  Duelist = 'Duelist',
  Brute = 'Brute',
  Assassin = 'Assassin',
}
```

**After:**
```typescript
enum GladiatorClass {
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

### Class Mapping

| Old Class | New Class | Rationale |
|-----------|-----------|-----------|
| Brute | Tank | High CON/DEF focus |
| Assassin | Legionnaire | High STR/DEF/DEX focus |
| Duelist | Duelist | Unchanged |
| Mage | Mage | Now explicit |

---

## Stat Weights

Each class has weighted stat distribution from the CSV:

### Tank (was Brute)
- **Favored (1.4x):** CON
- **High (1.3x):** DEF
- **Good (1.2x):** MR
- **Disfavored (0.7x):** DEX

**Role:** Defensive tank with high survivability.

### Legionnaire (was Assassin)
- **Favored (1.4x):** STR
- **High (1.3x):** DEF
- **Good (1.2x):** DEX
- **Disfavored (0.7x):** MR

**Role:** Physical warrior with strong defense and offense.

### Duelist
- **Favored (1.4x):** DEX
- **High (1.3x):** SPD
- **Good (1.2x):** STR
- **Disfavored (0.7x):** CON

**Role:** Fast, agile fighter (unchanged from before).

### Mage (new)
- **Favored (1.4x):** ARC
- **High (1.3x):** MR
- **Good (1.2x):** SPD
- **Disfavored (0.7x):** STR

**Role:** Magic caster with arcane power.

### Monk (new)
- **Favored (1.4x):** FTH
- **High (1.3x):** CON
- **Good (1.2x):** SPD
- **Disfavored (0.7x):** STR

**Role:** Faith-based caster with durability.

---

## Database Migration

### Schema Changes

**No breaking changes required.** The `Gladiator.class` field is already `String` (not an enum), so it accepts new values.

**Updated comment:**
```prisma
class String // Tank, Legionnaire, Duelist, Mage, Monk (legacy: Brute, Assassin)
```

### Data Migration Script

For existing gladiators in the database:

```sql
-- Map Brute → Tank
UPDATE "Gladiator" SET class = 'Tank' WHERE class = 'Brute';

-- Map Assassin → Legionnaire
UPDATE "Gladiator" SET class = 'Legionnaire' WHERE class = 'Assassin';

-- Existing Duelist, Mage remain unchanged
```

**Note:** This is a **one-way migration**. Once applied, old class names are removed from active data. Legacy enum values remain in code for backward compatibility only.

---

## Smart Contract Update

**Current contract (`GladiatorNFT.sol`) has:**
```solidity
enum GladiatorClass { Duelist, Brute, Assassin }
```

**Options:**

1. **Deploy new contract** with 5 classes (recommended for clean slate)
2. **Keep old contract**, map on backend (event listener converts Brute → Tank, Assassin → Legionnaire)
3. **Upgrade contract** (if upgradeability was built in)

**Recommended approach for demo:** Deploy new contract to testnet with updated enum:
```solidity
enum GladiatorClass { Tank, Legionnaire, Duelist, Mage, Monk }
```

---

## Frontend Updates Required

### 1. Mint UI (`apps/web/components/mint/MintGladiator.tsx`)

**Update `CLASS_INFO` object:**
- Remove `Brute`, `Assassin`
- Add `Tank`, `Legionnaire`, `Mage`, `Monk`
- Update icons, descriptions, stat biases

### 2. Contract Interface (`apps/web/lib/contracts.ts`)

**Update `GladiatorClass` export:**
```typescript
export enum GladiatorClass {
  Tank = 0,
  Legionnaire = 1,
  Duelist = 2,
  Mage = 3,
  Monk = 4,
}
```

### 3. Display Components

Any component that displays class names or icons needs updates:
- Camp UI
- Arena UI
- Match history
- Gladiator cards

---

## Game Server Updates

### 1. Event Listener (`gladiator-sync.ts`)

If keeping old contract, add mapping logic:
```typescript
const mappedClass = classFromContract === 'Brute' ? 'Tank'
  : classFromContract === 'Assassin' ? 'Legionnaire'
  : classFromContract;
```

### 2. CPU AI

If AI has class-specific behaviors, update to handle new classes:
- Tank: defensive, high HP
- Legionnaire: aggressive melee
- Monk: faith abilities (when implemented)

---

## Shared Package

### New Files

- **`packages/shared/src/classes/class-stat-weights.ts`**
  - `CLASS_STAT_WEIGHTS` constant
  - `getBaseStatWeights(class)`
  - `rollBaseStats(class, totalPool)`
  - `rollBaseStatsWithVariance(class, totalPool, variance)`
  - `statsToDBFormat()`, `dbStatsToWeights()`

### Exports

Updated `packages/shared/src/index.ts`:
```typescript
export * from './classes/class-stat-weights'
```

---

## Testing Checklist

- [ ] Unit tests for `rollBaseStats()`
- [ ] Verify stat distributions match CSV weights
- [ ] Test legacy class mapping (Brute → Tank, Assassin → Legionnaire)
- [ ] Mint UI displays all 5 new classes
- [ ] Database accepts new class values
- [ ] Game server handles all 5 classes in combat
- [ ] Event listener syncs new gladiators correctly

---

## Rollback Plan

If issues arise:

1. **Database:** Revert with inverse SQL (`Tank → Brute`, etc.)
2. **Code:** Git revert to previous commit
3. **Contract:** Use old contract address in env vars

**Data loss:** None (mapping is reversible for existing data).

---

## Timeline

**Phase 1 (Current):** Shared data definitions ✅
- GladiatorClass enum updated
- CLASS_STAT_WEIGHTS implemented
- Prisma schema comment updated

**Phase 2:** Contract & Frontend
- Deploy new contract with 5 classes
- Update Mint UI
- Update display components

**Phase 3:** Database Migration
- Run SQL migration on dev DB
- Test thoroughly
- Run on staging/prod

**Phase 4:** Testing & Polish
- Comprehensive testing
- Update docs
- Notify users (if any)

---

## Notes

- **Backward compatibility:** Legacy class values (`Brute`, `Assassin`) remain in enum but are deprecated
- **Migration safety:** Using String field in Prisma allows gradual migration
- **Stat weights:** Exact values from CSV ensure balance consistency
- **Contract deployment:** New contract recommended for clean separation

---

## References

- Notion Systems Wiki: Class Base Stat Odds CSV
- `/home/aidenkiefer/projects/crucible/crucible/docs/notion/Class Base Stat Odds 30690f09058d8011838aead5a550e251.csv`
- `packages/shared/src/classes/class-stat-weights.ts`
- `packages/shared/src/types/index.ts`
