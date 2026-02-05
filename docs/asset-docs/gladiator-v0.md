# Asset Generation Plan v0 — Minimal Viable Duelist

**Goal:** Generate the first playable gladiator character (Duelist class) with minimal viable animation set for Sprint 3 frontend combat UI.

**Scope:** 1 base gladiator, 4 critical animations, no arena tiles (solid color backgrounds), no equipment variants yet.

**Timeline:** ~15-20 minutes total generation time (async, PixelLab MCP)

**Next Phase:** After integration and testing, generate weapon/armor equipped variants and inventory icons (see asset-gen-guide.md).

---

## Design Direction

### Visual Identity
- **Theme:** Roman Duelist gladiator, battle-hardened, gritty coliseum fighter
- **Palette:** Blood & Bronze (Charcoal Black #121212, Dark Stone #1E1B18, Blood Red #8E1C1C, Bronze Gold #C18F59, Sand #D2B48C)
- **Style:** Retro 16-bit pixel art inspiration, readable at small sizes, strong silhouette
- **Tone:** Worn, heavy, deliberate — not cartoonish, not grimdark

### Technical Specifications
- **Canvas size:** 48px (character ~29px tall at 60% canvas)
- **Directions:** 4 (South, East, West, North)
- **View:** Low top-down (arena-friendly)
- **Proportions:** Heroic preset (strong, readable silhouette)
- **Outline:** Single black outline
- **Shading:** Basic shading
- **Detail:** Medium detail

---

## Generation Order (Critical)

Generate in this exact order to ensure consistency and allow early testing:

1. **Base Duelist Character** (4 directions) — ~2-3 minutes
2. **Animation: idle** (4 directions) — ~2-4 minutes
3. **Animation: walk** (4 directions) — ~2-4 minutes
4. **Animation: atk_slash** (4 directions) — ~2-4 minutes
5. **Animation: death** (4 directions) — ~2-4 minutes

**Total generation time:** ~15-20 minutes (all async)

---

## Step 1: Generate Base Duelist Character

**Tool:** `mcp__pixellab__create_character`

**Purpose:** Establish canonical Duelist body proportions and visual style for all animations.

### Parameters

```json
{
  "description": "Roman Duelist gladiator, heroic proportions, battle-hardened warrior, minimal cloth tunic and leather belt, bronze arm wraps, iron sword sheathed at side, scarred and weathered skin, determined expression, gritty coliseum fighter, dark stone and bronze color palette with blood red accents, retro 16-bit pixel art inspiration, strong readable silhouette at small size, moody shadows, worn and dusty materials, transparent background",
  "name": "Duelist Base",
  "size": 48,
  "n_directions": 4,
  "view": "low top-down",
  "proportions": "{\"type\": \"preset\", \"name\": \"heroic\"}",
  "outline": "single color black outline",
  "shading": "basic shading",
  "detail": "medium detail",
  "ai_freedom": 750
}
```

### Expected Output
- **character_id:** Save this ID for animation generation
- **4 rotation images:** South, West, East, North directional views
- **Processing time:** 2-3 minutes

### Verification
- [ ] Strong, readable silhouette at 48px
- [ ] Bronze/iron/leather materials visible
- [ ] Battle-worn aesthetic (scars, weathered look)
- [ ] Sword visible but not oversized
- [ ] Proportions feel heroic but grounded

### File Organization
Once downloaded, organize as:
```
apps/web/public/assets/sprites/characters/duelist_base/
  ├── directions/
  │   ├── south.png
  │   ├── west.png
  │   ├── east.png
  │   └── north.png
```

---

## Step 2: Generate Animation — Idle

**Tool:** `mcp__pixellab__animate_character`

**Purpose:** Resting combat stance, breathing/ready pose.

### Parameters

```json
{
  "character_id": "<character_id_from_step_1>",
  "template_animation_id": "breathing-idle",
  "animation_name": "idle",
  "action_description": "standing ready in combat stance with sword, breathing steadily, alert and prepared"
}
```

### Expected Output
- **Animation for all 4 directions**
- **Frame count:** Determined by template (likely 4-8 frames)
- **Processing time:** 2-4 minutes

### Verification
- [ ] Subtle breathing/idle motion
- [ ] Weapon remains visible and consistent
- [ ] Feels alert, not relaxed
- [ ] Loops smoothly

### File Organization
```
apps/web/public/assets/sprites/characters/duelist_base/
  └── animations/
      └── idle/
          ├── south/
          │   ├── frame_0.png
          │   ├── frame_1.png
          │   └── ...
          ├── west/
          ├── east/
          └── north/
```

---

## Step 3: Generate Animation — Walk

**Tool:** `mcp__pixellab__animate_character`

**Purpose:** Movement across arena (WASD controls in Sprint 3).

### Parameters

```json
{
  "character_id": "<character_id_from_step_1>",
  "template_animation_id": "walking-8-frames",
  "animation_name": "walk",
  "action_description": "walking confidently across arena sand, weapon ready, purposeful stride"
}
```

### Expected Output
- **Animation for all 4 directions**
- **Frame count:** 8 frames (walking-8-frames template)
- **Processing time:** 2-4 minutes

### Verification
- [ ] Smooth, readable walking motion
- [ ] Weapon doesn't wobble excessively
- [ ] Pace feels combat-ready (not casual stroll)
- [ ] Footwork clear even at small size
- [ ] Loops seamlessly

### File Organization
```
apps/web/public/assets/sprites/characters/duelist_base/
  └── animations/
      └── walk/
          ├── south/
          ├── west/
          ├── east/
          └── north/
```

---

## Step 4: Generate Animation — Attack (Slash)

**Tool:** `mcp__pixellab__animate_character`

**Purpose:** Primary sword attack (mapped to Space key in Sprint 3).

### Parameters

```json
{
  "character_id": "<character_id_from_step_1>",
  "template_animation_id": "cross-punch",
  "animation_name": "atk_slash",
  "action_description": "executing powerful downward sword slash with weight and force, then recovering to ready stance"
}
```

**Note:** Using `cross-punch` as the template animation because it has good forward motion and recovery. The action_description guides PixelLab to interpret it as a sword slash.

### Expected Output
- **Animation for all 4 directions**
- **Frame count:** Determined by template
- **Processing time:** 2-4 minutes

### Verification
- [ ] Clear anticipation → strike → recovery arc
- [ ] Sword motion is readable
- [ ] Feels impactful (weight transfer visible)
- [ ] Returns to neutral/ready pose
- [ ] Timing feels good at ~60 FPS playback

### File Organization
```
apps/web/public/assets/sprites/characters/duelist_base/
  └── animations/
      └── atk_slash/
          ├── south/
          ├── west/
          ├── east/
          └── north/
```

---

## Step 5: Generate Animation — Death

**Tool:** `mcp__pixellab__animate_character`

**Purpose:** Defeat animation when HP reaches 0.

### Parameters

```json
{
  "character_id": "<character_id_from_step_1>",
  "template_animation_id": "falling-back-death",
  "animation_name": "death",
  "action_description": "collapsing defeated to knees, dropping weapon, falling to the ground"
}
```

### Expected Output
- **Animation for all 4 directions**
- **Frame count:** Determined by template
- **Processing time:** 2-4 minutes

### Verification
- [ ] Clear progression: standing → wounded → collapse
- [ ] Weapon drops or falls with character
- [ ] Final frame is clearly "defeated" (laying down)
- [ ] Feels dramatic but not overly long
- [ ] Does NOT loop (plays once and holds final frame)

### File Organization
```
apps/web/public/assets/sprites/characters/duelist_base/
  └── animations/
      └── death/
          ├── south/
          ├── west/
          ├── east/
          └── north/
```

---

## MCP Tool Usage Guide

### Creating the Character

```typescript
// Use the PixelLab MCP tool via Claude Code
mcp__pixellab__create_character({
  description: "Roman Duelist gladiator, heroic proportions, battle-hardened warrior, minimal cloth tunic and leather belt, bronze arm wraps, iron sword sheathed at side, scarred and weathered skin, determined expression, gritty coliseum fighter, dark stone and bronze color palette with blood red accents, retro 16-bit pixel art inspiration, strong readable silhouette at small size, moody shadows, worn and dusty materials, transparent background",
  name: "Duelist Base",
  size: 48,
  n_directions: 4,
  view: "low top-down",
  proportions: '{"type": "preset", "name": "heroic"}',
  outline: "single color black outline",
  shading: "basic shading",
  detail: "medium detail",
  ai_freedom: 750
})
```

**Returns immediately with:**
- `character_id` — Save this for animations
- `job_id` — For checking status

### Checking Character Status

```typescript
mcp__pixellab__get_character({
  character_id: "<character_id>",
  include_preview: true
})
```

**Returns:**
- Status: pending/processing/completed
- Rotation images (when completed)
- List of animations and their status
- ZIP download URL
- Preview image

### Generating Animations

**IMPORTANT:** Queue all animations immediately after character creation completes. Do NOT wait for each animation to finish before starting the next.

```typescript
// Queue all 4 animations in parallel
mcp__pixellab__animate_character({
  character_id: "<character_id>",
  template_animation_id: "breathing-idle",
  animation_name: "idle",
  action_description: "standing ready in combat stance with sword, breathing steadily, alert and prepared"
})

mcp__pixellab__animate_character({
  character_id: "<character_id>",
  template_animation_id: "walking-8-frames",
  animation_name: "walk",
  action_description: "walking confidently across arena sand, weapon ready, purposeful stride"
})

mcp__pixellab__animate_character({
  character_id: "<character_id>",
  template_animation_id: "cross-punch",
  animation_name: "atk_slash",
  action_description: "executing powerful downward sword slash with weight and force, then recovering to ready stance"
})

mcp__pixellab__animate_character({
  character_id: "<character_id>",
  template_animation_id: "falling-back-death",
  animation_name: "death",
  action_description: "collapsing defeated to knees, dropping weapon, falling to the ground"
})
```

### Downloading Assets

Once all jobs complete:

```typescript
mcp__pixellab__get_character({
  character_id: "<character_id>",
  include_preview: true
})
```

**Download the ZIP** from the provided URL, which includes:
- All rotation images
- All animation frames (organized by animation name and direction)
- Metadata JSON

---

## Asset Integration Checklist

After generation completes:

### 1. Download and Organize
- [ ] Download ZIP from PixelLab
- [ ] Extract to `apps/web/public/assets/sprites/characters/duelist_base/`
- [ ] Verify directory structure matches plan
- [ ] Verify all 4 directions exist for base + 4 animations

### 2. Create Asset Manifest
- [ ] Create `apps/web/public/assets/sprites/characters/duelist_base/manifest.json`
- [ ] Document frame counts, frame rates, file paths
- [ ] Map animation keys to file paths

Example manifest structure:
```json
{
  "characterKey": "duelist_base",
  "className": "Duelist",
  "canvasSize": 48,
  "directions": 4,
  "rotations": {
    "south": "/assets/sprites/characters/duelist_base/directions/south.png",
    "west": "/assets/sprites/characters/duelist_base/directions/west.png",
    "east": "/assets/sprites/characters/duelist_base/directions/east.png",
    "north": "/assets/sprites/characters/duelist_base/directions/north.png"
  },
  "animations": {
    "idle": {
      "frameCount": 8,
      "frameRate": 8,
      "loop": true,
      "frames": {
        "south": [
          "/assets/sprites/characters/duelist_base/animations/idle/south/frame_0.png",
          "..."
        ],
        "west": ["..."],
        "east": ["..."],
        "north": ["..."]
      }
    },
    "walk": {
      "frameCount": 8,
      "frameRate": 12,
      "loop": true,
      "frames": { "..." }
    },
    "atk_slash": {
      "frameCount": 6,
      "frameRate": 16,
      "loop": false,
      "frames": { "..." }
    },
    "death": {
      "frameCount": 8,
      "frameRate": 10,
      "loop": false,
      "frames": { "..." }
    }
  }
}
```

### 3. Test in Canvas Renderer
- [ ] Load static rotation images in ArenaCanvas.tsx
- [ ] Verify size/scale looks correct (10 pixels per game unit)
- [ ] Test idle animation playback
- [ ] Test walk animation with WASD input
- [ ] Test attack animation on Space key
- [ ] Test death animation on HP = 0
- [ ] Verify all 4 directions render correctly

### 4. Performance Check
- [ ] Confirm all PNGs are optimized (use tinypng or similar if needed)
- [ ] Verify total asset size is reasonable (<2MB for base + 4 animations)
- [ ] Test load time in browser DevTools
- [ ] Confirm 60 FPS rendering with animations active

---

## Troubleshooting

### Character doesn't match design guidelines
- **Issue:** Colors too bright, not gritty enough
- **Fix:** Regenerate with additional prompt keywords: "dark moody palette", "battle-worn materials", "reduced saturation"

### Weapon is too large or small
- **Issue:** Sword dominates sprite or is barely visible
- **Fix:** Regenerate with adjusted description: "iron short sword" (smaller) or "iron longsword" (larger)

### Animation doesn't loop smoothly
- **Issue:** Walk or idle animations have visible jump
- **Fix:** Try different template_animation_id or add "smooth looping motion" to action_description

### Directions don't maintain consistency
- **Issue:** Weapon appears on different sides in different directions
- **Fix:** This is expected for pixel art; ensure East and West are mirrors, North and South maintain weapon position

### File organization is messy
- **Issue:** ZIP extraction doesn't match expected structure
- **Fix:** Manually reorganize files according to the structure in this doc

---

## Next Steps (Phase 2)

After Duelist base character is integrated and working in Sprint 3 combat UI:

1. **Generate equipped variants** (see asset-gen-guide.md §2)
   - Duelist with iron longsword + leather armor (visible on body)
   - Establishes authoritative scale for equipment

2. **Generate inventory icons** (see asset-gen-guide.md §3)
   - Isolated equipment icons based on equipped visuals
   - 16x16 or 24x24, centered, simplified

3. **Generate additional gladiators** (see asset-gen-guide.md MVP scope)
   - Brute class
   - Assassin class
   - Each with full animation set

4. **Generate arena tilesets** (optional for polish)
   - Sand floor (coliseum)
   - Stone borders/walls
   - Blood-stained variants

5. **Generate additional animations** (Sprint 4+)
   - dodge_roll
   - hit_react
   - cast (if spells in scope)
   - Additional weapon attack animations (spear thrust, bow draw, dagger stab)

---

## Design Principles (Reference)

From design-guidelines.md and asset-gen-guide.md:

### Core Aesthetic
- Roman / Gladiator / Coliseum
- Battle-hardened, iron, stone, sand, blood, bronze
- Gritty but stylish — not grimdark, not cartoonish
- Confident, serious, competitive
- Retro 16-bit inspiration without literal pixel nostalgia

### Color Palette — Blood & Bronze
**Base:**
- Charcoal Black: #121212
- Dark Stone: #1E1B18

**Accents:**
- Blood Red: #8E1C1C (damage, danger)
- Bronze Gold: #C18F59 (rarity, prestige)
- Sand: #D2B48C (neutral)

**Use sparingly:**
- Cyan: #2EE6D6 (arcana, i-frames)
- Purple: #7B4AE2 (faith, divine)

### Typography & UI (for future icon generation)
- VT323 or Press Start 2P for headings
- Engraved/stamped feeling
- High contrast for readability

---

## Template Animation Reference

Available PixelLab template animations (for reference):

**Movement:**
- `breathing-idle` — Subtle breathing/ready stance
- `walking` / `walking-4-frames` / `walking-6-frames` / `walking-8-frames` — Various walk cycles
- `running-4-frames` / `running-6-frames` / `running-8-frames` — Run cycles
- `crouched-walking` — Low stance movement
- `sad-walk` / `scary-walk` — Emotional variants

**Combat:**
- `fight-stance-idle-8-frames` — Combat ready stance
- `lead-jab` / `cross-punch` — Punching attacks
- `high-kick` / `roundhouse-kick` / `leg-sweep` / `flying-kick` / `hurricane-kick` — Kicks
- `surprise-uppercut` — Upward strike
- `throw-object` — Throwing motion
- `taking-punch` — Hit reaction

**Mobility:**
- `jumping-1` / `jumping-2` / `two-footed-jump` / `running-jump` — Jump variants
- `front-flip` / `backflip` — Acrobatic moves
- `running-slide` — Slide motion

**Actions:**
- `crouching` / `getting-up` — Posture changes
- `picking-up` / `drinking` — Object interactions
- `pushing` / `pull-heavy-object` — Environmental interactions
- `fireball` — Casting/projectile motion (could adapt for sword slash)

**Defeat:**
- `falling-back-death` — Fall backward
- `taking-punch` — Stagger/hit react

---

## Summary

**Deliverable:** 1 complete Duelist gladiator with 4 critical animations, ready for Sprint 3 frontend integration.

**Generation time:** ~15-20 minutes (async, can queue all jobs in parallel after character creation).

**File output:** ~20-40 PNG files organized in `/assets/sprites/characters/duelist_base/`

**Next:** Integration into ArenaCanvas.tsx, test combat UI, then proceed to weapon/armor equipped variants.

---

**Document status:** Ready for execution
**Last updated:** 2026-02-03
**Related docs:** asset-gen-guide.md, design-guidelines.md, docs/plans/04-sprint-3-frontend-animations.md
