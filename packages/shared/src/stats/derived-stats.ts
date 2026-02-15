/**
 * Derived Stats - Core Combat Outputs
 *
 * Implements all derived stat calculations from the Stats & Scaling System wiki.
 * All formulas use effective stats (eff()) to apply soft caps.
 */

import { eff } from './effective-stat';

/**
 * Base stats structure (8 stats)
 */
export interface BaseStats {
  STR: number; // Strength - physical damage, stamina contribution
  DEX: number; // Dexterity - stamina regen, dodge responsiveness
  DEF: number; // Defense - physical mitigation, recovery speed
  CON: number; // Constitution - HP, primary stamina contributor
  SPD: number; // Speed - movement, dodge duration, recovery, stamina regen
  MR: number;  // Magic Resist - mana pool, magic mitigation
  ARC: number; // Arcana - arcane damage, primary mana regen
  FTH: number; // Faith - divine damage, alternate mana regen
}

/**
 * Tuning parameters for derived stats (all configurable knobs)
 */
export interface DerivedStatsConfig {
  // HP
  HP_BASE: number;
  HP_PER_CON: number;

  // Mana
  MANA_BASE: number;
  MANA_PER_MR: number;

  // Movement
  MOVE_BASE: number;
  MS_K: number;
  MS_MAX: number;

  // Stamina
  STAM_BASE: number;
  STAM_K: number;
  STAM_STR_W: number;

  // Stamina Regen
  SR_BASE: number;
  SR_K: number;
  SR_SPD_W: number;

  // Mana Regen
  MR_BASE: number;
  MR_K: number;
  MR_OFF_W: number;

  // Dodge
  DODGE_BASE: number;
  DODGE_MIN: number;
  DODGE_K: number;

  // Recovery
  REC_K: number;
  REC_SPD_W: number;
  REC_MIN: number;
}

/**
 * Default tuning parameters from Stats & Scaling wiki (prototype values)
 */
export const DEFAULT_DERIVED_CONFIG: DerivedStatsConfig = {
  // HP
  HP_BASE: 100,
  HP_PER_CON: 8,

  // Mana
  MANA_BASE: 60,
  MANA_PER_MR: 6,

  // Movement
  MOVE_BASE: 1.0,
  MS_K: 0.015,
  MS_MAX: 1.45,

  // Stamina
  STAM_BASE: 80,
  STAM_K: 5,
  STAM_STR_W: 0.70,

  // Stamina Regen
  SR_BASE: 5.0,
  SR_K: 0.18,
  SR_SPD_W: 0.80,

  // Mana Regen
  MR_BASE: 2.5,
  MR_K: 0.16,
  MR_OFF_W: 0.35,

  // Dodge
  DODGE_BASE: 0.55,
  DODGE_MIN: 0.35,
  DODGE_K: 0.03,

  // Recovery
  REC_K: 0.02,
  REC_SPD_W: 0.60,
  REC_MIN: 0.70,
};

/**
 * Derived combat stats (outputs)
 */
export interface DerivedStats {
  HP: number;
  MANA: number;
  STAMINA: number;
  STAM_REGEN: number;
  MANA_REGEN: number;
  MOVE_MULT: number;
  DODGE_TIME: number;
  REC_MULT: number;
}

/**
 * Calculate HP from CON
 *
 * Formula: HP = HP_BASE + HP_PER_CON * eff(CON)
 */
export function calculateHP(
  stats: BaseStats,
  config: DerivedStatsConfig = DEFAULT_DERIVED_CONFIG
): number {
  return config.HP_BASE + config.HP_PER_CON * eff(stats.CON);
}

/**
 * Calculate Mana from MR
 *
 * Formula: MANA = MANA_BASE + MANA_PER_MR * eff(MR)
 */
export function calculateMana(
  stats: BaseStats,
  config: DerivedStatsConfig = DEFAULT_DERIVED_CONFIG
): number {
  return config.MANA_BASE + config.MANA_PER_MR * eff(stats.MR);
}

/**
 * Calculate Stamina from CON and STR
 *
 * Formula: STAMINA = STAM_BASE + STAM_K * (eff(CON) + STAM_STR_W * eff(STR))
 */
export function calculateStamina(
  stats: BaseStats,
  config: DerivedStatsConfig = DEFAULT_DERIVED_CONFIG
): number {
  return config.STAM_BASE + config.STAM_K * (eff(stats.CON) + config.STAM_STR_W * eff(stats.STR));
}

/**
 * Calculate Stamina Regen from DEX and SPD
 *
 * Formula: STAM_REGEN = SR_BASE + SR_K * (eff(DEX) + SR_SPD_W * eff(SPD))
 */
export function calculateStaminaRegen(
  stats: BaseStats,
  config: DerivedStatsConfig = DEFAULT_DERIVED_CONFIG
): number {
  return config.SR_BASE + config.SR_K * (eff(stats.DEX) + config.SR_SPD_W * eff(stats.SPD));
}

/**
 * Calculate Mana Regen from ARC and FTH (hybrid-aware)
 *
 * Formula:
 * MAGIC_MAIN = max(eff(ARC), eff(FTH))
 * MAGIC_OFF = min(eff(ARC), eff(FTH))
 * MANA_REGEN = MR_BASE + MR_K * (MAGIC_MAIN + MR_OFF_W * MAGIC_OFF)
 */
export function calculateManaRegen(
  stats: BaseStats,
  config: DerivedStatsConfig = DEFAULT_DERIVED_CONFIG
): number {
  const effArc = eff(stats.ARC);
  const effFth = eff(stats.FTH);
  const magicMain = Math.max(effArc, effFth);
  const magicOff = Math.min(effArc, effFth);

  return config.MR_BASE + config.MR_K * (magicMain + config.MR_OFF_W * magicOff);
}

/**
 * Calculate Movement Multiplier from SPD
 *
 * Formula: MOVE_MULT = clamp(1 + MS_K * eff(SPD), 1.00, MS_MAX)
 */
export function calculateMovementMult(
  stats: BaseStats,
  config: DerivedStatsConfig = DEFAULT_DERIVED_CONFIG
): number {
  const mult = 1 + config.MS_K * eff(stats.SPD);
  return Math.max(1.00, Math.min(mult, config.MS_MAX));
}

/**
 * Calculate Dodge Duration from DEX and SPD (lower is faster)
 *
 * Formula: DODGE_TIME = clamp(DODGE_BASE / (1 + DODGE_K * (eff(DEX) + eff(SPD))), DODGE_MIN, DODGE_BASE)
 */
export function calculateDodgeTime(
  stats: BaseStats,
  config: DerivedStatsConfig = DEFAULT_DERIVED_CONFIG
): number {
  const time = config.DODGE_BASE / (1 + config.DODGE_K * (eff(stats.DEX) + eff(stats.SPD)));
  return Math.max(config.DODGE_MIN, Math.min(time, config.DODGE_BASE));
}

/**
 * Calculate Recovery Multiplier from DEF and SPD (lower is faster)
 *
 * Formula: REC_MULT = clamp(1 / (1 + REC_K * (eff(DEF) + REC_SPD_W * eff(SPD))), REC_MIN, 1.00)
 */
export function calculateRecoveryMult(
  stats: BaseStats,
  config: DerivedStatsConfig = DEFAULT_DERIVED_CONFIG
): number {
  const mult = 1 / (1 + config.REC_K * (eff(stats.DEF) + config.REC_SPD_W * eff(stats.SPD)));
  return Math.max(config.REC_MIN, Math.min(mult, 1.00));
}

/**
 * Calculate all derived stats at once
 *
 * @param stats - Base stats (8 stats)
 * @param config - Optional tuning parameters (defaults to wiki values)
 * @returns All derived combat stats
 */
export function calculateDerivedStats(
  stats: BaseStats,
  config: DerivedStatsConfig = DEFAULT_DERIVED_CONFIG
): DerivedStats {
  return {
    HP: calculateHP(stats, config),
    MANA: calculateMana(stats, config),
    STAMINA: calculateStamina(stats, config),
    STAM_REGEN: calculateStaminaRegen(stats, config),
    MANA_REGEN: calculateManaRegen(stats, config),
    MOVE_MULT: calculateMovementMult(stats, config),
    DODGE_TIME: calculateDodgeTime(stats, config),
    REC_MULT: calculateRecoveryMult(stats, config),
  };
}
