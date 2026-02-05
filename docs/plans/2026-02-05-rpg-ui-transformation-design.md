# RPG UI/UX Transformation Design

**Date**: 2026-02-05
**Status**: Approved for Implementation
**Goal**: Transform Crucible's UI from website-like to RPG game-like experience

---

## Executive Summary

Transform Crucible's UI to feel like a Western RPG game (Diablo/PoE style) while maintaining the Roman gladiator theme and Blood & Bronze aesthetic. Focus on making the Camp feel like an in-game character management screen, with persistent HUD, embossed UI elements, and tactile game-like interactions.

**Key Constraint**: Implementation before final game assets are created (using unicode/emoji placeholders).

---

## Design Direction

### Style Foundation

**Base**: Western RPG (Diablo/Path of Exile)
- Dark, weighty UI
- Visual inventory and equipment slots
- Stat-driven character identity
- Gear rarity emphasis

**Influence**: Modern Action RPG (Dark Souls/Monster Hunter)
- Minimalist HUD
- Clean typography
- Intuitive navigation
- Readable under pressure

**Aesthetic Anchors** (from design-guidelines.md):
- Battle console in a Roman coliseum
- Worn, heavy, deliberate
- Retro 16-bit inspired (sharp edges, chunky blocks)
- Blood & Bronze palette

---

## 1. Persistent Game HUD

### Layout (~90px tall, always visible)

```
┌─────────────────────────────────────────────────────────────┐
│ [Portrait] Maximus #042  Lv.5  XP ███████░░░ 720/1000      │
│ ⚔️ CAMP                          Gold: 2,450 🪙  [!] x3     │
└─────────────────────────────────────────────────────────────┘
```

### Information Zones

**Left Zone**: Active Gladiator Identity
- Portrait: 64x64px (circular or square)
- Name, Token ID, Level
- Shows currently selected/active gladiator
- Clickable for quick-switch dropdown (in Camp) or gladiator card (elsewhere)

**Center-Left Zone**: Current Location
- Page name in display font (CAMP, ARENA, FORGE, etc.)
- Updates on navigation

**Center-Right Zone**: XP Progress
- Visual bar with fill animation
- Numerical display (current/max)
- Green fill color for progression

**Right Zone**: Resources & Notifications
- Gold count with coin icon
- Notification badges:
  - Skill points available
  - Unopened loot boxes
  - Pending challenges/matches
- Badge shows count: `[!] x3`

### Visual Treatment

- **Background**: Dark stone (#1E1B18)
- **Borders**: 2px solid bronze (#C18F59)
- **Style**: Embossed panel with inner shadows
- **Texture**: Maintains noise texture from globals.css
- **Separation**: Bottom bronze border separates HUD from content

### Active Gladiator Logic

- Persists across all pages
- Set via Camp gladiator selector
- Remembers last selected gladiator
- Used for Arena matchmaking, quick battle entry

---

## 2. Camp Layout (Character Management)

### Side-by-Side Split

**Left Panel**: Character Sheet (~350px fixed width)
**Right Panel**: Tabbed Content (flex, remaining width)

### Left Panel: Character Sheet

```
┌────────────────────┐
│                    │
│   [Portrait]       │
│   200x200px        │
│                    │
└────────────────────┘

⚔️ Duelist
Maximus #042
Level 5
XP ███████░░░ 720/1000

┌─ STATS ──────────┐
│ HP    ████ 85/100│
│ STM   ████ 95/100│
│                  │
│ STR   12  (+3)   │
│ DEX   15  (+2)   │
│ CON   10         │
│ SPD   14  (+1)   │
│ DEF   8          │
│ ...              │
└──────────────────┘

┌─ EQUIPMENT ──────┐
│  🗡️  ⚔️  🛡️     │
│  👑  🦴  🥾     │
└──────────────────┘
```

**Components**:

1. **Portrait Section**
   - Large 200x200px square
   - Placeholder: Colored block with class icon
   - Embossed frame with bronze border

2. **Identity Section**
   - Class icon + name
   - Gladiator name, token ID
   - Level display
   - XP bar (visual + numbers)

3. **Stats Panel**
   - Embossed sub-panel
   - Primary stats with bars (HP, Stamina)
   - Combat stats with numbers
   - Equipment modifiers in green: `(+3)`
   - Balanced density: bars + numbers visible

4. **Equipment Slots**
   - 6 slots in 2x3 grid
   - Slots: Weapon, Off-hand, Helmet, Chest, Gloves, Boots
   - Unicode/emoji placeholders
   - Rarity-colored borders (standard RPG colors)
   - Hover shows item tooltip
   - Click opens equipment details

### Right Panel: Tabbed Content

**Tab Navigation**:
- Three tabs: GLADIATORS | INVENTORY | CRAFTING
- Active tab "pressed in" (inverted emboss)
- Inactive tabs raised (normal emboss)
- Chunky, uppercase, tracking-wide font

**Tab: GLADIATORS**

```
┌─ YOUR GLADIATORS ────────────────┐
│                                  │
│  [Gladiator Selector]            │
│  Grid or list of owned gladiators│
│  Click to set as active          │
│                                  │
│  [Selected Gladiator Details]    │
│  • Progression UI                │
│  • Skill tree                    │
│  • Stat allocation               │
│  • Equipment management          │
│                                  │
└──────────────────────────────────┘
```

**Gladiator Selector**:
- Grid of cards (2-3 per row)
- Each card shows: portrait, name, level, class
- Active gladiator has bronze glow border
- Click to select/switch active gladiator

**Selected Gladiator Progression**:
- Skill tree component (if available points)
- Stat allocation panel (if available points)
- Equipment management (drag-drop to slots)

**Tab: INVENTORY**

```
┌─ LOOT BOXES ─────────────────────┐
│  [🎁] [🎁] [🎁]                 │
│  Wooden  Bronze  Silver          │
└──────────────────────────────────┘

┌─ EQUIPMENT ──────────────────────┐
│  Grid of equipment icons         │
│  Rarity-colored borders          │
│  Filterable by type/rarity       │
│  Click for details               │
└──────────────────────────────────┘
```

**Tab: CRAFTING**

- Existing CraftingWorkshop component
- Restyled to match embossed aesthetic

---

## 3. Visual Language

### Embossed/Engraved Style

**Core Principle**: Everything looks carved into or raised from stone

**Panels**:
```css
.panel-embossed {
  background: #1E1B18;
  border: 2px solid #C18F59;
  box-shadow:
    inset 0 2px 4px rgba(0,0,0,0.4),
    inset 0 -2px 4px rgba(255,255,255,0.05);
}
```

**Buttons (Raised)**:
```css
.btn-raised {
  background: #2B2118;
  border: 2px solid #C18F59;
  box-shadow:
    0 2px 0 rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.1);
}

.btn-raised:active {
  box-shadow:
    inset 0 2px 4px rgba(0,0,0,0.4);
  transform: translateY(1px);
}
```

**Pressed/Active State**:
```css
.btn-pressed {
  box-shadow:
    inset 0 2px 4px rgba(0,0,0,0.4);
}
```

**Hover Effects**:
- Subtle bronze glow: `box-shadow: 0 0 8px rgba(193,143,89,0.3)`
- Slight brightness increase
- No dramatic animations (120-150ms transitions)

### Typography Hierarchy

**Display Text** (titles, locations):
- Uppercase, tracking-wide
- Font: VT323 or Press Start 2P fallback
- Color: Sand (#D2B48C)

**Body Text**:
- Regular case
- Font: Inter or IBM Plex Sans
- Color: Sand 90% opacity

**Labels**:
- Small caps or spaced uppercase
- Font size: 10-12px
- Color: Bronze 80% opacity

### Stat Bars

**Visual Design**:
```
Label    ████████░░░░  45/60
```

**Colors** (semantic):
- HP: Red (#8E1C1C)
- Stamina: Green (#6B7A3C)
- XP: Bronze gradient
- Mana: Blue (#4AA3DF)

**Structure**:
- Bar background: Dark stone with inner shadow
- Fill: Colored with slight gradient
- Border: 1px bronze
- Numbers right-aligned

---

## 4. Equipment & Inventory

### Equipment Slots (Paperdoll Style)

**Slot Layout**:
```
┌──────┬──────┬──────┐
│ HELM │ NECK │ BACK │
├──────┼──────┼──────┤
│ MAIN │ CHEST│ OFF  │
├──────┼──────┼──────┤
│GLOVES│ LEGS │ BOOTS│
└──────┴──────┴──────┘
```

**Slot States**:
- **Empty**: Dashed bronze border, icon silhouette
- **Equipped**: Solid border, item icon, rarity color
- **Hover**: Bronze glow
- **Click**: Opens item details modal

### Rarity System (MVP)

**Standard RPG Colors** (familiar, instantly readable):

| Tier | Color | Border | Use |
|------|-------|--------|-----|
| Common | Gray (#9CA3AF) | Thin | Starter gear |
| Uncommon | Green (#10B981) | Medium | Drops |
| Rare | Blue (#3B82F6) | Medium | Crafted |
| Epic | Purple (#A855F7) | Thick | Boss loot |
| Legendary | Gold (#F59E0B) | Thick + glow | Special |

**Future Enhancement** (Blood & Bronze Palette):
- Base Stone (common) - #2A2A2A
- Weathered Bronze (uncommon) - #8B6F47
- Polished Bronze (rare) - #C18F59
- Blood-Forged (epic) - #8E1C1C with bronze accent
- Imperial Gold (legendary) - #E5B567 with glow

*Note: Standard colors for MVP, custom palette post-launch*

### Inventory Grid

**Layout**:
- Grid: 6-8 columns, auto rows
- Square cells (64x64px)
- Gap: 4px

**Item Cards**:
- Background: Dark stone
- Border: 2px rarity color
- Icon: Unicode/emoji centered
- Hover: Slight raise effect
- Click: Item details modal

**Filtering**:
- Tabs: ALL | WEAPONS | ARMOR | CONSUMABLES
- Sort: Rarity, Level, Recent

---

## 5. Navigation & Transitions

### Page Navigation

**Method**: Quick slide (150ms)
- New content slides from right
- Old content slides to left
- Easing: ease-out
- Maintains scroll position per page

**Future Enhancement**: Location banners for Arena/Forge
```
[Fade to black]
→ "ENTERING ARENA" in bronze
[Fade in content]
```

### Persistent Elements

**Never slide**:
- Persistent HUD (stays fixed)
- Background texture

**Slide**:
- All page content below HUD

---

## 6. Reward & Notification System

### Hybrid Approach

**Full-Screen Modals** (major moments):
- Level up
- Epic/Legendary loot drop
- Match victory (first time)
- Achievement unlocked

**Slide-In Notifications** (minor moments):
- Common/Uncommon loot
- Gold gained
- XP gained
- Match complete

### Modal Design

```
┌─────────────────────────────────────┐
│         [LEVEL UP!]                 │
│                                     │
│    You are now Level 6              │
│                                     │
│    +5 HP                            │
│    +3 Stamina                       │
│    +1 Skill Point                   │
│                                     │
│         [CONTINUE]                  │
└─────────────────────────────────────┘
```

**Style**:
- Dark overlay (80% opacity)
- Centered embossed panel
- Bronze border with glow
- Large display font for title
- Chunky "Continue" button

### Slide-In Notification

**Position**: Top-right, below HUD
**Duration**: 3 seconds auto-dismiss
**Style**: Small embossed panel
```
┌────────────────────┐
│ +50 Gold 🪙       │
└────────────────────┘
```

---

## 7. Placeholder Assets

### Before Game Art

**Equipment Icons**: Unicode + Emoji
- Weapon: ⚔️ 🗡️ 🏹
- Armor: 🛡️ 🦴
- Helmet: 👑 ⛑️
- Accessories: 💍 📿

**Gladiator Portraits**:
- Colored square (class-based color)
- Large class icon centered
- Embossed frame

**Stat Icons**:
- HP: ❤️
- Stamina: ⚡
- XP: ⭐
- Gold: 🪙

**Quality**: High enough to convey meaning, stylized enough to not look like placeholders

---

## 8. Home Page Transformation

### Current → RPG Menu

**Before**: Website landing page with cards

**After**: Game menu screen

```
┌─────────────────────────────────────┐
│         CRUCIBLE                    │
│      GLADIATOR COLISEUM             │
│           ⚔️                         │
│                                     │
│       Welcome, Maximus              │
│                                     │
│    ┌─────────────────────┐         │
│    │    ⛺ CAMP          │         │
│    ├─────────────────────┤         │
│    │    🔥 FORGE         │         │
│    ├─────────────────────┤         │
│    │    ⚔️ ARENA         │         │
│    ├─────────────────────┤         │
│    │    🤝 FRIENDS       │         │
│    └─────────────────────┘         │
└─────────────────────────────────────┘
```

**Design**:
- Centered menu panel
- Chunky embossed buttons
- Stacked vertically
- Clear icon + label
- Hover: Bronze glow + slight raise
- Active: Pressed effect

**Note**: HUD appears after selecting any menu option

---

## 9. Arena & Match Pages

### Arena Entry

**Simple, focused**:
- Center panel
- Gladiator selector dropdown
- "Enter Arena" large button
- "Practice" / "Ranked" tabs (future)

### Match Page

**Combat HUD** (different from persistent HUD):
- Top: HP bars for both gladiators
- Bottom: Stamina bars, ability cooldowns
- Center: Combat canvas
- Style: Minimal, high contrast, combat-focused

*Note*: Combat HUD overrides persistent HUD during matches

---

## 10. Mint Page (The Forge)

### Layout

```
┌─────────────────────────────────────┐
│            THE FORGE                │
│                                     │
│     Forge a New Gladiator           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  [Preview Window]           │   │
│  │  Shows stats preview        │   │
│  │  Class: Random roll         │   │
│  └─────────────────────────────┘   │
│                                     │
│  Cost: 0.01 ETH                    │
│                                     │
│  [FORGE GLADIATOR]                 │
│                                     │
│  Your Gladiators: [3 slots used]   │
└─────────────────────────────────────┘
```

**Flow**:
1. Show minting cost
2. Preview panel (animated?)
3. Large "Forge Gladiator" button
4. On success: Full-screen modal with reveal
5. Redirect to Camp to view new gladiator

---

## Implementation Priority

### Phase 1: Core Structure
1. Persistent HUD component
2. Embossed visual styles (CSS utilities)
3. Quick slide navigation system
4. Home page menu transformation

### Phase 2: Camp
1. Side-by-side layout
2. Character sheet left panel
3. Gladiator selector
4. Equipment slots with placeholders
5. Stats display with bars

### Phase 3: Inventory & Loot
1. Inventory grid
2. Rarity colors
3. Item tooltips
4. Loot box opening UI

### Phase 4: Arena & Forge
1. Arena entry screen
2. Mint page redesign
3. Reward modals
4. Notification slide-ins

### Phase 5: Polish
1. Hover effects refinement
2. Transition tuning
3. Responsive adjustments
4. Accessibility check

---

## Technical Notes

### Component Structure

```
/components
  /ui
    PersistentHUD.tsx
    EmbossedPanel.tsx
    StatBar.tsx
    EquipmentSlot.tsx
    RarityBorder.tsx
    RewardModal.tsx
    SlideNotification.tsx
  /camp
    CharacterSheet.tsx
    GladiatorSelector.tsx
    EquipmentGrid.tsx
    StatsPanel.tsx
  /inventory
    InventoryGrid.tsx
    ItemCard.tsx
    LootBoxCard.tsx
```

### CSS Utilities

```css
/* Add to globals.css */
.embossed-panel { /* raised panel */ }
.embossed-inset { /* pressed panel */ }
.stat-bar { /* progress bar */ }
.rarity-common { /* border color */ }
.rarity-uncommon { /* border color */ }
/* etc */
```

### State Management

- Active gladiator: Context or Zustand store
- Persists across navigation
- Syncs with backend on change
- Used by HUD, Camp, Arena

---

## Success Criteria

✅ **Feels like a game, not a website**
- Persistent HUD makes you feel "in the game"
- Camp feels like character management screen
- Navigation feels like game menus

✅ **Maintains design guidelines**
- Blood & Bronze palette
- Retro-inspired aesthetic
- Readable and functional
- Embossed/carved feel

✅ **Works without game art**
- Unicode placeholders are clear
- Rarity colors convey meaning
- Layout works with simple shapes

✅ **Fast and responsive**
- Transitions under 200ms
- Navigation feels snappy
- No lag or jank

---

## Future Enhancements

- Location banners for Arena/Forge transitions
- Custom Blood & Bronze rarity palette
- Animated gladiator portraits
- Combat ability bar in HUD
- Friend online status indicators
- Achievement notifications
- Tooltip improvements
- Sound effects for interactions

---

**End of Design Document**
