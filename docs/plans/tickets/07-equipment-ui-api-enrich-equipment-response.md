# Ticket 07: Enrich /api/equipment with displayName and iconUrl

## Task

Update GET /api/equipment to include displayName and iconUrl per item from template ui. Join template. Resolve iconUrl from ui.icon; omit when missing. Keep existing fields; add only displayName and iconUrl.

## Mandatory skill usage

Read SKILLS_GUIDE.md. Use backend-dev-guidelines, api-patterns, database-design.

## Reference docs (read-only)

- docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md
- docs/features/equipment.md

## Allowed files (ONLY these)

- apps/web/app/api/equipment/route.ts

## Hard limits

No schema or Prisma client change. LOCAL_PUBLIC path as-is for iconUrl.

## Instructions

1. Add include template to findMany.
2. Map each item: add displayName from template.ui or template.name; add iconUrl from template.ui.icon when source LOCAL_PUBLIC and path set.
3. Return enriched list.

## Done criteria

- GET returns displayName and iconUrl when template and ui.icon exist. Missing template or ui leaves iconUrl null/omitted. Only Allowed File modified.

---

## Implementation summary

- **Completed:** Ticket 07 — Enrich equipment API with displayName and iconUrl
- **Changes made:**
  1. Added template join to equipment query (include template with name and ui fields)
  2. Added server-side enrichment logic to map each equipment item:
     - displayName: resolved from template.ui.displayName || template.name || item.name
     - iconUrl: resolved from template.ui.icon when source is LOCAL_PUBLIC and path is set
  3. Return enriched equipment list with displayName and iconUrl (when available)
  4. Null template or missing ui.icon results in no iconUrl field (frontend falls back to emoji)
- **Key result:** Equipment API now returns UI-ready data; frontend receives displayName and iconUrl without additional fetches
- **Files modified:** apps/web/app/api/equipment/route.ts
- **Skills used:** backend-dev-guidelines, api-patterns, database-design
- **Result:** Strategy A (server-side enrichment) implemented; inventory UI can render icons
