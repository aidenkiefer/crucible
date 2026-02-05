/**
 * Match WebSocket Handlers
 * Real-time input streaming for combat
 */

import { Socket } from 'socket.io'
import { matchManager, createPlayerConfig } from '../services/match-manager'
import { MatchConfig } from '../services/match-instance'
import { Action, ActionType } from '../combat/types'
import { PHYSICS_CONSTANTS } from '@gladiator/shared/src/physics/constants'
import { InputValidator } from '../services/input-validator'
import { RateLimiter } from '../services/rate-limiter'
import { DisconnectHandler } from '../services/disconnect-handler'

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
// Rate Limiting & Disconnect Handling
// ============================================================================

const rateLimiter = new RateLimiter()
const disconnectHandler = new DisconnectHandler()

// Cleanup every 60 seconds
setInterval(() => {
  rateLimiter.cleanup()
  disconnectHandler.cleanup()
}, 60000)

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

      // Store userId in socket data for disconnect handling
      socket.data.userId = payload.userId

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
   * Sprint 6: Added input validation and rate limiting
   */
  socket.on('match:action', (payload: SubmitActionPayload) => {
    try {
      // 1. Rate limiting
      if (!rateLimiter.checkLimit(socket.id)) {
        socket.emit('match:error', { message: 'Rate limit exceeded' })
        return
      }

      const match = matchManager.getMatch(payload.matchId)
      if (!match) {
        socket.emit('match:error', { message: 'Match not found' })
        return
      }

      // 2. Input validation
      const state = match.getState()
      const combatant =
        state.combatant1.id === payload.gladiatorId ? state.combatant1 : state.combatant2

      const validation = InputValidator.validateAction(
        payload.action,
        combatant,
        state.elapsedTime
      )

      if (!validation.valid) {
        console.warn(`Invalid action from ${payload.gladiatorId}: ${validation.reason}`)
        // Don't submit invalid actions, but don't disconnect either (could be lag)
        return
      }

      // 3. Submit action
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
   * Sprint 6: Save state snapshots for 30s reconnection window
   */
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)

    const userId = socket.data.userId
    if (!userId) {
      return
    }

    // Find active matches for this user
    const activeMatches = matchManager.getActiveMatchesForUser(userId)

    for (const match of activeMatches) {
      const matchId = match.getMatchId()
      const state = match.getState()

      // Save snapshot
      disconnectHandler.onDisconnect(matchId, userId, state)

      // Notify opponent
      global.io?.to(matchId).emit('match:player-disconnected', {
        userId,
        reconnectWindowSeconds: 30,
      })
    }
  })

  /**
   * Handle reconnection
   * Sprint 6: Restore match state if within 30s window
   */
  socket.on('match:reconnect', (payload: { matchId: string; userId: string }) => {
    try {
      if (disconnectHandler.canReconnect(payload.matchId, payload.userId)) {
        const snapshot = disconnectHandler.getSnapshot(payload.matchId, payload.userId)

        if (snapshot) {
          // Store userId for future disconnects
          socket.data.userId = payload.userId

          socket.join(payload.matchId)
          socket.emit('match:reconnected', {
            matchId: payload.matchId,
            state: snapshot,
          })

          // Notify opponent
          socket.to(payload.matchId).emit('match:player-reconnected', {
            userId: payload.userId,
          })

          console.log(`Player ${payload.userId} reconnected to match ${payload.matchId}`)
        }
      } else {
        socket.emit('match:error', {
          message: 'Reconnect window expired or match not found',
        })
      }
    } catch (error) {
      console.error('Error reconnecting:', error)
      socket.emit('match:error', {
        message: error instanceof Error ? error.message : 'Failed to reconnect',
      })
    }
  })
}

// ============================================================================
// State Broadcasting
// ============================================================================

/**
 * Broadcast match state to all clients at 20Hz
 * Sprint 6: Server now ticks at 60Hz internally, but broadcasts throttled to 20Hz
 * to reduce network traffic while maintaining precise hit detection
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
      // Convert projectiles Map to array for JSON serialization (Sprint 4)
      projectiles: Array.from(state.projectiles.values()),
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
  }, PHYSICS_CONSTANTS.BROADCAST_INTERVAL) // 20Hz = 50ms interval
}

// ============================================================================
// Global IO Instance
// ============================================================================

declare global {
  var io: any
}
