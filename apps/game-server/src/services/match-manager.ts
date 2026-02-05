/**
 * Match Manager
 * Manages all active match instances
 */

import { MatchInstance, MatchConfig, PlayerConfig, MatchStatus } from './match-instance'

// ============================================================================
// Match Manager
// ============================================================================

export class MatchManager {
  private matches: Map<string, MatchInstance>

  constructor() {
    this.matches = new Map()
  }

  /**
   * Create a new match (CPU or PvP)
   */
  public createMatch(config: MatchConfig): MatchInstance {
    if (this.matches.has(config.matchId)) {
      throw new Error(`Match ${config.matchId} already exists`)
    }

    const match = new MatchInstance(config)
    this.matches.set(config.matchId, match)

    console.log(`Created match ${config.matchId} (CPU: ${config.isCpuMatch})`)

    return match
  }

  /**
   * Start a match
   */
  public startMatch(matchId: string): void {
    const match = this.getMatch(matchId)
    if (!match) {
      throw new Error(`Match ${matchId} not found`)
    }

    match.start()
  }

  /**
   * Stop a match
   */
  public stopMatch(matchId: string): void {
    const match = this.getMatch(matchId)
    if (!match) {
      throw new Error(`Match ${matchId} not found`)
    }

    match.stop()
  }

  /**
   * Get a match instance
   */
  public getMatch(matchId: string): MatchInstance | undefined {
    return this.matches.get(matchId)
  }

  /**
   * Remove a match (cleanup after completion)
   */
  public removeMatch(matchId: string): void {
    const match = this.matches.get(matchId)
    if (match) {
      match.stop()
      this.matches.delete(matchId)
      console.log(`Removed match ${matchId}`)
    }
  }

  /**
   * Get all active matches
   */
  public getActiveMatches(): MatchInstance[] {
    return Array.from(this.matches.values()).filter(
      match => match.getStatus() === MatchStatus.InProgress
    )
  }

  /**
   * Get active matches for a specific user
   * Sprint 6: Used for disconnect handling
   */
  public getActiveMatchesForUser(userId: string): MatchInstance[] {
    return Array.from(this.matches.values()).filter(match => {
      return match.getStatus() === MatchStatus.InProgress && match.hasUser(userId)
    })
  }

  /**
   * Clean up completed matches older than threshold
   */
  public cleanupCompletedMatches(maxAgeMs: number = 60000): void {
    const now = Date.now()
    const toRemove: string[] = []

    for (const [matchId, match] of this.matches.entries()) {
      if (match.getStatus() === MatchStatus.Completed) {
        const result = match.getResult()
        if (result) {
          // Remove if completed more than maxAgeMs ago
          toRemove.push(matchId)
        }
      }
    }

    for (const matchId of toRemove) {
      this.removeMatch(matchId)
    }

    if (toRemove.length > 0) {
      console.log(`Cleaned up ${toRemove.length} completed matches`)
    }
  }

  /**
   * Get total number of matches
   */
  public getTotalMatches(): number {
    return this.matches.size
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const matchManager = new MatchManager()

// ============================================================================
// Helper Functions for Stat Mapping
// ============================================================================

/**
 * Map Gladiator database stats to combat stats (8 stats)
 * Converts database field names to combat system field names
 */
export function mapGladiatorStats(gladiator: {
  constitution: number
  strength: number
  dexterity: number
  speed: number
  defense: number
  magicResist: number
  arcana: number
  faith: number
}): PlayerConfig['stats'] {
  return {
    constitution: gladiator.constitution,
    strength: gladiator.strength,
    dexterity: gladiator.dexterity,
    speed: gladiator.speed,
    defense: gladiator.defense,
    magicResist: gladiator.magicResist,
    arcana: gladiator.arcana,
    faith: gladiator.faith,
  }
}

/**
 * Create player config from gladiator data
 */
export function createPlayerConfig(
  userId: string,
  gladiator: {
    id: string
    constitution: number
    strength: number
    dexterity: number
    speed: number
    defense: number
    magicResist: number
    arcana: number
    faith: number
  }
): PlayerConfig {
  return {
    userId,
    gladiatorId: gladiator.id,
    stats: mapGladiatorStats(gladiator),
  }
}
