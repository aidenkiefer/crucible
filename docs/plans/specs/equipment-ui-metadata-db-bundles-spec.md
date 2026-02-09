# Spec: Equipment UI Metadata — DB/Bundles as Source of Truth (Option 1)

**Purpose:** Define the authoritative design for equipment template UI metadata (display name, icon path, etc.) so that Admin UI edits persist reliably on Vercel and propagate via the published bundle system without requiring repo filesystem writes.

**Status:** Spec only. Implementation is done via tickets that reference this spec.

---

## Recommended skills (implementation only)

When implementing the tickets that reference this spec, use these 10 skills from `agents/skills/CATALOG.md`. Do **not** use skills for code review, testing, verification, QA, or Git (e.g. no code-review, test, verify, commit, PR workflows).

| Skill | Use for |
|-------|--------|
| `executing-plans` | Running through the written implementation plan and ticket steps with checkpoints. |
| `writing-plans` | Aligning with spec/requirements before touching code; planning multi-step changes. |
| `cc-skill-backend-patterns` | Backend and API: Node.js, Express, Next.js API routes, server-side patterns. |
| `api-patterns` | API design: response shapes, REST conventions, enrichment of `/api/equipment`. |
| `database-design` | Schema and data model: EquipmentTemplate.ui, Equipment–template relationship. |
| `prisma-expert` | Prisma: schema, queries, includes, and equipment/template operations. |
| `nextjs-best-practices` | Next.js App Router, server components, data fetching, route handlers. |
| `react-patterns` | React components: Admin UI forms, inventory UI, hooks, TypeScript. |
| `frontend-design` | UI quality: Admin UI and inventory screens, layout and clarity. |
| `documentation-templates` | Updating data-glossary, spec, and other docs (structure, API docs, comments). |

---

## 1. Scope

### In scope

- Equipment template UI metadata stored on `EquipmentTemplate.ui` (JSON) and included in published bundle export.
- Removing all filesystem side-effects from Admin UI when creating/updating equipment templates (no folder creation, no `manifest.json` writes).
- Resolving inventory icon and display name at runtime via server-side enrichment on `/api/equipment` (Strategy A).
- First-class UI metadata editing in Admin UI (display name, icon source, icon path).
- Validation: warn on save when UI metadata is incomplete; block publish when required UI fields are missing for templates that must be visible in inventory.
- Backwards compatibility: inventory UI shows emoji fallback when `iconUrl` is missing.

### Out of scope (for this spec)

- Phase 2: icon upload to Supabase Storage (future ticket).
- Changing combat or game-server template loading; bundle loader continues to read the same export shape, with `ui` added.
- Reworking existing per-item manifest files under `public/assets/items/**`; they may remain as static assets or be deprecated later; no code shall depend on reading them at runtime.

---

## 2. Design intent

- **Single source of truth:** Equipment template (DB row) is the canonical data for all template metadata, including UI. Published bundle is the canonical runtime artifact. Repo filesystem is not a source of truth for template UI metadata.
- **No runtime repo writes:** Admin UI must work on Vercel where the filesystem is read-only. No creating folders or writing `manifest.json` as part of template save.
- **Simple consumption:** Inventory and other UIs receive `displayName` and `iconUrl` (and optional `rarityFrameKey`) on each equipment item from the API; no client-side manifest fetches or path logic.
- **Future-friendly:** `ui.icon.source` (e.g. `LOCAL_PUBLIC` | `SUPABASE_STORAGE`) and `ui.icon.path` allow later icon upload to storage without changing the resolution contract (server still returns `iconUrl`).

---

## 3. Data model (constraints)

- **EquipmentTemplate.ui** (existing JSON column) must hold structured UI metadata. Recommended shape (tickets will formalize and validate):
  - `displayName` (string)
  - `shortName` (string, optional)
  - `description` (string, optional)
  - `icon`: `{ source: "LOCAL_PUBLIC" | "SUPABASE_STORAGE", path: string, variant?: string }`
  - `rarityFrameKey`, `sortOrder`, `tags` (optional)
- **Equipment** (instance) must map to a template via `templateId` (existing) so the API can join and attach `displayName` and `iconUrl`. Where `templateId` is null (e.g. legacy or starter gear), fallback to `name` and no icon or emoji.
- **Bundle export** must include `ui` for each equipment template (exporter already includes `et.ui`; validation and schema documentation are in scope).

---

## 4. Runtime consumption (Strategy A)

- **Server-side enrichment:** When serving `/api/equipment`, join each equipment instance to its template (by `templateId`). For each item, attach:
  - `displayName`: from `template.ui.displayName` or `template.name`
  - `iconUrl`: resolved from `template.ui.icon.source` and `template.ui.icon.path` (LOCAL_PUBLIC → path as-is or prefixed; SUPABASE_STORAGE → public URL or signed URL from storage key)
- **Client:** Renders `iconUrl` when present; otherwise fallback to emoji. No fetches to `/assets/items/**/manifest.json`.

---

## 5. Validation rules

- **Record-level (save):** Warn when `ui.displayName` is missing or `ui.icon.path` is missing; allow save for drafts. Equipment template create/update APIs return `uiWarnings` array when UI metadata is incomplete.
- **Bundle-level (publish):** Block publish if any template in the bundle lacks `ui.displayName` or valid `ui.icon` (source + path). All templates in bundle are validated (no status-based exclusions in current implementation).
- **Path whitelist:** For LOCAL_PUBLIC, path must start with `/assets/`. For SUPABASE_STORAGE, no prefix validation (future).
- **Validation implementation:** See `validateBundle()` and `validateEquipmentUIMetadata()` in `apps/web/lib/admin/validator.ts`.

---

## 6. Asset strategy (Phase 1)

- Icons live in repo under `apps/web/public/assets/items/**` (existing structure).
- Templates store `ui.icon.source = "LOCAL_PUBLIC"` and `ui.icon.path` as a path like `/assets/items/commons/iron-sword/icon.png`.
- No manifest files required for resolution; server resolves `iconUrl` from `ui.icon` only.

---

## 7. Success criteria (for tickets)

- Admin UI never attempts to create asset folders or write `manifest.json` when creating/updating equipment templates.
- All equipment template create/update flows only touch the database.
- Bundle export includes `ui` for each equipment template; published bundle is self-contained for UI rendering.
- `/api/equipment` returns `displayName` and `iconUrl` (when resolvable) for each item; inventory UI renders icons with emoji fallback.
- Validation warns on save and blocks publish when UI metadata is incomplete per rules above.
- Existing gameplay and Admin UI flows continue to work; no regression on Vercel deploy.

---

## 8. Backfill Script Usage

To backfill UI metadata on existing EquipmentTemplate rows:

```bash
# From monorepo root
pnpm --filter @gladiator/database backfill-ui
```

**What it does:**
- Fetches all equipment templates from database
- For each template without complete ui metadata:
  - Sets `ui.displayName` from `template.name`
  - Sets `ui.icon.source` to `LOCAL_PUBLIC`
  - Sets `ui.icon.path` to `/assets/items/{rarity}/{key}/icon.png`
- Skips templates that already have complete ui metadata (idempotent)

**Output:** Reports updated and skipped counts.

---

## 9. Reference docs (for implementers)

| Document | Use |
|----------|-----|
| docs/plans/implementation/2026-02-09-template.md | Original proposal and migration steps. |
| docs/features/admin-ui.md | Admin UI architecture, §2.3 equipment assets. |
| docs/features/equipment.md | Template vs instance, authoring workflow. |
| docs/data-glossary.md | Schema, enums, JSON conventions. |
| CLAUDE.md | Project overview, conventions. |
| claude-workflow-opt.md | Spec vs ticket, limits, done criteria. |


  ⚠️ 6 Caveats Documented:

  - Null templateId fallback strategy
  - Icon path convention (flat vs folder structure)
  - Validation schema coordination between tickets 03 & 09
  - Admin UI UX improvement (structured form in ticket 04)
  - Starter gear templateId verification
  - Vercel deployment (no more write warnings after ticket 02)
