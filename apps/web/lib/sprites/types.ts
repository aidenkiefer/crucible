export interface SpriteManifest {
  characterKey: string
  className: string
  canvasSize: number
  directions: number
  basePath: string
  rotations: {
    south: string
    west: string
    east: string
    north: string
  }
  animations: {
    [animKey: string]: AnimationData
  }
  metadata: {
    generated: string
    pixelLabCharacterId: string
    prompt: string
  }
}

export interface AnimationData {
  sourceAnimation: string
  frameCount: number
  frameRate: number
  loop: boolean
  frames: {
    south: string[]
    west: string[]
    east: string[]
    north: string[]
  }
}

export type Direction = 'south' | 'west' | 'east' | 'north'

export interface LoadedSprite {
  manifest: SpriteManifest
  rotationImages: Map<Direction, HTMLImageElement>
  animationFrames: Map<string, Map<Direction, HTMLImageElement[]>>
}
