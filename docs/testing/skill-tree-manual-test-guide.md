# Skill Tree UI — Manual Testing Guide

**Purpose:** Verify that the Skill Tree UI feels responsive and lag-free after performance optimizations (Tasks 1-6).

**Time Estimate:** 15-20 minutes

---

## Pre-Test Checklist

- [ ] Dev server running on `http://localhost:3001`
- [ ] Browser DevTools open (F12)
- [ ] Have a test Gladiator with skill points available
- [ ] Chrome DevTools React Profiler available (recommended for detailed analysis)

---

## Test Scenarios

### Scenario 1: Tab Switching Performance

**Objective:** Verify that switching between skill trees is instant with no perceptible lag.

**Steps:**
1. Navigate to `/camp/gladiators/[gladiatorId]`
2. Scroll to the **Skills** section
3. Verify you can see the 6 tree tabs: Valor, Instinct, Discipline, Intellect, Zeal, Ferocity
4. Click on each tab in sequence: Valor → Instinct → Discipline → Intellect → Zeal → Ferocity
5. Repeat: Switch back to Valor
6. Repeat: Randomly switch between trees 10+ times

**Expected Behavior:**
- Each tab switch feels instantaneous
- No visible lag, pause, or freezing
- UI updates immediately
- No white/grey flash or placeholder rendering
- Smooth color/styling transitions

**Pass Criteria:**
- All tab switches feel instant (no delay > 50ms)
- No frame drops (should see 60 FPS in DevTools)

**Troubleshooting:**
If you see lag:
- Check React Profiler for which component is slow
- Look for "SkillTree" or "tier" rendering in the profiler
- Verify React DevTools shows memoization working (greyed out renders = memoized)

---

### Scenario 2: Hover Interactions — Tooltip Display

**Objective:** Verify that tooltips appear without delay and hover states are smooth.

**Steps:**
1. Stay on a single skill tree (e.g., Valor)
2. Hover over the first skill node
   - Expected: Tooltip appears showing skill details
   - Expected: No delay (should appear within 100ms)
3. Move your cursor to an adjacent skill node
   - Expected: Previous tooltip disappears
   - Expected: New tooltip appears smoothly
4. Move cursor quickly between 5+ skill nodes
   - Expected: Tooltips follow cursor smoothly
   - Expected: No stutter or lag when moving
5. Move cursor in circular motion over skills
   - Expected: Smooth tracking, no jank

**Expected Behavior:**
- Tooltips appear quickly (< 100ms)
- Tooltips position correctly (below or above skill based on viewport space)
- No hover "ghosting" (tooltip from previous skill lingering)
- Smooth hover highlight on skill button (glow effect)
- No flickering or flickering during cursor movement

**Pass Criteria:**
- Tooltips always appear without delay
- Cursor movement is smooth and fluid
- No stutter during rapid hover changes
- Tooltip positioning is correct (no overlaps, stays in viewport)

**Troubleshooting:**
If you see lag:
- Check React Profiler for tooltip rendering time
- Look for expensive computations in SkillTooltip component
- Verify tooltipRef calculation isn't blocking UI thread

---

### Scenario 3: Unlock Interaction — State Changes

**Objective:** Verify that unlocking skills is responsive with no lag during state update.

**Prerequisites:**
- Have a Gladiator with at least 2-3 skill points available
- Have an unlockable skill (available, not locked, prerequisite met)

**Steps:**
1. Identify an available skill to unlock
2. Click the skill node
   - Expected: Loading indicator (...) appears immediately
   - Expected: No delay in button state change
3. Wait for unlock to complete
   - Expected: Button shows checkmark or success state
   - Expected: Skill points decrease
   - Expected: UI updates without lag
4. Repeat with 3-5 more skills (if you have enough points)
5. Unlock a skill, then quickly switch trees
   - Expected: Skill unlock completes smoothly
   - Expected: Tree switch doesn't interfere with unlock animation

**Expected Behavior:**
- Loading indicator appears instantly (< 16ms)
- No "stuck" button state or unresponsive UI
- Skill points counter updates immediately after unlock
- No lag during unlock API call
- No visual jank during state transitions

**Pass Criteria:**
- All unlock interactions feel responsive
- No delays in UI state changes
- Loading indicator displays correctly
- Unlock counter animates smoothly
- Skill tree remains interactive during unlock

**Troubleshooting:**
If you see lag:
- Check Network tab for slow API response
- Look for React Profiler slow renders during unlock
- Verify unlockSkill callback is memoized (check React DevTools)

---

### Scenario 4: Stress Test — Many Unlocked Skills

**Objective:** Verify performance remains good even with many unlocked skills.

**Prerequisites:**
- Enough skill points to unlock 10+ skills (or edit skillPointsAvailable in browser console)

**Steps:**
1. Unlock 10-15 skills across the current tree
2. Repeat Scenario 1: Switch between trees
   - Expected: Same responsive feel as with few unlocked skills
   - Expected: No degradation in tab switch speed
3. Repeat Scenario 2: Hover over many skills
   - Expected: Same smooth tooltip behavior
   - Expected: No lag when hovering with many unlocked skills
4. Hover over a mix of locked and unlocked skills
   - Expected: Same responsive feel
   - Expected: No special lag for unlocked skills

**Expected Behavior:**
- Performance remains consistent regardless of unlock count
- No performance degradation as you unlock more skills
- Same smooth interactions with 1 unlocked skill as with 15

**Pass Criteria:**
- Tab switching remains instant
- Hover interactions remain smooth
- No frame drops when many skills are unlocked
- Memory usage remains reasonable (DevTools Performance tab)

**Troubleshooting:**
If you see lag with many skills:
- Check React Profiler for which component is slow
- Look for "Tier" or "SkillNodeButton" rendering
- Verify useMemo and React.memo are working (check DevTools)

---

### Scenario 5: Keyboard + Mouse Combinations

**Objective:** Verify UI remains responsive with rapid/combined interactions.

**Steps:**
1. Switch trees while hovering (hold hover + click tab)
   - Expected: Smooth interaction
   - Expected: No lag or stutter
2. Unlock skill while switching tabs
   - Click unlock, immediately switch tree
   - Expected: Tree switch is smooth
   - Expected: Unlock completes in background
3. Rapid fire hovers + clicks
   - Quickly move mouse between skills while clicking unlock
   - Expected: UI responsive
   - Expected: No "stuck" states
4. Tab switching while scrolling
   - Scroll skill tree area while switching tabs
   - Expected: Smooth scrolling + tab switching
   - Expected: No jank or frame drops

**Expected Behavior:**
- All interactions remain responsive
- No stalling or freezing with combined actions
- UI doesn't feel "stuck" at any point
- Smooth animations even with simultaneous interactions

**Pass Criteria:**
- All combined interactions work smoothly
- No lag with multiple simultaneous UI updates
- Animations remain fluid under rapid interaction

---

### Scenario 6: Cross-Gladiator Verification (Optional)

**Objective:** Verify performance is consistent across different Gladiators.

**Steps:**
1. Go back to Camp (`/camp`)
2. Switch to a different Gladiator
3. Open Skills tab again
4. Repeat Scenarios 1-3 with this new Gladiator
   - Tab switching
   - Hover interactions
   - Unlock (if possible)

**Expected Behavior:**
- Same responsive feel as first Gladiator
- No performance differences between Gladiators
- Consistent behavior regardless of Gladiator data

**Pass Criteria:**
- All scenarios feel equally responsive
- No Gladiator-specific lag
- Consistent performance across different Gladiators

---

## Performance Profiling (Advanced Testing)

If you want to verify optimizations are working at the React level:

### Using Chrome DevTools React Profiler

1. Open Chrome DevTools → Components tab
2. Look for **SkillTree** component
3. Expand to see child components:
   - SkillNodeButton (should be memoized)
   - SkillTooltip (conditional render)
4. Perform a tab switch
5. Watch React DevTools:
   - **Greyed out components** = memoized, skipped re-render (GOOD ✅)
   - **Highlighted components** = re-rendered (expected for selectedTree change)
6. Verify:
   - SkillNodeButton instances don't all highlight on every render
   - Only the hovered skill's tooltip re-renders
   - skillsByTier is only recomputed on tree change

### Using React Profiler Recording

1. Open DevTools → Profiler tab
2. Start recording (red circle)
3. Perform one tab switch (Valor → Instinct)
4. Stop recording
5. Analyze the flame graph:
   - Look for SkillTree component
   - Verify render time is < 100ms
   - Verify SkillNodeButton renders are fast (< 5ms each)
6. Check "Ranked by Duration" to find slow components
7. Expected: No component taking > 50ms to render

---

## Data Recording

### Quick Test Results Template

Use this template to record your test results:

```
## Test Date: ____________________
## Tester: ____________________
## Gladiator: ____________________

### Scenario 1: Tab Switching
- All tabs switch instantly? [ ] Yes [ ] No
- Any visible lag? [ ] Yes [ ] No
- Frame rate smooth (60 FPS)? [ ] Yes [ ] No
- Notes: ____________________

### Scenario 2: Hover Interactions
- Tooltips appear without delay? [ ] Yes [ ] No
- Cursor movement smooth? [ ] Yes [ ] No
- Any stutter or jank? [ ] Yes [ ] No
- Tooltip positioning correct? [ ] Yes [ ] No
- Notes: ____________________

### Scenario 3: Unlock Interaction
- Loading indicator appears instantly? [ ] Yes [ ] No
- Unlock completes smoothly? [ ] Yes [ ] No
- Skill points update immediately? [ ] Yes [ ] No
- Any lag during unlock? [ ] Yes [ ] No
- Notes: ____________________

### Scenario 4: Stress Test
- Performance consistent with many skills? [ ] Yes [ ] No
- Any degradation noticed? [ ] Yes [ ] No
- Tab switch still instant? [ ] Yes [ ] No
- Notes: ____________________

### Scenario 5: Combined Interactions
- All interactions remain responsive? [ ] Yes [ ] No
- Any "stuck" states? [ ] Yes [ ] No
- Animations remain fluid? [ ] Yes [ ] No
- Notes: ____________________

### Overall Assessment
Overall responsiveness: [ ] Excellent [ ] Good [ ] Fair [ ] Poor

Any issues found:
____________________
____________________

Estimated latency: ____________________
```

---

## Issues to Report

If you encounter any of the following, document and report:

### Critical Issues (Block Deployment)
- [ ] UI freezes or becomes unresponsive
- [ ] Tooltips never appear
- [ ] Tab switching causes crashes or errors
- [ ] Skill unlock fails consistently
- [ ] Memory leaks (DevTools shows continuously increasing memory)

### High Priority Issues (Fix Before Release)
- [ ] Lag > 100ms on any interaction
- [ ] Visual stutter or jank during hover
- [ ] Tooltips appear with delay > 200ms
- [ ] Unlock animation stutters
- [ ] Performance degrades with 10+ unlocked skills

### Medium Priority Issues (Nice to Fix)
- [ ] Tooltip positioning occasionally incorrect
- [ ] Minor lag on first tree load
- [ ] Hover highlight animation could be smoother
- [ ] Loading indicator position could be centered better

### Low Priority Issues (Polish)
- [ ] Tooltip text wrapping could be better
- [ ] Icon could be higher quality
- [ ] Color contrast could be improved
- [ ] Font size slightly too small on mobile

---

## Browser Requirements

- **Minimum:** Chrome/Edge 90+, Firefox 88+, Safari 14+
- **Recommended:** Latest version of Chrome for DevTools React Profiler
- **Mobile:** iOS Safari 14+, Chrome Android 90+
- **Performance baseline:** 60 FPS on devices with 4GB+ RAM

---

## Success Criteria Summary

✅ **All scenarios pass when:**
- Tab switching feels instant (< 50ms)
- Hover interactions are smooth (no stutter)
- Tooltips appear without delay (< 100ms)
- Unlocking is responsive (immediate state change)
- Performance consistent with many skills
- Combined interactions don't cause lag
- Frame rate remains 60 FPS throughout

---

## Notes for Developers

This guide is designed for QA/testing team members. If developers are running this test:

1. Use React DevTools Profiler to verify optimizations are working
2. Check that SkillNodeButton is memoized (should see "Memoized" in component tree)
3. Verify React.memo is preventing unnecessary re-renders
4. Check useCallback dependencies are correct
5. Monitor useMemo for skillsByTier recomputation only on tree change

See `docs/testing/skill-tree-performance-verification.md` for detailed implementation analysis.

---

**Last Updated:** 2026-02-16
**Relevant Implementation:** SkillTree.tsx, SkillNodeButton.tsx (memoized), ActiveSkillsGrid (future)
**Related Docs:** skill-tree-performance-verification.md, ../features/skill-trees-system.md
