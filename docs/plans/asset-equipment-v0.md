# Equipment Asset Generation Plan v0

**Goal:** Generate visual assets for starter equipment (weapons and armor) using PixelLab map object tool.

**Strategy:** Following asset-gen-guide.md workflow - generate equipment as isolated, centered objects with transparent backgrounds for inventory icons and UI display.

**Scope:** Minimal starter kit for Duelist class demo.

---

## Equipment List (Starter Kit)

Based on docs/features/equipment.md and Sprint 2 combat implementation:

### Weapons (MAIN_HAND)
1. **Iron Longsword** - Primary melee weapon (used in Sprint 2 combat)
2. **Wooden Training Sword** - Starter weapon alternative

### Armor (CHEST)
3. **Leather Chest Armor** - Basic protection
4. **Cloth Tunic** - Starter armor alternative

### Shield (OFF_HAND) - Optional
5. **Wooden Round Shield** - Defensive option

---

## Generation Strategy

### Two Approaches Available:

#### Approach A: Standalone Icons (Recommended for MVP)
- Use `create_map_object` in **basic mode** (no background_image)
- Generate isolated, centered equipment icons
- Fast, simple, ready for inventory UI immediately
- **Size:** 32x32 or 48x48 (larger than inventory 16x16 for quality)
- Downscale to 16x16 or 24x24 for actual inventory UI

#### Approach B: Style-Matched Icons (For Visual Consistency)
- Use `create_map_object` with **style matching mode**
- Provide the Duelist character sprite as background_image for style reference
- Equipment will match the character's art style perfectly
- More complex workflow but better visual cohesion

**Recommendation:** Start with Approach A for speed, can regenerate with Approach B later if needed.

---

## Equipment Asset Specifications

### Visual Style (Consistent with Duelist)
- **View:** High top-down (good for equipment visibility)
- **Outline:** Single color outline
- **Shading:** Medium shading
- **Detail:** Medium detail
- **Palette:** Blood & Bronze aesthetic
  - Iron/steel: dark gray with metallic highlights
  - Leather: brown/tan weathered tones
  - Wood: warm brown, worn
  - Bronze accents where appropriate

### Canvas Sizes
- **Weapons:** 48x48 or 64x64 (swords are long)
- **Armor:** 48x48 (chest pieces are square-ish)
- **Shields:** 48x48 (round or rectangular)

### Downsizing for UI
After generation, downscale to:
- **Inventory icons:** 16x16 or 24x24
- **Equipment preview:** 32x32
- **Keep originals** for high-quality display

---

## Generation Order

### Priority 1: Core Combat Equipment
1. Iron Longsword (primary weapon)
2. Leather Chest Armor (primary armor)

### Priority 2: Starter Alternatives
3. Wooden Training Sword
4. Cloth Tunic

### Priority 3: Optional Additions
5. Wooden Round Shield

---

## Step-by-Step: Generate Iron Longsword

**Tool:** `mcp__pixellab__create_map_object`

### Parameters

```json
{
  "description": "Iron longsword weapon, battle-worn medieval blade, straight crossguard, leather-wrapped grip, dark iron with metallic highlights, weathered and scarred from combat, gritty Roman gladiator aesthetic, retro pixel art style, centered on transparent background, high contrast readable silhouette",
  "width": 64,
  "height": 64,
  "view": "high top-down",
  "outline": "single color outline",
  "shading": "medium shading",
  "detail": "medium detail"
}
```

### Expected Output
- **object_id:** Save for tracking
- **Processing time:** ~15-30 seconds
- **Image:** 64x64 PNG, transparent background, centered sword

### Verification
- [ ] Sword is centered and clearly visible
- [ ] Iron material reads as metallic (highlights, dark base)
- [ ] Battle-worn details visible (nicks, scratches)
- [ ] Outline is crisp and readable
- [ ] Matches Blood & Bronze color palette
- [ ] Silhouette is clear even at small size

### File Organization
```
apps/web/public/assets/sprites/equipment/weapons/
  └── iron_longsword/
      ├── original_64x64.png
      ├── icon_32x32.png
      ├── icon_24x24.png
      └── icon_16x16.png
```

---

## Step-by-Step: Generate Leather Chest Armor

**Tool:** `mcp__pixellab__create_map_object`

### Parameters

```json
{
  "description": "Leather chest armor, Roman gladiator cuirass, hardened brown leather with bronze studs and buckles, worn and weathered from battle, shoulder straps visible, gritty realistic texture, retro pixel art style, centered on transparent background, clear readable shape",
  "width": 48,
  "height": 48,
  "view": "high top-down",
  "outline": "single color outline",
  "shading": "medium shading",
  "detail": "medium detail"
}
```

### Expected Output
- **object_id:** Save for tracking
- **Processing time:** ~15-30 seconds
- **Image:** 48x48 PNG, transparent background, centered armor

### Verification
- [ ] Armor is centered and torso-shaped
- [ ] Leather material reads as worn/weathered
- [ ] Bronze studs/buckles visible as accents
- [ ] Outline is clear
- [ ] Matches character aesthetic
- [ ] Recognizable as chest armor at small size

### File Organization
```
apps/web/public/assets/sprites/equipment/armor/
  └── leather_chest/
      ├── original_48x48.png
      ├── icon_32x32.png
      ├── icon_24x24.png
      └── icon_16x16.png
```

---

## Step-by-Step: Generate Wooden Training Sword

**Tool:** `mcp__pixellab__create_map_object`

### Parameters

```json
{
  "description": "Wooden training sword, practice blade made of hardwood, simple crossguard, grip wrapped with cloth, worn from use, lighter brown wood tone, retro pixel art style, centered on transparent background, clear silhouette",
  "width": 64,
  "height": 64,
  "view": "high top-down",
  "outline": "single color outline",
  "shading": "medium shading",
  "detail": "medium detail"
}
```

---

## Step-by-Step: Generate Cloth Tunic

**Tool:** `mcp__pixellab__create_map_object`

### Parameters

```json
{
  "description": "Simple cloth tunic, basic linen or cotton shirt, neutral tan or off-white color, worn and dusty, minimal decoration, Roman style with belt tie, retro pixel art style, centered on transparent background, simple readable shape",
  "width": 48,
  "height": 48,
  "view": "high top-down",
  "outline": "single color outline",
  "shading": "medium shading",
  "detail": "medium detail"
}
```

---

## Step-by-Step: Generate Wooden Round Shield

**Tool:** `mcp__pixellab__create_map_object`

### Parameters

```json
{
  "description": "Wooden round shield, circular design with iron boss in center, hardwood planks bound with leather straps, battle-scarred and dented, Roman gladiator style, retro pixel art, centered on transparent background, clear circular silhouette",
  "width": 48,
  "height": 48,
  "view": "high top-down",
  "outline": "single color outline",
  "shading": "medium shading",
  "detail": "medium detail"
}
```

---

## Downscaling Workflow

After generation, create multiple sizes for different UI contexts:

### Using ImageMagick (if available)
```bash
# 64x64 → 32x32
convert original_64x64.png -resize 32x32 -filter Point icon_32x32.png

# 32x32 → 24x24
convert icon_32x32.png -resize 24x24 -filter Point icon_24x24.png

# 24x24 → 16x16
convert icon_24x24.png -resize 16x16 -filter Point icon_16x16.png
```

### Using Python/Pillow
```python
from PIL import Image

img = Image.open('original_64x64.png')
img.resize((32, 32), Image.NEAREST).save('icon_32x32.png')
img.resize((24, 24), Image.NEAREST).save('icon_24x24.png')
img.resize((16, 16), Image.NEAREST).save('icon_16x16.png')
```

**Important:** Use **NEAREST** (Point) filter for pixel art to preserve sharp edges.

---

## Equipment Manifest

After generation, create manifest for each equipment piece:

### Example: iron_longsword/manifest.json

```json
{
  "equipmentKey": "iron_longsword",
  "equipmentType": "WEAPON",
  "slot": "MAIN_HAND",
  "displayName": "Iron Longsword",
  "description": "A battle-worn iron blade. Standard issue for arena combatants.",
  "rarity": "COMMON",
  "basePath": "/assets/sprites/equipment/weapons/iron_longsword",
  "icons": {
    "original": "original_64x64.png",
    "large": "icon_32x32.png",
    "medium": "icon_24x24.png",
    "small": "icon_16x16.png"
  },
  "metadata": {
    "canvasSize": 64,
    "generated": "2026-02-04",
    "pixelLabObjectId": "<object_id>",
    "prompt": "Iron longsword weapon, battle-worn medieval blade..."
  },
  "gameData": {
    "templateKey": "iron_longsword",
    "baseStatMods": {
      "strength": 2,
      "dexterity": 1
    },
    "grantedActions": ["sword_slash"]
  }
}
```

---

## Integration with Equipment System

### Database Template Mapping
Each generated equipment asset should map to an `EquipmentTemplate` in the database:

```typescript
// EquipmentTemplate example
{
  key: "iron_longsword",
  name: "Iron Longsword",
  description: "A battle-worn iron blade.",
  type: EquipmentType.WEAPON,
  slot: EquipmentSlot.MAIN_HAND,
  iconKey: "iron_longsword", // References asset manifest
  rarity: "COMMON",
  baseStatMods: { strength: 2, dexterity: 1 },
  // ... actions via EquipmentTemplateAction join
}
```

### Runtime Asset Loading
```typescript
// In inventory UI component
import ironSwordManifest from '@/public/assets/sprites/equipment/weapons/iron_longsword/manifest.json'

const iconPath = `/assets/sprites/equipment/weapons/iron_longsword/${ironSwordManifest.icons.small}`

<img src={iconPath} alt="Iron Longsword" className="w-4 h-4" />
```

---

## Testing Checklist

After generating all equipment assets:

### Visual Quality
- [ ] All equipment pieces are clearly identifiable
- [ ] Color palette matches Duelist character (Blood & Bronze)
- [ ] Outlines are crisp and readable
- [ ] Materials read correctly (iron, leather, wood)
- [ ] Battle-worn details visible but not cluttered

### Technical
- [ ] All PNGs have transparent backgrounds
- [ ] Objects are centered in canvas
- [ ] File sizes are reasonable (<50KB per asset)
- [ ] Multiple sizes generated (64, 32, 24, 16)
- [ ] Manifests created for each piece

### Integration
- [ ] Icons render correctly in inventory UI mock
- [ ] Downscaled versions maintain clarity
- [ ] Equipment templates reference correct iconKeys
- [ ] Asset paths are correct in manifests

---

## Troubleshooting

### Equipment looks too small/large
- **Fix:** Adjust width/height parameters (try 32, 48, 64, 96)
- Objects should fill ~60-70% of canvas for good visibility

### Materials don't read correctly
- **Fix:** Add more material-specific keywords to prompt
  - Iron: "dark metallic gray, steel highlights, worn edges"
  - Leather: "brown tan weathered, creased texture, buckles"
  - Wood: "warm brown hardwood, visible grain, worn smooth"

### Style doesn't match character
- **Fix:** Use style-matching mode with character sprite as background_image
- Or add more specific style keywords: "retro 16-bit pixel art, gritty Roman aesthetic, Blood & Bronze palette"

### Downscaled icons lose clarity
- **Fix:** Ensure using NEAREST/Point filter (not bilinear/bicubic)
- Generate at higher resolution first (64x64 or 96x96)
- Simplify original design (less fine detail)

---

## Next Steps (After Equipment Icons)

### Phase 3: Equipped Character Variants
Once inventory icons are complete and you have more PixelLab credits:

1. **Generate Duelist wearing equipment**
   - Use `create_character` with description including equipped gear
   - "Roman Duelist gladiator wielding iron longsword, wearing leather chest armor..."
   - This establishes authoritative visual scale for equipment on character

2. **Generate additional animations**
   - Walk, attack, death for equipped variant
   - Ensures weapon/armor move naturally with character

3. **Layered rendering system** (future)
   - Separate body/armor/weapon layers
   - Mix-and-match equipment visually
   - More complex but ultimate flexibility

---

## Summary

**Deliverable:** 5 equipment pieces as inventory icons, multiple sizes, ready for UI integration.

**Generation time:** ~2-5 minutes total (all async, if within trial limits).

**File output:** ~20-25 PNG files organized by equipment type.

**Next:** Integration into Admin UI equipment templates and inventory components.

---

**Document status:** Ready for execution
**Last updated:** 2026-02-04
**Related docs:** asset-gen-guide.md, docs/features/equipment.md, data-glossary.md
