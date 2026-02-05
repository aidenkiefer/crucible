import express from 'express'
import { createServer as createHTTPServer } from 'http'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import cors from 'cors'
import { setupSocketHandlers } from './sockets'

export async function createServer() {
  const app = express()
  const httpServer = createHTTPServer(app)

  app.use(cors())
  app.use(express.json())

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Create Redis clients for Socket.io adapter
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  const pubClient = createClient({ url: redisUrl })
  const subClient = pubClient.duplicate()

  // Connect Redis clients
  await Promise.all([pubClient.connect(), subClient.connect()])
  console.log('✅ Redis clients connected')

  // Create Socket.io server with Redis adapter
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    adapter: createAdapter(pubClient, subClient),
  })

  // Setup WebSocket handlers
  setupSocketHandlers(io)

  return httpServer
}
