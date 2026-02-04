# Design Guidelines — Crucible

Design principles and standards for Crucible (Gladiator Coliseum): UI, visuals, motion, and tone.  
Use this doc to keep the experience consistent across the web app, arena, and future surfaces.

Crucible’s UI should feel like:
- a **battle console** in a Roman coliseum
- **worn, heavy, deliberate**
- readable and functional under pressure
- retro-inspired, not nostalgic for nostalgia’s sake

---

## Visual Direction

### Core Aesthetic
- **Roman / Gladiator / Coliseum**
- Battle-hardened, iron, stone, sand, blood, bronze
- Gritty but stylish — not grimdark, not cartoonish
- Confident, serious, competitive

### Style Translation (UI)
- **Retro 16-bit inspiration**:
  - sharp edges
  - pixel-adjacent spacing
  - chunky UI blocks
- NOT literal pixel art everywhere
- UI should *feel* retro even if rendered crisply

### Surfaces
- Dark stone / iron backgrounds
- Subtle noise, grain, or texture
- High contrast elements layered on top

### Arena vs UI
- Arena/combat: kinetic, dramatic, high contrast
- Menus/HUD: restrained, readable, minimal motion

---

## Typography

### Font Direction
- **Primary UI Font**: Pixel-adjacent or retro-inspired sans-serif
  - Examples to explore:
    - VT323 (pixel)
    - Press Start 2P (for headings only)
    - Inter / IBM Plex Sans (fallback for readability)
- Avoid overly ornate Roman serif fonts for body text

### Hierarchy
- Headings: Bold, condensed, uppercase
- Labels: Small caps or spaced uppercase
- Body text: Clean, neutral, readable at small sizes

### Guidelines
- Favor **legibility over flair**
- UI text should feel “engraved” or “stamped”
- Use weight and spacing instead of color alone

---

## Color

### General Principles
- **Dark, moody base**
- **Bright accent colors for action**
- Neutral stone/iron tones for structure
- Color = meaning (never decorative only)

### Semantic Color Usage
- Red: damage, danger, enemy
- Gold: rarity, reward, prestige
- Green: stamina, success, confirm
- Blue/Cyan: magic, mana, arcana
- Purple: faith, divine, rare effects

### Accessibility
- Maintain high contrast (WCAG AA minimum)
- Never rely on color alone for state
- Use icons + labels for critical info

---

## Spacing and Layout

### Layout Philosophy
- **Grid-based**
- Chunky margins
- Clear separation between sections

### Density
- Slightly compact, tactical feel
- Avoid airy, modern SaaS spacing
- UI should feel “weighty”

### Responsiveness
- Desktop-first for demo
- Mobile-friendly later, not priority

---

## Components and UI Patterns

### Buttons
- Squared or slightly beveled edges
- Solid fills, strong contrast
- Hover: brightness + subtle glow
- Active: slight “pressed in” illusion

### Cards / Panels
- Dark backgrounds
- Hard borders or inner shadows
- Titles feel like plaques or nameplates

### Inputs
- Minimal rounding
- Clear focus states
- Avoid modern “floating labels”

### Navigation
- Icon + text
- Clear active state
- No hidden gestures

### UI Library
- Tailwind + shadcn is fine
- Override default “soft modern” styles
- Prefer custom tokens over defaults

---

## Motion and Animation

### Combat
- Snappy, readable
- Emphasis on impact:
  - hit flashes
  - screen shake (subtle)
  - brief freeze frames
- No floaty easing

### UI Motion
- Fast, restrained
- Slide or fade, not bounce
- Durations: 120–200ms

### Performance First
- Avoid heavy particle effects in UI
- Combat effects should scale down gracefully

---

## Accessibility

- Full keyboard navigation
- Clear focus outlines
- High contrast mode friendly
- Respect reduced motion preferences
- Text always readable over background

---

## Tone and Copy

### Voice
- In-world, but not verbose
- Confident, blunt, martial
- Short phrases > lore dumps

### Examples
- “Enter the Arena”
- “Prepare Loadout”
- “Victory”
- “Defeat”
- “Blood Was Spilled”

### Errors
- Clear, direct
- Slightly thematic but never confusing
  - “Action failed” > “The gods deny you”

---

## Color Palette Options

Below are **5 palette directions**. Each can be used for UI, HUD, and marketing.

---

### Palette A — *Blood & Bronze* (Classic Gladiator)

**Base**
- Charcoal Black: #121212
- Dark Stone: #1E1B18

**Accents**
- Blood Red: #8E1C1C
- Bronze Gold: #C18F59
- Sand: #D2B48C

**Use When**
- You want timeless Roman grit
- Strong identity, low risk

---

### Palette B — *Obsidian & Gold* (Prestige / NFT Lean)

**Base**
- Obsidian: #0E0E11
- Graphite: #1A1A22

**Accents**
- Imperial Gold: #E5B567
- Ash White: #E6E6E6
- Crimson: #B11226

**Use When**
- You want “valuable”, premium vibes
- Strong for marketplace / inventory UI

---

### Palette C — *Arena Neon* (Retro + Modern Punch)

**Base**
- Near Black: #0B0B0D
- Gunmetal: #1F1F24

**Accents**
- Neon Red: #FF2D2D
- Electric Cyan: #2EE6D6
- Acid Yellow: #F3E600

**Use When**
- Leaning hard into 16-bit + arcade energy
- Fast combat readability

---

### Palette D — *Ash & Faith* (Magic / Divine Lean)

**Base**
- Dark Ash: #141414
- Slate: #2A2A2A

**Accents**
- Arcane Blue: #4AA3DF
- Faith Purple: #7B4AE2
- Pale Gold: #E6D8A8

**Use When**
- Spells and magic are front-and-center
- Cleaner, slightly mystical tone

---

### Palette E — *Sandstorm* (Coliseum Earthy)

**Base**
- Deep Brown: #1C1611
- Warm Stone: #2B2118

**Accents**
- Sand Gold: #D9B26C
- Rust Red: #A63A2E
- Olive Green: #6B7A3C

**Use When**
- You want grounded, dusty realism
- Strong environmental identity

---

## References

- concept.md
- equipment.md
- admin-ui.md (Admin UI plan; implemented in Sprint 2.5 — see SPRINT-2.5-SUMMARY.md)
- data-glossary.md
- Future: Figma boards, sprite sheets, arena mockups
