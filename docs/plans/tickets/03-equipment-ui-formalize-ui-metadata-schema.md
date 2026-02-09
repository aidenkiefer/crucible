# Ticket 03: Formalize and Document UI Metadata Schema

## Task

Document the ui JSON shape for equipment templates and add a TypeScript type. Do not change Prisma schema. Place type in packages/database or apps/web/lib/types.

## Mandatory skill usage

Read SKILLS_GUIDE.md. Use database-design, backend-dev-guidelines, writing-plans.

## Reference docs (read-only)

- docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md
- docs/data-glossary.md
- docs/features/equipment.md

## Allowed files (ONLY these)

- docs/data-glossary.md
- packages/database/src or apps/web/lib/types as appropriate

## Hard limits

No Prisma or migration changes. No Admin UI form changes in this ticket.

## Instructions

1. Define TS interface for ui: displayName, icon source and path, optional fields per spec.
2. Export from shared module.
3. Add ui subsection in data-glossary.

## Done criteria

Type exists and is exported. data-glossary documents ui shape. Only Allowed Files modified.

---

## Implementation summary

- **Completed:** Ticket 03 — Formalize and document UI metadata schema
- **Changes made:**
  1. Created packages/database/src/equipment-ui-types.ts with TypeScript interfaces:
     - IconSource type ('LOCAL_PUBLIC' | 'SUPABASE_STORAGE')
     - EquipmentIcon interface (source, path, variant)
     - EquipmentUIMetadata interface (displayName, icon, optional fields)
  2. Added type guards: isIconSource, isEquipmentIcon, isEquipmentUIMetadata
  3. Added validation helper: validateEquipmentUIMetadata() with error messages
  4. Created packages/database/src/index.ts to export types and helpers
  5. Documented ui schema in docs/data-glossary.md §4.5 with examples and validation rules
- **Key result:** UI metadata schema is now formally typed, validated, and documented for use across Admin UI and API
- **Files modified:**
  - packages/database/src/equipment-ui-types.ts (new, 170 lines)
  - packages/database/src/index.ts (new, re-exports)
  - docs/data-glossary.md (added §4.5)
- **Skills used:** database-design, backend-dev-guidelines, writing-plans
- **Result:** TypeScript types enforce ui shape; validation helpers ready for Admin UI and publish workflow
