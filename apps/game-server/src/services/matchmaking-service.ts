/**
 * Matchmaking Service
 * Manages quick match queue with FIFO matching
 */

import { Server } from 'socket.io'
import { prisma } from '@gladiator/database/src/client'

interface QueueEntry {
  userId: string
  gladiatorId: string
  socketId: string
}

export class MatchmakingService {
  private queue: QueueEntry[] = []
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  addToQueue(userId: string, gladiatorId: string, socketId: string) {
    // Remove if already in queue
    this.queue = this.queue.filter(e => e.userId !== userId)

    this.queue.push({ userId, gladiatorId, socketId })
    console.log(`Player ${userId} added to queue (${this.queue.length} in queue)`)

    this.attemptMatch()
  }

  removeFromQueue(userId: string) {
    this.queue = this.queue.filter(e => e.userId !== userId)
    console.log(`Player ${userId} removed from queue`)
  }

  private async attemptMatch() {
    if (this.queue.length < 2) return

    // Simple FIFO matching
    const player1 = this.queue.shift()!
    const player2 = this.queue.shift()!

    console.log(`Matching ${player1.userId} vs ${player2.userId}`)

    try {
      const match = await this.createPvPMatch(player1, player2)

      // Notify both players
      this.io.to(player1.socketId).emit('match:found', { matchId: match.id })
      this.io.to(player2.socketId).emit('match:found', { matchId: match.id })
    } catch (error) {
      console.error('Match creation failed:', error)
      // Re-add to queue
      this.queue.push(player1, player2)
    }
  }

  private async createPvPMatch(player1: QueueEntry, player2: QueueEntry) {
    const match = await prisma.match.create({
      data: {
        player1Id: player1.userId,
        player1GladiatorId: player1.gladiatorId,
        player2Id: player2.userId,
        player2GladiatorId: player2.gladiatorId,
        isCpuMatch: false,
        matchLog: [],
        durationSeconds: 0,
      },
    })

    return match
  }
}
