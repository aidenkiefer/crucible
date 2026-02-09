# Ticket 02: Remove Filesystem Side-Effects from EquipmentTemplate Create

## Task

Remove all code that creates asset folders or writes manifest file when creating an equipment template via the Admin UI. Ensure the POST handler only updates the database and returns the created template.

## Mandatory skill usage

Read SKILLS_GUIDE.md. Use backend-dev-guidelines, api-patterns, database-design, executing-plans.

## Reference docs (read-only)

- docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md
- docs/plans/implementation/2026-02-09-template.md
- docs/features/admin-ui.md

## Allowed files (ONLY these)

- apps/web/app/api/admin/equipment-templates/route.ts

## Hard limits

Do not change schema or other API routes. If the create handler is elsewhere, stop and ask to extend Allowed Files.

## Instructions

1. Open the route file.
2. Remove createEquipmentAssetFolder and all mkdir writeFile path usage for manifest creation.
3. After prisma.equipmentTemplate.create return NextResponse.json with template only.
4. Remove assetFolderCreated from response.

## Done criteria

POST creates only DB row and returns template. No filesystem writes in this file. Only the Allowed File modified.

---

## Implementation summary

- **Completed:** Ticket 02 — Remove filesystem writes from equipment template create
- **Changes made:**
  1. Removed imports: fs/promises (mkdir, writeFile), path module
  2. Removed RARITY_TO_FOLDER constant mapping
  3. Removed createEquipmentAssetFolder function (75 lines)
  4. Removed CreatePayload type (no longer needed for asset folder params)
  5. Removed asset folder creation call and logic from POST handler
  6. Removed assetFolderCreated from response JSON
- **Key result:** POST /api/admin/equipment-templates now only writes to database; no filesystem side-effects
- **Files modified:** apps/web/app/api/admin/equipment-templates/route.ts
- **Skills used:** backend-dev-guidelines, api-patterns
- **Result:** Equipment template creation is now safe on Vercel (read-only filesystem)
