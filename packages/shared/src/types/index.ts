// Gladiator Types
export enum GladiatorClass {
  Duelist = 'Duelist',
  Brute = 'Brute',
  Assassin = 'Assassin',
}

export interface BaseStats {
  strength: number
  agility: number
  endurance: number
  technique: number
}

export interface Gladiator {
  id: string
  tokenId: number
  ownerId: string
  class: GladiatorClass
  level: number
  xp: number
  baseStats: BaseStats
  equippedWeaponId?: string
  equippedArmorId?: string
  skillPointsAvailable: number
  unlockedSkills: string[]
}

// Equipment Types
export enum EquipmentType {
  Weapon = 'Weapon',
  Armor = 'Armor',
}

export enum Rarity {
  Common = 'Common',
  Rare = 'Rare',
  Epic = 'Epic',
}

export interface Equipment {
  id: string
  ownerId: string
  type: EquipmentType
  rarity: Rarity
  name: string
  stats: {
    attack?: number
    defense?: number
    speed?: number
  }
}

// Combat Types
export enum CombatAction {
  LightAttack = 'LightAttack',
  HeavyAttack = 'HeavyAttack',
  Block = 'Block',
  Dodge = 'Dodge',
  SpecialAbility = 'SpecialAbility',
}

export interface CombatState {
  matchId: string
  player1: CombatantState
  player2: CombatantState
  currentTick: number
  isComplete: boolean
  winnerId?: string
}

export interface CombatantState {
  gladiatorId: string
  health: number
  maxHealth: number
  stamina: number
  maxStamina: number
  lastAction?: CombatAction
}

// Match Types
export interface Match {
  id: string
  player1GladiatorId: string
  player2GladiatorId?: string
  isCpuMatch: boolean
  winnerId?: string
  matchLog: ActionLog[]
  durationSeconds: number
  createdAt: string
}

export interface ActionLog {
  tick: number
  actorId: string
  action: CombatAction
  targetId: string
  damage?: number
  staminaCost: number
  result: string
}

// User Types
export interface User {
  id: string
  email: string
  walletAddress?: string
  username: string
  createdAt: string
}
