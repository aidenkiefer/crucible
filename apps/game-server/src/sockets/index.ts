import { Server, Socket } from 'socket.io'
import { setupMatchHandlers } from './match-handlers'
import { setupMatchmakingHandlers } from './matchmaking-handlers'
import { MatchmakingService } from '../services/matchmaking-service'

export function setupSocketHandlers(io: Server) {
  // Store io instance globally for match state broadcasting
  global.io = io

  // Create matchmaking service
  const matchmakingService = new MatchmakingService(io)

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`)

    // Setup match-related handlers
    setupMatchHandlers(socket)

    // Setup matchmaking handlers (Sprint 6)
    setupMatchmakingHandlers(socket, matchmakingService)

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })

    // Placeholder for game events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() })
    })
  })
}
