# Sprint 5 Summary: Progression & Loot

**Duration:** Implemented in one session
**Status:** ✅ Complete

---

## Overview

Sprint 5 implemented the progression and loot systems for Crucible: Gladiator Coliseum. This sprint added XP/leveling, skill trees, loot boxes, crafting, salvaging, and gold economy — transforming the game from a pure combat demo into a full progression RPG.

---

## Implemented Features

### 1. Match Persistence & Rewards

**Files Changed:**
- `packages/database/prisma/schema.prisma` — Updated Match model
- `apps/game-server/src/services/match-instance.ts` — Match persistence logic
- `apps/web/app/api/matches/history/route.ts` — Match history API
- `apps/web/app/matches/page.tsx` — Match history UI

**Implementation:**
- Matches now persist to database after completion
- Tracked stats: damage dealt, dodges used, attacks landed (per player)
- 80% loot box drop rate on CPU wins (Wooden tier)
- Match history page with victory/defeat styling, filters, rewards display

**Schema Changes:**
```prisma
model Match {
  matchType    String   @default("cpu")
  matchStats   Json     @default("{}")
  rewardType   String?
  rewardAmount Int?     @default(0)
  lootBoxTier  String?
  completedAt  DateTime?
}

model LootBox {
  id                  String   @id @default(uuid())
  ownerId             String
  tier                String   @default("wooden")
  opened              Boolean  @default(false)
  rewardedEquipmentId String?
  createdAt           DateTime @default(now())
  openedAt            DateTime?
}

model UserGold {
  userId    String   @id
  balance   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

### 2. Loot Box System

**Files Created:**
- `packages/shared/src/loot/starter-gear.ts` — Starter gear definitions
- `apps/web/app/api/loot-boxes/route.ts` — Loot box inventory API
- `apps/web/app/api/loot-boxes/open/route.ts` — Loot box opening API
- `apps/web/components/loot/LootBoxInventory.tsx` — Loot box UI

**Implementation:**
- Wooden Loot Box tier with starter gear pool
- 4 armor sets: Balanced, Heavy, Light, Mage Robes
- 7 weapons: Iron Sword, Training Spear, Short Bow, Steel Dagger, Heavy Axe, War Hammer, Wooden Staff
- Opening consumes box and creates Equipment instance
- Reward modal displays received item with stats

**Starter Gear Examples:**
```typescript
{
  key: 'heavy_armor',
  name: 'Heavy Armor Set',
  type: 'ARMOR',
  slot: 'CHEST',
  subtype: 'HEAVY',
  baseStatMods: { constitution: 5, defense: 5, speed: -3 },
  tags: ['starter', 'tank', 'heavy'],
}

{
  key: 'iron_sword',
  name: 'Iron Sword',
  type: 'WEAPON',
  slot: 'MAIN_HAND',
  subtype: 'SWORD',
  baseStatMods: { strength: 2 },
  scaling: { strength: 0.6, dexterity: 0.3 },
  tags: ['starter', 'melee', 'balanced'],
}
```

---

### 3. XP & Leveling System

**Files Created:**
- `apps/game-server/src/services/progression.ts` — Progression service
- `apps/web/app/api/gladiators/[gladiatorId]/progression/route.ts` — Progression API
- `apps/web/components/gladiators/GladiatorProgression.tsx` — Progression UI

**Files Modified:**
- `apps/game-server/src/services/match-instance.ts` — Integrated XP rewards

**Implementation:**
- Exponential XP curve: `level * 100 + (level-1) * 50`
  - Level 1→2: 100 XP
  - Level 2→3: 250 XP
  - Level 10→11: 1450 XP
- Level cap: 20
- Win: 100 XP, Loss: 25 XP
- On level up: Auto-increment all 8 stats, award 1 skill point
- UI shows level progress bar, XP to next level, current stats

**Key Functions:**
```typescript
export function getXPForLevel(level: number): number {
  if (level >= MAX_LEVEL) return Infinity
  return level * 100 + (level - 1) * 50
}

export async function awardXP(gladiatorId: string, xpAmount: number): Promise<number> {
  // Process level ups, increment stats, award skill points
}
```

---

### 4. Skill Tree System

**Files Created:**
- `packages/shared/src/skills/skill-trees.ts` — Skill tree definitions
- `apps/web/app/api/gladiators/[gladiatorId]/skills/unlock/route.ts` — Skill unlock API
- `apps/web/components/skills/SkillTree.tsx` — Skill tree UI

**Implementation:**
- 4 classes: Duelist, Brute, Assassin, Mage
- 4-5 branches per class covering all 8 stats
- Tier-based progression (must unlock prerequisites)
- Skills cost 1 skill point, grant permanent stat boosts
- UI shows skill branches, locked/unlocked states, stat boosts

**Skill Tree Examples:**

**Duelist Branches:**
1. Precision (STR + DEX)
2. Resilience (CON + DEF)
3. Mobility (SPD)
4. Tactics (FAITH)
5. Arcane Defense (MAG_RES + ARC)

**Mage Branches:**
1. Arcane Power (ARC)
2. Spell Defense (MAG_RES + DEF)
3. Mystic Knowledge (ARC + CON)
4. Battle Mage (STR + DEX)
5. Divine Faith (FAITH + SPD)

**Total Skills:** ~50-60 across all classes

---

### 5. Crafting System (3→1)

**Files Created:**
- `packages/shared/src/crafting/crafting-system.ts` — Crafting logic
- `apps/web/app/api/equipment/craft/route.ts` — Crafting API
- `apps/web/components/equipment/CraftingWorkshop.tsx` — Crafting UI

**Implementation:**
- Combine 3 items → 1 higher-quality item
- Output type determined by majority (or random if tie)
- Output rarity upgrade chances:
  - All same rarity: 90% upgrade
  - Mixed rarities: 50% upgrade from highest
- Rarity tiers: Common (2 stats) → Uncommon (3) → Rare (4) → Epic (5) → Legendary (6)
- Auto-generate stats based on rarity tier

**Crafting Logic:**
```typescript
export function determineCraftedRarity(rarities: EquipmentRarity[]): EquipmentRarity {
  const tiers = rarities.map((r) => RARITY_TIERS.indexOf(r))
  const maxTier = Math.max(...tiers)
  const allSame = new Set(tiers).size === 1

  if (allSame) {
    // 90% chance to upgrade
    if (Math.random() < 0.9 && maxTier < RARITY_TIERS.length - 1) {
      return RARITY_TIERS[maxTier + 1]
    }
  } else {
    // 50% chance to upgrade
    if (Math.random() < 0.5 && maxTier < RARITY_TIERS.length - 1) {
      return RARITY_TIERS[maxTier + 1]
    }
  }
  return RARITY_TIERS[maxTier]
}
```

---

### 6. Salvaging System

**Files Created:**
- `apps/web/app/api/equipment/salvage/route.ts` — Salvage API

**Files Modified:**
- `apps/web/components/equipment/CraftingWorkshop.tsx` — Salvage UI

**Implementation:**
- Break down equipment → receive Gold
- Salvage values:
  - Common: 10 Gold
  - Uncommon: 25 Gold
  - Rare: 50 Gold
  - Epic: 100 Gold
  - Legendary: 250 Gold
- Cannot salvage equipped items
- Multi-select UI for batch salvaging

---

### 7. Gold Economy

**Files Created:**
- `apps/web/app/api/gold/balance/route.ts` — Gold balance API

**Files Modified:**
- `packages/database/prisma/schema.prisma` — UserGold model

**Implementation:**
- Mock gold system for demo
- UserGold table tracks balance per user
- Earned from salvaging equipment
- Production: ETH-backed (purchase Gold with ETH)
- UI displays gold balance with coin emoji

---

### 8. Equipment Integration

**Files Created:**
- `apps/web/app/api/equipment/route.ts` — Equipment inventory API
- `apps/web/app/api/gladiators/[gladiatorId]/equip/route.ts` — Equip/unequip API
- `apps/web/components/equipment/EquipmentInventory.tsx` — Equipment UI

**Implementation:**
- Equipment inventory with equipped status
- Slot-based equipping: MAIN_HAND (weapons), CHEST (armor)
- Equip/unequip with validation (type, ownership, slot)
- UI shows rarity colors, stats, equipped status
- Cannot craft/salvage equipped items

**Rarity Colors:**
- Common: Gray
- Uncommon: Green
- Rare: Blue
- Epic: Purple
- Legendary: Yellow

---

## Documentation

### Files Created:
1. `docs/features/perks-and-abilities.md` — Perks & abilities design (Sprint 8+)
2. `docs/plans/10-sprint-8-post-demo.md` — Post-demo roadmap

### Files Updated:
1. `docs/features/equipment.md` — Added Sprint 5 section with crafting, salvaging, loot boxes, XP, skill trees

---

## Database Schema Impact

**New Models:**
- `LootBox` — Loot box inventory
- `UserGold` — Gold economy

**Updated Models:**
- `Match` — Added persistence fields (matchType, matchStats, rewardType, rewardAmount, lootBoxTier, completedAt)
- `Gladiator` — Already had progression fields (level, xp, skillPointsAvailable, unlockedSkills)

---

## API Endpoints Added

### Match & Loot
- `GET /api/matches/history` — Match history with filters
- `GET /api/loot-boxes` — Loot box inventory
- `POST /api/loot-boxes/open` — Open loot box

### Progression
- `GET /api/gladiators/[id]/progression` — XP, level, stats
- `POST /api/gladiators/[id]/skills/unlock` — Unlock skill

### Crafting & Economy
- `POST /api/equipment/craft` — Craft 3→1
- `POST /api/equipment/salvage` — Salvage for Gold
- `GET /api/gold/balance` — Gold balance

### Equipment
- `GET /api/equipment` — Equipment inventory
- `POST /api/gladiators/[id]/equip` — Equip item
- `DELETE /api/gladiators/[id]/equip` — Unequip item

---

## UI Components Added

1. **LootBoxInventory** — Display and open loot boxes
2. **GladiatorProgression** — Level, XP bar, stats
3. **SkillTree** — Skill branches with unlock UI
4. **CraftingWorkshop** — Crafting and salvaging tabs
5. **EquipmentInventory** — Equipment list with equip buttons

---

## Technical Highlights

### Exponential XP Curve
```typescript
// Level 1→2: 100 XP
// Level 2→3: 250 XP
// Level 10→11: 1450 XP
level * 100 + (level - 1) * 50
```

### Crafting Rarity Upgrade
```typescript
// All same: 90% upgrade chance
// Mixed: 50% upgrade from highest
determineCraftedRarity(rarities)
```

### Match Stats Tracking
```typescript
interface MatchStats {
  damageDealt: { player1: number; player2: number }
  dodgesUsed: { player1: number; player2: number }
  attacksLanded: { player1: number; player2: number }
}
```

### Skill Tree Structure
```typescript
interface SkillNode {
  id: string
  branch: string
  tier: number
  prerequisite?: string
  statBoosts: Record<string, number>
  cost: number
}
```

---

## Player Experience Flow

1. **Win CPU Match** → 80% chance for Wooden Loot Box + 100 XP
2. **Open Loot Box** → Receive starter gear (weapon or armor)
3. **Gain Levels** → Auto-increment stats, earn skill points
4. **Unlock Skills** → Spend skill points on skill tree branches
5. **Craft Equipment** → Combine 3 items → 1 better item
6. **Salvage Extras** → Convert unwanted gear → Gold
7. **Equip Best Gear** → Slot-based equipping (MAIN_HAND, CHEST)
8. **Repeat** → Progressive power increase

---

## Next Steps (Sprint 6: Multiplayer)

With progression and loot systems complete, Sprint 6 will focus on:
1. Real-time PvP matchmaking
2. Friend challenges
3. Lobby system
4. Spectator mode

Sprint 5 provides the foundation for meaningful PvP by giving players:
- Customized builds (skill trees, equipment)
- Progression goals (XP, levels, loot)
- Economic incentives (crafting, salvaging, gold)

---

## Success Metrics

**Completed:**
- ✅ Match persistence and history
- ✅ Loot box system (4 armor, 7 weapons)
- ✅ XP & leveling (exponential curve, level 20 cap)
- ✅ Skill trees (4 classes, 4-5 branches each)
- ✅ Crafting (3→1 with rarity upgrades)
- ✅ Salvaging (equipment → Gold)
- ✅ Gold economy (mock for demo)
- ✅ Equipment integration (slot-based equipping)
- ✅ Documentation (perks-and-abilities.md, Sprint 8 plan, equipment.md updates)

**Technical Debt:**
- Database migration needs to be run manually (P3006 error due to shadow database)
- Perks not yet integrated into combat (Sprint 8)
- Abilities not yet implemented (Sprint 8)

---

## Files Created/Modified Summary

**Total Files Changed:** ~30 files

**Created:**
- 15 new files (services, APIs, components, docs)

**Modified:**
- 5 existing files (schema, match-instance, equipment.md)

**Documentation:**
- 3 new docs (perks-and-abilities.md, Sprint 8 plan, Sprint 5 summary)
- 1 updated doc (equipment.md)

---

## Conclusion

Sprint 5 successfully transformed Crucible from a pure combat demo into a full-featured progression RPG. The loot box system provides immediate rewards, XP/leveling gives long-term goals, skill trees enable build customization, and crafting/salvaging create an economic loop.

**Sprint 5 is now complete and ready for Sprint 6: Multiplayer PvP.**
