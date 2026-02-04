# Crucible — Asset Design & Generation Guide (MVP)

This document defines a cohesive, repeatable workflow for designing and generating visual assets for Crucible using PixelLab (via MCP), targeting a browser-based game built with React (TSX/JSX) and Three.js. It standardizes sprite sizes, styles, prompts, naming, and the generation order to ensure consistency, performance, and rapid iteration for the MVP.

---

## Goals

- Consistent, on-brand assets (Roman gladiator, gritty, retro 16-bit energy)
- Fast iteration suitable for MVP and live tuning
- Clear separation between data (templates) and visuals (assets)
- Efficient Three.js rendering (client-side animation, minimal server load)

---

## Visual Direction

### Core Aesthetic
- Roman / Gladiator / Coliseum
- Battle-hardened, iron, stone, sand, bronze
- Gritty but readable, not grimdark or cartoonish
- Retro 16-bit inspiration without literal pixel nostalgia overload

### Color Philosophy
- Dark, moody bases
- Bright accent pops for action and readability
- Limited palettes per character/equipment kit

Recommended base palette for MVP:
- Blood & Bronze
  - Charcoal Black, Dark Stone
  - Blood Red (damage), Bronze Gold (rarity), Sand (neutral)
Use additional accents sparingly (cyan for arcana, purple for faith).

---

## Sprite Standards (MVP)

### Perspective & Directions
- View: Low top-down (arena-friendly, readable)
- Directions: 4 directions (South, East, West, North)
- Upgrade path: 8 directions later if needed

### Sizes
- Characters: 48 px canvas
- Arena tiles: 16×16 (optionally 32×32 later)
- Inventory icons: 16×16 or 24×24

### Animation Set (MVP)
Required:
- idle
- walk
- attack_primary
- dodge_roll
- hit_react
- death

Optional:
- cast (only if spells are in MVP)

---

## Asset Generation Order (Critical)

Always generate in this order to avoid scale, alignment, and animation issues:

1) Base Gladiators (no gear detail)
   - Establish canonical body proportions and silhouette
   - Light clothing only (cloth, sandals, belts)
   - These become reusable body models

2) Equipped Gladiators (gear-focused)
   - Generate versions wearing specific weapons/armor
   - This defines authoritative visual scale and placement for equipment

3) Equipment Inventory Icons
   - Generate isolated, simplified icons based on equipped visuals
   - Centered, transparent background, readable at small sizes

Never generate equipment icons first and try to fit them onto characters later.

---

## PixelLab Generation Workflow (MCP)

PixelLab MCP tools are non-blocking and allow queued generation.

### Character Creation
- Use proportions preset: heroic
- Size: 48
- Directions: 4
- Outline: single black outline
- Shading: basic
- Detail: medium

Queue all animations immediately after creating the character.

### Tilesets
- Use top-down tileset generation
- Chain tilesets using base tile IDs to maintain continuity
- Focus on coliseum materials: sand, stone, blood-stained variants

---

## Prompt Templates

### Base Gladiator Prompt
Roman gladiator base body, heroic proportions, light cloth and leather, no heavy armor, gritty coliseum fighter, retro 16-bit pixel art, strong silhouette, readable at 48px, limited palette, single black outline, moody shadows, transparent background

### Equipped Gladiator Prompt
Roman gladiator wearing iron longsword and leather chest armor, heroic proportions, battle-worn bronze and iron materials, gritty coliseum fighter, retro 16-bit pixel art, strong silhouette, readable at 48px, high contrast, single black outline, bright accent color, transparent background

### Inventory Icon Prompt
Inventory icon of the iron longsword worn by the gladiator above, pixel art, isolated, centered, simplified shape, high contrast, readable at 16px, transparent background

---

## Naming & Organization

### Keys
- Characters: glad_murmillo_01, glad_thraex_01
- Animations: idle, walk, atk_slash, dodge_roll
- Equipment: iron_longsword, leather_armor

### Folder Layout
apps/web/public/assets/
- sprites/characters/{character_key}/
  - directions/
  - animations/{animation_key}/
- sprites/icons/equipment/{equipment_key}.png
- tilesets/arena_sandstone_v1/

### Metadata
- Keep sprite and animation references in JSON/TS manifests
- Runtime references assets by key, not file path

---

## Three.js Rendering Guidelines

- Use NearestFilter for textures
- Disable or carefully manage mipmaps
- Snap sprite positions to a grid for pixel clarity
- Prefer spritesheets/atlases to reduce draw calls
- All animation runs client-side

---

## MVP Scope Recommendation

For the demo:
- 3 base gladiators (one per class archetype)
- 1 equipped variant per gladiator (starter kit)
- Inventory icons only for starter equipment
- 1–2 arena tilesets

This is sufficient to demonstrate:
- Combat readability
- Inventory/equipment flow
- Visual identity

---

## Data Integration

- Templates (EquipmentTemplate, ActionTemplate) live in DB
- Visual references stored as keys (iconKey, animKey, vfxKey)
- Supabase Storage holds exported bundles
- Runtime loads active bundle JSON and resolves asset keys locally

---

## Future Extensions

- Rarity skins and recolors via palette swaps
- 8-direction animations
- Layered equipment rendering (body + armor layers)
- Spell VFX spritesheets

---

## Summary

- Generate gladiators first, equipment second, icons last
- Lock sprite standards early
- Treat PixelLab as a content build system
- Keep runtime fast and deterministic
- Optimize for iteration, not perfection, in MVP

This document is the single source of truth for all visual asset generation during early development.
