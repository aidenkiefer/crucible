'use client'

import { useEffect, useRef, useState } from 'react'

export interface GameAction {
  type: string // 'Attack' | 'Dodge'
  slot?: 'mainHand' | 'offHand' // For attacks
}

interface GameInput {
  moveX: number
  moveY: number
  facing: number
  actions: GameAction[]
}

interface UseGameInputOptions {
  onWeaponChange?: (weaponIndex: number) => void
}

export function useGameInput(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options?: UseGameInputOptions
) {
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

      // Weapon switching (1-4)
      if (e.key >= '1' && e.key <= '4' && !e.repeat) {
        const weaponIndex = parseInt(e.key) - 1
        options?.onWeaponChange?.(weaponIndex)
        return
      }

      // Action keys
      if (e.key === ' ' && !e.repeat) {
        // Space: Attack with main hand (for accessibility)
        setInput((prev) => ({
          ...prev,
          actions: [...prev.actions, { type: 'Attack', slot: 'mainHand' }],
        }))
      } else if (e.key === 'Shift' && !e.repeat) {
        // Shift: Dodge
        setInput((prev) => ({
          ...prev,
          actions: [...prev.actions, { type: 'Dodge' }],
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

    const handleMouseDown = (e: MouseEvent) => {
      // Only handle clicks on the canvas
      if (!canvasRef.current) return
      const target = e.target as HTMLElement
      if (!canvasRef.current.contains(target)) return

      e.preventDefault() // Prevent default behavior

      if (e.button === 0) {
        // Left click: Main hand attack
        setInput((prev) => ({
          ...prev,
          actions: [...prev.actions, { type: 'Attack', slot: 'mainHand' }],
        }))
      } else if (e.button === 2) {
        // Right click: Off hand attack
        setInput((prev) => ({
          ...prev,
          actions: [...prev.actions, { type: 'Attack', slot: 'offHand' }],
        }))
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      // Prevent context menu on canvas
      if (!canvasRef.current) return
      const target = e.target as HTMLElement
      if (canvasRef.current.contains(target)) {
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('contextmenu', handleContextMenu)

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
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('contextmenu', handleContextMenu)
      clearInterval(inputInterval)
    }
  }, [canvasRef, options])

  return input
}
