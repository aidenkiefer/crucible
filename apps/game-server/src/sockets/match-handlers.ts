/**
 * Match WebSocket Handlers
 * Real-time input streaming for combat
 */

import { Socket } from 'socket.io'
import { matchManager, createPlayerConfig } from '../services/match-manager'
import { MatchConfig } from '../services/match-instance'
import { Action, ActionType } from '../combat/types'

// ============================================================================
// Types
// ============================================================================

interface CreateMatchPayload {
  matchId: string
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

interface SubmitActionPayload {
  matchId: string
  gladiatorId: string
  action: Action
}

interface JoinMatchPayload {
  matchId: string
}

// ============================================================================
// WebSocket Handlers
// ============================================================================

export function setupMatchHandlers(socket: Socket) {
  /**
   * Create a new match (CPU or PvP)
   */
  socket.on('match:create', (payload: CreateMatchPayload) => {
    try {
      console.log(`Creating match ${payload.matchId} for user ${payload.userId}`)

      const playerConfig = createPlayerConfig(payload.userId, {
        id: payload.gladiatorId,
        ...payload.gladiatorStats,
      })

      const matchConfig: MatchConfig = {
        matchId: payload.matchId,
        player1: playerConfig,
        isCpuMatch: payload.isCpuMatch,
      }

      const match = matchManager.createMatch(matchConfig)

      // Join match room
      socket.join(payload.matchId)

      socket.emit('match:created', {
        matchId: payload.matchId,
        success: true,
      })

      console.log(`Match ${payload.matchId} created successfully`)
    } catch (error) {
      console.error('Error creating match:', error)
      socket.emit('match:error', {
        message: error instanceof Error ? error.message : 'Failed to create match',
      })
    }
  })

  /**
   * Start a match
   */
  socket.on('match:start', (payload: { matchId: string }) => {
    try {
      matchManager.startMatch(payload.matchId)

      // Emit match started to all clients in the room
      socket.to(payload.matchId).emit('match:started', {
        matchId: payload.matchId,
      })
      socket.emit('match:started', {
        matchId: payload.matchId,
      })

      // Start state broadcast loop
      startStateBroadcast(payload.matchId)

      console.log(`Match ${payload.matchId} started`)
    } catch (error) {
      console.error('Error starting match:', error)
      socket.emit('match:error', {
        message: error instanceof Error ? error.message : 'Failed to start match',
      })
    }
  })

  /**
   * Submit action during match
   */
  socket.on('match:action', (payload: SubmitActionPayload) => {
    try {
      const match = matchManager.getMatch(payload.matchId)
      if (!match) {
        socket.emit('match:error', { message: 'Match not found' })
        return
      }

      match.submitAction(payload.gladiatorId, payload.action)

      // Actions are processed in the next tick
      // No immediate response needed
    } catch (error) {
      console.error('Error submitting action:', error)
      socket.emit('match:error', {
        message: error instanceof Error ? error.message : 'Failed to submit action',
      })
    }
  })

  /**
   * Join an existing match (for PvP)
   */
  socket.on('match:join', (payload: JoinMatchPayload) => {
    try {
      const match = matchManager.getMatch(payload.matchId)
      if (!match) {
        socket.emit('match:error', { message: 'Match not found' })
        return
      }

      // Join match room
      socket.join(payload.matchId)

      socket.emit('match:joined', {
        matchId: payload.matchId,
        state: match.getState(),
      })

      console.log(`Client joined match ${payload.matchId}`)
    } catch (error) {
      console.error('Error joining match:', error)
      socket.emit('match:error', {
        message: error instanceof Error ? error.message : 'Failed to join match',
      })
    }
  })

  /**
   * Leave a match
   */
  socket.on('match:leave', (payload: { matchId: string }) => {
    try {
      socket.leave(payload.matchId)
      console.log(`Client left match ${payload.matchId}`)
    } catch (error) {
      console.error('Error leaving match:', error)
    }
  })

  /**
   * Handle disconnection
   */
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    // Cleanup logic can be added here
  })
}

// ============================================================================
// State Broadcasting
// ============================================================================

/**
 * Broadcast match state to all clients at 20Hz
 */
function startStateBroadcast(matchId: string) {
  const broadcastInterval = setInterval(() => {
    const match = matchManager.getMatch(matchId)
    if (!match) {
      clearInterval(broadcastInterval)
      return
    }

    const state = match.getState()
    const status = match.getStatus()

    // Broadcast state to all clients in the match room
    global.io?.to(matchId).emit('match:state', {
      matchId,
      tickNumber: state.tickNumber,
      elapsedTime: state.elapsedTime,
      combatant1: {
        id: state.combatant1.id,
        position: state.combatant1.position,
        facingAngle: state.combatant1.facingAngle,
        currentHp: state.combatant1.currentHp,
        currentStamina: state.combatant1.currentStamina,
        isAlive: state.combatant1.isAlive,
        isInvulnerable: state.combatant1.isInvulnerable,
        currentAction: state.combatant1.currentAction,
      },
      combatant2: {
        id: state.combatant2.id,
        position: state.combatant2.position,
        facingAngle: state.combatant2.facingAngle,
        currentHp: state.combatant2.currentHp,
        currentStamina: state.combatant2.currentStamina,
        isAlive: state.combatant2.isAlive,
        isInvulnerable: state.combatant2.isInvulnerable,
        currentAction: state.combatant2.currentAction,
      },
      winner: state.winner,
    })

    // Broadcast events from this tick
    const events = match['engine'].getEvents() // Access private field
    if (events.length > 0) {
      global.io?.to(matchId).emit('match:events', {
        matchId,
        events,
      })
    }

    // Stop broadcasting if match is over
    if (status === 'Completed') {
      clearInterval(broadcastInterval)

      const result = match.getResult()
      if (result) {
        global.io?.to(matchId).emit('match:completed', {
          matchId,
          winnerId: result.winnerId,
          duration: result.duration,
        })
      }
    }
  }, 50) // 20Hz = 50ms interval
}

// ============================================================================
// Global IO Instance
// ============================================================================

declare global {
  var io: any
}
