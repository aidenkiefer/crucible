import { SpriteManifest, LoadedSprite, Direction } from './types'

export class SpriteLoader {
  private cache = new Map<string, LoadedSprite>()

  async loadCharacter(characterKey: string): Promise<LoadedSprite> {
    // Check cache first
    if (this.cache.has(characterKey)) {
      return this.cache.get(characterKey)!
    }

    // Load manifest
    const manifestPath = `/assets/sprites/characters/${characterKey}/manifest.json`
    const response = await fetch(manifestPath)
    if (!response.ok) {
      throw new Error(`Failed to load manifest for ${characterKey}`)
    }
    const manifest: SpriteManifest = await response.json()

    // Load rotation images
    const rotationImages = new Map<Direction, HTMLImageElement>()
    const rotationPromises = Object.entries(manifest.rotations).map(
      async ([direction, path]) => {
        const img = await this.loadImage(
          `${manifest.basePath}/${path}`
        )
        rotationImages.set(direction as Direction, img)
      }
    )
    await Promise.all(rotationPromises)

    // Load animation frames
    const animationFrames = new Map<
      string,
      Map<Direction, HTMLImageElement[]>
    >()

    for (const [animKey, animData] of Object.entries(manifest.animations)) {
      const directionFrames = new Map<Direction, HTMLImageElement[]>()

      for (const [direction, framePaths] of Object.entries(animData.frames)) {
        const frames = await Promise.all(
          framePaths.map((path) =>
            this.loadImage(`${manifest.basePath}/${path}`)
          )
        )
        directionFrames.set(direction as Direction, frames)
      }

      animationFrames.set(animKey, directionFrames)
    }

    const loadedSprite: LoadedSprite = {
      manifest,
      rotationImages,
      animationFrames,
    }

    this.cache.set(characterKey, loadedSprite)
    return loadedSprite
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
      img.src = src
    })
  }
}

// Singleton instance
export const spriteLoader = new SpriteLoader()
