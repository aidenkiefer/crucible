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
