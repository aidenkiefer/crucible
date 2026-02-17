# Skill Tree System — How It Works, Storage, Fetching & Performance

Technical reference for the cross-class skill tree implementation: behavior, data flow, storage, and performance strategies.

**Player-facing overview:** [skill-trees-cross-class.md](skill-trees-cross-class.md)

---

## 1. How the Skill Tree Works

### 1.1 Structure

- **6 trees:** Valor, Instinct, Discipline, Intellect, Zeal, Ferocity (all cross-class).
- **108 skills total:** Each tree has 15 skills in tiers 1–5 (1 point each) and 3 tier-6 capstones (2 points each).
- **Definitions are static:** Trees and skills are defined in code, not in the database. The database only stores *which* skills each gladiator has unlocked.

### 1.2 Rules

- **Tier prerequisites:** Tier 1 has no prerequisite. Tier N (N ≥ 2) requires at least one unlocked skill from tier N−1 in the *same tree*.
- **One skill per tier per tree:** A gladiator may unlock only one skill per (tree, tier). Unlocking a second skill in the same tier of the same tree is rejected by the API.
- **Point economy:** Unlock cost is `skill.cost` (1 for tiers 1–5, 2 for tier 6). The server enforces `skillPointsAvailable - skillPointsSpent >= skill.cost`.

### 1.3 Unlock Flow

1. User clicks an available skill node in the UI (`SkillTree.tsx`).
2. Frontend calls `POST /api/gladiators/[gladiatorId]/skills/unlock` with `{ skillId }`.
3. API (see §2.2) validates: ownership, skill exists, not already unlocked, sufficient points, tier prerequisite, and one-per-tier-per-tree.
4. Server updates: `unlockedSkills` (append skill ID), `skillPointsSpent` (increment by cost), and applies any `statBoosts` to the gladiator row.
5. Response returns updated gladiator and `pointsRemaining`. Camp refetches gladiators (or parent passes new props), so the Skills UI shows updated state.

### 1.4 Shared Package API

- **Source:** `packages/shared/src/skills/skill-trees.ts`
- **Exports:** `SkillNode`, `SkillTreeName`, `getSkillTree(treeName)`, `getAllTreeNames()`, `getSkill(skillId)`, `findSkillById(skillId)`, `canUnlockSkill(skillId, unlockedIds)` (client-side prerequisite check), `calculateSkillPointsSpent(unlockedIds)` (legacy helper; server uses `skillPointsSpent` instead).

---

## 2. Storage and Fetching

### 2.1 Where Data Lives

| What | Where | Notes |
|------|--------|--------|
| **Tree/skill definitions** | `packages/shared/src/skills/skill-trees.ts` | Static: 6 trees, 108 skills. No DB table for definitions. |
| **Per-gladiator state** | Postgres via Prisma (`Gladiator` model) | `unlockedSkills: String[]`, `skillPointsAvailable: Int`, `skillPointsSpent: Int`. |
| **Runtime cache (client)** | React Context (`SkillTreeContext`) | One fetch of all trees on app load; consumed by SkillTree and ActiveSkillsGrid. |

### 2.2 API Endpoints

- **GET `/api/skill-trees`**  
  Returns all 6 trees. Implemented by reading from shared: `getAllTreeNames()` then `getSkillTree(name)` per tree. No DB read. Used only by the client’s single initial fetch inside `SkillTreeContext`.

- **POST `/api/gladiators/[gladiatorId]/skills/unlock`**  
  Body: `{ skillId }`. Loads gladiator from DB; uses `findSkillById(skillId)` for definition. Validates points (`skillPointsAvailable - skillPointsSpent >= cost`), tier prerequisite, and one-per-tier-per-tree. Updates `unlockedSkills`, `skillPointsSpent`, and stat columns; returns updated gladiator and `pointsRemaining`.

### 2.3 Fetch Strategy (Client)

- **One fetch for definitions:** On app mount, `SkillTreeProvider` (in root layout) calls `GET /api/skill-trees` once and stores the result in React state. No refetch when navigating to Camp or switching to the Skills tab.
- **Gladiator data:** Camp page loads gladiators (including `unlockedSkills`, `skillPointsAvailable`, `skillPointsSpent`) via its own data flow (e.g. `/api/gladiators`). After an unlock, the unlock API returns the updated gladiator; Camp refetches (or receives updated props) so the Skills UI reflects new state without refetching skill trees.

---

## 3. Performance Strategies Implemented

These were added to make the skill tree UI responsive, fast, and smooth (see also `docs/plans/2026-02-16-skills-stats-shop-polish.md`).

| Strategy | What we did |
|----------|-------------|
| **Single fetch for trees** | `SkillTreeContext` fetches `/api/skill-trees` once on mount. All consumers (`SkillTree`, `ActiveSkillsGrid`) use `useSkillTrees()` and never fetch trees themselves. |
| **No refetch on tab switch** | Camp does not refetch gladiators when the user switches to the Skills tab. Gladiator data is already in memory; only tree definitions needed to come from the one-time context fetch. |
| **Memoized tree list** | In `SkillTree.tsx`, the list of trees derived from context is built with `useMemo` so we don’t recompute on every render. |
| **Server-side point tracking** | `skillPointsSpent` is stored and updated on the server. Remaining points are `skillPointsAvailable - skillPointsSpent`. This avoids client-side drift and incorrect “0 points remaining” bugs. |
| **Debounced tooltip position** | In `SkillTooltip`, the effect that computes tooltip position runs after a 100ms timeout and clears the timeout on cleanup. Reduces layout thrash when moving the cursor quickly across many nodes. |

### 3.1 File Reference

- **Context:** `apps/web/contexts/SkillTreeContext.tsx` — provider, single fetch, `useSkillTrees()`.
- **Layout:** `apps/web/app/layout.tsx` — wraps app with `SkillTreeProvider`.
- **Consumers:** `apps/web/components/skills/SkillTree.tsx`, `apps/web/components/camp/ActiveSkillsGrid.tsx` — both use `useSkillTrees()` only.
- **API:** `apps/web/app/api/skill-trees/route.ts` (GET), `apps/web/app/api/gladiators/[gladiatorId]/skills/unlock/route.ts` (POST).
- **Definitions:** `packages/shared/src/skills/skill-trees.ts`.
- **Schema:** `packages/database/prisma/schema.prisma` — `Gladiator.unlockedSkills`, `skillPointsAvailable`, `skillPointsSpent`.

---

## 4. Summary

- **Behavior:** 6 trees, 108 skills, tier prerequisites, one-per-tier-per-tree, points from `skillPointsAvailable` / `skillPointsSpent`.
- **Storage:** Definitions in shared package; per-gladiator state in Postgres (`unlockedSkills`, `skillPointsAvailable`, `skillPointsSpent`).
- **Fetching:** One GET of all trees at app load via `SkillTreeContext`; gladiator data via Camp’s existing flow; unlock via POST that returns updated gladiator.
- **Performance:** Single tree fetch, no refetch on tab switch, memoized tree list, server-side points, debounced tooltip positioning.
