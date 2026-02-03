// Combat Constants
export const COMBAT_TICK_INTERVAL = 1000 // milliseconds
export const BASE_HEALTH = 100
export const BASE_STAMINA = 100
export const STAMINA_REGEN_PER_TICK = 10

// Action Costs and Damage
export const ACTION_CONFIG = {
  LightAttack: {
    staminaCost: 10,
    baseDamage: 15,
    canBeBlocked: true,
    canBeDodged: true,
  },
  HeavyAttack: {
    staminaCost: 25,
    baseDamage: 30,
    canBeBlocked: true,
    canBeDodged: true,
  },
  Block: {
    staminaCost: 5,
    damageReduction: 0.75,
  },
  Dodge: {
    staminaCost: 15,
    dodgeChance: 0.8,
  },
}

// Progression Constants
export const XP_PER_WIN = 100
export const XP_PER_LOSS = 25
export const XP_TO_LEVEL = (level: number) => level * 100

// Loot Drop Rates
export const LOOT_DROP_RATES = {
  Common: 0.7,
  Rare: 0.25,
  Epic: 0.05,
}
