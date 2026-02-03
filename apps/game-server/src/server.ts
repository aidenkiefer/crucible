import express from 'express'
import { createServer as createHTTPServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { setupSocketHandlers } from './sockets'

export function createServer() {
  const app = express()
  const httpServer = createHTTPServer(app)

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  })

  app.use(cors())
  app.use(express.json())

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Setup WebSocket handlers
  setupSocketHandlers(io)

  return httpServer
}
