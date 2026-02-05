/**
 * Sprint 5: Crafting & Salvaging System
 * 3→1 crafting with type weighting and rarity upgrades
 */

export type EquipmentRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'

export const RARITY_TIERS: EquipmentRarity[] = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
]

export const SALVAGE_VALUES: Record<EquipmentRarity, number> = {
  Common: 10,
  Uncommon: 25,
  Rare: 50,
  Epic: 100,
  Legendary: 250,
}

/**
 * Calculate salvage value for equipment
 */
export function calculateSalvageValue(rarity: EquipmentRarity): number {
  return SALVAGE_VALUES[rarity] || 10
}

/**
 * Determine output rarity from crafting 3 items
 * Rules:
 * - If all 3 are same rarity: 90% upgrade to next tier, 10% stay same tier
 * - If mixed rarities (different input rarities):
 *   - 10% stay at lowest tier
 *   - 30% one tier above lowest (capped at max tier)
 *   - 30% match highest tier
 *   - 30% random tier between lowest and highest (inclusive)
 * - Can't upgrade beyond Legendary
 */
export function determineCraftedRarity(rarities: EquipmentRarity[]): EquipmentRarity {
  if (rarities.length !== 3) {
    throw new Error('Crafting requires exactly 3 items')
  }

  const tiers = rarities.map((r) => RARITY_TIERS.indexOf(r))
  const maxTier = Math.max(...tiers)
  const minTier = Math.min(...tiers)
  const allSame = maxTier === minTier

  if (allSame) {
    if (Math.random() < 0.9 && maxTier < RARITY_TIERS.length - 1) {
      return RARITY_TIERS[maxTier + 1]
    }
    return RARITY_TIERS[maxTier]
  }

  // Mixed rarities: 10% lowest, 30% one upgrade, 30% highest, 30% mixed
  const roll = Math.random()
  if (roll < 0.1) {
    return RARITY_TIERS[minTier]
  }
  if (roll < 0.4) {
    const oneUp = Math.min(minTier + 1, RARITY_TIERS.length - 1)
    return RARITY_TIERS[oneUp]
  }
  if (roll < 0.7) {
    return RARITY_TIERS[maxTier]
  }
  // 30%: random tier between min and max (inclusive)
  const range = maxTier - minTier + 1
  const randomTier = minTier + Math.floor(Math.random() * range)
  return RARITY_TIERS[randomTier]
}

/**
 * Determine output type from crafting 3 items
 * Uses type weighting: majority type wins, ties broken randomly
 */
export function determineCraftedType(types: string[]): string {
  if (types.length !== 3) {
    throw new Error('Crafting requires exactly 3 items')
  }

  // Count type occurrences
  const typeCounts = types.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Find max count
  const maxCount = Math.max(...Object.values(typeCounts))
  const topTypes = Object.keys(typeCounts).filter((t) => typeCounts[t] === maxCount)

  // If tie, pick random
  return topTypes[Math.floor(Math.random() * topTypes.length)]
}

/**
 * Generate stat mods for crafted equipment
 * Higher rarity = more stats
 */
export function generateCraftedStats(rarity: EquipmentRarity): Record<string, number> {
  const statCount = {
    Common: 2,
    Uncommon: 3,
    Rare: 4,
    Epic: 5,
    Legendary: 6,
  }[rarity]

  const possibleStats = [
    'constitution',
    'strength',
    'dexterity',
    'speed',
    'defense',
    'magicResist',
    'arcana',
    'faith',
  ]

  const stats: Record<string, number> = {}
  const selectedStats = possibleStats
    .sort(() => Math.random() - 0.5)
    .slice(0, statCount)

  const tierMultiplier = RARITY_TIERS.indexOf(rarity) + 1

  for (const stat of selectedStats) {
    stats[stat] = Math.floor(Math.random() * 3 + 1) * tierMultiplier
  }

  return stats
}

/**
 * Generate name for crafted equipment
 */
export function generateCraftedName(type: string, rarity: EquipmentRarity): string {
  const prefixes = {
    Common: ['Worn', 'Basic', 'Simple', 'Standard'],
    Uncommon: ['Sturdy', 'Refined', 'Quality', 'Enhanced'],
    Rare: ['Superior', 'Master', 'Exquisite', 'Forged'],
    Epic: ['Legendary', 'Ancient', 'Mythic', 'Eternal'],
    Legendary: ['Divine', 'Transcendent', 'Primordial', 'Celestial'],
  }

  const prefix = prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)]

  return `${prefix} ${type}`
}
