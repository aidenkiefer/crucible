# Sprint 3.5: Frontend Combat UI — Remaining Items

**Status:** Planned  
**Prerequisites:** Sprint 3 complete (see [SPRINT-3-SUMMARY.md](../SPRINT-3-SUMMARY.md))  
**Source:** Gaps identified between [04-sprint-3-frontend-animations.md](04-sprint-3-frontend-animations.md) and what was delivered in Sprint 3.

---

## Overview

Sprint 3 delivered the core real-time combat UI: sprite loading, Canvas renderer, interpolation, input handling, WebSocket integration, Match HUD, and match page. The following items from the Sprint 3 plan were **not** completed and are captured here as Sprint 3.5.

---

## Task 1: Client-Side Prediction (Optional for MVP)

**Source:** Plan Task 2, Step 2 — "Create client prediction hook (optional for MVP)"  
**Status in Sprint 3:** Explicitly deferred; local player movement is driven by server state.

**Goal:** Apply movement locally immediately for the local player, then reconcile with server state, for a snappier feel and reduced perceived input lag.

**Files:**
- Create: `apps/web/hooks/useClientPrediction.ts`

**Notes:**
- Plan included full code for `useClientPrediction(serverState, localInput)` using a ref for predicted state, reconciliation (snap if diff > 2, else lerp), and an interval to apply `Physics.applyMovement` / `Physics.updatePosition` locally.
- Requires `Physics` (or equivalent movement logic) to be available in shared/frontend — currently physics may live only on the game server. If so, either expose a minimal movement helper in `@gladiator/shared` or reimplement a thin client-side prediction that matches server physics (e.g. position += velocity * dt).
- Integrate predicted state into the match page / ArenaCanvas so the **player** unit is drawn from predicted state when available, while **opponent** remains interpolated from server state.

**Acceptance:**
- [ ] Hook exists and is wired so local player position updates immediately on WASD input.
- [ ] When server state arrives, reconciliation runs (snap or smooth lerp) so client prediction doesn’t drift.
- [ ] No regression in opponent interpolation or network behavior.

---

## Task 2: Main Hand / Off-Hand Attack Bindings (Mouse)

**Source:** Plan "Key Challenges" — "Attack with Main hand weapon slot using left click, and off-hand slot using right click"  
**Status in Sprint 3:** Not implemented. Current behavior: Space = single attack action; no left/right click or main/off-hand distinction.

**Goal:** Support left click for main-hand attack and right click for off-hand attack (in addition to or instead of Space for primary attack), and send the appropriate action/slot to the server.

**Files:**
- Update: `apps/web/hooks/useGameInput.ts` — add mouse button handling (left = main hand, right = off hand), prevent context menu on right click.
- Update: `apps/web/components/arena/ArenaCanvas.tsx` (or wrapper) — ensure canvas receives click events and passes them to the input hook or submit path.
- Update: Input payload / server contract if the server expects a slot or action type (e.g. `mainHand` vs `offHand`); align with game server and `docs/data-glossary.md` / action templates.

**Acceptance:**
- [ ] Left click triggers main-hand attack (or primary attack).
- [ ] Right click triggers off-hand attack (or secondary attack); no browser context menu.
- [ ] Server receives and processes the correct action/slot; cooldowns/HUD reflect per-slot if applicable.
- [ ] Optional: Keep Space as primary attack for accessibility.

---

## Task 3: Sprint 3 Verification Checklist

**Source:** Plan "Verification Checklist" (Sprite Rendering, Real-Time Movement, Combat Actions, Visual Feedback, Match Flow).  
**Status in Sprint 3:** Checklist was not executed or documented; some items depend on full match creation flow.

**Goal:** Run through the Sprint 3 verification checklist, fix any gaps, and document results (or add automated tests where feasible).

**Reference (from plan):**

- **Sprite rendering:** Duelist loads; idle animation; facing; centering; pixel art crisp; fallback circle.
- **Real-time movement:** WASD smooth; mouse facing; sprite direction; responsive; arena bounds; opponent interpolation.
- **Combat actions:** Space = attack; Shift = dodge; cooldowns on HUD; no attack/dodge on cooldown or without stamina.
- **Visual feedback:** HP/stamina bars; Blood Red when low HP; i-frame cyan ring; 60 FPS; Dark Stone background.
- **Match flow:** Create CPU match from lobby; match starts; 20Hz combat; match end at 0 HP; victory/defeat screen; "Fight Again" creates new match.

**Deliverables:**
- [ ] Go through each checkbox; mark as verified, not applicable, or failed.
- [ ] Fix any failed or missing behavior (e.g. arena bounds, cooldown display, stamina checks).
- [ ] Document in a short "Sprint 3 verification results" section (e.g. in this file or in SPRINT-3-SUMMARY.md) and call out any deferred items (e.g. "Fight Again" flow if match creation API isn’t ready).

---

## Task 4: Match Creation and "Fight Again" Flow (If Not Already Wired)

**Source:** Plan verification checklist — "Can create CPU match from lobby", "Match starts immediately after creation", "Fight Again button creates new match".  
**Status in Sprint 3:** Match page expects a `matchId`; no lobby or "create CPU match" UI described; "Fight Again" currently reloads the page (per plan code sample).

**Goal:** Ensure there is a clear path from the app (e.g. home or arena placeholder) to create a CPU match and land on the match page with a valid `matchId`, and that "Fight Again" creates a new match and navigates to it (instead of only reloading).

**Scope:**
- If an API or game-server endpoint already exists to create a CPU match and return `matchId`, add or link UI (e.g. from `/arena` or home "Enter Arena") to call it and redirect to `/match/[matchId]`.
- Update match page "Fight Again" to create a new match (same API) and navigate to the new match URL rather than `window.location.reload()`.
- If match creation is owned by a different sprint or backend, document the dependency and add a stub or placeholder in Sprint 3.5 so the flow is clear for when the API is ready.

**Acceptance:**
- [ ] From a defined entry point (e.g. arena or home), user can start a CPU match and be taken to `/match/[matchId]`.
- [ ] "Fight Again" creates a new match and opens the new match page (or is documented as blocked by backend).
- [ ] No regression in existing match page or WebSocket behavior.

---

## Summary Table

| Task | Source in Sprint 3 plan | Priority |
|------|--------------------------|----------|
| 1. Client-side prediction (`useClientPrediction`) | Task 2, Step 2 (optional) | Medium |
| 2. Main hand / off-hand (left/right click) | Key Challenges | Medium |
| 3. Run and document verification checklist | Verification Checklist | High |
| 4. Match creation + Fight Again flow | Verification Checklist (Match Flow) | High (may be backend-dependent) |

---

## References

- **Sprint 3 plan:** [04-sprint-3-frontend-animations.md](04-sprint-3-frontend-animations.md)
- **Sprint 3 summary:** [../SPRINT-3-SUMMARY.md](../SPRINT-3-SUMMARY.md)
- **Design guidelines:** [../design-guidelines.md](../design-guidelines.md)
- **Combat engine (Sprint 2):** [../SPRINT-2-SUMMARY.md](../SPRINT-2-SUMMARY.md)
