/**
 * Disconnect Handler
 * Manages player disconnects with 30s reconnection window
 */

import { CombatState } from '../combat/types'

interface DisconnectSnapshot {
  matchId: string
  userId: string
  disconnectTime: number
  stateSnapshot: CombatState
}

export class DisconnectHandler {
  private snapshots: Map<string, DisconnectSnapshot> = new Map()
  private readonly RECONNECT_WINDOW_MS = 30000 // 30 seconds

  /**
   * Save snapshot when player disconnects
   */
  onDisconnect(matchId: string, userId: string, state: CombatState): void {
    const key = `${matchId}:${userId}`

    this.snapshots.set(key, {
      matchId,
      userId,
      disconnectTime: Date.now(),
      stateSnapshot: state,
    })

    console.log(`Saved disconnect snapshot for ${userId} in match ${matchId}`)

    // Auto-cleanup after reconnect window
    setTimeout(() => {
      if (this.snapshots.has(key)) {
        console.log(`Reconnect window expired for ${userId}`)
        this.snapshots.delete(key)
        // TODO: Notify match to forfeit player
      }
    }, this.RECONNECT_WINDOW_MS)
  }

  /**
   * Check if player can reconnect
   */
  canReconnect(matchId: string, userId: string): boolean {
    const key = `${matchId}:${userId}`
    const snapshot = this.snapshots.get(key)

    if (!snapshot) return false

    const elapsed = Date.now() - snapshot.disconnectTime
    return elapsed < this.RECONNECT_WINDOW_MS
  }

  /**
   * Get snapshot for reconnection
   */
  getSnapshot(matchId: string, userId: string): CombatState | null {
    const key = `${matchId}:${userId}`
    const snapshot = this.snapshots.get(key)

    if (!snapshot) return null

    // Remove snapshot after retrieval
    this.snapshots.delete(key)
    return snapshot.stateSnapshot
  }

  /**
   * Clean up expired snapshots
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, snapshot] of this.snapshots.entries()) {
      if (now - snapshot.disconnectTime > this.RECONNECT_WINDOW_MS) {
        this.snapshots.delete(key)
      }
    }
  }
}
