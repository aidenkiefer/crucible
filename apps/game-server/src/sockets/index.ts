import { Server, Socket } from 'socket.io'

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })

    // Placeholder for game events
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() })
    })
  })
}
