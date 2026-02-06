# UI Assets Implementation Guide

Guide for integrating new UI sprite assets into Crucible's React components.

---

## 📁 Directory Structure Created

```
apps/web/public/assets/
  ui/
    buttons/           # Button sprites
    panels/            # Panel backgrounds, frames
    slots/             # Inventory/equipment slots
    navigation/        # Nav elements
    icons/             # Currency, stats, emblems
    decorations/       # Ornaments, dividers
  backgrounds/
    menu/              # Main menu bg
    camp/              # Camp bg
    arena/             # Arena bg
  chests/              # Loot chest sprites
  sprites/             # Character sprites (existing)
```

---

## 🎨 Asset Organization Guidelines

### File Naming Convention
- **Descriptive**: `currency-gold-coin-24.png`
- **With variants**: `button-raised-hover.png`, `slot-weapon-empty.png`
- **Animated**: `coin-gold-spin-sheet-4x24.png` (4 frames, 24x24 each)

### Recommended Sizes
- Small icons: 16x16, 24x24
- Standard UI elements: 32x32, 48x48
- Backgrounds: Match viewport or tile
- Buttons: 9-slice compatible or multiple sizes

---

## 🔧 Implementation Examples

### 1. Backgrounds

#### Main Menu Background
**File location**: `apps/web/public/assets/backgrounds/menu/coliseum-main.png`

**Implementation** in `apps/web/app/page.tsx`:
```tsx
export default async function Home() {
  // ... existing code

  return (
    <main
      className="min-h-screen bg-coliseum-black"
      style={{
        backgroundImage: 'url(/assets/backgrounds/menu/coliseum-main.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Rest of content */}
    </main>
  )
}
```

Or add to `globals.css`:
```css
.bg-main-menu {
  background-image: url('/assets/backgrounds/menu/coliseum-main.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
```

#### Camp Background
**File location**: `apps/web/public/assets/backgrounds/camp/camp-scene.png`

**Implementation** in `apps/web/app/camp/page.tsx`:
```tsx
return (
  <main
    className="min-h-screen bg-coliseum-black pt-[90px]"
    style={{
      backgroundImage: 'url(/assets/backgrounds/camp/camp-scene.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}
  >
    {/* Camp content */}
  </main>
)
```

---

### 2. Currency Icons

**File locations**:
- `apps/web/public/assets/ui/icons/currency-gold-24.png`
- `apps/web/public/assets/ui/icons/currency-xp-24.png`
- `apps/web/public/assets/ui/icons/currency-skill-24.png`

#### Static Currency Display
Create a reusable component: `apps/web/components/ui/CurrencyDisplay.tsx`

```tsx
'use client'

interface CurrencyDisplayProps {
  type: 'gold' | 'xp' | 'skill' | 'stat'
  amount: number
  size?: 16 | 24 | 32
  showLabel?: boolean
}

export function CurrencyDisplay({
  type,
  amount,
  size = 24,
  showLabel = false
}: CurrencyDisplayProps) {
  const icons = {
    gold: `/assets/ui/icons/currency-gold-${size}.png`,
    xp: `/assets/ui/icons/currency-xp-${size}.png`,
    skill: `/assets/ui/icons/currency-skill-${size}.png`,
    stat: `/assets/ui/icons/currency-stat-${size}.png`,
  }

  const labels = {
    gold: 'Gold',
    xp: 'XP',
    skill: 'Skill Points',
    stat: 'Stat Points',
  }

  return (
    <div className="flex items-center gap-2">
      <img
        src={icons[type]}
        alt={labels[type]}
        className="inline-block"
        width={size}
        height={size}
      />
      <span className="text-coliseum-sand font-bold">
        {amount.toLocaleString()}
      </span>
      {showLabel && (
        <span className="text-coliseum-sand/70 text-sm uppercase tracking-wider">
          {labels[type]}
        </span>
      )}
    </div>
  )
}
```

**Usage**:
```tsx
// In CharacterSheet or any component
<CurrencyDisplay type="gold" amount={1250} />
<CurrencyDisplay type="xp" amount={850} showLabel />
```

#### Animated Currency (if you have sprite sheets)
**File location**: `apps/web/public/assets/ui/icons/currency-gold-spin-sheet-4x24.png`

Create: `apps/web/components/ui/AnimatedCurrency.tsx`

```tsx
'use client'

import { useEffect, useRef } from 'react'

interface AnimatedCurrencyProps {
  type: 'gold' | 'bronze'
  size?: 24 | 32
  frameCount?: number
  fps?: number
}

export function AnimatedCurrency({
  type,
  size = 24,
  frameCount = 4,
  fps = 8
}: AnimatedCurrencyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sprite = new Image()
    sprite.src = `/assets/ui/icons/currency-${type}-spin-sheet-${frameCount}x${size}.png`

    let currentFrame = 0
    const frameInterval = 1000 / fps

    const animate = () => {
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(
        sprite,
        currentFrame * size, 0, // Source x, y
        size, size,              // Source width, height
        0, 0,                    // Dest x, y
        size, size               // Dest width, height
      )
      currentFrame = (currentFrame + 1) % frameCount
    }

    sprite.onload = () => {
      const interval = setInterval(animate, frameInterval)
      return () => clearInterval(interval)
    }

    return () => {
      sprite.onload = null
    }
  }, [type, size, frameCount, fps])

  return <canvas ref={canvasRef} width={size} height={size} />
}
```

**Usage**:
```tsx
<AnimatedCurrency type="gold" size={24} frameCount={4} fps={8} />
```

---

### 3. Stat Icons

**File locations**: `apps/web/public/assets/ui/icons/stat-{name}-24.png`
- stat-constitution-24.png
- stat-strength-24.png
- stat-dexterity-24.png
- stat-speed-24.png
- stat-defense-24.png
- stat-magicresist-24.png
- stat-arcana-24.png
- stat-faith-24.png

#### Update CharacterSheet Component
In `apps/web/components/rpg-ui/CharacterSheet.tsx`:

```tsx
// Add this helper component
function AttributeStat({
  label,
  value,
  icon
}: {
  label: string
  value: number
  icon?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      {icon && (
        <img
          src={icon}
          alt={label}
          width={20}
          height={20}
          className="opacity-80"
        />
      )}
      <span className="text-coliseum-sand/70 text-sm uppercase tracking-wider flex-1">
        {label}
      </span>
      <span className="text-coliseum-sand font-bold text-lg">
        {value}
      </span>
    </div>
  )
}

// Then in the attributes section:
<div className="grid grid-cols-2 gap-3 panel-inset p-4">
  <AttributeStat
    label="Constitution"
    value={gladiator.constitution}
    icon="/assets/ui/icons/stat-constitution-24.png"
  />
  <AttributeStat
    label="Strength"
    value={gladiator.strength}
    icon="/assets/ui/icons/stat-strength-24.png"
  />
  {/* ... rest of stats */}
</div>
```

---

### 4. Equipment Slots

**File locations**:
- `apps/web/public/assets/ui/slots/slot-weapon-empty.png`
- `apps/web/public/assets/ui/slots/slot-weapon-filled.png`
- `apps/web/public/assets/ui/slots/slot-helmet-empty.png`
- etc.

#### Update EquipmentSlot Component
In `apps/web/components/rpg-ui/EquipmentSlot.tsx`:

```tsx
const slotBackgrounds = {
  MAIN_HAND: {
    empty: '/assets/ui/slots/slot-weapon-empty.png',
    filled: '/assets/ui/slots/slot-weapon-filled.png',
  },
  OFF_HAND: {
    empty: '/assets/ui/slots/slot-weapon-empty.png',
    filled: '/assets/ui/slots/slot-weapon-filled.png',
  },
  HELMET: {
    empty: '/assets/ui/slots/slot-helmet-empty.png',
    filled: '/assets/ui/slots/slot-helmet-filled.png',
  },
  CHEST: {
    empty: '/assets/ui/slots/slot-chest-empty.png',
    filled: '/assets/ui/slots/slot-chest-filled.png',
  },
  GAUNTLETS: {
    empty: '/assets/ui/slots/slot-gauntlets-empty.png',
    filled: '/assets/ui/slots/slot-gauntlets-filled.png',
  },
  GREAVES: {
    empty: '/assets/ui/slots/slot-greaves-empty.png',
    filled: '/assets/ui/slots/slot-greaves-filled.png',
  },
}

export function EquipmentSlot({ slot, isEmpty, rarity }: EquipmentSlotProps) {
  const bg = slotBackgrounds[slot]
  const bgImage = isEmpty ? bg.empty : bg.filled

  return (
    <div
      className={`relative w-16 h-16 ${getRarityClass(rarity)}`}
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Equipment icon or empty state */}
    </div>
  )
}
```

---

### 5. Custom Buttons

**File locations**:
- `apps/web/public/assets/ui/buttons/btn-primary.png`
- `apps/web/public/assets/ui/buttons/btn-primary-hover.png`
- `apps/web/public/assets/ui/buttons/btn-primary-pressed.png`

#### Option A: CSS Background Images
Add to `apps/web/app/globals.css`:

```css
@layer components {
  .btn-sprite {
    background-image: url('/assets/ui/buttons/btn-primary.png');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    border: none;
    padding: 12px 24px;
    color: var(--coliseum-sand);
    font-weight: bold;
    text-transform: uppercase;
    cursor: pointer;
  }

  .btn-sprite:hover {
    background-image: url('/assets/ui/buttons/btn-primary-hover.png');
  }

  .btn-sprite:active {
    background-image: url('/assets/ui/buttons/btn-primary-pressed.png');
  }
}
```

#### Option B: React Component with States
Create: `apps/web/components/ui/SpriteButton.tsx`

```tsx
'use client'

import { useState } from 'react'

interface SpriteButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function SpriteButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}: SpriteButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const getBackground = () => {
    if (disabled) return `/assets/ui/buttons/btn-${variant}-disabled.png`
    if (isPressed) return `/assets/ui/buttons/btn-${variant}-pressed.png`
    if (isHovered) return `/assets/ui/buttons/btn-${variant}-hover.png`
    return `/assets/ui/buttons/btn-${variant}.png`
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsPressed(false)
      }}
      className="relative px-6 py-3 font-bold uppercase tracking-wider text-sm text-coliseum-sand"
      style={{
        backgroundImage: `url(${getBackground()})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1
      }}
    >
      {children}
    </button>
  )
}
```

**Usage**:
```tsx
<SpriteButton variant="primary" onClick={handleClick}>
  Enter Arena
</SpriteButton>
```

---

### 6. Panel Backgrounds

**File locations**:
- `apps/web/public/assets/ui/panels/panel-embossed.png`
- `apps/web/public/assets/ui/panels/panel-inset.png`

#### Add to globals.css (9-slice approach for scalable panels)
```css
@layer components {
  .panel-sprite-embossed {
    border-image: url('/assets/ui/panels/panel-embossed.png') 16 fill / 16px / 0 stretch;
    padding: 16px;
  }

  .panel-sprite-inset {
    border-image: url('/assets/ui/panels/panel-inset.png') 16 fill / 16px / 0 stretch;
    padding: 16px;
  }
}
```

Or for fixed-size panels:
```tsx
<div
  className="p-6"
  style={{
    backgroundImage: 'url(/assets/ui/panels/panel-embossed.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }}
>
  {/* Panel content */}
</div>
```

---

### 7. Loot Chests

**File locations**:
- `apps/web/public/assets/chests/chest-wooden.png`
- `apps/web/public/assets/chests/chest-stone.png`
- `apps/web/public/assets/chests/chest-bronze.png`
- `apps/web/public/assets/chests/chest-iron.png`

#### Update LootBoxInventory Component
In `apps/web/components/loot/LootBoxInventory.tsx`:

```tsx
const chestSprites = {
  COMMON: '/assets/chests/chest-wooden.png',
  UNCOMMON: '/assets/chests/chest-stone.png',
  RARE: '/assets/chests/chest-bronze.png',
  EPIC: '/assets/chests/chest-iron.png',
}

// In the render:
<div className="grid grid-cols-3 gap-4">
  {lootBoxes.map((box) => (
    <button
      key={box.id}
      onClick={() => handleOpen(box.id)}
      className="relative flex flex-col items-center gap-2 p-4 hover:scale-105 transition-transform"
    >
      <img
        src={chestSprites[box.tier]}
        alt={`${box.tier} chest`}
        className="w-24 h-24 object-contain"
      />
      <span className="text-coliseum-bronze text-sm uppercase">
        {box.tier}
      </span>
    </button>
  ))}
</div>
```

---

### 8. Navigation Elements

**File locations**:
- `apps/web/public/assets/ui/navigation/arrow-back.png`
- `apps/web/public/assets/ui/navigation/arrow-next.png`
- `apps/web/public/assets/ui/navigation/icon-settings.png`

#### Create Navigation Icon Component
`apps/web/components/ui/NavIcon.tsx`:

```tsx
interface NavIconProps {
  type: 'back' | 'next' | 'settings' | 'close'
  size?: 16 | 24 | 32
  onClick?: () => void
  className?: string
}

export function NavIcon({ type, size = 24, onClick, className = '' }: NavIconProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center hover:opacity-80 transition-opacity ${className}`}
    >
      <img
        src={`/assets/ui/navigation/${type}-${size}.png`}
        alt={type}
        width={size}
        height={size}
      />
    </button>
  )
}
```

**Usage**:
```tsx
<NavIcon type="back" size={24} onClick={() => router.back()} />
```

---

## 🎯 Next Steps

1. **Move your generated assets** into the appropriate folders
2. **Test one component at a time** - start with backgrounds, then icons, then buttons
3. **Create reusable components** for common patterns (CurrencyDisplay, NavIcon, etc.)
4. **Update globals.css** for sprite-based utility classes
5. **Consider lazy loading** for larger background images
6. **Add loading states** for images that aren't cached

---

## 💡 Pro Tips

### Performance
- Use Next.js `<Image>` component for optimized loading:
```tsx
import Image from 'next/image'

<Image
  src="/assets/ui/icons/currency-gold-24.png"
  alt="Gold"
  width={24}
  height={24}
/>
```

### Preloading Critical Assets
Add to `apps/web/app/layout.tsx`:
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/assets/backgrounds/menu/coliseum-main.png" />
        <link rel="preload" as="image" href="/assets/ui/icons/currency-gold-24.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Sprite Sheets for Animations
For multi-frame animations, use CSS sprites or canvas-based animation (see AnimatedCurrency example above).

---

## 📝 Checklist

After moving files:
- [ ] Test backgrounds on main menu and camp pages
- [ ] Implement currency icons in CharacterSheet
- [ ] Update equipment slots in CharacterSheet
- [ ] Add stat icons to attribute display
- [ ] Replace button styles with sprite buttons
- [ ] Integrate loot chests in LootBoxInventory
- [ ] Add navigation icons throughout app
- [ ] Test on different screen sizes
- [ ] Verify all images load correctly
- [ ] Check performance with DevTools

---

Once you've moved your files into the folders, let me know which component you'd like to update first, and I'll help you implement it!
