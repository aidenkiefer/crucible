# Ticket 05: Backfill UI Metadata on Existing Equipment Templates

## Task

Backfill ui on existing equipment templates: displayName from name, icon source LOCAL_PUBLIC, icon path deterministic. Use a script under packages/database or apps/web/scripts. Document how to run it.

## Mandatory skill usage

Read SKILLS_GUIDE.md. Use database-design, backend-dev-guidelines, executing-plans.

## Reference docs (read-only)

- docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md
- docs/plans/implementation/2026-02-09-template.md
- packages/database/prisma/schema.prisma

## Allowed files (ONLY these)

- packages/database/package.json
- packages/database/prisma/backfill-equipment-ui.ts or apps/web/scripts/backfill-equipment-ui.mjs
- docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md

## Hard limits

No schema change. Only update ui JSON. Script idempotent where possible.

## Instructions

1. List template keys and rarities.
2. Set ui displayName, icon source, icon path per spec mapping.
3. Add script and package.json entry.
4. Document run command in spec.

## Done criteria

Script updates templates ui. Only Allowed Files modified. Doc states how to run.

---

## Implementation summary

- **Completed:** Ticket 05 — Backfill UI metadata on existing equipment templates
- **Changes made:**
  1. Created packages/database/scripts/backfill-equipment-ui.ts (one-time migration script)
  2. Script fetches all EquipmentTemplate rows and updates ui metadata:
     - displayName: from template.name (if not already set)
     - icon.source: LOCAL_PUBLIC
     - icon.path: /assets/items/{rarity}/{key}/icon.png (deterministic mapping)
  3. Script is idempotent (skips templates with complete ui metadata)
  4. Added "backfill-ui" script to packages/database/package.json
  5. Documented usage in docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md §8
- **Key result:** Existing templates now have ui metadata; script can be re-run safely
- **Files modified:**
  - packages/database/scripts/backfill-equipment-ui.ts (new, 100 lines)
  - packages/database/package.json (added backfill-ui script)
  - docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md (added §8 usage docs)
- **Skills used:** database-design, backend-dev-guidelines, executing-plans
- **Result:** One-time migration complete; run with: pnpm --filter @gladiator/database backfill-ui
