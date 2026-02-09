#!/usr/bin/env node
/**
 * One-time script: for each .png in public/assets/items/{commons|uncommons|rares},
 * create a subfolder {key}, move the image into it as icon.png, and write a
 * placeholder manifest.json. Run from repo root: node apps/web/scripts/seed-item-manifests.mjs
 *
 * Result: folders and manifests exist in the repo, so Vercel serves them without
 * any filesystem writes. Admin UI only needs to update DB and optionally edit manifest.
 */

import { readdir, mkdir, writeFile, rename } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const itemsBase = join(__dirname, '..', 'public', 'assets', 'items')

const RARITIES = ['commons', 'uncommons', 'rares']

function keyToTitle(key) {
  return key
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function placeholderManifest(key, raritySlug, displayName) {
  const basePath = `/assets/items/${raritySlug}/${key}`
  return {
    equipmentKey: key,
    equipmentType: 'WEAPON',
    slot: 'MAIN_HAND',
    displayName,
    description: '',
    rarity: raritySlug === 'commons' ? 'COMMON' : raritySlug === 'uncommons' ? 'UNCOMMON' : 'RARE',
    basePath,
    icons: {
      original: 'icon.png',
      large: 'icon.png',
      medium: 'icon.png',
      small: 'icon.png',
    },
    metadata: {
      subtype: '',
      generatedBy: 'seed-item-manifests',
    },
    gameData: {
      templateKey: key,
      baseStatMods: {},
      grantedActions: [],
    },
  }
}

async function main() {
  for (const rarity of RARITIES) {
    const dir = join(itemsBase, rarity)
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch (e) {
      console.warn('Skip', rarity, e.message)
      continue
    }
    const pngs = entries.filter(
      (e) => e.isFile() && e.name.endsWith('.png') && e.name !== `${rarity}.png`
    )
    for (const png of pngs) {
      const key = png.name.replace(/\.png$/i, '')
      const itemDir = join(dir, key)
      const iconDest = join(itemDir, 'icon.png')
      const manifestPath = join(itemDir, 'manifest.json')
      await mkdir(itemDir, { recursive: true })
      const srcPath = join(dir, png.name)
      await rename(srcPath, iconDest)
      const manifest = placeholderManifest(key, rarity, keyToTitle(key))
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
      console.log('Created', join(rarity, key), '+ manifest + moved icon')
    }
  }
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
