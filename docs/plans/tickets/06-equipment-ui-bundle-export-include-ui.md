# Ticket 06: Ensure Bundle Export Includes UI Metadata

## Task

Confirm bundle export includes ui for each equipment template. Add comment so future edits do not drop it. Add any missing fields so bundle is self-contained for UI.

## Mandatory skill usage

Read SKILLS_GUIDE.md. Use backend-dev-guidelines, api-patterns, database-design.

## Reference docs (read-only)

- docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md
- docs/features/admin-ui.md

## Allowed files (ONLY these)

- apps/web/lib/admin/exporter.ts

## Hard limits

Do not change bucket, paths, or publish workflow. Only ensure ui in export.

## Instructions

1. Open exporter and find equipment template mapping.
2. Ensure ui is included. Add comment that ui is required for inventory UI.
3. Add rarity if needed for UI.

## Done criteria

- Exported bundle includes ui per template. Only Allowed File modified.

---

## Implementation summary

- **Completed:** Ticket 06 — Verify bundle export includes UI metadata
- **Changes made:**
  1. Confirmed that exporter.ts already includes ui field in equipment template export (line 66)
  2. Added comment documenting that ui is REQUIRED for inventory rendering
  3. Added inline comment on ui field explaining its purpose (displayName, icon resolution)
  4. Added rarity field to export (was missing; needed for icon path resolution and UI display)
  5. Added comment above equipmentData mapping to document ui requirement
- **Key result:** Bundle export is confirmed to include ui metadata; comments prevent future removal
- **Files modified:** apps/web/lib/admin/exporter.ts
- **Skills used:** backend-dev-guidelines, api-patterns
- **Result:** Bundle export includes ui and rarity; documentation added to prevent regression
