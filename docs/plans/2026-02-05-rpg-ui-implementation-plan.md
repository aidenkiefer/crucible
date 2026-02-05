# RPG UI Transformation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Crucible's UI from website-like to RPG game experience with persistent HUD, embossed visual style, and character management screen.

**Architecture:** Add persistent game HUD component, create embossed CSS utilities, implement side-by-side Camp layout with character sheet and equipment slots. Use React Context for active gladiator state. All components use unicode/emoji placeholders before game assets.

**Tech Stack:** Next.js 14, React 18, TypeScript, TailwindCSS, Next-Auth

**Design Reference:** `docs/plans/2026-02-05-rpg-ui-transformation-design.md`

---

## Phase 1: Core Structure & Embossed Styles

### Task 1: Add Embossed CSS Utilities

**Goal:** Create CSS utilities for embossed/engraved visual style

**Files:**
- Modify: `apps/web/app/globals.css`

**Step 1: Add embossed panel utilities**

Add to `@layer components` section:

```css
  /* Embossed panel styles - raised from surface */
  .panel-embossed {
    @apply bg-coliseum-stone border-2 border-coliseum-bronze;
    box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.4),
      inset 0 -2px 4px rgba(255, 255, 255, 0.05),
      0 1px 0 rgba(255, 255, 255, 0.1);
  }

  /* Embossed inset - pressed into surface */
  .panel-inset {
    @apply bg-coliseum-black border-2 border-coliseum-bronze/50;
    box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.6),
      inset 0 -1px 2px rgba(255, 255, 255, 0.03);
  }

  /* Raised button - normal state */
  .btn-raised {
    @apply bg-coliseum-stone border-2 border-coliseum-bronze text-coliseum-sand;
    @apply font-bold uppercase tracking-wider text-sm transition-all duration-150;
    box-shadow:
      0 2px 0 rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .btn-raised:hover {
    @apply brightness-110;
    box-shadow:
      0 2px 0 rgba(0, 0, 0, 0.3),
      0 0 8px rgba(193, 143, 89, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .btn-raised:active {
    box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.4);
    @apply translate-y-px;
  }

  /* Pressed button - active/selected state */
  .btn-pressed {
    @apply bg-coliseum-black border-2 border-coliseum-bronze text-coliseum-bronze;
    @apply font-bold uppercase tracking-wider text-sm;
    box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.6);
  }
```

**Step 2: Add stat bar utilities**

Add to `@layer components` section:

```css
  /* Stat bar container */
  .stat-bar {
    @apply relative h-5 bg-coliseum-black/50 border border-coliseum-bronze/30;
    @apply overflow-hidden;
    box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.3);
  }

  /* Stat bar fill */
  .stat-bar-fill {
    @apply absolute inset-0 transition-all duration-300;
  }

  /* Stat bar colors */
  .stat-bar-hp {
    @apply bg-gradient-to-r from-red-900 to-red-700;
  }

  .stat-bar-stamina {
    @apply bg-gradient-to-r from-green-900 to-green-700;
  }

  .stat-bar-xp {
    @apply bg-gradient-to-r from-coliseum-bronze/60 to-coliseum-bronze;
  }

  .stat-bar-mana {
    @apply bg-gradient-to-r from-blue-900 to-blue-700;
  }
```

**Step 3: Add rarity border utilities**

Add to `@layer components` section:

```css
  /* Equipment rarity borders */
  .rarity-common {
    @apply border-2 border-gray-400;
  }

  .rarity-uncommon {
    @apply border-2 border-green-500;
  }

  .rarity-rare {
    @apply border-2 border-blue-500;
  }

  .rarity-epic {
    @apply border-2 border-purple-500;
  }

  .rarity-legendary {
    @apply border-2 border-amber-500;
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
  }

  /* Equipment slot - empty state */
  .equipment-slot-empty {
    @apply border-2 border-dashed border-coliseum-bronze/30;
    @apply bg-coliseum-black/30 flex items-center justify-center;
    @apply text-coliseum-bronze/20 text-3xl;
  }

  /* Equipment slot - hover */
  .equipment-slot:hover {
    box-shadow: 0 0 8px rgba(193, 143, 89, 0.3);
    @apply brightness-110;
  }
```

**Step 4: Verify styles**

Check that globals.css compiles without errors.

---

### Task 2: Create Active Gladiator Context

**Goal:** Manage active gladiator state across the app

**Files:**
- Create: `apps/web/contexts/ActiveGladiatorContext.tsx`

**Step 1: Create context file**

```typescript
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Gladiator {
  id: string
  tokenId: number
  name?: string
  class: string
  level: number
  xp: number
  xpToNextLevel: number
}

interface ActiveGladiatorContextType {
  activeGladiator: Gladiator | null
  setActiveGladiator: (gladiator: Gladiator | null) => void
  isLoading: boolean
}

const ActiveGladiatorContext = createContext<ActiveGladiatorContextType | undefined>(
  undefined
)

export function ActiveGladiatorProvider({ children }: { children: ReactNode }) {
  const [activeGladiator, setActiveGladiatorState] = useState<Gladiator | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('activeGladiatorId')
    if (stored) {
      // Fetch gladiator data from API
      fetch(`/api/gladiators/${stored}`)
        .then(res => res.json())
        .then(data => {
          if (data.gladiator) {
            setActiveGladiatorState(data.gladiator)
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const setActiveGladiator = (gladiator: Gladiator | null) => {
    setActiveGladiatorState(gladiator)
    if (gladiator) {
      localStorage.setItem('activeGladiatorId', gladiator.id)
    } else {
      localStorage.removeItem('activeGladiatorId')
    }
  }

  return (
    <ActiveGladiatorContext.Provider
      value={{ activeGladiator, setActiveGladiator, isLoading }}
    >
      {children}
    </ActiveGladiatorContext.Provider>
  )
}

export function useActiveGladiator() {
  const context = useContext(ActiveGladiatorContext)
  if (context === undefined) {
    throw new Error('useActiveGladiator must be used within ActiveGladiatorProvider')
  }
  return context
}
```

**Step 2: Add provider to root layout**

Modify: `apps/web/app/layout.tsx`

Import and wrap:

```typescript
import { ActiveGladiatorProvider } from '@/contexts/ActiveGladiatorContext'

// Inside <body>:
<ActiveGladiatorProvider>
  {/* existing providers and children */}
</ActiveGladiatorProvider>
```

---

### Task 3: Create Persistent HUD Component

**Goal:** Build always-visible HUD with active gladiator info

**Files:**
- Create: `apps/web/components/ui/PersistentHUD.tsx`

**Step 1: Create HUD component**

```typescript
'use client'

import { useActiveGladiator } from '@/contexts/ActiveGladiatorContext'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export function PersistentHUD() {
  const { activeGladiator, isLoading } = useActiveGladiator()
  const { data: session } = useSession()
  const pathname = usePathname()

  // Don't show HUD on landing page or auth pages
  if (!session || pathname === '/' || pathname.startsWith('/auth')) {
    return null
  }

  // Get current location name
  const getLocationName = () => {
    if (pathname.startsWith('/camp')) return 'CAMP'
    if (pathname.startsWith('/arena')) return 'ARENA'
    if (pathname.startsWith('/mint')) return 'FORGE'
    if (pathname.startsWith('/friends')) return 'FRIENDS'
    if (pathname.startsWith('/quick-match')) return 'MATCHMAKING'
    return 'CRUCIBLE'
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 panel-embossed">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Left: Active Gladiator */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-12 h-12 bg-coliseum-stone animate-pulse rounded" />
          ) : activeGladiator ? (
            <>
              {/* Portrait placeholder */}
              <div className="w-12 h-12 panel-inset flex items-center justify-center text-2xl">
                ⚔️
              </div>
              {/* Identity */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-coliseum-sand font-display text-sm">
                    {activeGladiator.name || `${activeGladiator.class} #${activeGladiator.tokenId}`}
                  </span>
                  <span className="text-coliseum-sand/60 text-xs">
                    Lv.{activeGladiator.level}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <span className="text-coliseum-sand/50 text-sm">No gladiator selected</span>
          )}
        </div>

        {/* Center: Location */}
        <div className="hidden sm:block">
          <span className="text-coliseum-bronze font-display tracking-wider text-sm">
            {getLocationName()}
          </span>
        </div>

        {/* Right: XP and Resources */}
        <div className="flex items-center gap-4">
          {activeGladiator && (
            <>
              {/* XP Bar */}
              <div className="hidden md:flex flex-col gap-1 min-w-[150px]">
                <div className="stat-bar h-2">
                  <div
                    className="stat-bar-fill stat-bar-xp h-full"
                    style={{
                      width: `${(activeGladiator.xp / activeGladiator.xpToNextLevel) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-coliseum-sand/60 text-[10px] text-right">
                  XP {activeGladiator.xp}/{activeGladiator.xpToNextLevel}
                </div>
              </div>

              {/* Gold */}
              <div className="flex items-center gap-1 text-coliseum-bronze">
                <span className="text-lg">🪙</span>
                <span className="text-sm font-bold">2,450</span>
              </div>

              {/* Notifications */}
              <div className="flex items-center gap-1 text-coliseum-bronze">
                <span className="text-sm">📬</span>
                <span className="text-xs font-bold">x3</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Add HUD to layout**

Modify: `apps/web/app/layout.tsx`

```typescript
import { PersistentHUD } from '@/components/ui/PersistentHUD'

// Inside <body>, before {children}:
<PersistentHUD />
<div className="pt-[90px]"> {/* Offset for fixed HUD */}
  {children}
</div>
```

**Step 3: Test HUD visibility**

- Navigate to `/camp` - HUD should show
- Navigate to `/` - HUD should hide
- Check responsive behavior (mobile, tablet, desktop)

---

### Task 4: Add Page Slide Transitions

**Goal:** Implement 150ms slide transitions between pages

**Files:**
- Create: `apps/web/components/ui/PageTransition.tsx`

**Step 1: Create transition wrapper**

```typescript
'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [displayLocation, setDisplayLocation] = useState(pathname)
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter')

  useEffect(() => {
    if (pathname !== displayLocation) {
      setTransitionStage('exit')
      const timer = setTimeout(() => {
        setDisplayLocation(pathname)
        setTransitionStage('enter')
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [pathname, displayLocation])

  return (
    <div
      className={`transition-transform duration-150 ease-out ${
        transitionStage === 'exit'
          ? '-translate-x-full'
          : transitionStage === 'enter'
          ? 'translate-x-0'
          : 'translate-x-full'
      }`}
    >
      {children}
    </div>
  )
}
```

**Step 2: Apply to pages**

Note: For simplicity, we'll apply transitions at the page level rather than globally. Each page that needs transitions will wrap its content in PageTransition.

Example for Camp page:

```typescript
import { PageTransition } from '@/components/ui/PageTransition'

export default function CampPage() {
  return (
    <PageTransition>
      {/* existing page content */}
    </PageTransition>
  )
}
```

**Step 3: Test transitions**

Navigate between pages and verify smooth slide animation.

---

## Phase 2: Camp Character Management

### Task 5: Create Stat Bar Component

**Goal:** Reusable stat bar with visual + numerical display

**Files:**
- Create: `apps/web/components/ui/StatBar.tsx`

**Step 1: Create component**

```typescript
interface StatBarProps {
  label: string
  current: number
  max: number
  type: 'hp' | 'stamina' | 'xp' | 'mana'
  showNumbers?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StatBar({
  label,
  current,
  max,
  type,
  showNumbers = true,
  size = 'md',
}: StatBarProps) {
  const percentage = Math.min((current / max) * 100, 100)

  const heightClass = {
    sm: 'h-3',
    md: 'h-5',
    lg: 'h-6',
  }[size]

  const typeClass = {
    hp: 'stat-bar-hp',
    stamina: 'stat-bar-stamina',
    xp: 'stat-bar-xp',
    mana: 'stat-bar-mana',
  }[type]

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Label */}
      <span className="text-coliseum-sand/80 uppercase text-xs tracking-wider min-w-[60px]">
        {label}
      </span>

      {/* Bar */}
      <div className={`stat-bar flex-1 ${heightClass}`}>
        <div
          className={`stat-bar-fill ${typeClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Numbers */}
      {showNumbers && (
        <span className="text-coliseum-sand text-xs font-mono min-w-[60px] text-right">
          {current}/{max}
        </span>
      )}
    </div>
  )
}
```

**Step 2: Test with different values**

Create a test page or story to verify:
- Different stat types show correct colors
- Percentage calculation works
- Numbers display correctly
- Sizes work (sm, md, lg)

---

### Task 6: Create Equipment Slot Component

**Goal:** Equipment slot with rarity borders and placeholders

**Files:**
- Create: `apps/web/components/equipment/EquipmentSlot.tsx`

**Step 1: Create component**

```typescript
interface Equipment {
  id: string
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  icon: string
  type: string
}

interface EquipmentSlotProps {
  slot: 'weapon' | 'offhand' | 'helmet' | 'chest' | 'gloves' | 'boots'
  equipment: Equipment | null
  onClick?: () => void
}

export function EquipmentSlot({ slot, equipment, onClick }: EquipmentSlotProps) {
  const slotIcons = {
    weapon: '⚔️',
    offhand: '🛡️',
    helmet: '⛑️',
    chest: '🦴',
    gloves: '🧤',
    boots: '🥾',
  }

  const slotLabels = {
    weapon: 'Weapon',
    offhand: 'Off-Hand',
    helmet: 'Helmet',
    chest: 'Chest',
    gloves: 'Gloves',
    boots: 'Boots',
  }

  const rarityClass = equipment
    ? `rarity-${equipment.rarity}`
    : 'equipment-slot-empty'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`equipment-slot relative w-20 h-20 transition-all duration-150 ${rarityClass}`}
      title={equipment ? equipment.name : `Empty ${slotLabels[slot]}`}
    >
      {equipment ? (
        <span className="text-3xl">{equipment.icon}</span>
      ) : (
        <span className="text-3xl opacity-30">{slotIcons[slot]}</span>
      )}

      {/* Slot label overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-coliseum-black/70 text-[8px] text-coliseum-sand/60 uppercase tracking-wider py-0.5">
        {slotLabels[slot]}
      </div>
    </button>
  )
}
```

**Step 2: Test equipment slot**

Verify:
- Empty slots show dashed border + faded icon
- Equipped items show rarity-colored border
- Different rarities display correct colors
- Hover effect works
- Click handler fires

---

### Task 7: Create Character Sheet Component

**Goal:** Left panel with portrait, stats, and equipment

**Files:**
- Create: `apps/web/components/camp/CharacterSheet.tsx`

**Step 1: Create component**

```typescript
'use client'

import { useActiveGladiator } from '@/contexts/ActiveGladiatorContext'
import { StatBar } from '@/components/ui/StatBar'
import { EquipmentSlot } from '@/components/equipment/EquipmentSlot'

interface CharacterSheetProps {
  gladiatorId: string
}

export function CharacterSheet({ gladiatorId }: CharacterSheetProps) {
  const { activeGladiator } = useActiveGladiator()

  // TODO: Fetch full gladiator data including stats and equipment
  const mockData = {
    portrait: '⚔️',
    name: 'Maximus',
    tokenId: 42,
    class: 'Duelist',
    level: 5,
    xp: 720,
    xpToNextLevel: 1000,
    stats: {
      hp: 85,
      maxHp: 100,
      stamina: 95,
      maxStamina: 100,
      strength: 12,
      strBonus: 3,
      dexterity: 15,
      dexBonus: 2,
      constitution: 10,
      speed: 14,
      spdBonus: 1,
      defense: 8,
      magicResist: 6,
      arcana: 5,
      faith: 4,
    },
    equipment: {
      weapon: null,
      offhand: null,
      helmet: null,
      chest: null,
      gloves: null,
      boots: null,
    },
  }

  return (
    <div className="w-full md:w-[350px] space-y-4">
      {/* Portrait */}
      <div className="panel-embossed aspect-square flex flex-col items-center justify-center">
        <div className="text-9xl">{mockData.portrait}</div>
        <div className="mt-4 text-center">
          <div className="text-coliseum-bronze text-sm uppercase tracking-wider">
            {mockData.class}
          </div>
          <div className="text-coliseum-sand font-display text-lg">
            {mockData.name} #{mockData.tokenId}
          </div>
          <div className="text-coliseum-sand/60 text-sm">Level {mockData.level}</div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="panel-inset p-3">
        <StatBar
          label="XP"
          current={mockData.xp}
          max={mockData.xpToNextLevel}
          type="xp"
        />
      </div>

      {/* Stats Panel */}
      <div className="panel-embossed p-4 space-y-2">
        <h3 className="text-coliseum-bronze uppercase tracking-wider text-xs font-bold mb-3">
          Stats
        </h3>

        {/* Primary Stats with Bars */}
        <StatBar
          label="HP"
          current={mockData.stats.hp}
          max={mockData.stats.maxHp}
          type="hp"
          size="sm"
        />
        <StatBar
          label="Stamina"
          current={mockData.stats.stamina}
          max={mockData.stats.maxStamina}
          type="stamina"
          size="sm"
        />

        <div className="h-px bg-coliseum-bronze/20 my-3" />

        {/* Combat Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <StatRow label="STR" value={mockData.stats.strength} bonus={mockData.stats.strBonus} />
          <StatRow label="DEX" value={mockData.stats.dexterity} bonus={mockData.stats.dexBonus} />
          <StatRow label="CON" value={mockData.stats.constitution} />
          <StatRow label="SPD" value={mockData.stats.speed} bonus={mockData.stats.spdBonus} />
          <StatRow label="DEF" value={mockData.stats.defense} />
          <StatRow label="M.RES" value={mockData.stats.magicResist} />
          <StatRow label="ARC" value={mockData.stats.arcana} />
          <StatRow label="FAI" value={mockData.stats.faith} />
        </div>
      </div>

      {/* Equipment Slots */}
      <div className="panel-embossed p-4">
        <h3 className="text-coliseum-bronze uppercase tracking-wider text-xs font-bold mb-3">
          Equipment
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <EquipmentSlot slot="weapon" equipment={mockData.equipment.weapon} />
          <EquipmentSlot slot="offhand" equipment={mockData.equipment.offhand} />
          <EquipmentSlot slot="helmet" equipment={mockData.equipment.helmet} />
          <EquipmentSlot slot="chest" equipment={mockData.equipment.chest} />
          <EquipmentSlot slot="gloves" equipment={mockData.equipment.gloves} />
          <EquipmentSlot slot="boots" equipment={mockData.equipment.boots} />
        </div>
      </div>
    </div>
  )
}

// Helper component for stat rows
function StatRow({ label, value, bonus }: { label: string; value: number; bonus?: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-coliseum-sand/70 uppercase text-xs">{label}</span>
      <span className="text-coliseum-sand font-mono text-sm">
        {value}
        {bonus && bonus > 0 && (
          <span className="text-green-500 ml-1">(+{bonus})</span>
        )}
      </span>
    </div>
  )
}
```

**Step 2: Test character sheet**

Verify:
- Portrait displays correctly
- Stats show with proper formatting
- Equipment slots render in grid
- Bonus stats show in green
- Responsive layout works

---

### Task 8: Update Camp Page Layout

**Goal:** Implement side-by-side layout with character sheet

**Files:**
- Modify: `apps/web/app/camp/page.tsx`

**Step 1: Replace camp page content**

```typescript
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { CharacterSheet } from '@/components/camp/CharacterSheet'
import { useActiveGladiator } from '@/contexts/ActiveGladiatorContext'
import { PageTransition } from '@/components/ui/PageTransition'
import { EquipmentInventory } from '@/components/equipment/EquipmentInventory'
import { LootBoxInventory } from '@/components/loot/LootBoxInventory'
import { CraftingWorkshop } from '@/components/equipment/CraftingWorkshop'

interface Gladiator {
  id: string
  tokenId: number
  class: string
  level: number
  xp: number
  skillPointsAvailable: number
}

type Tab = 'gladiators' | 'inventory' | 'crafting'

export default function CampPage() {
  const { data: session, status } = useSession()
  const { activeGladiator, setActiveGladiator } = useActiveGladiator()
  const [gladiators, setGladiators] = useState<Gladiator[]>([])
  const [tab, setTab] = useState<Tab>('gladiators')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/gladiators')
        .then((res) => res.json())
        .then((data) => {
          setGladiators(data.gladiators || [])
          // Set first gladiator as active if none selected
          if (!activeGladiator && data.gladiators?.length > 0) {
            setActiveGladiator(data.gladiators[0])
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [session?.user?.id, activeGladiator, setActiveGladiator])

  if (status === 'loading' || loading) {
    return (
      <PageTransition>
        <main className="min-h-screen bg-coliseum-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coliseum-bronze mx-auto" />
            <p className="text-coliseum-sand/70 mt-4">Loading camp...</p>
          </div>
        </main>
      </PageTransition>
    )
  }

  if (!session) {
    return (
      <PageTransition>
        <main className="min-h-screen bg-coliseum-black flex items-center justify-center">
          <div className="panel-embossed p-8 max-w-md text-center">
            <h1 className="font-display text-2xl text-coliseum-sand uppercase mb-4">
              Camp
            </h1>
            <p className="text-coliseum-sand/70 mb-6">
              Sign in to view your gladiators and inventory.
            </p>
            <Link href="/" className="btn-raised inline-block px-6 py-3">
              Return to Gate
            </Link>
          </div>
        </main>
      </PageTransition>
    )
  }

  if (gladiators.length === 0) {
    return (
      <PageTransition>
        <main className="min-h-screen bg-coliseum-black flex items-center justify-center">
          <div className="panel-embossed p-8 max-w-md text-center">
            <h1 className="font-display text-2xl text-coliseum-sand uppercase mb-4">
              Camp
            </h1>
            <p className="text-coliseum-sand/70 mb-6">
              No gladiators yet. Mint one at the Forge to get started.
            </p>
            <Link href="/mint" className="btn-raised inline-block px-6 py-3">
              Go to Forge
            </Link>
          </div>
        </main>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <main className="min-h-screen bg-coliseum-black p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-3xl text-coliseum-sand uppercase tracking-wide">
              Camp
            </h1>
            <Link href="/" className="btn-raised px-4 py-2 text-xs">
              ← Gate
            </Link>
          </div>

          {/* Side-by-side Layout */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Character Sheet */}
            <div className="flex-shrink-0">
              {activeGladiator && <CharacterSheet gladiatorId={activeGladiator.id} />}
            </div>

            {/* Right: Tabbed Content */}
            <div className="flex-1 min-w-0">
              {/* Tab Navigation */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setTab('gladiators')}
                  className={tab === 'gladiators' ? 'btn-pressed px-6 py-3' : 'btn-raised px-6 py-3'}
                >
                  Gladiators
                </button>
                <button
                  type="button"
                  onClick={() => setTab('inventory')}
                  className={tab === 'inventory' ? 'btn-pressed px-6 py-3' : 'btn-raised px-6 py-3'}
                >
                  Inventory
                </button>
                <button
                  type="button"
                  onClick={() => setTab('crafting')}
                  className={tab === 'crafting' ? 'btn-pressed px-6 py-3' : 'btn-raised px-6 py-3'}
                >
                  Crafting
                </button>
              </div>

              {/* Tab Content */}
              <div className="panel-embossed p-6 min-h-[600px]">
                {tab === 'gladiators' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
                        Your Gladiators
                      </h2>
                      <p className="text-coliseum-sand/70 text-sm mb-6">
                        Select a gladiator to view details and manage progression.
                      </p>
                    </div>

                    {/* Gladiator Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {gladiators.map((g) => {
                        const isActive = activeGladiator?.id === g.id
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setActiveGladiator(g)}
                            className={`text-left p-4 transition-all duration-150 ${
                              isActive
                                ? 'panel-inset border-coliseum-bronze'
                                : 'panel-embossed border-coliseum-bronze/30 hover:border-coliseum-bronze/60'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-coliseum-bronze text-xs uppercase tracking-wider mb-1">
                                  {g.class}
                                </div>
                                <div className="font-display text-coliseum-sand text-lg">
                                  #{g.tokenId}
                                </div>
                                <div className="text-coliseum-sand/60 text-sm">
                                  Level {g.level}
                                </div>
                              </div>
                              {isActive && (
                                <div className="text-coliseum-bronze text-xl">✓</div>
                              )}
                            </div>
                            {g.skillPointsAvailable > 0 && (
                              <div className="mt-3 text-coliseum-bronze text-xs">
                                {g.skillPointsAvailable} skill points available
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Selected Gladiator Details */}
                    {activeGladiator && (
                      <div className="mt-8 panel-inset p-4">
                        <h3 className="text-coliseum-bronze uppercase tracking-wider text-xs font-bold mb-3">
                          Progression
                        </h3>
                        <p className="text-coliseum-sand/70 text-sm">
                          Skill tree and stat allocation will appear here when available.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'inventory' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
                        Loot Boxes
                      </h2>
                      <LootBoxInventory />
                    </div>
                    <div>
                      <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
                        Equipment
                      </h2>
                      <EquipmentInventory />
                    </div>
                  </div>
                )}

                {tab === 'crafting' && (
                  <div>
                    <CraftingWorkshop />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  )
}
```

**Step 2: Test camp layout**

Verify:
- Side-by-side layout on desktop
- Stacked layout on mobile
- Tab switching works
- Gladiator selection updates active gladiator
- Character sheet updates when changing gladiators

---

## Phase 3: Inventory & Equipment

### Task 9: Create Inventory Grid Component

**Goal:** Grid display for equipment items

**Files:**
- Modify: `apps/web/components/equipment/EquipmentInventory.tsx`

**Step 1: Update to use embossed grid**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Equipment {
  id: string
  name: string
  type: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  attackBonus?: number
  defenseBonus?: number
  speedBonus?: number
}

const EQUIPMENT_ICONS: Record<string, string> = {
  Weapon: '⚔️',
  Armor: '🛡️',
  Helmet: '⛑️',
  Boots: '🥾',
  Gloves: '🧤',
}

export function EquipmentInventory() {
  const { data: session } = useSession()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [filter, setFilter] = useState<'ALL' | 'Weapon' | 'Armor'>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/equipment')
        .then((res) => res.json())
        .then((data) => {
          setEquipment(data.equipment || [])
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [session?.user?.id])

  const filteredEquipment =
    filter === 'ALL' ? equipment : equipment.filter((e) => e.type === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coliseum-bronze" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['ALL', 'Weapon', 'Armor'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={filter === f ? 'btn-pressed px-4 py-2 text-xs' : 'btn-raised px-4 py-2 text-xs'}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Equipment Grid */}
      {filteredEquipment.length === 0 ? (
        <div className="panel-inset p-8 text-center">
          <p className="text-coliseum-sand/60">No equipment found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {filteredEquipment.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`equipment-slot aspect-square p-2 rarity-${item.rarity} hover:brightness-110 transition-all`}
              title={item.name}
            >
              <div className="text-3xl">{EQUIPMENT_ICONS[item.type] || '📦'}</div>
              <div className="absolute bottom-0 left-0 right-0 bg-coliseum-black/80 text-[8px] text-coliseum-sand uppercase tracking-wider py-0.5 truncate px-1">
                {item.name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Test inventory grid**

Verify:
- Grid displays items with rarity colors
- Filter tabs work
- Hover effects display
- Empty state shows correctly
- Responsive grid columns

---

### Task 10: Update Loot Box Inventory

**Goal:** Style loot boxes with embossed panels

**Files:**
- Modify: `apps/web/components/loot/LootBoxInventory.tsx`

**Step 1: Update to use embossed style**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface LootBox {
  id: string
  tier: 'wooden' | 'bronze' | 'silver' | 'gold'
  opened: boolean
}

const TIER_COLORS = {
  wooden: 'text-amber-800',
  bronze: 'text-coliseum-bronze',
  silver: 'text-gray-400',
  gold: 'text-amber-400',
}

const TIER_LABELS = {
  wooden: 'Wooden',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
}

export function LootBoxInventory() {
  const { data: session } = useSession()
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/loot-boxes')
        .then((res) => res.json())
        .then((data) => {
          setLootBoxes(data.lootBoxes || [])
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [session?.user?.id])

  const unopened = lootBoxes.filter((box) => !box.opened)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coliseum-bronze" />
      </div>
    )
  }

  if (unopened.length === 0) {
    return (
      <div className="panel-inset p-8 text-center">
        <p className="text-coliseum-sand/60">No unopened loot boxes.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {unopened.map((box) => (
        <button
          key={box.id}
          type="button"
          className="panel-embossed p-4 hover:brightness-110 transition-all text-center"
        >
          <div className={`text-5xl mb-2 ${TIER_COLORS[box.tier]}`}>🎁</div>
          <div className="text-coliseum-sand text-sm font-display uppercase">
            {TIER_LABELS[box.tier]}
          </div>
          <div className="text-coliseum-sand/60 text-xs mt-1">Click to open</div>
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Test loot boxes**

Verify:
- Loot boxes display in grid
- Tier colors show correctly
- Hover effects work
- Empty state displays

---

## Phase 4: Home Page & Other Screens

### Task 11: Transform Home Page to Game Menu

**Goal:** Convert home page to RPG-style main menu

**Files:**
- Modify: `apps/web/app/page.tsx`

**Step 1: Update authenticated home page**

Replace the action cards section with a centered menu:

```typescript
// After the hero section in authenticated view:

return (
  <main className="min-h-screen bg-coliseum-black">
    <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />

    <div className="max-w-2xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-block px-8 py-1 border-x-2 border-coliseum-bronze/30">
          <h1 className="font-display text-6xl text-coliseum-sand uppercase tracking-wide">
            Crucible
          </h1>
        </div>
        <p className="text-coliseum-bronze uppercase tracking-[0.4em] text-xs mt-3">
          Gladiator Coliseum
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-coliseum-bronze/50" />
          <span className="text-coliseum-bronze text-lg">⚔</span>
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-coliseum-bronze/50" />
        </div>

        <div className="mt-6">
          <p className="text-coliseum-sand/80 uppercase tracking-wider text-sm">
            Welcome back, <span className="text-coliseum-sand font-bold">{userName}</span>
          </p>
        </div>
      </div>

      {/* Main Menu */}
      <div className="panel-embossed p-8 space-y-3">
        <Link
          href="/camp"
          className="btn-raised w-full px-8 py-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">⛺</span>
            <div className="text-left">
              <div className="font-display text-lg uppercase tracking-wide">Camp</div>
              <div className="text-coliseum-sand/60 text-xs normal-case tracking-normal">
                Manage gladiators and inventory
              </div>
            </div>
          </div>
          <span className="text-coliseum-bronze group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <Link
          href="/mint"
          className="btn-raised w-full px-8 py-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">🔥</span>
            <div className="text-left">
              <div className="font-display text-lg uppercase tracking-wide">The Forge</div>
              <div className="text-coliseum-sand/60 text-xs normal-case tracking-normal">
                Mint a new gladiator
              </div>
            </div>
          </div>
          <span className="text-coliseum-bronze group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <Link
          href="/arena"
          className="btn-raised w-full px-8 py-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">⚔️</span>
            <div className="text-left">
              <div className="font-display text-lg uppercase tracking-wide">Arena</div>
              <div className="text-coliseum-sand/60 text-xs normal-case tracking-normal">
                Test your gladiator in combat
              </div>
            </div>
          </div>
          <span className="text-coliseum-bronze group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <Link
          href="/quick-match"
          className="btn-raised w-full px-8 py-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">🎯</span>
            <div className="text-left">
              <div className="font-display text-lg uppercase tracking-wide">Quick Match</div>
              <div className="text-coliseum-sand/60 text-xs normal-case tracking-normal">
                Find a PvP opponent
              </div>
            </div>
          </div>
          <span className="text-coliseum-bronze group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <Link
          href="/friends"
          className="btn-raised w-full px-8 py-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">🤝</span>
            <div className="text-left">
              <div className="font-display text-lg uppercase tracking-wide">Friends</div>
              <div className="text-coliseum-sand/60 text-xs normal-case tracking-normal">
                Challenge friends to battle
              </div>
            </div>
          </div>
          <span className="text-coliseum-bronze group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-8 flex flex-col items-center gap-4">
        {isAdmin && (
          <Link href="/admin" className="btn-raised px-6 py-2 text-xs">
            War Council
          </Link>
        )}
        <SignInButton />
      </div>

      {/* Decorative Footer */}
      <div className="mt-16 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-coliseum-bronze/20" />
        <span className="text-coliseum-bronze/30 text-xs uppercase tracking-widest">
          Blood & Glory
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-coliseum-bronze/20" />
      </div>
    </div>
  </main>
)
```

**Step 2: Test home menu**

Verify:
- Menu items display in embossed panel
- Hover effects work (arrow slides right)
- All links navigate correctly
- Responsive layout works

---

### Task 12: Update Arena Page

**Goal:** Simpler arena entry screen

**Files:**
- Modify: `apps/web/app/arena/page.tsx`

**Step 1: Update arena page**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import { useCreateMatch } from '@/hooks/useCreateMatch'
import { useActiveGladiator } from '@/contexts/ActiveGladiatorContext'
import { PageTransition } from '@/components/ui/PageTransition'

export default function ArenaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { activeGladiator } = useActiveGladiator()
  const { createMatch, isCreating, error } = useCreateMatch()
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreateCpuMatch = async () => {
    if (!session?.user) {
      setCreateError('You must be signed in to enter the arena')
      return
    }

    if (!activeGladiator) {
      setCreateError('Please select a gladiator in Camp first')
      return
    }

    setCreateError(null)

    const mockGladiatorStats = {
      constitution: 10,
      strength: 10,
      dexterity: 10,
      speed: 10,
      defense: 10,
      magicResist: 10,
      arcana: 10,
      faith: 10,
    }

    const matchId = await createMatch({
      userId: session.user.id || session.user.email || 'unknown',
      gladiatorId: activeGladiator.id,
      gladiatorStats: mockGladiatorStats,
      isCpuMatch: true,
    })

    if (matchId) {
      router.push(`/match/${matchId}`)
    } else {
      setCreateError(error || 'Failed to create match')
    }
  }

  return (
    <PageTransition>
      <main className="min-h-screen bg-coliseum-black flex items-center justify-center p-6">
        <div className="panel-embossed p-8 max-w-md w-full space-y-6 text-center">
          <div className="text-6xl mb-4">⚔️</div>

          <h1 className="font-display text-3xl text-coliseum-sand uppercase tracking-wide">
            Enter the Arena
          </h1>

          <p className="text-coliseum-sand/80 uppercase tracking-wider text-sm">
            Test your skills against the AI
          </p>

          {!session && (
            <div className="panel-inset p-3">
              <p className="text-coliseum-red text-sm">
                You must be signed in to enter the arena
              </p>
            </div>
          )}

          {!activeGladiator && session && (
            <div className="panel-inset p-3">
              <p className="text-amber-400 text-sm">
                Please select a gladiator in Camp first
              </p>
            </div>
          )}

          {(createError || error) && (
            <div className="panel-inset p-3 border-coliseum-red/50">
              <p className="text-coliseum-red text-sm">
                {createError || error}
              </p>
            </div>
          )}

          {activeGladiator && (
            <div className="panel-inset p-4">
              <div className="text-coliseum-bronze text-xs uppercase tracking-wider mb-1">
                Fighting as
              </div>
              <div className="text-coliseum-sand font-display">
                {activeGladiator.name || `${activeGladiator.class} #${activeGladiator.tokenId}`}
              </div>
              <div className="text-coliseum-sand/60 text-sm">
                Level {activeGladiator.level}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={handleCreateCpuMatch}
              disabled={isCreating || !session || !activeGladiator}
              className="btn-raised px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <span className="inline-block animate-spin mr-2">⚔</span>
                  Creating Match...
                </>
              ) : (
                'Fight CPU Opponent'
              )}
            </button>

            <Link href="/camp" className="btn-raised px-8 py-3">
              Return to Camp
            </Link>
          </div>
        </div>
      </main>
    </PageTransition>
  )
}
```

**Step 2: Test arena page**

Verify:
- Shows active gladiator info
- Warns if no gladiator selected
- Create match button works
- Error messages display correctly

---

### Task 13: Update Quick Match & Friends Pages

**Goal:** Apply embossed styling to Sprint 6 pages

**Files:**
- Modify: `apps/web/app/quick-match/page.tsx`
- Modify: `apps/web/app/friends/page.tsx`

**Step 1: Update Quick Match**

Replace the existing page content with embossed styling:

```typescript
// In quick-match/page.tsx, update the return JSX:

return (
  <PageTransition>
    <main className="min-h-screen bg-coliseum-black flex items-center justify-center p-6">
      <div className="panel-embossed p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🎯</div>
          <h1 className="font-display text-3xl text-coliseum-sand uppercase">Quick Match</h1>
        </div>

        {!isSearching ? (
          <div className="space-y-4">
            <div className="panel-inset p-4">
              <label className="block mb-2 text-coliseum-sand/80 uppercase text-xs tracking-wider">
                Select Gladiator:
              </label>
              <select
                onChange={e => setSelectedGladiator(e.target.value)}
                className="w-full p-3 bg-coliseum-black border-2 border-coliseum-bronze/30 text-coliseum-sand focus:border-coliseum-bronze focus:outline-none"
              >
                <option value="">-- Select a gladiator --</option>
                <option value="placeholder-gladiator-id">Placeholder Gladiator</option>
              </select>
            </div>

            <button
              onClick={startSearch}
              disabled={!selectedGladiator}
              className="btn-raised w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Find Match
            </button>

            <Link href="/camp" className="block text-center">
              <button className="btn-raised px-6 py-2 text-xs">
                Return to Camp
              </button>
            </Link>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="text-coliseum-sand text-xl">Searching for opponent...</div>
            <div className="animate-spin w-16 h-16 border-4 border-coliseum-bronze border-t-transparent rounded-full mx-auto" />
            <button
              onClick={cancelSearch}
              className="btn-raised px-6 py-3"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </main>
  </PageTransition>
)
```

**Step 2: Update Friends Page**

Apply embossed styling to panels and buttons:

```typescript
// In friends/page.tsx, update the main content:

return (
  <PageTransition>
    <main className="min-h-screen bg-coliseum-black p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl text-coliseum-sand uppercase tracking-wide mb-8">
          Friends & Challenges
        </h1>

        {error && (
          <div className="mb-4 panel-inset p-4 border-coliseum-red/50">
            <p className="text-coliseum-red">{error}</p>
          </div>
        )}

        {/* Add Friend Section */}
        <div className="mb-8 panel-embossed p-6">
          <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
            Add Friend
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={friendUsername}
              onChange={e => setFriendUsername(e.target.value)}
              placeholder="Enter username..."
              className="flex-1 p-3 bg-coliseum-black border-2 border-coliseum-bronze/30 text-coliseum-sand focus:border-coliseum-bronze focus:outline-none placeholder:text-coliseum-sand/30"
            />
            <button
              onClick={addFriend}
              disabled={loading || !friendUsername.trim()}
              className="btn-raised px-6 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8 panel-embossed p-6">
            <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
              Pending Requests
            </h2>
            <div className="space-y-2">
              {pendingRequests.map(request => (
                <div key={request.id} className="panel-inset p-3 flex items-center justify-between">
                  <span className="text-coliseum-sand font-medium">{request.username}</span>
                  <button
                    onClick={() => acceptFriend(request.id)}
                    className="btn-raised px-4 py-1 text-xs"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="mb-8 panel-embossed p-6">
          <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
            Friends
          </h2>
          {friends.length === 0 ? (
            <p className="text-coliseum-sand/60">No friends yet. Add some!</p>
          ) : (
            <div className="space-y-2">
              {friends.map(friend => (
                <div key={friend.id} className="panel-inset p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-coliseum-sand font-medium">{friend.username}</span>
                    {friend.isOnline && (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  <button
                    onClick={() => challengeFriend(friend.id, 'placeholder-gladiator-id')}
                    className="btn-raised px-4 py-1 text-xs"
                  >
                    Challenge
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Challenges */}
        <div className="panel-embossed p-6">
          <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
            Active Challenges
          </h2>
          {challenges.length === 0 ? (
            <p className="text-coliseum-sand/60">No active challenges.</p>
          ) : (
            <div className="space-y-2">
              {challenges.map(challenge => (
                <div key={challenge.id} className="panel-inset p-3 flex items-center justify-between">
                  <div>
                    <p className="text-coliseum-sand font-medium">
                      {challenge.challenger.username} vs {challenge.opponent.username}
                    </p>
                    <p className="text-coliseum-sand/50 text-sm">Status: {challenge.status}</p>
                  </div>
                  {challenge.status === 'pending' &&
                    challenge.opponent.username === session?.user?.name && (
                      <button
                        onClick={() => acceptChallenge(challenge.id)}
                        className="btn-raised px-4 py-1 text-xs"
                      >
                        Accept
                      </button>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  </PageTransition>
)
```

**Step 3: Test both pages**

Verify:
- Embossed panels display correctly
- Buttons use raised/pressed states
- Input fields have proper styling
- Layouts are responsive

---

## Phase 5: Rewards & Polish

### Task 14: Create Reward Modal Component

**Goal:** Full-screen modal for level-ups and rare loot

**Files:**
- Create: `apps/web/components/ui/RewardModal.tsx`

**Step 1: Create modal component**

```typescript
'use client'

import { useEffect, useState } from 'react'

interface RewardModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'level-up' | 'loot'
  data: {
    title: string
    message: string
    rewards?: string[]
  }
}

export function RewardModal({ isOpen, onClose, type, data }: RewardModalProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShow(true)
    }
  }, [isOpen])

  if (!isOpen && !show) return null

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 200)
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-200 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-coliseum-black/90"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative panel-embossed p-8 max-w-md w-full mx-4 text-center transition-transform duration-200 ${
          show ? 'scale-100' : 'scale-95'
        }`}
        style={{
          boxShadow: '0 0 20px rgba(193, 143, 89, 0.3)',
        }}
      >
        {/* Icon */}
        <div className="text-7xl mb-4">
          {type === 'level-up' ? '⭐' : '🎁'}
        </div>

        {/* Title */}
        <h2 className="font-display text-3xl text-coliseum-bronze uppercase tracking-wide mb-4">
          {data.title}
        </h2>

        {/* Message */}
        <p className="text-coliseum-sand text-lg mb-6">{data.message}</p>

        {/* Rewards List */}
        {data.rewards && data.rewards.length > 0 && (
          <div className="panel-inset p-4 mb-6">
            <ul className="space-y-2">
              {data.rewards.map((reward, i) => (
                <li key={i} className="text-coliseum-sand">
                  {reward}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleClose}
          className="btn-raised px-12 py-4"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Test reward modal**

Create a test page or button to trigger the modal:
- Level-up modal shows correctly
- Loot modal shows correctly
- Overlay closes modal on click
- Continue button works
- Animation smooth

---

### Task 15: Create Slide Notification Component

**Goal:** Small notifications for minor rewards

**Files:**
- Create: `apps/web/components/ui/SlideNotification.tsx`

**Step 1: Create notification component**

```typescript
'use client'

import { useEffect, useState } from 'react'

interface SlideNotificationProps {
  message: string
  icon?: string
  duration?: number
  onClose: () => void
}

export function SlideNotification({
  message,
  icon = '✓',
  duration = 3000,
  onClose,
}: SlideNotificationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(true)

    const timer = setTimeout(() => {
      setShow(false)
      setTimeout(onClose, 150)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      className={`fixed top-24 right-6 z-50 panel-embossed px-6 py-3 flex items-center gap-3 transition-all duration-150 ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{
        boxShadow: '0 0 12px rgba(193, 143, 89, 0.2)',
      }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-coliseum-sand font-medium">{message}</span>
    </div>
  )
}
```

**Step 2: Create notification manager hook**

Create: `apps/web/hooks/useNotifications.ts`

```typescript
'use client'

import { useState, useCallback } from 'react'

interface Notification {
  id: string
  message: string
  icon?: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((message: string, icon?: string) => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, icon }])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
  }
}
```

**Step 3: Test notifications**

Create test buttons to trigger different notifications:
- Notification slides in from right
- Auto-dismisses after 3 seconds
- Multiple notifications stack correctly
- Smooth animations

---

### Task 16: Final Polish & Responsive Adjustments

**Goal:** Ensure everything works on mobile and looks polished

**Step 1: Test responsive layouts**

Check these breakpoints:
- Mobile (< 640px)
- Tablet (640-1024px)
- Desktop (> 1024px)

Pages to test:
- Home page (menu should stack on mobile)
- Camp (character sheet should stack above tabs on mobile)
- Arena (modal should be smaller on mobile)
- Quick Match (centered panel should be smaller on mobile)
- Friends (full width on mobile with padding)

**Step 2: Accessibility check**

Verify:
- All buttons have focus states
- Tab navigation works through the interface
- Color contrast meets WCAG AA
- Screen reader labels are appropriate

**Step 3: Performance check**

- Test page transitions feel snappy (< 200ms)
- No layout shift during load
- Images/icons load quickly
- Smooth animations (no jank)

---

## Verification Checklist

After completing all tasks, verify:

**Core Structure:**
- [ ] Persistent HUD shows on all pages except landing/auth
- [ ] Active gladiator displays in HUD
- [ ] Location name updates correctly
- [ ] XP bar displays and animates
- [ ] Page transitions slide smoothly (150ms)

**Visual Style:**
- [ ] All panels use embossed/inset styling
- [ ] Buttons have raised/pressed states
- [ ] Hover effects show bronze glow
- [ ] Active tabs show pressed state
- [ ] Stat bars display with correct colors

**Camp:**
- [ ] Side-by-side layout on desktop
- [ ] Character sheet shows portrait, stats, equipment
- [ ] Gladiator selector displays all gladiators
- [ ] Active gladiator has visual indicator
- [ ] Tabs switch content correctly
- [ ] Equipment slots show rarity borders
- [ ] Stat bonuses display in green

**Inventory:**
- [ ] Equipment grid displays with rarity colors
- [ ] Filter tabs work
- [ ] Loot boxes display in grid
- [ ] Empty states show correctly

**Home & Other Pages:**
- [ ] Home page shows menu-style layout
- [ ] Arena shows active gladiator
- [ ] Quick Match styled correctly
- [ ] Friends page uses embossed panels

**Rewards:**
- [ ] Reward modals display full-screen
- [ ] Slide notifications work
- [ ] Animations smooth

**Responsive:**
- [ ] Mobile layout works (< 640px)
- [ ] Tablet layout works (640-1024px)
- [ ] Desktop layout works (> 1024px)

**Accessibility:**
- [ ] Focus states visible
- [ ] Tab navigation functional
- [ ] Color contrast sufficient

---

## Next Steps

After implementation:
1. User testing to get feedback on "game feel"
2. Iterate on animations and transitions
3. Add sound effects for interactions
4. Create actual game assets to replace unicode placeholders
5. Implement Blood & Bronze custom rarity palette
6. Add location banner transitions for Arena/Forge

---

**End of Implementation Plan**
