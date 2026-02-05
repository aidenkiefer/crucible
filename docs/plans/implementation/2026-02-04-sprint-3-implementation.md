# Sprint 3 Frontend Real-Time Combat UI - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build real-time 2D combat visualization with WASD controls, smooth movement, and Duelist sprite rendering.

**Architecture:** Canvas-based 60 FPS rendering with sprite animation system, client prediction, server reconciliation via WebSocket, and input streaming.

**Tech Stack:**
- HTML5 Canvas API (2D context, image rendering)
- React + TypeScript hooks
- Socket.io-client (WebSocket)
- Duelist sprite assets (48x48 pixel art, 4 directions, idle animation)

**Key Implementation Notes:**
- Sprite assets already generated at `apps/web/public/assets/sprites/characters/duelist_base/`
- Uses `manifest.json` for runtime asset loading
- Pixel art must use nearest-neighbor scaling (no blur)
- Design colors from Blood & Bronze palette (Dark Stone #1E1B18, Blood Red #8E1C1C, Cyan #2EE6D6)

---

## Task 1: Sprite Loading System

**Files:**
- Create: `apps/web/lib/sprites/types.ts`
- Create: `apps/web/lib/sprites/SpriteLoader.ts`
- Create: `apps/web/lib/sprites/AnimationPlayer.ts`

### Step 1: Create sprite type definitions

**File:** `apps/web/lib/sprites/types.ts`

```typescript
export interface SpriteManifest {
  characterKey: string
  className: string
  canvasSize: number
  directions: number
  basePath: string
  rotations: {
    south: string
    west: string
    east: string
    north: string
  }
  animations: {
    [animKey: string]: AnimationData
  }
  metadata: {
    generated: string
    pixelLabCharacterId: string
    prompt: string
  }
}

export interface AnimationData {
  sourceAnimation: string
  frameCount: number
  frameRate: number
  loop: boolean
  frames: {
    south: string[]
    west: string[]
    east: string[]
    north: string[]
  }
}

export type Direction = 'south' | 'west' | 'east' | 'north'

export interface LoadedSprite {
  manifest: SpriteManifest
  rotationImages: Map<Direction, HTMLImageElement>
  animationFrames: Map<string, Map<Direction, HTMLImageElement[]>>
}
```

**Expected:** TypeScript types compile without errors.

### Step 2: Implement sprite loader

**File:** `apps/web/lib/sprites/SpriteLoader.ts`

```typescript
import { SpriteManifest, LoadedSprite, Direction } from './types'

export class SpriteLoader {
  private cache = new Map<string, LoadedSprite>()

  async loadCharacter(characterKey: string): Promise<LoadedSprite> {
    // Check cache first
    if (this.cache.has(characterKey)) {
      return this.cache.get(characterKey)!
    }

    // Load manifest
    const manifestPath = `/assets/sprites/characters/${characterKey}/manifest.json`
    const response = await fetch(manifestPath)
    if (!response.ok) {
      throw new Error(`Failed to load manifest for ${characterKey}`)
    }
    const manifest: SpriteManifest = await response.json()

    // Load rotation images
    const rotationImages = new Map<Direction, HTMLImageElement>()
    const rotationPromises = Object.entries(manifest.rotations).map(
      async ([direction, path]) => {
        const img = await this.loadImage(
          `${manifest.basePath}/${path}`
        )
        rotationImages.set(direction as Direction, img)
      }
    )
    await Promise.all(rotationPromises)

    // Load animation frames
    const animationFrames = new Map<
      string,
      Map<Direction, HTMLImageElement[]>
    >()

    for (const [animKey, animData] of Object.entries(manifest.animations)) {
      const directionFrames = new Map<Direction, HTMLImageElement[]>()

      for (const [direction, framePaths] of Object.entries(animData.frames)) {
        const frames = await Promise.all(
          framePaths.map((path) =>
            this.loadImage(`${manifest.basePath}/${path}`)
          )
        )
        directionFrames.set(direction as Direction, frames)
      }

      animationFrames.set(animKey, directionFrames)
    }

    const loadedSprite: LoadedSprite = {
      manifest,
      rotationImages,
      animationFrames,
    }

    this.cache.set(characterKey, loadedSprite)
    return loadedSprite
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
      img.src = src
    })
  }
}

// Singleton instance
export const spriteLoader = new SpriteLoader()
```

**Expected:** SpriteLoader can load manifest and images asynchronously.

### Step 3: Implement animation player

**File:** `apps/web/lib/sprites/AnimationPlayer.ts`

```typescript
import { AnimationData, Direction } from './types'

export class AnimationPlayer {
  private currentFrame = 0
  private lastFrameTime = 0
  private isPlaying = false

  constructor(
    private animationData: AnimationData,
    private frames: Map<Direction, HTMLImageElement[]>
  ) {}

  start() {
    this.isPlaying = true
    this.currentFrame = 0
    this.lastFrameTime = Date.now()
  }

  stop() {
    this.isPlaying = false
    this.currentFrame = 0
  }

  pause() {
    this.isPlaying = false
  }

  resume() {
    this.isPlaying = true
    this.lastFrameTime = Date.now()
  }

  getCurrentFrame(direction: Direction): HTMLImageElement | null {
    const directionFrames = this.frames.get(direction)
    if (!directionFrames || directionFrames.length === 0) return null

    return directionFrames[this.currentFrame]
  }

  update() {
    if (!this.isPlaying) return

    const now = Date.now()
    const frameDuration = 1000 / this.animationData.frameRate
    const elapsed = now - this.lastFrameTime

    if (elapsed >= frameDuration) {
      this.currentFrame++

      if (this.currentFrame >= this.animationData.frameCount) {
        if (this.animationData.loop) {
          this.currentFrame = 0
        } else {
          this.currentFrame = this.animationData.frameCount - 1
          this.isPlaying = false
        }
      }

      this.lastFrameTime = now
    }
  }
}
```

**Expected:** AnimationPlayer advances frames at correct rate, loops appropriately.

### Step 4: Commit sprite system

```bash
git add apps/web/lib/sprites/
git commit -m "feat(sprites): add sprite loading and animation system

- Add type definitions for sprites and animations
- Implement SpriteLoader with caching
- Implement AnimationPlayer with frame timing
- Supports 4-directional sprites and looping animations"
```

---

## Task 2: Canvas Renderer with Sprite Support

**Files:**
- Create: `apps/web/components/arena/interpolation.ts`
- Create: `apps/web/components/arena/renderer.ts`

### Step 1: Create interpolation utilities

**File:** `apps/web/components/arena/interpolation.ts`

```typescript
import { Vec2 } from '@gladiator/shared/src/combat/types'

export interface InterpolatedState {
  pos: Vec2
  facing: number
}

/**
 * Interpolate between two positions for smooth movement
 */
export function interpolatePosition(
  from: Vec2,
  to: Vec2,
  alpha: number
): Vec2 {
  return {
    x: from.x + (to.x - from.x) * alpha,
    y: from.y + (to.y - from.y) * alpha,
  }
}

/**
 * Interpolate angle (handles wraparound)
 */
export function interpolateAngle(
  from: number,
  to: number,
  alpha: number
): number {
  let diff = to - from
  // Normalize to [-PI, PI]
  while (diff > Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI

  return from + diff * alpha
}

/**
 * Smooth lerp for reconciliation
 */
export function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha
}
```

**Expected:** Interpolation functions handle position and angle smoothly.

### Step 2: Implement canvas renderer with sprite support

**File:** `apps/web/components/arena/renderer.ts`

```typescript
import { UnitState } from '@gladiator/shared/src/combat/types'
import { Direction } from '@/lib/sprites/types'

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private scale: number = 10 // 10 pixels per game unit

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  clear() {
    // Dark stone background (from design guidelines)
    this.ctx.fillStyle = '#1E1B18'
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }

  drawArena(width: number, height: number) {
    // Draw arena bounds with darker stone color
    this.ctx.strokeStyle = '#4a4a6a'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(0, 0, width * this.scale, height * this.scale)

    // Draw center line (subtle sand color)
    this.ctx.strokeStyle = '#3a3a4a'
    this.ctx.setLineDash([5, 5])
    this.ctx.beginPath()
    this.ctx.moveTo((width / 2) * this.scale, 0)
    this.ctx.lineTo((width / 2) * this.scale, height * this.scale)
    this.ctx.stroke()
    this.ctx.setLineDash([])
  }

  drawUnit(
    unit: UnitState,
    sprite: HTMLImageElement | null,
    isPlayer: boolean
  ) {
    const x = unit.pos.x * this.scale
    const y = unit.pos.y * this.scale

    if (sprite) {
      // Draw sprite centered on position
      // Sprite is 48x48, so offset by half to center
      const spriteX = x - sprite.width / 2
      const spriteY = y - sprite.height / 2

      // Use NEAREST NEIGHBOR scaling for pixel art
      this.ctx.imageSmoothingEnabled = false

      this.ctx.drawImage(sprite, spriteX, spriteY)

      // Draw i-frame indicator around sprite
      if (unit.isInvulnerable) {
        this.ctx.strokeStyle = '#2EE6D6' // Cyan from design guidelines
        this.ctx.lineWidth = 2
        const radius = sprite.width / 2 + 3
        this.ctx.beginPath()
        this.ctx.arc(x, y, radius, 0, Math.PI * 2)
        this.ctx.stroke()
      }

      // HP/Stamina bars positioned above sprite
      const barY = spriteY - 10
      this.drawStatusBars(unit, x, barY, isPlayer)
    } else {
      // Fallback: draw colored circle if sprite not loaded
      this.drawFallbackUnit(unit, x, y, isPlayer)
    }

    // Draw name
    const nameY = y - 40
    this.ctx.fillStyle = isPlayer ? '#4ade80' : '#ef4444'
    this.ctx.font = '12px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(unit.name, x, nameY)
  }

  private drawStatusBars(
    unit: UnitState,
    centerX: number,
    y: number,
    isPlayer: boolean
  ) {
    const barWidth = 48 // Match sprite width
    const barHeight = 4
    const barX = centerX - barWidth / 2

    // HP bar background
    this.ctx.fillStyle = '#222'
    this.ctx.fillRect(barX, y, barWidth, barHeight)

    // HP bar fill (Blood Red when low, from design guidelines)
    const hpPercent = unit.hp / unit.derived.hpMax
    if (hpPercent > 0.5) {
      this.ctx.fillStyle = '#4ade80' // Green
    } else if (hpPercent > 0.25) {
      this.ctx.fillStyle = '#fbbf24' // Yellow
    } else {
      this.ctx.fillStyle = '#8E1C1C' // Blood Red
    }
    this.ctx.fillRect(barX, y, barWidth * hpPercent, barHeight)

    // Stamina bar
    const stamBarY = y + barHeight + 1
    this.ctx.fillStyle = '#1a1a1a'
    this.ctx.fillRect(barX, stamBarY, barWidth, barHeight - 1)

    const stamPercent = unit.stamina / unit.derived.stamMax
    this.ctx.fillStyle = '#3b82f6' // Blue
    this.ctx.fillRect(barX, stamBarY, barWidth * stamPercent, barHeight - 1)
  }

  private drawFallbackUnit(
    unit: UnitState,
    x: number,
    y: number,
    isPlayer: boolean
  ) {
    const radius = 8
    const color = isPlayer ? '#4ade80' : '#ef4444'

    // Draw facing indicator
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 3
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
    this.ctx.lineTo(
      x + Math.cos(unit.facing) * 20,
      y + Math.sin(unit.facing) * 20
    )
    this.ctx.stroke()

    // Draw body
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    this.ctx.fill()

    // Draw i-frame indicator
    if (unit.isInvulnerable) {
      this.ctx.strokeStyle = '#2EE6D6'
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.arc(x, y, radius + 3, 0, Math.PI * 2)
      this.ctx.stroke()
    }

    const barY = y - radius - 15
    this.drawStatusBars(unit, x, barY, isPlayer)
  }

  /**
   * Convert facing angle (radians) to sprite direction
   * Facing 0 = East, PI/2 = South, PI = West, 3PI/2 = North
   */
  facingToDirection(facing: number): Direction {
    // Normalize to 0-2PI
    let normalized = facing % (2 * Math.PI)
    if (normalized < 0) normalized += 2 * Math.PI

    // Map to 4 directions (45 degree zones around each cardinal)
    if (normalized >= 7 * Math.PI / 4 || normalized < Math.PI / 4) {
      return 'east'
    } else if (normalized >= Math.PI / 4 && normalized < 3 * Math.PI / 4) {
      return 'south'
    } else if (normalized >= 3 * Math.PI / 4 && normalized < 5 * Math.PI / 4) {
      return 'west'
    } else {
      return 'north'
    }
  }
}
```

**Expected:** Renderer draws sprites with pixel-perfect scaling and fallback circles.

### Step 3: Commit renderer

```bash
git add apps/web/components/arena/interpolation.ts apps/web/components/arena/renderer.ts
git commit -m "feat(arena): add canvas renderer with sprite support

- Implement interpolation utilities for smooth movement
- Add Renderer class with sprite drawing
- Support fallback to colored circles if sprites fail
- Use design guidelines colors (Dark Stone, Blood Red, Cyan)
- Disable image smoothing for crisp pixel art"
```

---

## Task 3: Arena Canvas Component

**Files:**
- Create: `apps/web/components/arena/ArenaCanvas.tsx`

### Step 1: Implement ArenaCanvas with sprite loading

**File:** `apps/web/components/arena/ArenaCanvas.tsx`

```typescript
'use client'

import { useRef, useEffect, useState } from 'react'
import { CombatState } from '@gladiator/shared/src/combat/types'
import { Renderer } from './renderer'
import { interpolatePosition, interpolateAngle } from './interpolation'
import { spriteLoader } from '@/lib/sprites/SpriteLoader'
import { AnimationPlayer } from '@/lib/sprites/AnimationPlayer'
import { LoadedSprite } from '@/lib/sprites/types'

interface ArenaCanvasProps {
  combatState: CombatState | null
  playerUnitId: string
}

export function ArenaCanvas({ combatState, playerUnitId }: ArenaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const animationFrameRef = useRef<number>()

  // Sprite loading state
  const [duelistSprite, setDuelistSprite] = useState<LoadedSprite | null>(null)
  const [animationPlayers, setAnimationPlayers] = useState<Map<string, AnimationPlayer>>(
    new Map()
  )

  // Store previous state for interpolation
  const prevStateRef = useRef<CombatState | null>(null)
  const stateReceivedAtRef = useRef<number>(0)

  // Load Duelist sprite on mount
  useEffect(() => {
    spriteLoader.loadCharacter('duelist_base').then((sprite) => {
      setDuelistSprite(sprite)

      // Create animation player for idle animation
      const idleFrames = sprite.animationFrames.get('idle')
      if (idleFrames) {
        const player = new AnimationPlayer(
          sprite.manifest.animations.idle,
          idleFrames
        )
        player.start()

        const players = new Map()
        players.set('idle', player)
        setAnimationPlayers(players)
      }
    }).catch((err) => {
      console.error('Failed to load Duelist sprite:', err)
    })
  }, [])

  useEffect(() => {
    if (combatState) {
      prevStateRef.current = combatState
      stateReceivedAtRef.current = Date.now()
    }
  }, [combatState])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    rendererRef.current = new Renderer(ctx)

    // Render loop at 60 FPS
    let lastTime = Date.now()

    const renderFrame = () => {
      const now = Date.now()
      const deltaTime = (now - lastTime) / 1000
      lastTime = now

      if (rendererRef.current && combatState) {
        const renderer = rendererRef.current

        renderer.clear()
        renderer.drawArena(
          combatState.arena.width,
          combatState.arena.height
        )

        // Update all animation players
        animationPlayers.forEach((player) => player.update())

        // Calculate interpolation alpha
        // Server sends at 20Hz (50ms), interpolate between snapshots
        const timeSinceUpdate = now - stateReceivedAtRef.current
        const interpolationWindow = 50 // ms (assuming 20Hz server)
        const alpha = Math.min(1, timeSinceUpdate / interpolationWindow)

        // Render units
        for (const [unitId, unit] of combatState.units.entries()) {
          const isPlayer = unitId === playerUnitId

          // For opponent: interpolate between last two states
          // For player: render directly (prediction handled separately)
          const renderUnit = { ...unit }

          if (!isPlayer && prevStateRef.current) {
            const prevUnit = prevStateRef.current.units.get(unitId)
            if (prevUnit) {
              renderUnit.pos = interpolatePosition(prevUnit.pos, unit.pos, alpha)
              renderUnit.facing = interpolateAngle(prevUnit.facing, unit.facing, alpha)
            }
          }

          // Get sprite frame for current direction
          let spriteFrame: HTMLImageElement | null = null
          if (duelistSprite) {
            const direction = renderer.facingToDirection(renderUnit.facing)
            const idlePlayer = animationPlayers.get('idle')
            if (idlePlayer) {
              spriteFrame = idlePlayer.getCurrentFrame(direction)
            }
          }

          renderer.drawUnit(renderUnit, spriteFrame, isPlayer)
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame)
    }

    renderFrame()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [combatState, playerUnitId, duelistSprite, animationPlayers])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="border-2 border-gray-700 rounded-lg bg-[#1E1B18]"
      />
      {!duelistSprite && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading sprites...</p>
        </div>
      )}
    </div>
  )
}
```

**Expected:** Canvas renders at 60 FPS with sprite animation, shows loading state.

### Step 2: Commit ArenaCanvas

```bash
git add apps/web/components/arena/ArenaCanvas.tsx
git commit -m "feat(arena): add ArenaCanvas component with sprite rendering

- Load Duelist sprite on mount
- Create animation player for idle animation
- Render sprites at 60 FPS with interpolation
- Show loading state while sprites load
- Update animation players each frame"
```

---

## Task 4: Input Handling

**Files:**
- Create: `apps/web/hooks/useGameInput.ts`

### Step 1: Implement input handler hook

**File:** `apps/web/hooks/useGameInput.ts`

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'

interface GameInput {
  moveX: number
  moveY: number
  facing: number
  actions: string[]
}

export function useGameInput(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const [input, setInput] = useState<GameInput>({
    moveX: 0,
    moveY: 0,
    facing: 0,
    actions: [],
  })

  const keysPressed = useRef<Set<string>>(new Set())
  const mousePos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())

      // Action keys
      if (e.key === ' ' && !e.repeat) {
        // Space: Attack
        setInput((prev) => ({
          ...prev,
          actions: [...prev.actions, 'Attack'],
        }))
      } else if (e.key === 'Shift' && !e.repeat) {
        // Shift: Dodge
        setInput((prev) => ({
          ...prev,
          actions: [...prev.actions, 'Dodge'],
        }))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)

    // Update input state based on keys pressed
    const inputInterval = setInterval(() => {
      let moveX = 0
      let moveY = 0

      if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) moveY = -1
      if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) moveY = 1
      if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) moveX = -1
      if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) moveX = 1

      // Calculate facing from mouse position relative to canvas center
      const facing = Math.atan2(mousePos.current.y - 250, mousePos.current.x - 250)

      setInput((prev) => ({
        moveX,
        moveY,
        facing,
        actions: [], // Actions are one-time, clear after sending
      }))
    }, 16) // ~60Hz

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(inputInterval)
    }
  }, [canvasRef])

  return input
}
```

**Expected:** Input hook captures WASD, mouse position, and action keys at 60Hz.

### Step 2: Commit input hook

```bash
git add apps/web/hooks/useGameInput.ts
git commit -m "feat(input): add useGameInput hook for WASD + mouse controls

- Capture WASD movement keys at 60Hz
- Track mouse position for facing calculation
- Handle Space (attack) and Shift (dodge) actions
- Clear one-time actions after reading"
```

---

## Task 5: WebSocket Integration

**Files:**
- Create: `apps/web/hooks/useRealTimeMatch.ts`

### Step 1: Check if useSocket hook exists

Run: `ls apps/web/hooks/useSocket.ts`

**Expected:** Either file exists (from Sprint 2) or needs to be created.

**If file doesn't exist**, create it:

**File:** `apps/web/hooks/useSocket.ts`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001', {
        transports: ['websocket'],
      })

      socket.on('connect', () => {
        console.log('Socket connected')
        setIsConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })
    }

    return () => {
      if (socket) {
        socket.off('connect')
        socket.off('disconnect')
      }
    }
  }, [])

  return socket
}
```

### Step 2: Implement real-time match hook

**File:** `apps/web/hooks/useRealTimeMatch.ts`

```typescript
'use client'

import { useEffect, useState, useRef } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { CombatState } from '@gladiator/shared/src/combat/types'

export function useRealTimeMatch(matchId: string, gladiatorId: string) {
  const [combatState, setCombatState] = useState<CombatState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const socket = useSocket()

  // Throttle input submission to avoid flooding server
  const lastInputSent = useRef<number>(0)
  const inputThrottle = 16 // ms (~60Hz)

  useEffect(() => {
    if (!socket || !matchId) return

    // Join match room
    socket.emit('match:join', { matchId })

    // Listen for state updates (20Hz from server)
    socket.on('match:state', (state: CombatState) => {
      setCombatState(state)

      if (state.isComplete) {
        setIsComplete(true)
      }
    })

    // Listen for match completion
    socket.on('match:complete', ({ winnerId, finalState }) => {
      setCombatState(finalState)
      setIsComplete(true)
    })

    setIsConnected(true)

    return () => {
      socket.off('match:state')
      socket.off('match:complete')
      socket.emit('match:leave', { matchId })
    }
  }, [socket, matchId])

  const submitInput = (input: {
    moveX: number
    moveY: number
    facing?: number
    actions?: string[]
  }) => {
    if (!socket || !isConnected) return

    const now = Date.now()
    if (now - lastInputSent.current < inputThrottle) return

    socket.emit('match:input', {
      matchId,
      gladiatorId,
      input,
    })

    lastInputSent.current = now
  }

  return {
    combatState,
    isConnected,
    isComplete,
    submitInput,
  }
}
```

**Expected:** Hook connects to match via WebSocket, receives 20Hz state updates.

### Step 3: Commit WebSocket hooks

```bash
git add apps/web/hooks/useSocket.ts apps/web/hooks/useRealTimeMatch.ts
git commit -m "feat(websocket): add real-time match WebSocket integration

- Add useSocket hook for Socket.io connection
- Implement useRealTimeMatch for match state + input submission
- Throttle input to 60Hz to avoid flooding server
- Handle match:state (20Hz) and match:complete events"
```

---

## Task 6: Match HUD Component

**Files:**
- Create: `apps/web/components/arena/MatchHUD.tsx`

### Step 1: Implement MatchHUD

**File:** `apps/web/components/arena/MatchHUD.tsx`

```typescript
'use client'

import { UnitState } from '@gladiator/shared/src/combat/types'

interface MatchHUDProps {
  playerUnit: UnitState | null
}

export function MatchHUD({ playerUnit }: MatchHUDProps) {
  if (!playerUnit) return null

  const hpPercent = (playerUnit.hp / playerUnit.derived.hpMax) * 100
  const stamPercent = (playerUnit.stamina / playerUnit.derived.stamMax) * 100

  const attackCooldown = playerUnit.cooldowns['Attack'] ?? 0
  const dodgeCooldown = playerUnit.cooldowns['Dodge'] ?? 0

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 p-4 rounded-lg border border-gray-700 min-w-[400px]">
      {/* HP Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Health</span>
          <span>{Math.round(playerUnit.hp)} / {playerUnit.derived.hpMax}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Stamina Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Stamina</span>
          <span>{Math.round(playerUnit.stamina)} / {playerUnit.derived.stamMax}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${stamPercent}%` }}
          />
        </div>
      </div>

      {/* Cooldown Indicators */}
      <div className="flex gap-4 justify-center">
        <div className="text-center">
          <div className={`text-xs mb-1 ${attackCooldown > 0 ? 'text-gray-500' : 'text-green-400'}`}>
            Attack [SPACE]
          </div>
          {attackCooldown > 0 && (
            <div className="text-xs text-gray-400">{(attackCooldown / 1000).toFixed(1)}s</div>
          )}
        </div>

        <div className="text-center">
          <div className={`text-xs mb-1 ${dodgeCooldown > 0 ? 'text-gray-500' : 'text-cyan-400'}`}>
            Dodge [SHIFT]
          </div>
          {dodgeCooldown > 0 && (
            <div className="text-xs text-gray-400">{(dodgeCooldown / 1000).toFixed(1)}s</div>
          )}
        </div>
      </div>

      {/* Controls hint */}
      <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500 text-center">
        WASD: Move | Mouse: Aim | SPACE: Attack | SHIFT: Dodge
      </div>
    </div>
  )
}
```

**Expected:** HUD displays HP, stamina, cooldowns, and controls hint.

### Step 2: Commit MatchHUD

```bash
git add apps/web/components/arena/MatchHUD.tsx
git commit -m "feat(arena): add MatchHUD component for player status

- Display HP and stamina bars with percentages
- Show attack and dodge cooldowns
- Indicate controls (WASD, Space, Shift)
- Position at bottom center of screen"
```

---

## Task 7: Match Page

**Files:**
- Create: `apps/web/app/match/[matchId]/page.tsx`

### Step 1: Implement match page

**File:** `apps/web/app/match/[matchId]/page.tsx`

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { ArenaCanvas } from '@/components/arena/ArenaCanvas'
import { MatchHUD } from '@/components/arena/MatchHUD'
import { useRealTimeMatch } from '@/hooks/useRealTimeMatch'
import { useGameInput } from '@/hooks/useGameInput'

export default function MatchPage() {
  const params = useParams()
  const { data: session } = useSession()
  const matchId = params.matchId as string

  // TODO: Load gladiator ID from match data or query param
  const gladiatorId = 'player-gladiator-id'

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { combatState, isConnected, isComplete, submitInput } = useRealTimeMatch(matchId, gladiatorId)
  const input = useGameInput(canvasRef)

  // Submit input continuously
  useEffect(() => {
    if (isConnected && !isComplete) {
      submitInput(input)
    }
  }, [input, isConnected, isComplete, submitInput])

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1E1B18]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Connecting to match...</p>
        </div>
      </div>
    )
  }

  const playerUnit = combatState?.units.get(gladiatorId) ?? null

  return (
    <div className="min-h-screen bg-[#1E1B18] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">
          Combat Arena
        </h1>

        <div className="flex justify-center mb-4">
          <ArenaCanvas
            combatState={combatState}
            playerUnitId={gladiatorId}
          />
        </div>

        <MatchHUD playerUnit={playerUnit} />

        {isComplete && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-gray-900 p-8 rounded-lg border-2 border-gray-700 text-center">
              <h2 className="text-3xl font-bold mb-4">
                {combatState?.winnerId === gladiatorId ? (
                  <span className="text-green-500">Victory!</span>
                ) : (
                  <span className="text-red-500">Defeat</span>
                )}
              </h2>
              <button
                onClick={() => window.location.reload()}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                Fight Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Expected:** Match page connects, renders arena + HUD, handles victory/defeat.

### Step 2: Commit match page

```bash
git add apps/web/app/match/\[matchId\]/page.tsx
git commit -m "feat(match): add match page with real-time combat UI

- Connect to WebSocket for match state
- Render ArenaCanvas with sprite animations
- Display MatchHUD with player status
- Handle victory/defeat screen
- Submit WASD + mouse input continuously"
```

---

## Verification

### Manual Testing

Run: `npm run dev` (in apps/web)

**Test sprite loading:**
1. Navigate to `/match/test-match-id`
2. Verify "Loading sprites..." appears briefly
3. Verify Duelist sprite renders after loading
4. Verify idle animation plays smoothly (4 frames @ 8 FPS)

**Test input:**
1. Press WASD keys
2. Move mouse around canvas
3. Verify sprite rotates to face mouse direction
4. Press Space (attack)
5. Press Shift (dodge)

**Test rendering:**
1. Open browser DevTools > Performance
2. Record for 5 seconds
3. Verify consistent 60 FPS
4. Verify no frame drops or stuttering

**Test fallback:**
1. Temporarily break sprite path in manifest.json
2. Reload page
3. Verify colored circles render instead
4. Fix path and verify sprites return

### Checklist

Sprint 3 verification checklist from plan:

**Sprite Rendering:**
- [ ] Duelist sprite loads successfully
- [ ] Idle animation plays smoothly (4 frames @ 8 FPS)
- [ ] Sprite faces correct direction based on facing angle
- [ ] Sprite is centered on unit position
- [ ] Pixel art is crisp (no blurring from image smoothing)
- [ ] Fallback to colored circle if sprite fails to load

**Real-Time Movement:**
- [ ] WASD keys move player smoothly
- [ ] Mouse controls facing direction
- [ ] Sprite updates direction as character rotates
- [ ] Player movement is responsive (no lag)
- [ ] Player cannot move outside arena bounds
- [ ] Opponent movement interpolates smoothly

**Combat Actions:**
- [ ] Space bar triggers attack
- [ ] Shift key triggers dodge roll
- [ ] Cooldown indicators show on HUD
- [ ] Cannot attack/dodge while on cooldown
- [ ] Cannot attack/dodge without stamina

**Visual Feedback:**
- [ ] HP bars positioned above sprite
- [ ] Stamina bars positioned above sprite
- [ ] HP bar uses Blood Red (#8E1C1C) when low
- [ ] I-frame visual (cyan #2EE6D6 ring) appears during dodge around sprite
- [ ] Smooth 60 FPS rendering with sprite animations
- [ ] Background uses Dark Stone (#1E1B18) color

**Match Flow:**
- [ ] Can create CPU match from lobby
- [ ] Match starts immediately after creation
- [ ] Combat runs at 20Hz server-side
- [ ] Match ends when one gladiator reaches 0 HP
- [ ] Victory/defeat screen shows correctly
- [ ] "Fight Again" button creates new match

---

## Summary

**Deliverables:**
- Sprite loading system (types, loader, animation player)
- Canvas renderer with sprite support
- ArenaCanvas component with 60 FPS rendering
- Input handling (WASD + mouse + actions)
- WebSocket integration (match state + input submission)
- MatchHUD component (HP, stamina, cooldowns)
- Match page with complete combat UI

**Total commits:** 7

**Next steps:** Once Sprint 3 is verified working, proceed to Sprint 4 (Additional Weapons & Projectiles).

---

**Plan complete!**
