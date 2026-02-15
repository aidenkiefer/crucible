/**
 * Damage Calculations
 * Pure functions for damage calculation and mitigation
 *
 * Includes both legacy functions (for backward compatibility) and new wiki-based
 * damage scaling with bounded curves and effective stat soft caps.
 */

import type { BaseAttributes, DerivedStats, WeaponDefinition, WeaponType } from './types'
import { eff } from '../stats/effective-stat'
import type { BaseStats } from '../stats/derived-stats'

// ============================================================================
// Damage & Mitigation Scaling Config (Stats & Scaling Wiki)
// ============================================================================

/**
 * Damage scaling configuration
 * Formula: DMG_MULT = 1 + DMG_CAP * (eff(MAIN) / (eff(MAIN) + DMG_HALF))
 */
export interface DamageScalingConfig {
  DMG_CAP: number;   // Maximum damage multiplier cap (default 1.20)
  DMG_HALF: number;  // Half-max point for diminishing returns (default 18)
}

/**
 * Mitigation scaling configuration
 * Formula: MIT = CAP * (eff(STAT) / (eff(STAT) + HALF))
 */
export interface MitigationScalingConfig {
  DEF_CAP: number;   // Physical mitigation cap (default 0.60 = 60%)
  DEF_HALF: number;  // Physical half-max point (default 18)
  MR_CAP: number;    // Magic mitigation cap (default 0.60 = 60%)
  MR_HALF: number;   // Magic half-max point (default 18)
}

/**
 * Default damage scaling from wiki (prototype values)
 */
export const DEFAULT_DAMAGE_CONFIG: DamageScalingConfig = {
  DMG_CAP: 1.20,
  DMG_HALF: 18,
};

/**
 * Default mitigation scaling from wiki (prototype values)
 */
export const DEFAULT_MITIGATION_CONFIG: MitigationScalingConfig = {
  DEF_CAP: 0.60,
  DEF_HALF: 18,
  MR_CAP: 0.60,
  MR_HALF: 18,
};

// ============================================================================
// Wiki-Based Damage Scaling (Bounded Curve with Effective Stats)
// ============================================================================

/**
 * Calculate damage multiplier using bounded scaling curve
 *
 * Formula: DMG_MULT = 1 + DMG_CAP * (eff(MAIN) / (eff(MAIN) + DMG_HALF))
 *
 * @param mainStat - Primary damage stat (STR for physical, ARC/FTH for magic)
 * @param config - Damage scaling config (defaults to wiki values)
 * @returns Damage multiplier (e.g., 1.0 to 2.2)
 */
export function calculateDamageMultiplier(
  mainStat: number,
  config: DamageScalingConfig = DEFAULT_DAMAGE_CONFIG
): number {
  const effStat = eff(mainStat);
  return 1 + config.DMG_CAP * (effStat / (effStat + config.DMG_HALF));
}

/**
 * Calculate physical mitigation from DEF
 *
 * Formula: MIT_PHYS = DEF_CAP * (eff(DEF) / (eff(DEF) + DEF_HALF))
 *
 * @param defense - DEF stat
 * @param config - Mitigation config (defaults to wiki values)
 * @returns Physical mitigation (0.0 to 0.60 = 0% to 60%)
 */
export function calculatePhysicalMitigation(
  defense: number,
  config: MitigationScalingConfig = DEFAULT_MITIGATION_CONFIG
): number {
  const effDef = eff(defense);
  return config.DEF_CAP * (effDef / (effDef + config.DEF_HALF));
}

/**
 * Calculate magic mitigation from MR
 *
 * Formula: MIT_MAGIC = MR_CAP * (eff(MR) / (eff(MR) + MR_HALF))
 *
 * @param magicResist - MR stat
 * @param config - Mitigation config (defaults to wiki values)
 * @returns Magic mitigation (0.0 to 0.60 = 0% to 60%)
 */
export function calculateMagicMitigation(
  magicResist: number,
  config: MitigationScalingConfig = DEFAULT_MITIGATION_CONFIG
): number {
  const effMR = eff(magicResist);
  return config.MR_CAP * (effMR / (effMR + config.MR_HALF));
}

/**
 * Calculate final damage using wiki formulas
 *
 * Formula: FINAL_DAMAGE = BASE_DAMAGE * DMG_MULT * WEAPON_COEFF * (1 - MITIGATION)
 *
 * @param baseDamage - Base weapon/skill damage
 * @param mainStat - Primary damage stat (STR, DEX, ARC, FTH)
 * @param defenseStat - Defender's DEF (physical) or MR (magic)
 * @param damageType - 'physical' or 'magic'
 * @param weaponCoeff - Weapon coefficient (1.0 class, 0.8 universal)
 * @param damageConfig - Damage scaling config
 * @param mitigationConfig - Mitigation config
 * @returns Final damage after all modifiers
 */
export function calculateWikiDamage(
  baseDamage: number,
  mainStat: number,
  defenseStat: number,
  damageType: 'physical' | 'magic',
  weaponCoeff: number = 1.0,
  damageConfig: DamageScalingConfig = DEFAULT_DAMAGE_CONFIG,
  mitigationConfig: MitigationScalingConfig = DEFAULT_MITIGATION_CONFIG
): number {
  // Step 1: Calculate damage multiplier from main stat
  const damageMult = calculateDamageMultiplier(mainStat, damageConfig);

  // Step 2: Apply damage multiplier and weapon coefficient
  const rawDamage = baseDamage * damageMult * weaponCoeff;

  // Step 3: Calculate mitigation
  const mitigation = damageType === 'physical'
    ? calculatePhysicalMitigation(defenseStat, mitigationConfig)
    : calculateMagicMitigation(defenseStat, mitigationConfig);

  // Step 4: Apply mitigation
  const finalDamage = rawDamage * (1 - mitigation);

  return Math.max(1, Math.floor(finalDamage));
}

// ============================================================================
// Legacy Damage Functions (Backward Compatibility)
// ============================================================================

/**
 * Calculate raw damage from a weapon attack before defense mitigation
 * Melee weapons scale with STR, ranged weapons scale with DEX
 * @param weaponCoeff - Weapon coefficient (1.0 for class weapon, 0.8 for universal, default 1.0)
 */
export function calculateRawDamage(
  weapon: WeaponDefinition,
  attackerAttributes: BaseAttributes,
  weaponCoeff: number = 1.0
): number {
  const baseDamage = weapon.baseDamage

  // Apply weapon scaling
  const strDamage = attackerAttributes.strength * weapon.scaling.strength
  const dexDamage = attackerAttributes.dexterity * weapon.scaling.dexterity
  const scaledDamage = baseDamage + strDamage + dexDamage

  // Apply weapon coefficient (class vs universal weapon)
  const finalDamage = scaledDamage * weaponCoeff

  return Math.floor(finalDamage)
}

/**
 * Calculate final damage after applying target's defense
 */
export function calculateFinalDamage(
  rawDamage: number,
  defenderStats: DerivedStats
): number {
  // Apply damage reduction from defense stat
  const mitigatedDamage = rawDamage * (1 - defenderStats.damageReduction)

  // Minimum 1 damage
  return Math.max(1, Math.floor(mitigatedDamage))
}

/**
 * Calculate complete damage from attacker to defender
 * Combines raw damage calculation and defense mitigation
 * @param weaponCoeff - Weapon coefficient (1.0 for class weapon, 0.8 for universal, default 1.0)
 */
export function calculateDamage(
  weapon: WeaponDefinition,
  attackerAttributes: BaseAttributes,
  defenderStats: DerivedStats,
  isInvulnerable: boolean = false,
  weaponCoeff: number = 1.0
): number {
  // No damage if invulnerable (dodge i-frames)
  if (isInvulnerable) {
    return 0
  }

  const rawDamage = calculateRawDamage(weapon, attackerAttributes, weaponCoeff)
  return calculateFinalDamage(rawDamage, defenderStats)
}

/**
 * Calculate new HP after damage
 */
export function applyDamageToHp(currentHp: number, damage: number): number {
  return Math.max(0, currentHp - damage)
}

/**
 * Check if unit is dead
 */
export function isDead(hp: number): boolean {
  return hp <= 0
}
