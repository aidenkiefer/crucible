/**
 * Sprint 5: Starter Gear Pool
 * Wooden Loot Box contains these items (4 armor sets + 7 weapons)
 */

export interface StarterGearItem {
  key: string
  name: string
  description: string
  type: 'WEAPON' | 'ARMOR'
  slot: 'MAIN_HAND' | 'CHEST'
  subtype: string
  baseStatMods: Record<string, number>
  scaling?: Record<string, number>
  tags: string[]
}

// ============================================================================
// Armor Sets (4 total)
// ============================================================================

export const STARTER_ARMOR: StarterGearItem[] = [
  {
    key: 'balanced_armor',
    name: 'Balanced Armor Set',
    description: 'Well-rounded protection for versatile fighters',
    type: 'ARMOR',
    slot: 'CHEST',
    subtype: 'MEDIUM',
    baseStatMods: {
      constitution: 3,
      defense: 3,
      speed: -1,
    },
    tags: ['starter', 'balanced', 'medium'],
  },
  {
    key: 'heavy_armor',
    name: 'Heavy Armor Set',
    description: 'Thick plating for maximum protection',
    type: 'ARMOR',
    slot: 'CHEST',
    subtype: 'HEAVY',
    baseStatMods: {
      constitution: 5,
      defense: 5,
      speed: -3,
    },
    tags: ['starter', 'tank', 'heavy'],
  },
  {
    key: 'light_armor',
    name: 'Light Armor Set',
    description: 'Minimal protection for maximum mobility',
    type: 'ARMOR',
    slot: 'CHEST',
    subtype: 'LIGHT',
    baseStatMods: {
      constitution: 1,
      defense: 1,
      speed: 3,
      dexterity: 2,
    },
    tags: ['starter', 'agile', 'light'],
  },
  {
    key: 'mage_armor',
    name: 'Mage Robes',
    description: 'Enchanted robes that enhance magical abilities',
    type: 'ARMOR',
    slot: 'CHEST',
    subtype: 'ROBES',
    baseStatMods: {
      arcana: 4,
      magicResist: 3,
      defense: -1,
    },
    tags: ['starter', 'mage', 'magic'],
  },
]

// ============================================================================
// Weapons (7 total)
// ============================================================================

export const STARTER_WEAPONS: StarterGearItem[] = [
  {
    key: 'iron_sword',
    name: 'Iron Sword',
    description: 'A reliable blade for balanced combat',
    type: 'WEAPON',
    slot: 'MAIN_HAND',
    subtype: 'SWORD',
    baseStatMods: {
      strength: 2,
    },
    scaling: {
      strength: 0.6,
      dexterity: 0.3,
    },
    tags: ['starter', 'melee', 'balanced'],
  },
  {
    key: 'training_spear',
    name: 'Training Spear',
    description: 'Long reach with defensive capabilities',
    type: 'WEAPON',
    slot: 'MAIN_HAND',
    subtype: 'SPEAR',
    baseStatMods: {
      strength: 1,
      defense: 1,
    },
    scaling: {
      strength: 0.4,
      dexterity: 0.5,
    },
    tags: ['starter', 'melee', 'reach'],
  },
  {
    key: 'short_bow',
    name: 'Short Bow',
    description: 'Reliable ranged weapon for hunters',
    type: 'WEAPON',
    slot: 'MAIN_HAND',
    subtype: 'BOW',
    baseStatMods: {
      dexterity: 3,
    },
    scaling: {
      dexterity: 0.8,
    },
    tags: ['starter', 'ranged', 'projectile'],
  },
  {
    key: 'steel_dagger',
    name: 'Steel Dagger',
    description: 'Fast strikes for agile fighters',
    type: 'WEAPON',
    slot: 'MAIN_HAND',
    subtype: 'DAGGER',
    baseStatMods: {
      dexterity: 2,
      speed: 1,
    },
    scaling: {
      dexterity: 0.7,
    },
    tags: ['starter', 'melee', 'fast'],
  },
  {
    key: 'heavy_axe',
    name: 'Heavy Axe',
    description: 'Devastating cleaves for raw power',
    type: 'WEAPON',
    slot: 'MAIN_HAND',
    subtype: 'AXE',
    baseStatMods: {
      strength: 4,
      speed: -2,
    },
    scaling: {
      strength: 0.9,
    },
    tags: ['starter', 'melee', 'heavy', 'slow'],
  },
  {
    key: 'war_hammer',
    name: 'War Hammer',
    description: 'Crushing blows that break through armor',
    type: 'WEAPON',
    slot: 'MAIN_HAND',
    subtype: 'HAMMER',
    baseStatMods: {
      strength: 3,
      defense: -1,
    },
    scaling: {
      strength: 0.8,
    },
    tags: ['starter', 'melee', 'armor-breaking'],
  },
  {
    key: 'wooden_staff',
    name: 'Wooden Staff',
    description: 'Focuses magical energy for spellcasting',
    type: 'WEAPON',
    slot: 'MAIN_HAND',
    subtype: 'STAFF',
    baseStatMods: {
      arcana: 3,
    },
    scaling: {
      arcana: 1.0,
    },
    tags: ['starter', 'magic', 'catalyst'],
  },
]

// ============================================================================
// Full Starter Gear Pool
// ============================================================================

export const STARTER_GEAR_POOL: StarterGearItem[] = [
  ...STARTER_ARMOR,
  ...STARTER_WEAPONS,
]

// ============================================================================
// Loot Box Configuration
// ============================================================================

export interface LootBoxConfig {
  tier: string
  itemPool: StarterGearItem[]
  guaranteedRarity: string
}

export const LOOT_BOX_CONFIGS: Record<string, LootBoxConfig> = {
  wooden: {
    tier: 'wooden',
    itemPool: STARTER_GEAR_POOL,
    guaranteedRarity: 'Common',
  },
  // Future tiers:
  // bronze: { ... },
  // silver: { ... },
  // gold: { ... },
}

/**
 * Roll a random item from loot box
 */
export function rollLootBoxItem(tier: string): StarterGearItem {
  const config = LOOT_BOX_CONFIGS[tier]
  if (!config) {
    throw new Error(`Unknown loot box tier: ${tier}`)
  }

  const pool = config.itemPool
  const randomIndex = Math.floor(Math.random() * pool.length)
  return pool[randomIndex]
}
