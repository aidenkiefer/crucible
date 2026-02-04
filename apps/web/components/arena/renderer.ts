import { CombatantData } from '@gladiator/shared/src/combat/types'
import { Direction } from '@/lib/sprites/types'

export class Renderer {
  private ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  clear() {
    // Dark stone background (from design guidelines)
    this.ctx.fillStyle = '#1E1B18'
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
  }

  drawArena() {
    // Draw arena bounds with darker stone color
    this.ctx.strokeStyle = '#4a4a6a'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

    // Draw center line (subtle sand color)
    this.ctx.strokeStyle = '#3a3a4a'
    this.ctx.setLineDash([5, 5])
    this.ctx.beginPath()
    this.ctx.moveTo(this.ctx.canvas.width / 2, 0)
    this.ctx.lineTo(this.ctx.canvas.width / 2, this.ctx.canvas.height)
    this.ctx.stroke()
    this.ctx.setLineDash([])
  }

  drawUnit(
    combatant: CombatantData,
    sprite: HTMLImageElement | null,
    isPlayer: boolean,
    name: string = ''
  ) {
    const x = combatant.position.x
    const y = combatant.position.y

    if (sprite) {
      // Draw sprite centered on position
      // Sprite is 48x48, so offset by half to center
      const spriteX = x - sprite.width / 2
      const spriteY = y - sprite.height / 2

      // Use NEAREST NEIGHBOR scaling for pixel art
      this.ctx.imageSmoothingEnabled = false

      this.ctx.drawImage(sprite, spriteX, spriteY)

      // Draw i-frame indicator around sprite
      if (combatant.isInvulnerable) {
        this.ctx.strokeStyle = '#2EE6D6' // Cyan from design guidelines
        this.ctx.lineWidth = 2
        const radius = sprite.width / 2 + 3
        this.ctx.beginPath()
        this.ctx.arc(x, y, radius, 0, Math.PI * 2)
        this.ctx.stroke()
      }

      // HP/Stamina bars positioned above sprite
      const barY = spriteY - 10
      this.drawStatusBars(combatant, x, barY)
    } else {
      // Fallback: draw colored circle if sprite not loaded
      this.drawFallbackUnit(combatant, x, y, isPlayer)
    }

    // Draw name
    const nameY = y - 40
    this.ctx.fillStyle = isPlayer ? '#4ade80' : '#ef4444'
    this.ctx.font = '12px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(name || combatant.id, x, nameY)
  }

  private drawStatusBars(
    combatant: CombatantData,
    centerX: number,
    y: number
  ) {
    const barWidth = 48 // Match sprite width
    const barHeight = 4
    const barX = centerX - barWidth / 2

    // For now, use hardcoded max values (will be improved in later tasks)
    // TODO: Get actual max values from server
    const hpMax = 100
    const stamMax = 100

    // HP bar background
    this.ctx.fillStyle = '#222'
    this.ctx.fillRect(barX, y, barWidth, barHeight)

    // HP bar fill (Blood Red when low, from design guidelines)
    const hpPercent = combatant.currentHp / hpMax
    if (hpPercent > 0.5) {
      this.ctx.fillStyle = '#4ade80' // Green
    } else if (hpPercent > 0.25) {
      this.ctx.fillStyle = '#fbbf24' // Yellow
    } else {
      this.ctx.fillStyle = '#8E1C1C' // Blood Red
    }
    this.ctx.fillRect(barX, y, barWidth * hpPercent, barHeight)

    // Stamina bar
    const stamBarY = y + barHeight + 1
    this.ctx.fillStyle = '#1a1a1a'
    this.ctx.fillRect(barX, stamBarY, barWidth, barHeight - 1)

    const stamPercent = combatant.currentStamina / stamMax
    this.ctx.fillStyle = '#3b82f6' // Blue
    this.ctx.fillRect(barX, stamBarY, barWidth * stamPercent, barHeight - 1)
  }

  private drawFallbackUnit(
    combatant: CombatantData,
    x: number,
    y: number,
    isPlayer: boolean
  ) {
    const radius = 8
    const color = isPlayer ? '#4ade80' : '#ef4444'

    // Draw facing indicator
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 3
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
    this.ctx.lineTo(
      x + Math.cos(combatant.facingAngle) * 20,
      y + Math.sin(combatant.facingAngle) * 20
    )
    this.ctx.stroke()

    // Draw body
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    this.ctx.fill()

    // Draw i-frame indicator
    if (combatant.isInvulnerable) {
      this.ctx.strokeStyle = '#2EE6D6'
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.arc(x, y, radius + 3, 0, Math.PI * 2)
      this.ctx.stroke()
    }

    const barY = y - radius - 15
    this.drawStatusBars(combatant, x, barY)
  }

  /**
   * Convert facing angle (radians) to sprite direction
   * Facing 0 = East, PI/2 = South, PI = West, 3PI/2 = North
   */
  facingToDirection(facingAngle: number): Direction {
    // Normalize to 0-2PI
    let normalized = facingAngle % (2 * Math.PI)
    if (normalized < 0) normalized += 2 * Math.PI

    // Map to 4 directions (45 degree zones around each cardinal)
    if (normalized >= 7 * Math.PI / 4 || normalized < Math.PI / 4) {
      return 'east'
    } else if (normalized >= Math.PI / 4 && normalized < 3 * Math.PI / 4) {
      return 'south'
    } else if (normalized >= 3 * Math.PI / 4 && normalized < 5 * Math.PI / 4) {
      return 'west'
    } else {
      return 'north'
    }
  }
}
