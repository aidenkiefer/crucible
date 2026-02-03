import { Server, Socket } from 'socket.io'
import { setupMatchHandlers } from './match-handlers'

export function setupSocketHandlers(io: Server) {
  // Store io instance globally for match state broadcasting
  global.io = io

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`)

    // Setup match-related handlers
    setupMatchHandlers(socket)

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })

    // Placeholder for game events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() })
    })
  })
}
