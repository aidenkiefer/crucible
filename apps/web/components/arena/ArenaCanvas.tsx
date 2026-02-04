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
  playerGladiatorId: string
}

export function ArenaCanvas({ combatState, playerGladiatorId }: ArenaCanvasProps) {
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

  // Update previous state reference when new state arrives
  useEffect(() => {
    if (combatState) {
      prevStateRef.current = combatState
      stateReceivedAtRef.current = Date.now()
    }
  }, [combatState])

  // 60 FPS render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    rendererRef.current = new Renderer(ctx)

    let lastTime = Date.now()

    const renderFrame = () => {
      const now = Date.now()
      const deltaTime = (now - lastTime) / 1000
      lastTime = now

      if (rendererRef.current && combatState) {
        const renderer = rendererRef.current

        renderer.clear()
        renderer.drawArena()

        // Update all animation players
        animationPlayers.forEach((player) => player.update())

        // Calculate interpolation alpha
        // Server sends at 20Hz (50ms), interpolate between snapshots
        const timeSinceUpdate = now - stateReceivedAtRef.current
        const interpolationWindow = 50 // ms (assuming 20Hz server)
        const alpha = Math.min(1, timeSinceUpdate / interpolationWindow)

        // Render combatant1
        const combatant1 = combatState.combatant1
        const isPlayer1 = combatant1.id === playerGladiatorId

        // Interpolate opponent movement (not player - prediction handled separately)
        let renderCombatant1 = { ...combatant1 }
        if (!isPlayer1 && prevStateRef.current) {
          const prevCombatant1 = prevStateRef.current.combatant1
          renderCombatant1 = {
            ...combatant1,
            position: interpolatePosition(prevCombatant1.position, combatant1.position, alpha),
            facingAngle: interpolateAngle(prevCombatant1.facingAngle, combatant1.facingAngle, alpha),
          }
        }

        // Get sprite frame for current direction
        let spriteFrame1: HTMLImageElement | null = null
        if (duelistSprite) {
          const direction1 = renderer.facingToDirection(renderCombatant1.facingAngle)
          const idlePlayer = animationPlayers.get('idle')
          if (idlePlayer) {
            spriteFrame1 = idlePlayer.getCurrentFrame(direction1)
          }
        }

        renderer.drawUnit(renderCombatant1, spriteFrame1, isPlayer1, 'Player 1')

        // Render combatant2
        const combatant2 = combatState.combatant2
        const isPlayer2 = combatant2.id === playerGladiatorId

        // Interpolate opponent movement
        let renderCombatant2 = { ...combatant2 }
        if (!isPlayer2 && prevStateRef.current) {
          const prevCombatant2 = prevStateRef.current.combatant2
          renderCombatant2 = {
            ...combatant2,
            position: interpolatePosition(prevCombatant2.position, combatant2.position, alpha),
            facingAngle: interpolateAngle(prevCombatant2.facingAngle, combatant2.facingAngle, alpha),
          }
        }

        // Get sprite frame for combatant2
        let spriteFrame2: HTMLImageElement | null = null
        if (duelistSprite) {
          const direction2 = renderer.facingToDirection(renderCombatant2.facingAngle)
          const idlePlayer = animationPlayers.get('idle')
          if (idlePlayer) {
            spriteFrame2 = idlePlayer.getCurrentFrame(direction2)
          }
        }

        renderer.drawUnit(renderCombatant2, spriteFrame2, isPlayer2, 'Player 2')
      }

      animationFrameRef.current = requestAnimationFrame(renderFrame)
    }

    renderFrame()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [combatState, playerGladiatorId, duelistSprite, animationPlayers])

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
