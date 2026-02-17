# Skill Trees Performance Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add surgical memoization to SkillTree and ActiveSkillsGrid components to reduce re-renders by 70-80%, eliminating lag on tab switches, hovers, and unlocks.

**Architecture:** Extract `<SkillNodeButton />` and `<SkillSlot />` as memoized components; wrap derived state (`skillsByTier`, `hoveredSkill`, `resolved`, `sorted`) in `useMemo`; wrap event handlers in `useCallback` to stabilize references.

**Tech Stack:** React 18 (`React.memo`, `useMemo`, `useCallback`), TypeScript, Tailwind CSS.

---

## Task 1: Optimize SkillTree.tsx — Memoize Derived State

**Files:**
- Modify: `apps/web/components/skills/SkillTree.tsx:290-315`

**Context:**
Currently, `skillsByTier` and `hoveredSkill` are computed inline on every render. This causes all 108 skill buttons to recalculate their render logic on every parent state change (hover, unlock, points update). Wrapping in `useMemo` ensures they only recalculate when their dependencies change.

**Step 1: Update imports to include useMemo**

At the top of `SkillTree.tsx`, change:
```typescript
import { useState, useEffect, useRef, useMemo } from 'react'
```

(Already present in the file, so no change needed. Verify it's there.)

**Step 2: Memoize skillsByTier**

Replace lines 307-314 (the inline `skillsByTier` calculation):

```typescript
  const skillsByTier = useMemo(() => {
    if (!currentTree) return {}
    return currentTree.skills.reduce(
      (acc, skill) => {
        if (!acc[skill.tier]) acc[skill.tier] = []
        acc[skill.tier].push(skill)
        return acc
      },
      {} as Record<number, SkillNode[]>
    )
  }, [currentTree])
```

**Step 3: Memoize hoveredSkill**

After the `skillsByTier` block (around line 315), add:

```typescript
  const hoveredSkill = useMemo(() => {
    return hoveredSkillId && currentTree
      ? currentTree.skills.find((s) => s.id === hoveredSkillId) ?? null
      : null
  }, [hoveredSkillId, currentTree])
```

Then **remove** the inline `hoveredSkill` assignment (originally lines 351-354). The tooltip will now use `hoveredSkill` directly instead of computing it inline.

**Step 4: Update tooltip reference**

Find the line that renders the tooltip (around line 517):
```typescript
{isHovered && (
  <SkillTooltip
    skill={hoveredSkill}  // Now using memoized hoveredSkill
    ...
  />
)}
```

Verify it uses `hoveredSkill` from the memoized value, not a computed inline value.

**Step 5: Commit**

```bash
git add apps/web/components/skills/SkillTree.tsx
git commit -m "perf: memoize skillsByTier and hoveredSkill in SkillTree"
```

---

## Task 2: Optimize SkillTree.tsx — Extract SkillNodeButton Component

**Files:**
- Modify: `apps/web/components/skills/SkillTree.tsx`

**Context:**
Currently, all 108 skill buttons re-render whenever the parent SkillTree component updates (selection change, points update, unlock, hover). Extracting `<SkillNodeButton />` as a memoized component and wrapping with `React.memo()` prevents re-renders when props are unchanged.

**Step 1: Create SkillNodeButton component (add before the main SkillTree function)**

Add this component before the `export function SkillTree()` line (around line 275):

```typescript
interface SkillNodeButtonProps {
  skill: SkillNode
  isUnlocked: boolean
  isAvailable: boolean
  canAfford: boolean
  needsPrereqTier: boolean
  unlocking: string | null
  pointsRemaining: number
  treeTheme: (typeof TREE_THEMES)[SkillTreeName]
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
  isHovered: boolean
  anchorRef: React.RefObject<HTMLDivElement | null>
  hoveredSkill: SkillNode | null
}

const SkillNodeButton = React.memo(({
  skill,
  isUnlocked,
  isAvailable,
  canAfford,
  needsPrereqTier,
  unlocking,
  pointsRemaining,
  treeTheme,
  onMouseEnter,
  onMouseLeave,
  onClick,
  isHovered,
  anchorRef,
  hoveredSkill,
}: SkillNodeButtonProps) => {
  const cost = skill.cost

  return (
    <div
      key={skill.id}
      ref={isHovered ? anchorRef : undefined}
      className="relative flex flex-col items-center gap-2 min-w-[7rem]"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!isAvailable || !!unlocking}
        className={`relative h-16 w-16 shrink-0 rounded-full border-2 transition-[transform,box-shadow] duration-100 ease-out ${
          isUnlocked
            ? `${treeTheme.border} bg-gray-900/80 shadow-lg ring-2 ring-green-500/50`
            : isAvailable
            ? `${treeTheme.border} bg-gray-900/80 hover:scale-105 hover:ring-2 hover:ring-coliseum-bronze/60 cursor-pointer`
            : 'border-gray-600 bg-gray-900/60 opacity-70 cursor-not-allowed'
        }`}
      >
        <span
          className={`absolute inset-1.5 rounded-full overflow-hidden bg-gray-900 ${
            isUnlocked ? '' : 'grayscale'
          }`}
        >
          <Image
            src={treeTheme.icon}
            alt={skill.name}
            width={56}
            height={56}
            className="h-full w-full object-contain"
          />
        </span>
        {isUnlocked && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">
            ✓
          </span>
        )}
        {unlocking === skill.id && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-coliseum-black/70 text-coliseum-bronze text-xs">
            ...
          </span>
        )}
      </button>
      <span className="text-xs text-coliseum-sand/80 w-full text-center leading-tight px-0.5">
        {skill.name}
      </span>
      {isHovered && (
        <SkillTooltip
          skill={skill}
          isUnlocked={isUnlocked}
          isAvailable={isAvailable}
          needsPrereqTier={needsPrereqTier}
          canAfford={canAfford}
          cost={cost}
          treeTheme={treeTheme}
          anchorRef={anchorRef}
        />
      )}
    </div>
  )
})

SkillNodeButton.displayName = 'SkillNodeButton'
```

**Step 2: Commit**

```bash
git add apps/web/components/skills/SkillTree.tsx
git commit -m "perf: extract SkillNodeButton as memoized component"
```

---

## Task 3: Optimize SkillTree.tsx — Replace Inline Skill Rendering with SkillNodeButton

**Files:**
- Modify: `apps/web/components/skills/SkillTree.tsx:446-535`

**Context:**
The skill rendering loop (lines 455-531) currently inlines all the button logic. Now that we have `<SkillNodeButton />`, we replace that with a single component call, passing all necessary props.

**Step 1: Replace the skill rendering loop**

Find the section that renders each skill (around lines 455-531) and replace it with:

```typescript
{tierSkills.map((skill) => {
  const isUnlocked = unlockedSkills.includes(skill.id)
  const canUnlock = canUnlockSkill(skill.id, unlockedSkills)
  const canAfford = pointsRemaining >= skill.cost
  const needsPrereqTier =
    skill.prerequisiteTier &&
    !currentTree.skills
      .filter((s) => s.tier === skill.prerequisiteTier)
      .some((s) => unlockedSkills.includes(s.id))
  const isAvailable =
    canUnlock && canAfford && !isUnlocked && !needsPrereqTier
  const isHovered = hoveredSkillId === skill.id

  return (
    <SkillNodeButton
      key={skill.id}
      skill={skill}
      isUnlocked={isUnlocked}
      isAvailable={isAvailable}
      canAfford={canAfford}
      needsPrereqTier={!!needsPrereqTier}
      unlocking={unlocking}
      pointsRemaining={pointsRemaining}
      treeTheme={treeTheme}
      onMouseEnter={() => setHoveredSkillId(skill.id)}
      onMouseLeave={() => setHoveredSkillId(null)}
      onClick={() => {
        if (isAvailable && !unlocking) unlockSkill(skill.id, skill.cost)
      }}
      isHovered={isHovered}
      anchorRef={hoveredWrapperRef}
      hoveredSkill={hoveredSkill}
    />
  )
})}
```

**Step 2: Commit**

```bash
git add apps/web/components/skills/SkillTree.tsx
git commit -m "perf: use SkillNodeButton component in skill rendering loop"
```

---

## Task 4: Optimize SkillTree.tsx — Add useCallback for Event Handlers

**Files:**
- Modify: `apps/web/components/skills/SkillTree.tsx:316-341`

**Context:**
Event handlers like `unlockSkill` are recreated on every render. Wrapping them in `useCallback` ensures they maintain stable references, allowing memoized child components to recognize when props haven't changed and skip re-renders.

**Step 1: Import useCallback (verify it's already imported)**

At the top of the file, verify:
```typescript
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
```

**Step 2: Wrap unlockSkill in useCallback**

Replace the `unlockSkill` function (lines 316-341) with:

```typescript
  const unlockSkill = useCallback(
    async (skillId: string, cost: number) => {
      try {
        setUnlocking(skillId)
        const res = await fetch(`/api/gladiators/${gladiatorId}/skills/unlock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillId }),
        })
        if (!res.ok) {
          const errorText = await res.text()
          console.error('Failed to unlock skill:', errorText)
          return
        }
        const data = await res.json()
        if (data.success) {
          setUnlockedSkills([...unlockedSkills, skillId])
          onSkillUnlocked?.()
        } else {
          console.error('Failed to unlock skill:', data.error || 'Unknown error')
        }
      } catch (error) {
        console.error('Failed to unlock skill:', error)
      } finally {
        setUnlocking(null)
      }
    },
    [gladiatorId, unlockedSkills, onSkillUnlocked]
  )
```

**Step 3: Commit**

```bash
git add apps/web/components/skills/SkillTree.tsx
git commit -m "perf: add useCallback to unlockSkill handler"
```

---

## Task 5: Optimize ActiveSkillsGrid.tsx — Memoize Derived Arrays

**Files:**
- Modify: `apps/web/components/camp/ActiveSkillsGrid.tsx:41-46`

**Context:**
Currently, `resolved` and `sorted` are computed inline on every render. Wrapping them in `useMemo` prevents recalculation when `unlockedSkills` hasn't changed, which is the common case.

**Step 1: Verify useMemo is imported**

At the top of `ActiveSkillsGrid.tsx`, verify:
```typescript
import { useState, useEffect, useRef, useMemo } from 'react'
```

**Step 2: Memoize resolved and sorted**

Replace lines 41-46 (the inline `resolved` and `sorted` calculations) with:

```typescript
  const resolved = useMemo(
    () =>
      unlockedSkills
        .map((id) => skillsById[id])
        .filter((s): s is SkillNode => s != null),
    [unlockedSkills, skillsById]
  )

  const sorted = useMemo(
    () =>
      [...resolved].sort(
        (a, b) => (a.tree.localeCompare(b.tree) || a.tier - b.tier)
      ),
    [resolved]
  )
```

**Step 3: Commit**

```bash
git add apps/web/components/camp/ActiveSkillsGrid.tsx
git commit -m "perf: memoize resolved and sorted arrays in ActiveSkillsGrid"
```

---

## Task 6: Optimize ActiveSkillsGrid.tsx — Extract SkillSlot Component

**Files:**
- Modify: `apps/web/components/camp/ActiveSkillsGrid.tsx`

**Context:**
Currently, all skill slots re-render whenever the parent component updates. Extracting `<SkillSlot />` as a memoized component prevents unnecessary re-renders.

**Step 1: Create SkillSlot component (add before ActiveSkillsGrid function)**

Add this before the `export function ActiveSkillsGrid()` line (around line 24):

```typescript
interface SkillSlotProps {
  skill: SkillNode
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  theme: (typeof TREE_THEMES)[SkillTreeName]
  anchorRef: React.RefObject<HTMLDivElement | null>
}

const SkillSlot = React.memo(({
  skill,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  theme,
  anchorRef,
}: SkillSlotProps) => {
  return (
    <div
      ref={isHovered ? anchorRef : undefined}
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`
          w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-lg border-2 flex items-center justify-center overflow-hidden
          bg-coliseum-black/60 transition-colors duration-100
          ${isHovered ? 'border-coliseum-bronze shadow-lg' : 'border-coliseum-sand/30'}
        `}
      >
        <Image
          src={theme.icon}
          alt={skill.name}
          width={56}
          height={56}
          className="w-full h-full object-contain"
        />
      </div>
      {isHovered && (
        <SkillSlotTooltip
          skill={skill}
          treeTheme={theme}
          anchorRef={anchorRef}
        />
      )}
    </div>
  )
})

SkillSlot.displayName = 'SkillSlot'
```

**Step 2: Update imports**

Ensure `React` is imported at the top:
```typescript
import React, { useState, useEffect, useRef, useMemo } from 'react'
```

**Step 3: Replace skill slot rendering**

In the `return` statement of `ActiveSkillsGrid`, find the skill mapping (around line 66) and replace:

```typescript
{sorted.map((skill) => {
  const theme = TREE_THEMES[skill.tree as SkillTreeName] ?? TREE_THEMES.Valor
  const isHovered = hoveredId === skill.id
  return (
    <SkillSlot
      key={skill.id}
      skill={skill}
      isHovered={isHovered}
      onMouseEnter={() => setHoveredId(skill.id)}
      onMouseLeave={() => setHoveredId(null)}
      theme={theme}
      anchorRef={hoveredRef}
    />
  )
})}
```

**Step 4: Commit**

```bash
git add apps/web/components/camp/ActiveSkillsGrid.tsx
git commit -m "perf: extract SkillSlot as memoized component"
```

---

## Task 7: Manual Testing — Verify Performance Improvements

**Files:**
- Test: `apps/web/components/skills/SkillTree.tsx`
- Test: `apps/web/components/camp/ActiveSkillsGrid.tsx`

**Context:**
After memoization changes, we need to verify that the UI feels responsive and lag-free in all interaction modes.

**Step 1: Start the dev server**

```bash
cd /home/aidenkiefer/projects/crucible/crucible
pnpm dev
```

Expected: Both `apps/web` and `apps/game-server` start without errors.

**Step 2: Open the app and navigate to the Skills tab**

- Open browser to `http://localhost:3000`
- Sign in if needed
- Navigate to `/camp` or `/camp/gladiators/[id]`
- Find the Skills tab

**Step 3: Test tab switching (Valor → Instinct → Discipline, etc.)**

- Click through each skill tree tab
- Verify switching feels instant (no lag, no pause)
- Expected: Smooth tab transitions with no visible frame drops

**Step 4: Test hovering over skills**

- Hover over skill nodes one by one
- Verify tooltips appear without delay
- Expected: Tooltips appear instantly, no stutter when moving cursor between skills

**Step 5: Test unlocking a skill**

- Unlock a skill (if you have skill points available)
- Verify the unlock animation and state update feel responsive
- Expected: Button state changes instantly, no lag during or after unlock

**Step 6: Test with many unlocked skills**

- If available, test in a Gladiator that has many skills unlocked
- Repeat hovering and tab switching with heavy state
- Expected: Same responsive feel as with few skills

**Step 7: No commit needed**

This is manual verification. If lag persists, check the React DevTools Profiler to identify remaining bottlenecks.

---

## Task 8: Final Commit & Documentation

**Files:**
- None (documentation only)

**Context:**
Verify all changes are committed and document the optimization for future reference.

**Step 1: Verify all changes are committed**

```bash
git status
```

Expected: "nothing to commit, working tree clean"

**Step 2: Review commit history**

```bash
git log --oneline -10
```

Expected: See commits from Tasks 1-6:
- perf: memoize skillsByTier and hoveredSkill in SkillTree
- perf: extract SkillNodeButton as memoized component
- perf: use SkillNodeButton component in skill rendering loop
- perf: add useCallback to unlockSkill handler
- perf: memoize resolved and sorted arrays in ActiveSkillsGrid
- perf: extract SkillSlot as memoized component

**Step 3: Document in memory (optional)**

If desired, update `/home/aidenkiefer/.claude/projects/-home-aidenkiefer-projects-crucible-crucible/memory/MEMORY.md` with optimization techniques learned.

**Step 4: Done**

No final commit needed. The optimization is complete.

---

## Summary

**Files Modified:**
- `apps/web/components/skills/SkillTree.tsx` (~80 lines added/changed)
- `apps/web/components/camp/ActiveSkillsGrid.tsx` (~60 lines added/changed)

**Techniques Applied:**
- `useMemo` for derived state (skillsByTier, hoveredSkill, resolved, sorted)
- `React.memo()` for component extraction (SkillNodeButton, SkillSlot)
- `useCallback` for stable event handler references

**Expected Improvement:**
- 70-80% reduction in re-renders
- Smooth 60fps interactions on tab switching, hovering, unlocking
- No lag with 0 or many unlocked skills

**Testing:**
- Manual verification of UI responsiveness
- React DevTools Profiler for detailed metrics (optional)
