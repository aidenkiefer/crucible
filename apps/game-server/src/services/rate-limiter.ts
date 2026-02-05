/**
 * Rate Limiter
 * Prevents input flooding and DDoS attacks
 */

export class RateLimiter {
  private inputCounts: Map<string, { count: number; resetTime: number }> = new Map()
  private readonly MAX_INPUTS_PER_SECOND = 120 // Allow up to 120 inputs/sec (2x tick rate)
  private readonly WINDOW_MS = 1000

  checkLimit(clientId: string): boolean {
    const now = Date.now()
    const record = this.inputCounts.get(clientId)

    if (!record || now > record.resetTime) {
      // Start new window
      this.inputCounts.set(clientId, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      })
      return true
    }

    if (record.count >= this.MAX_INPUTS_PER_SECOND) {
      console.warn(`Rate limit exceeded for client ${clientId}`)
      return false
    }

    record.count++
    return true
  }

  cleanup() {
    const now = Date.now()
    for (const [clientId, record] of this.inputCounts.entries()) {
      if (now > record.resetTime + 5000) {
        this.inputCounts.delete(clientId)
      }
    }
  }
}
