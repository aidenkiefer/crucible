# Sprint 3: Frontend - Combat UI & Animations

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build smooth 2D combat visualization with programmer art

**Duration:** Week 3-4
**Prerequisites:** Sprint 2 complete (combat engine working)

**Architecture:** Canvas-based rendering with 60 FPS animation loop, WebSocket state synchronization, interpolation between ticks

**Tech Stack:**
- HTML5 Canvas API
- React + TypeScript
- Socket.io-client
- CSS animations for UI elements

---

## Key Components

### 1. Arena Canvas Renderer
**File:** `apps/web/components/arena/ArenaCanvas.tsx`

- 800x600 canvas
- Simple background (gradient or solid color)
- Two gladiator sprites (colored rectangles for programmer art)
- Health/stamina bars above each gladiator
- Smooth interpolation between tick states

### 2. Combat Controls
**File:** `apps/web/components/arena/CombatControls.tsx`

- 4 action buttons: Light Attack, Heavy Attack, Block, Dodge
- Stamina cost indicator on each button
- Disabled state when insufficient stamina
- Keyboard shortcuts (Q, W, E, R)

### 3. Combat Log
**File:** `apps/web/components/arena/CombatLog.tsx`

- Scrollable log of recent actions
- Color-coded: attacks (red), defenses (blue), dodges (green)
- Auto-scroll to latest entry

### 4. Match Result Screen
**File:** `apps/web/components/arena/MatchResult.tsx`

- Victory/Defeat display
- XP gained
- Match statistics (damage dealt, actions taken)
- "Fight Again" button

---

## Task 1: Arena Canvas (2.5 hours)

### Gladiator Sprite (Programmer Art)

```typescript
// Simple colored rectangle + label
function drawGladiator(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, name: string) {
  // Body
  ctx.fillStyle = color
  ctx.fillRect(x, y, 40, 60)

  // Name label
  ctx.fillStyle = '#000'
  ctx.font = '12px Arial'
  ctx.fillText(name, x - 10, y - 10)
}
```

### Animation System

- Idle: gentle bobbing motion
- Attack: quick forward lunge
- Block: defensive stance (hands up)
- Dodge: quick sidestep
- Hit: flash red + knockback
- Death: fade out + fall

---

## Task 2: Combat Controls (1.5 hours)

### Action Button Component

```typescript
interface ActionButtonProps {
  action: CombatAction
  staminaCost: number
  currentStamina: number
  onAction: (action: CombatAction) => void
  disabled: boolean
}

function ActionButton({ action, staminaCost, currentStamina, onAction, disabled }: ActionButtonProps) {
  const canAfford = currentStamina >= staminaCost

  return (
    <button
      onClick={() => onAction(action)}
      disabled={disabled || !canAfford}
      className={`action-btn ${!canAfford ? 'insufficient-stamina' : ''}`}
    >
      <div className="action-name">{action}</div>
      <div className="stamina-cost">{staminaCost} stamina</div>
    </button>
  )
}
```

---

## Task 3: WebSocket Integration (2 hours)

### Match Connection Hook

```typescript
function useMatchConnection(matchId: string) {
  const [combatState, setCombatState] = useState<CombatState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socket = useSocket()

  useEffect(() => {
    if (!socket || !matchId) return

    socket.emit('match:join', { matchId })

    socket.on('match:tick', (state: CombatState) => {
      setCombatState(state)
    })

    socket.on('match:complete', ({ winnerId, finalState }) => {
      setCombatState(finalState)
      // Show result screen
    })

    setIsConnected(true)

    return () => {
      socket.off('match:tick')
      socket.off('match:complete')
    }
  }, [socket, matchId])

  const submitAction = (action: CombatAction) => {
    if (socket && matchId) {
      socket.emit('match:submit-action', { matchId, action })
    }
  }

  return { combatState, isConnected, submitAction }
}
```

---

## Task 4: Match Page (1.5 hours)

**File:** `apps/web/app/match/[matchId]/page.tsx`

```typescript
'use client'

import { useParams } from 'next/navigation'
import { ArenaCanvas } from '@/components/arena/ArenaCanvas'
import { CombatControls } from '@/components/arena/CombatControls'
import { CombatLog } from '@/components/arena/CombatLog'
import { useMatchConnection } from '@/hooks/useMatchConnection'

export default function MatchPage() {
  const params = useParams()
  const matchId = params.matchId as string

  const { combatState, isConnected, submitAction } = useMatchConnection(matchId)

  if (!isConnected || !combatState) {
    return <div>Connecting to match...</div>
  }

  return (
    <div className="match-container">
      <ArenaCanvas combatState={combatState} />
      <CombatControls
        combatState={combatState}
        onAction={submitAction}
      />
      <CombatLog log={combatState.log} />
    </div>
  )
}
```

---

## Verification Checklist

- [ ] Arena renders at 60 FPS
- [ ] Gladiator sprites animate smoothly
- [ ] Health/stamina bars update in real-time
- [ ] Action buttons work correctly
- [ ] Combat log displays all actions
- [ ] Match result screen shows after victory/defeat
- [ ] XP gain displayed
- [ ] "Fight Again" creates new match

---

## Next Sprint

**Sprint 4: Progression & Loot Systems**

See: `docs/plans/05-sprint-4-progression-loot.md`
