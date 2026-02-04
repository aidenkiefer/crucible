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
    socket.on('match:state', (state: any) => {
      // Convert projectiles array to Map (Sprint 4)
      const projectilesMap = new Map()
      if (state.projectiles && Array.isArray(state.projectiles)) {
        state.projectiles.forEach((p: any) => {
          projectilesMap.set(p.id, p)
        })
      }

      const combatState: CombatState = {
        ...state,
        projectiles: projectilesMap,
      }

      setCombatState(combatState)

      if (state.winner != null) {
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
