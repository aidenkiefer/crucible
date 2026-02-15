/**
 * Stat Builder - Build effective combat stats for match start
 *
 * Computes derived stats from:
 * - Gladiator base stats
 * - Equipment stat bonuses (future: template baseStatMods + instance rolledMods)
 * - Skill stat bonuses (from unlockedSkills)
 *
 * Uses wiki-based effective stat soft caps and bounded scaling.
 */

import {
  BaseStats,
  calculateDerivedStats,
  DEFAULT_DERIVED_CONFIG,
  type DerivedStats as WikiDerivedStats,
} from '@gladiator/shared/src/stats'

/**
 * Legacy BaseAttributes format (lowercase names)
 */
export interface LegacyBaseAttributes {
  constitution: number
  strength: number
  dexterity: number
  speed: number
  defense: number
  magicResist: number
  arcana: number
  faith: number
}

/**
 * Legacy DerivedStats format (old combat system)
 */
export interface LegacyDerivedStats {
  maxHp: number
  maxStamina: number
  staminaRegen: number
  moveSpeed: number
  damageReduction: number
}

/**
 * Convert legacy lowercase BaseAttributes to new uppercase BaseStats
 */
export function convertToBaseStats(legacy: LegacyBaseAttributes): BaseStats {
  return {
    STR: legacy.strength,
    DEX: legacy.dexterity,
    DEF: legacy.defense,
    CON: legacy.constitution,
    SPD: legacy.speed,
    MR: legacy.magicResist,
    ARC: legacy.arcana,
    FTH: legacy.faith,
  }
}

/**
 * Convert wiki DerivedStats to legacy format for combat engine compatibility
 */
export function convertToLegacyDerived(wiki: WikiDerivedStats): LegacyDerivedStats {
  return {
    maxHp: Math.floor(wiki.HP),
    maxStamina: Math.floor(wiki.STAMINA),
    staminaRegen: wiki.STAM_REGEN,
    moveSpeed: wiki.MOVE_MULT * 150, // Assume BASE_MOVE_SPEED = 150 (from old system)
    damageReduction: 0, // Mitigation now handled via wiki formulas in damage calculation
  }
}

/**
 * Build effective stats for match start
 *
 * Steps:
 * 1. Start with gladiator base stats
 * 2. Add equipment stat bonuses (future: load from templates + instances)
 * 3. Add skill stat bonuses (future: load from unlockedSkills)
 * 4. Apply effective stat soft caps via wiki formulas
 * 5. Calculate derived stats (HP, stamina, mana, movement, dodge, recovery)
 *
 * @param baseStats - Gladiator base stats (from NFT or DB)
 * @param equipmentBonuses - Stat bonuses from equipped items (future)
 * @param skillBonuses - Stat bonuses from unlocked skills (future)
 * @returns Combat-ready derived stats in legacy format
 */
export function buildEffectiveStats(
  baseStats: LegacyBaseAttributes,
  equipmentBonuses?: Partial<BaseStats>,
  skillBonuses?: Partial<BaseStats>
): LegacyDerivedStats {
  // Step 1: Convert to uppercase format
  const base = convertToBaseStats(baseStats)

  // Step 2: Sum bonuses (future: aggregate equipment + skill bonuses)
  const effectiveBuild: BaseStats = {
    STR: base.STR + (equipmentBonuses?.STR ?? 0) + (skillBonuses?.STR ?? 0),
    DEX: base.DEX + (equipmentBonuses?.DEX ?? 0) + (skillBonuses?.DEX ?? 0),
    DEF: base.DEF + (equipmentBonuses?.DEF ?? 0) + (skillBonuses?.DEF ?? 0),
    CON: base.CON + (equipmentBonuses?.CON ?? 0) + (skillBonuses?.CON ?? 0),
    SPD: base.SPD + (equipmentBonuses?.SPD ?? 0) + (skillBonuses?.SPD ?? 0),
    MR: base.MR + (equipmentBonuses?.MR ?? 0) + (skillBonuses?.MR ?? 0),
    ARC: base.ARC + (equipmentBonuses?.ARC ?? 0) + (skillBonuses?.ARC ?? 0),
    FTH: base.FTH + (equipmentBonuses?.FTH ?? 0) + (skillBonuses?.FTH ?? 0),
  }

  // Step 3: Calculate wiki-based derived stats (applies eff() internally)
  const wikiDerived = calculateDerivedStats(effectiveBuild, DEFAULT_DERIVED_CONFIG)

  // Step 4: Convert to legacy format for combat engine
  return convertToLegacyDerived(wikiDerived)
}

/**
 * Get weapon coefficient from equipment template
 *
 * @param equipmentTemplateKey - Equipment template key (future: load from DB/bundle)
 * @returns Weapon coefficient (1.0 for class weapon, 0.8 for universal, default 1.0)
 */
export function getWeaponCoeff(equipmentTemplateKey?: string): number {
  // TODO: Load from equipment template (Sprint 2.5 bundle loader)
  // For now, default to 1.0 (class weapon)
  return 1.0
}
