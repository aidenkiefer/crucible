# Skill Trees Performance Optimization — Design Doc

**Date:** 2026-02-16
**Approach:** Surgical Memoization
**Expected Impact:** 70-80% reduction in re-renders and recalculations

---

## Problem Statement

The Skill Trees UI experiences lag across all interactions:
- Initial page load
- Tab switching (selecting different trees)
- Hovering over skills
- Unlocking skills
- Works poorly with no skills unlocked and with many skills unlocked

Root causes identified in code review:
1. `skillsByTier` computed inline on every render (SkillTree.tsx:307-314)
2. Per-skill validation logic (`canUnlock`, `canAfford`, `needsPrereqTier`) computed inline for every skill (O(n) per skill per render = O(n²) total)
3. `resolved` and `sorted` arrays computed inline on every render (ActiveSkillsGrid:41-46)
4. No component memoization — entire skill node re-renders when parent state changes
5. Inline `hoveredSkill` computation without memoization

---

## Solution: Surgical Memoization

### Core Strategy

Add targeted memoization to prevent unnecessary re-renders and recalculations without major architectural changes.

### Changes by File

#### **SkillTree.tsx**

**1. Memoize derived state**
- Wrap `skillsByTier` calculation in `useMemo` (depends on `currentTree`)
- Wrap `hoveredSkill` calculation in `useMemo` (depends on `hoveredSkillId` and `currentTree`)

**2. Extract `<SkillNodeButton />` memoized component**
- Move skill node button + label rendering into its own component
- Props: `skill`, `isUnlocked`, `isAvailable`, `isHovered`, `canAfford`, `needsPrereqTier`, `unlocking`, `pointsRemaining`, `treeTheme`, `onMouseEnter`, `onMouseLeave`, `onClick`
- Wrap with `React.memo()` to skip re-renders when props unchanged
- This prevents re-renders of all 108 skill buttons when hovering on one, selecting a tree, etc.

**3. Memoize event handlers**
- Wrap `unlockSkill` function in `useCallback` (depends on `gladiatorId`)
- Wrap `setSelectedTree` in `useCallback` if used as a prop (currently inline, but good practice)
- Pass stable callbacks to memoized `<SkillNodeButton />` to prevent remounting

**4. Extract `<SkillTooltip />` as memoized component**
- Already exists, but ensure it doesn't trigger re-renders of parent
- Pass only necessary props to prevent cascading re-renders

#### **ActiveSkillsGrid.tsx**

**1. Memoize derived arrays**
- Wrap `resolved` calculation in `useMemo` (depends on `unlockedSkills` and `skillsById`)
- Wrap `sorted` calculation in `useMemo` (depends on `resolved`)

**2. Extract `<SkillSlot />` memoized component**
- Move individual skill slot rendering into its own component
- Props: `skill`, `isHovered`, `onMouseEnter`, `onMouseLeave`, `theme`, `anchorRef`
- Wrap with `React.memo()` to skip re-renders when props unchanged

#### **SkillTreeContext.tsx**

No changes needed — already optimal (single fetch, no refetches).

---

## Implementation Details

### What Gets Memoized

| Item | Location | Type | Dependency |
|------|----------|------|------------|
| `skillsByTier` | SkillTree.tsx:307 | useMemo | `currentTree` |
| `hoveredSkill` | SkillTree.tsx:351 | useMemo | `hoveredSkillId`, `currentTree` |
| `unlockSkill` | SkillTree.tsx:316 | useCallback | `gladiatorId` |
| `SkillNodeButton` | SkillTree.tsx | React.memo | Props (skill, state) |
| `SkillTooltip` | SkillTree.tsx | React.memo | Props (skill, state) |
| `resolved` | ActiveSkillsGrid.tsx:41 | useMemo | `unlockedSkills`, `skillsById` |
| `sorted` | ActiveSkillsGrid.tsx:44 | useMemo | `resolved` |
| `SkillSlot` | ActiveSkillsGrid.tsx | React.memo | Props (skill, state) |

### Why This Works

1. **Prevents O(n²) recalculations:** Validation logic is computed once per tree render, not per skill
2. **Prevents cascading re-renders:** Memoized child components skip render if props unchanged
3. **Keeps handlers stable:** `useCallback` ensures event handlers don't change, allowing memos to be effective
4. **Minimal code changes:** ~150 lines added/refactored, no API changes, no component removal

---

## Expected Outcomes

- **Tab switching:** Instant (no recomputation of all skills)
- **Hovering:** Smooth (only hovered skill tooltip updates, not entire tree)
- **Unlocking:** Responsive (memoized components prevent re-render cascade)
- **Initial load:** Same (no change to data fetching)
- **Overall:** 70-80% fewer re-renders, smooth 60fps interactions

---

## Testing Strategy

1. **Manual testing:** Tab switching, hovering, unlocking with 0 and many skills
2. **React DevTools Profiler:** Measure render counts and durations before/after
3. **Browser DevTools Performance tab:** Verify no layout thrashing during interactions
4. **Edge cases:** Unlock animation, state updates, rapid clicking

---

## Rollback Plan

All changes are additive and non-breaking. If issues arise, individual memos can be removed without affecting functionality.

---

## Notes

- This approach maintains the current component structure and API
- Validation logic remains client-side; no server changes needed
- Image optimization (lazy loading, priority hints) can be a follow-up optimization
- Virtualization is a future step if skill lists grow larger
