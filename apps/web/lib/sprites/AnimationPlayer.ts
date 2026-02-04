import { AnimationData, Direction } from './types'

export class AnimationPlayer {
  private currentFrame = 0
  private lastFrameTime = 0
  private isPlaying = false

  constructor(
    private animationData: AnimationData,
    private frames: Map<Direction, HTMLImageElement[]>
  ) {}

  start() {
    this.isPlaying = true
    this.currentFrame = 0
    this.lastFrameTime = Date.now()
  }

  stop() {
    this.isPlaying = false
    this.currentFrame = 0
  }

  pause() {
    this.isPlaying = false
  }

  resume() {
    this.isPlaying = true
    this.lastFrameTime = Date.now()
  }

  getCurrentFrame(direction: Direction): HTMLImageElement | null {
    const directionFrames = this.frames.get(direction)
    if (!directionFrames || directionFrames.length === 0) return null

    return directionFrames[this.currentFrame]
  }

  update() {
    if (!this.isPlaying) return

    const now = Date.now()
    const frameDuration = 1000 / this.animationData.frameRate
    const elapsed = now - this.lastFrameTime

    if (elapsed >= frameDuration) {
      this.currentFrame++

      if (this.currentFrame >= this.animationData.frameCount) {
        if (this.animationData.loop) {
          this.currentFrame = 0
        } else {
          this.currentFrame = this.animationData.frameCount - 1
          this.isPlaying = false
        }
      }

      this.lastFrameTime = now
    }
  }
}
