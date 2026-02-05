/**
 * Matchmaking WebSocket Handlers
 * Quick match queue join/leave
 */

import { Socket } from 'socket.io'
import { MatchmakingService } from '../services/matchmaking-service'

interface JoinQueuePayload {
  userId: string
  gladiatorId: string
}

export function setupMatchmakingHandlers(
  socket: Socket,
  matchmakingService: MatchmakingService
) {
  /**
   * Join matchmaking queue
   */
  socket.on('matchmaking:join', (payload: JoinQueuePayload) => {
    try {
      // Store userId in socket data
      socket.data.userId = payload.userId

      matchmakingService.addToQueue(payload.userId, payload.gladiatorId, socket.id)

      socket.emit('matchmaking:joined', {
        success: true,
        queuePosition: 'Finding opponent...',
      })

      console.log(`User ${payload.userId} joined matchmaking queue`)
    } catch (error) {
      console.error('Error joining queue:', error)
      socket.emit('matchmaking:error', {
        message: error instanceof Error ? error.message : 'Failed to join queue',
      })
    }
  })

  /**
   * Leave matchmaking queue
   */
  socket.on('matchmaking:leave', () => {
    try {
      const userId = socket.data.userId
      if (userId) {
        matchmakingService.removeFromQueue(userId)

        socket.emit('matchmaking:left', {
          success: true,
        })

        console.log(`User ${userId} left matchmaking queue`)
      }
    } catch (error) {
      console.error('Error leaving queue:', error)
      socket.emit('matchmaking:error', {
        message: error instanceof Error ? error.message : 'Failed to leave queue',
      })
    }
  })

  /**
   * Auto-remove from queue on disconnect
   */
  socket.on('disconnect', () => {
    const userId = socket.data.userId
    if (userId) {
      matchmakingService.removeFromQueue(userId)
    }
  })
}
