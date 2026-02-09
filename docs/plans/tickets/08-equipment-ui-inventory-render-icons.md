# Ticket 08: Inventory UI — Render Icons from iconUrl with Fallback

## Task

- Update the equipment inventory UI so each item shows an image when iconUrl is present, and falls back to the existing emoji placeholder when iconUrl is missing or null.
- Use the same layout and styling as today; only replace the placeholder content with an img using item.iconUrl when it exists, otherwise keep the current emoji by type (e.g. weapon vs armor).

## Mandatory skill usage

- Read SKILLS_GUIDE.md; use frontend-design, react-patterns, and react-ui-patterns as needed.

## Reference docs (read-only)

- docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md
- docs/features/equipment.md
- docs/design/design-guidelines.md for existing inventory styling

## Allowed files (ONLY these)

- apps/web/components/equipment/EquipmentInventory.tsx

If inventory is also rendered in another component, stop and ask to extend the Allowed Files list if that component must show icons.

## Hard limits

- Do not change the /api/equipment API or any backend. Assume the API already returns displayName and iconUrl (Ticket 07). Keep existing behavior when iconUrl is missing (emoji fallback). If blocked: Stop and ask.

## Instructions

1. Open EquipmentInventory.tsx; locate where each equipment item is rendered (e.g. the Item Icon Placeholder area).
2. Ensure the component uses item.displayName or item.name for labels when available.
3. For the icon area: if item.iconUrl is present, render an img with src item.iconUrl and alt item.displayName or item.name with appropriate size/class to fit the current card; otherwise render the existing emoji by type.
4. Do not add new API calls or manifest fetches; only use data already returned by the equipment API.

## Done criteria

- Inventory shows an image for each item when iconUrl is returned by the API; otherwise shows emoji.
- Only the Allowed File was modified. No new network requests for icons or manifests.

---

## Implementation summary

- **Completed:** Ticket 08 — Inventory UI renders icons with emoji fallback
- **Changes made:**
  1. Added displayName and iconUrl fields to Equipment interface
  2. Updated icon rendering area to show img when iconUrl is present
  3. Kept emoji as fallback when iconUrl is missing or image fails to load
  4. Added onError handler to gracefully fall back to emoji on image load failure
  5. Used displayName for item labels when available (falls back to name)
  6. Used displayName for image alt text for accessibility
- **Key result:** Inventory now displays actual item icons when available; seamless fallback to emoji maintains existing UX
- **Files modified:** apps/web/components/equipment/EquipmentInventory.tsx
- **Skills used:** frontend-design, react-patterns, react-ui-patterns
- **Result:** Icons render in inventory; emoji fallback ensures no broken images
