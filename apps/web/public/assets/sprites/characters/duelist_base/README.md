# Duelist Base Character Assets

**Character ID:** `b3add1e6-12af-435f-8711-b7d57f65d743`
**Generated:** 2026-02-04
**Class:** Duelist
**Canvas Size:** 48x48px

## What's Included

### Base Character Rotations
- ✅ South, West, East, North directional views
- Located in `rotations/`

### Animations
- ✅ **Idle** (breathing-idle) - 4 frames per direction @ 8 FPS
  - Subtle breathing/ready stance
  - Loops continuously

### Pending (Trial Limit Reached)
- ⏸️ Walk animation (walking-8-frames)
- ⏸️ Attack slash animation (cross-punch adapted)
- ⏸️ Death animation (falling-back-death)

## File Structure

```
duelist_base/
├── manifest.json          # Runtime asset manifest
├── metadata.json          # Full PixelLab metadata with keypoints
├── README.md             # This file
├── rotations/            # Static directional views
│   ├── south.png
│   ├── west.png
│   ├── east.png
│   └── north.png
└── animations/
    └── breathing-idle/   # Idle animation
        ├── south/
        │   ├── frame_000.png
        │   ├── frame_001.png
        │   ├── frame_002.png
        │   └── frame_003.png
        ├── west/
        ├── east/
        └── north/
```

## Integration Guide

### Loading in React/Three.js

```typescript
import manifest from '@/public/assets/sprites/characters/duelist_base/manifest.json'

// Load rotation images
const rotationImages = {
  south: `/assets/sprites/characters/duelist_base/${manifest.rotations.south}`,
  west: `/assets/sprites/characters/duelist_base/${manifest.rotations.west}`,
  east: `/assets/sprites/characters/duelist_base/${manifest.rotations.east}`,
  north: `/assets/sprites/characters/duelist_base/${manifest.rotations.north}`,
}

// Load idle animation frames
const idleFrames = manifest.animations.idle.frames.south.map(
  (framePath) => `/assets/sprites/characters/duelist_base/${framePath}`
)
```

### Animation Playback

```typescript
// Idle animation
const frameCount = manifest.animations.idle.frameCount // 4
const frameRate = manifest.animations.idle.frameRate   // 8 FPS
const frameDuration = 1000 / frameRate                 // 125ms per frame

// Use in game loop
let currentFrame = 0
setInterval(() => {
  currentFrame = (currentFrame + 1) % frameCount
  renderFrame(idleFrames[currentFrame])
}, frameDuration)
```

## Visual Style

- **Palette:** Blood & Bronze (Dark Stone #1E1B18, Bronze Gold #C18F59, Blood Red #8E1C1C)
- **Outline:** Single black outline
- **Shading:** Basic shading
- **Detail:** Medium detail
- **Aesthetic:** Battle-hardened Roman gladiator, gritty but readable

## Next Steps

1. **Sprint 3 Integration:**
   - Use idle animation as placeholder for all states
   - Test rendering in ArenaCanvas.tsx
   - Verify scale/positioning at 10px per game unit

2. **Phase 2 (Equipment Assets):**
   - Generate equipped variant (iron longsword + leather armor visible)
   - Generate inventory icons based on equipped visuals
   - See `docs/plans/asset-v0.md` for full workflow

3. **Future Animations:**
   - Upgrade PixelLab or manually create walk, attack, death animations
   - Add dodge_roll, hit_react for complete combat set

## Related Documentation

- `/docs/plans/asset-v0.md` - Complete asset generation plan
- `/docs/asset-gen-guide.md` - Asset design & workflow guide
- `/docs/design-guidelines.md` - Visual design principles
- `/docs/plans/04-sprint-3-frontend-animations.md` - Integration target
