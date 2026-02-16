/**
 * Class Stat Weights & Base Stat Generation
 *
 * From Notion Systems Wiki > Class Base Stat Odds CSV
 * Each class has weighted stat distribution ranging from 1.4x (favored) to 0.7x (disfavored)
 *
 * Note: For legacy classes (Brute, Assassin), use Tank and Legionnaire weights respectively
 */

import { GladiatorClass } from '../types'

export type StatKey = 'CON' | 'STR' | 'DEX' | 'SPD' | 'DEF' | 'MR' | 'ARC' | 'FTH'

export interface ClassStatWeights {
  CON: number  // Constitution
  STR: number  // Strength
  DEX: number  // Dexterity
  SPD: number  // Speed
  DEF: number  // Defense
  MR: number   // Magic Resist
  ARC: number  // Arcana
  FTH: number  // Faith
}

/**
 * Base stat weights from Class Base Stat Odds CSV
 *
 * CSV Format (transposed):
 * Weight | Duelist | Mage | Monk | Tank | Legionnaire
 * 1.4x   | DEX     | ARC  | FTH  | CON  | STR
 * 1.3x   | SPD     | MR   | CON  | DEF  | DEF
 * 1.2x   | STR     | SPD  | SPD  | MR   | DEX
 * 1.1x   | MR      | DEX  | MR   | STR  | CON
 * 1.0x   | DEF     | FTH  | DEX  | ARC  | SPD
 * 0.9x   | FTH     | CON  | DEF  | FTH  | ARC
 * 0.8x   | ARC     | DEF  | ARC  | SPD  | FTH
 * 0.7x   | CON     | STR  | STR  | DEX  | MR
 */
export const CLASS_STAT_WEIGHTS: Record<GladiatorClass, ClassStatWeights> = {
  [GladiatorClass.Tank]: {
    CON: 1.4,  // Very high (1.4x)
    DEF: 1.3,  // Very high (1.3x)
    MR: 1.2,   // High (1.2x)
    STR: 1.1,  // Above average (1.1x)
    ARC: 1.0,  // Average (1.0x)
    FTH: 0.9,  // Below average (0.9x)
    SPD: 0.8,  // Low (0.8x)
    DEX: 0.7,  // Very low (0.7x)
  },
  [GladiatorClass.Legionnaire]: {
    STR: 1.4,  // Very high (1.4x)
    DEF: 1.3,  // Very high (1.3x)
    DEX: 1.2,  // High (1.2x)
    CON: 1.1,  // Above average (1.1x)
    SPD: 1.0,  // Average (1.0x)
    ARC: 0.9,  // Below average (0.9x)
    FTH: 0.8,  // Low (0.8x)
    MR: 0.7,   // Very low (0.7x)
  },
  [GladiatorClass.Duelist]: {
    DEX: 1.4,  // Very high (1.4x)
    SPD: 1.3,  // Very high (1.3x)
    STR: 1.2,  // High (1.2x)
    MR: 1.1,   // Above average (1.1x)
    DEF: 1.0,  // Average (1.0x)
    FTH: 0.9,  // Below average (0.9x)
    ARC: 0.8,  // Low (0.8x)
    CON: 0.7,  // Very low (0.7x)
  },
  [GladiatorClass.Mage]: {
    ARC: 1.4,  // Very high (1.4x)
    MR: 1.3,   // Very high (1.3x)
    SPD: 1.2,  // High (1.2x)
    DEX: 1.1,  // Above average (1.1x)
    FTH: 1.0,  // Average (1.0x)
    CON: 0.9,  // Below average (0.9x)
    DEF: 0.8,  // Low (0.8x)
    STR: 0.7,  // Very low (0.7x)
  },
  [GladiatorClass.Monk]: {
    FTH: 1.4,  // Very high (1.4x)
    CON: 1.3,  // Very high (1.3x)
    SPD: 1.2,  // High (1.2x)
    MR: 1.1,   // Above average (1.1x)
    DEX: 1.0,  // Average (1.0x)
    DEF: 0.9,  // Below average (0.9x)
    ARC: 0.8,  // Low (0.8x)
    STR: 0.7,  // Very low (0.7x)
  },
  // Legacy compatibility - map to modern equivalents
  [GladiatorClass.Brute]: {
    // Brute → Tank (high CON, DEF)
    CON: 1.4,
    DEF: 1.3,
    MR: 1.2,
    STR: 1.1,
    ARC: 1.0,
    FTH: 0.9,
    SPD: 0.8,
    DEX: 0.7,
  },
  [GladiatorClass.Assassin]: {
    // Assassin → Legionnaire (high STR, DEF, DEX)
    STR: 1.4,
    DEF: 1.3,
    DEX: 1.2,
    CON: 1.1,
    SPD: 1.0,
    ARC: 0.9,
    FTH: 0.8,
    MR: 0.7,
  },
}

/**
 * Get base stat weights for a given class
 */
export function getBaseStatWeights(gladiatorClass: GladiatorClass): ClassStatWeights {
  return CLASS_STAT_WEIGHTS[gladiatorClass]
}

/**
 * Roll base stats for a gladiator using class weights
 *
 * @param gladiatorClass - The class to roll stats for
 * @param totalPool - Total stat points to distribute (default 50 for L1)
 * @returns Object with 8 base stats distributed according to class weights
 *
 * Algorithm:
 * 1. Calculate total weight sum across all 8 stats
 * 2. Distribute pool proportionally by weight (floor division)
 * 3. Distribute remainder to highest-weight stats first
 */
export function rollBaseStats(gladiatorClass: GladiatorClass, totalPool: number = 50): ClassStatWeights {
  const weights = getBaseStatWeights(gladiatorClass)
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)

  // Distribute pool proportionally by weights (floor division)
  const stats: ClassStatWeights = {
    CON: Math.floor((weights.CON / totalWeight) * totalPool),
    STR: Math.floor((weights.STR / totalWeight) * totalPool),
    DEX: Math.floor((weights.DEX / totalWeight) * totalPool),
    SPD: Math.floor((weights.SPD / totalWeight) * totalPool),
    DEF: Math.floor((weights.DEF / totalWeight) * totalPool),
    MR: Math.floor((weights.MR / totalWeight) * totalPool),
    ARC: Math.floor((weights.ARC / totalWeight) * totalPool),
    FTH: Math.floor((weights.FTH / totalWeight) * totalPool),
  }

  // Calculate remainder after floor division
  let remainder = totalPool - Object.values(stats).reduce((sum, v) => sum + v, 0)

  // Sort stats by weight (descending) to distribute remainder
  const sortedStats = Object.entries(weights).sort((a, b) => b[1] - a[1])

  // Distribute remainder points to highest-weight stats
  for (const [stat] of sortedStats) {
    if (remainder <= 0) break
    stats[stat as StatKey]++
    remainder--
  }

  return stats
}

/**
 * Generate random stats with variance around weighted distribution
 *
 * @param gladiatorClass - The class to roll stats for
 * @param totalPool - Total stat points to distribute (default 50)
 * @param variance - Amount of randomness (0-1, default 0.2 = ±20%)
 * @returns Object with 8 base stats with some random variance
 *
 * Note: For demo purposes only. Production should use VRF or other secure randomness.
 */
export function rollBaseStatsWithVariance(
  gladiatorClass: GladiatorClass,
  totalPool: number = 50,
  variance: number = 0.2
): ClassStatWeights {
  const weights = getBaseStatWeights(gladiatorClass)
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)

  // Apply variance to weights
  const variedWeights: ClassStatWeights = Object.entries(weights).reduce((acc, [stat, weight]) => {
    // Random multiplier between (1 - variance) and (1 + variance)
    const randomFactor = 1 + (Math.random() * 2 - 1) * variance
    acc[stat as StatKey] = weight * randomFactor
    return acc
  }, {} as ClassStatWeights)

  const variedTotalWeight = Object.values(variedWeights).reduce((sum, w) => sum + w, 0)

  // Distribute with varied weights
  const stats: ClassStatWeights = {
    CON: Math.floor((variedWeights.CON / variedTotalWeight) * totalPool),
    STR: Math.floor((variedWeights.STR / variedTotalWeight) * totalPool),
    DEX: Math.floor((variedWeights.DEX / variedTotalWeight) * totalPool),
    SPD: Math.floor((variedWeights.SPD / variedTotalWeight) * totalPool),
    DEF: Math.floor((variedWeights.DEF / variedTotalWeight) * totalPool),
    MR: Math.floor((variedWeights.MR / variedTotalWeight) * totalPool),
    ARC: Math.floor((variedWeights.ARC / variedTotalWeight) * totalPool),
    FTH: Math.floor((variedWeights.FTH / variedTotalWeight) * totalPool),
  }

  // Distribute remainder
  let remainder = totalPool - Object.values(stats).reduce((sum, v) => sum + v, 0)
  const sortedStats = Object.entries(variedWeights).sort((a, b) => b[1] - a[1])

  for (const [stat] of sortedStats) {
    if (remainder <= 0) break
    stats[stat as StatKey]++
    remainder--
  }

  return stats
}

/**
 * Helper to convert ClassStatWeights to database-compatible object
 */
export function statsToDBFormat(stats: ClassStatWeights) {
  return {
    constitution: stats.CON,
    strength: stats.STR,
    dexterity: stats.DEX,
    speed: stats.SPD,
    defense: stats.DEF,
    magicResist: stats.MR,
    arcana: stats.ARC,
    faith: stats.FTH,
  }
}

/**
 * Helper to convert database stat format to ClassStatWeights
 */
export function dbStatsToWeights(dbStats: {
  constitution: number
  strength: number
  dexterity: number
  speed: number
  defense: number
  magicResist: number
  arcana: number
  faith: number
}): ClassStatWeights {
  return {
    CON: dbStats.constitution,
    STR: dbStats.strength,
    DEX: dbStats.dexterity,
    SPD: dbStats.speed,
    DEF: dbStats.defense,
    MR: dbStats.magicResist,
    ARC: dbStats.arcana,
    FTH: dbStats.faith,
  }
}

const STAT_ORDER: StatKey[] = ['CON', 'STR', 'DEX', 'SPD', 'DEF', 'MR', 'ARC', 'FTH']
const TOTAL_BASE_STATS = 50
const MIN_PER_STAT = 1
const RANGE = 10000

/** Seeded PRNG (mulberry32) for reproducible rolls. Returns 0..1. */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Roll base stats using the same weighted algorithm as the on-chain contract:
 * 8 random values scaled by class weights, then allocate TOTAL_BASE_STATS (50)
 * with MIN_PER_STAT (1) per stat. Sum of returned stats is exactly 50.
 * Use for test gladiators and any off-chain mint flow.
 *
 * @param gladiatorClass - Tank, Legionnaire, Duelist, Mage, Monk (or legacy Brute/Assassin)
 * @param seed - Optional seed for reproducibility. If omitted, uses Math.random().
 */
export function rollWeightedStatsContractStyle(
  gladiatorClass: GladiatorClass,
  seed?: number
): { constitution: number; strength: number; dexterity: number; speed: number; defense: number; magicResist: number; arcana: number; faith: number } {
  const weights = getBaseStatWeights(gladiatorClass)
  const w = STAT_ORDER.map((k) => Math.round(weights[k] * 100))

  const random = seed !== undefined ? seededRandom(seed) : () => Math.random()

  const s: number[] = []
  let sumS = 0
  for (let i = 0; i < 8; i++) {
    const r = Math.floor(random() * RANGE) + 1
    const si = r * w[i]
    s.push(si)
    sumS += si
  }

  const remaining = TOTAL_BASE_STATS - 8 * MIN_PER_STAT
  const out = [0, 0, 0, 0, 0, 0, 0, 0]
  const remainder = [0, 0, 0, 0, 0, 0, 0, 0]

  for (let i = 0; i < 8; i++) {
    const raw = Math.floor((remaining * s[i]) / sumS)
    out[i] = MIN_PER_STAT + raw
    remainder[i] = (remaining * s[i]) % sumS
  }

  let sumAlloc = out.reduce((a, b) => a + b, 0)
  let leftover = TOTAL_BASE_STATS - sumAlloc

  while (leftover > 0) {
    let maxRem = 0
    let maxIdx = 0
    for (let i = 0; i < 8; i++) {
      if (remainder[i] > maxRem) {
        maxRem = remainder[i]
        maxIdx = i
      }
    }
    out[maxIdx] += 1
    remainder[maxIdx] = 0
    sumAlloc += 1
    leftover -= 1
  }

  return {
    constitution: out[0],
    strength: out[1],
    dexterity: out[2],
    speed: out[3],
    defense: out[4],
    magicResist: out[5],
    arcana: out[6],
    faith: out[7],
  }
}
