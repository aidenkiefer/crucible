/**
 * Match Creation Hook
 * Creates and starts CPU or PvP matches
 */

'use client'

import { useState } from 'react'
import { useSocket } from '@/hooks/useSocket'

interface CreateMatchOptions {
  userId: string
  gladiatorId: string
  gladiatorStats: {
    constitution: number
    strength: number
    dexterity: number
    speed: number
    defense: number
    magicResist: number
    arcana: number
    faith: number
  }
  isCpuMatch: boolean
}

export function useCreateMatch() {
  const socket = useSocket()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createMatch = async (options: CreateMatchOptions): Promise<string | null> => {
    if (!socket) {
      setError('Not connected to game server')
      return null
    }

    setIsCreating(true)
    setError(null)

    const matchId = crypto.randomUUID()

    return new Promise((resolve) => {
      // Listen for match creation response
      const handleCreated = (response: { matchId: string; success: boolean }) => {
        if (response.success) {
          // Match created, now start it
          socket.emit('match:start', { matchId })

          // Wait for match started confirmation
          const handleStarted = () => {
            socket.off('match:started', handleStarted)
            socket.off('match:error', handleError)
            setIsCreating(false)
            resolve(matchId)
          }

          socket.once('match:started', handleStarted)
        }
      }

      const handleError = (errorResponse: { message: string }) => {
        socket.off('match:created', handleCreated)
        socket.off('match:started')
        setError(errorResponse.message)
        setIsCreating(false)
        resolve(null)
      }

      socket.once('match:created', handleCreated)
      socket.once('match:error', handleError)

      // Send create request
      socket.emit('match:create', {
        matchId,
        userId: options.userId,
        gladiatorId: options.gladiatorId,
        gladiatorStats: options.gladiatorStats,
        isCpuMatch: options.isCpuMatch,
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        socket.off('match:created', handleCreated)
        socket.off('match:error', handleError)
        setError('Match creation timed out')
        setIsCreating(false)
        resolve(null)
      }, 5000)
    })
  }

  return {
    createMatch,
    isCreating,
    error,
  }
}
