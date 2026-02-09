# Ticket 09: Validation — UI Metadata Rules (Warn on Save, Block Publish)

## Task

- Add validation for equipment template UI metadata:
  - **On save (record-level):** Warn when `ui.displayName` is missing or `ui.icon.path` is missing (e.g. return warnings in the API response or show inline in Admin UI). Allow save (draft).
  - **On publish (bundle-level):** When validating a bundle before publish, fail validation if any equipment template in the bundle that should be visible in inventory is missing required UI metadata (e.g. `ui.displayName` or valid `ui.icon.source` + `ui.icon.path`). Define “visible in inventory” as: template is part of the bundle and (e.g.) status is PUBLISHED or a tag/flag indicates it; if the project has no such flag, apply to all templates in the bundle for simplicity.
- Implement in the existing validation paths (e.g. validate-bundle endpoint and/or equipment template update validation). Do not add a new validation framework; plug into current flow.

## Mandatory skill usage

- Read **SKILLS_GUIDE.md**; use **backend-dev-guidelines**, **api-patterns**, and **database-design** as needed.

## Reference docs (read-only)

- docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md (§5 Validation rules)
- docs/features/admin-ui.md §2.4 Validation, §6 Bundle workflow

## Allowed files (ONLY these)

- apps/web/app/api/admin/equipment-templates/route.ts (optional: return warnings on POST)
- apps/web/app/api/admin/equipment-templates/[id]/route.ts (optional: return warnings on PUT)
- apps/web/app/api/admin/bundles/validate/route.ts (or wherever bundle validation runs)
- apps/web/lib/admin/ (if validation helpers live here)

> If bundle validation is in the game server or another app, stop and ask to extend the Allowed Files list.

## Hard limits

- Do not change the database schema. Do not block save for drafts; only warn.
- Publish must be blocked when validation fails (existing behavior); add UI metadata checks to that failure condition.
- **If blocked:** Stop and ask.

## Instructions

1. Locate where bundle validation runs before publish (e.g. validate-bundle API or publish flow). Add a check: for each equipment template in the bundle, if it is considered “visible in inventory” (per spec), require `ui.displayName` and `ui.icon.source` + `ui.icon.path`; if missing, add an error and fail validation.
2. Optionally: in equipment template create/update API, compute a list of warnings (e.g. “Missing displayName”, “Missing icon path”) and return in the response so the Admin UI can show them inline. Admin UI can then display warnings without blocking save.
3. Document the rule in one sentence in the spec or data-glossary (e.g. “Publish blocked if any template in bundle lacks ui.displayName or ui.icon.path.”).

## Done criteria

- Publish validation fails when a template in the bundle lacks required UI metadata (per rule above).
- Optionally, save returns warnings for missing UI metadata; save is still allowed for drafts.
- Only Allowed Files were modified.

---

## Implementation summary

- **Completed:** Ticket 09 — UI metadata validation (warn on save, block on publish)
- **Changes made:**
  1. Added UI metadata validation to validateBundle() in validator.ts:
     - Checks for ui.displayName (required)
     - Checks for ui.icon.source (must be LOCAL_PUBLIC or SUPABASE_STORAGE)
     - Checks for ui.icon.path (required)
     - Validates LOCAL_PUBLIC paths start with /assets/
     - All validation failures are severity 'error' (block publish)
  2. Added validateEquipmentUIMetadata() helper for record-level validation:
     - Returns warnings array (not errors)
     - Same checks as bundle validation
  3. Updated equipment template POST route to return uiWarnings on create
  4. Updated equipment template PUT route to return uiWarnings on update
  5. Updated spec §5 to document validation implementation
- **Key result:** Publish is blocked when UI metadata is incomplete; save returns warnings for drafts
- **Files modified:**
  - apps/web/lib/admin/validator.ts (added UI validation logic)
  - apps/web/app/api/admin/equipment-templates/route.ts (added uiWarnings)
  - apps/web/app/api/admin/equipment-templates/[id]/route.ts (added uiWarnings)
  - docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md (updated §5)
- **Skills used:** backend-dev-guidelines, api-patterns, database-design
- **Result:** Validation enforces UI metadata completeness; admins warned on save, publish blocked when incomplete
