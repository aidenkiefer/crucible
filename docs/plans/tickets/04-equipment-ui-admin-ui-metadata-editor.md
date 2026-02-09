# Ticket 04: Admin UI — First-Class UI Metadata Editor

## Task

- Add or expand the UI metadata section on the equipment template edit page (`/admin/equipment-templates/[id]` and optionally create flow) so admins can set: **Display Name** (text input; maps to `ui.displayName`), **Icon Source** (selector: LOCAL_PUBLIC | SUPABASE_STORAGE), **Icon Path** (text input; for LOCAL_PUBLIC must start with `/assets/`, for SUPABASE_STORAGE use storage key prefix).
- Ensure the form reads and writes the `ui` JSON field on the template (existing field).
- Optionally show a simple "health" hint when icon path or display name is missing (e.g. "Missing icon path").

## Mandatory skill usage

- Read **SKILLS_GUIDE.md**; use **frontend-design**, **react-patterns**, **nextjs-best-practices**, and **api-patterns** as needed.

## Reference docs (read-only)

- docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md
- docs/features/admin-ui.md §3–4
- docs/design/design-guidelines.md

## Allowed files (ONLY these)

- apps/web/app/admin/equipment-templates/[id]/page.tsx
- apps/web/app/admin/equipment-templates/new/page.tsx (if UI metadata is also set on create)

> If the editor is split across more components, stop and ask to extend the Allowed Files list.

## Hard limits

- Do not change API route request/response shapes beyond what the backend already accepts for `ui`.
- Do not add new API routes; use existing GET/PUT for equipment templates.
- **If blocked:** Stop and ask.

## Instructions

1. Locate the equipment template edit (and optionally new) page(s).
2. Add a "UI metadata" section with: Display Name, Icon Source (dropdown), Icon Path (input). Validate path prefix in the frontend when possible (e.g. LOCAL_PUBLIC → path starts with `/assets/`).
3. On load, populate from `template.ui`; on save, include the updated `ui` object in the PUT (or POST) body.
4. Optionally display a warning when `displayName` or `icon.path` is missing.

## Done criteria

- Admins can set and save `ui.displayName`, `ui.icon.source`, and `ui.icon.path` from the equipment template editor.
- Only Allowed Files were modified.
- Existing template load/save still works.

---

## Implementation summary

- **Completed:** Ticket 04 — Admin UI first-class metadata editor
- **Changes made:**
  1. Replaced freeform JSON editor with structured UI metadata section in both edit and create pages
  2. Added Display Name text input (maps to ui.displayName, falls back to template name)
  3. Added Icon Source dropdown selector (LOCAL_PUBLIC | SUPABASE_STORAGE)
  4. Added Icon Path text input with contextual placeholder and helper text
  5. Added health warning banner when displayName or icon.path is missing
  6. Kept JSON editors for baseStatMods, scaling, and rarityRules
  7. Removed old "UI Metadata" JSON editor in favor of structured fields
- **Key result:** Admins can now set UI metadata through user-friendly form fields instead of raw JSON; warnings alert when required fields are missing
- **Files modified:**
  - apps/web/app/admin/equipment-templates/[id]/page.tsx
  - apps/web/app/admin/equipment-templates/new/page.tsx
- **Skills used:** frontend-design, react-patterns, nextjs-best-practices
- **Result:** Improved Admin UI UX; ui metadata is now first-class and validated in the form
