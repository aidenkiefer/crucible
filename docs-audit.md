# Documentation Audit Instructions

**Last audit ran:** 2026-02-06 15:00 *(Sprint 6 summary: docs/plans/summaries/SPRINT-6-SUMMARY.md)*

---

## Purpose

After implementing changes to the codebase and **before pushing to GitHub**, run this audit so that all relevant documentation stays in sync with the code. The audit is driven by a **summary document** that describes what was built or changed (e.g. a sprint summary, an implementation summary, or a release note).

**How to trigger (for you or any dev):**

> Read `docs-audit.md` and complete the instructions, considering the implementation described in **`[summary-file]`**.

Replace `[summary-file]` with the actual path, e.g.:
- `docs/plans/summaries/SPRINT-6-SUMMARY.md`
- `docs/plans/implementation/2026-02-15-xyz-implementation.md`

---

## Input: The Summary Document

1. **Read the summary document** you were given (e.g. `xxx-summary.md` or the path the user specified).
2. From it, extract:
   - **What was added or changed:** New or modified apps, packages, routes, components, API routes, services, schema/models, config, and any new or updated docs.
   - **Sprint or scope:** If it’s a sprint completion, which sprint; if it’s a feature, which area (e.g. matchmaking, crafting, UI).
3. Use this list as the source of truth when updating the docs below. If the summary references specific files or sections, use those; otherwise infer from “Files created/modified” or “Changes made” (or equivalent) in the summary.

---

## Audit Checklist (in order)

Work through these in order. For each item, **only make updates that are justified by the summary document**. Do not invent changes.

---

### 1. README.md (priority)

- **Status & Roadmap**
  - If the summary reflects sprint completion or status change, update the **Sprint table** (e.g. mark a sprint ✅ Complete or 🔄 In Progress).
  - Ensure the **“Currently built”** paragraph reflects new routes, pages, components, API routes, game-server features, or packages mentioned in the summary (e.g. new `/camp` pages, new API routes, new services).
- **Project structure / Quick start**
  - If new top-level dirs, apps, or packages were added, update any **project structure** section or bullet list in README so it matches the repo.
- **Documentation table / links**
  - If the summary mentions **new docs** (e.g. a new sprint summary, a new guide, or a new plan), add or update the **documentation table** (or “Key docs” / “Docs” section) in README so the new doc is listed with a short description and path.
- **Other**
  - If the summary describes changes to tech stack, design decisions, or success criteria, update the corresponding sections in README only where the summary explicitly supports it.

---

### 2. INDEX.md (priority)

INDEX has two main parts: **Non-Documentation Index** (codebase layout) and **Documentation Index** (doc layout).

- **Non-Documentation Index**
  - **File and folder layout (non-docs):** If the summary adds or renames **apps**, **packages**, **contracts**, or key **files/folders** (e.g. new routes under `app/`, new API routes, new services, new components), update the tree so it matches. Adjust inline comments (e.g. “Sprint 5: …”) if the summary says so.
  - **Quick reference by purpose:** If new capabilities were added (e.g. matchmaking, friends, new API surface), add or update the relevant row so the “Primary file(s)” column points to the right paths.
  - **Non-documentation summaries:** If new notable files or modules were added (e.g. a new service, a new hook, a new route group), add a short bullet under the appropriate subsection (e.g. `apps/web`, `apps/game-server`, `packages/shared`).
- **Documentation Index**
  - **File and folder layout (docs):** If **new docs** were added (e.g. new sprint summary, new guide, new plan under `docs/`), add them to the `docs/` tree in the correct place (e.g. `docs/plans/summaries/`, `docs/guides/`, `docs/features/`).
  - **Quick reference by purpose:** If a new doc is the primary reference for something (e.g. “Sprint 6 status”), add or update the corresponding row.
  - **Document summaries:** If a **new doc** was added, add a short summary under the right subsection (e.g. `docs/plans/summaries/`, `docs/features/`). If an **existing doc** was significantly updated (e.g. a guide or feature doc), adjust its summary line only if the summary document describes that change.

---

### 3. docs/architecture.md (priority)

- **Component breakdown**
  - **Frontend:** If new **pages/routes** or **components** were added or renamed, update the “Key Pages” / “Key Components” (or equivalent) list and any short descriptions (e.g. new `/quick-match`, new `/friends`, new components under `components/`).
  - **Game server:** If new **services**, **sockets**, or **combat/runtime behavior** were added (e.g. matchmaking service, new WebSocket events, new tick behavior), update the game-server section and any diagrams or bullet lists that describe services and events.
  - **Database / Supabase:** If the summary mentions **schema or data model changes** (new tables, new relations, new fields), update the database/backend section and any data-flow description so it matches.
- **Diagrams**
  - If the high-level architecture changed (e.g. new external service, new path between frontend and backend), update the ASCII or described diagram only if the summary justifies it.
- **Data flow / security / deployment**
  - Update these only if the summary explicitly describes changes (e.g. new auth flow, new env vars, new deployment step).

---

### 4. docs/data-glossary.md (priority)

- **Schema and game data**
  - If the summary describes **Prisma schema changes** (new models, new fields, new enums, new relations), update the corresponding sections in the glossary (enums, User, Gladiator, Equipment, Match, LootBox, etc.). Add new models or fields with a short, accurate description.
  - If **game data concepts** changed (e.g. new equipment slot, new action category, new template/instance rules), update the relevant subsections and any “design intent” or “principles” that are affected.
- **JSON shapes / conventions (§8–11)**
  - Update only if the summary mentions changes to template/instance JSON shapes, derived stats, or authoring/runtime conventions.

---

### 5. Other documentation (as needed)

Only touch these if the summary document clearly implies an update.

- **CLAUDE.md**
  - **Current state / Status & Roadmap:** If the summary reflects a sprint completion or a clear “current sprint” change, update the opening “Current state” sentence and the **Status & Roadmap** table so an agent sees the correct “next” sprint and completed sprints.
  - **Repository Structure:** If new top-level dirs or major app/package structure was added, update the repo structure block so it matches INDEX and the real repo.
  - **Key Documentation:** If a new doc becomes a primary reference (e.g. new sprint summary or new guide), add it to the Key Documentation table with a short “Use when” description.
- **docs/features/** (e.g. admin-ui.md, combat.md, equipment.md, planned-features.md)
  - Update only if the summary says a **feature spec** was implemented, deprecated, or revised (e.g. “Admin UI now supports X” or “Combat spec updated to include Y”).
- **docs/guides/** (e.g. development-setup.md, vercel-deployment.md, testing-admin-ui.md)
  - Update only if the summary describes **setup, deployment, or testing** changes (e.g. new env vars, new steps, new services to run).
- **docs/design/design-guidelines.md**
  - Update only if the summary describes **design system or UI** changes (e.g. new components, new tokens, new patterns).
- **New summary or plan docs**
  - If the summary you’re auditing *is* a new file (e.g. a new `SPRINT-X-SUMMARY.md` or implementation doc), ensure it is **added to INDEX.md** under the Documentation Index (file layout + document summaries) as in step 2.

---

## After completing the audit

1. **Update “Last audit ran”** at the top of this file with the current date and time (e.g. `2026-02-15 14:30`).
2. **Reply to the user** with a short report:
   - Which of the four priority docs were updated (README, INDEX, architecture, data-glossary).
   - Which other docs (if any) were updated and why.
   - If something in the summary was ambiguous or missing (e.g. “no schema changes described, so data-glossary was not updated”), say so briefly.

---

## Summary of priority docs

| Doc | When to update |
|-----|----------------|
| **README.md** | Sprint/status change; new routes/pages/components/APIs; new docs; project structure change. |
| **INDEX.md** | New or renamed code paths (apps, packages, routes, services, components); new or renamed docs; new “primary file” or doc purpose. |
| **docs/architecture.md** | New pages/components/services/sockets; schema or data-flow changes; diagram or deployment changes. |
| **docs/data-glossary.md** | Prisma schema or game data model changes; new/updated enums, models, fields, or conventions. |

Use the **implementation/summary document** as the single source of truth; only change docs where the summary justifies it.
