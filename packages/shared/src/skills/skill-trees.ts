/**
 * Sprint 5: Skill Tree System
 * Defines skill trees for all 4 gladiator classes
 * 4-5 branches per class, covering all 8 stats
 */

export interface SkillNode {
  id: string
  name: string
  description: string
  branch: string
  tier: number // 1-5, higher tiers require previous tier
  prerequisite?: string // Skill ID that must be unlocked first
  statBoosts: Record<string, number>
  cost: number // Skill points required
}

// ============================================================================
// DUELIST — Balanced fighter, jack-of-all-trades
// Branches: Precision, Resilience, Mobility, Tactics, Arcane Defense
// ============================================================================

export const DUELIST_SKILLS: SkillNode[] = [
  // Branch 1: Precision (Strength + Dexterity)
  {
    id: 'duelist_precision_1',
    name: 'Steady Grip',
    description: 'Improved weapon handling',
    branch: 'Precision',
    tier: 1,
    statBoosts: { strength: 1, dexterity: 1 },
    cost: 1,
  },
  {
    id: 'duelist_precision_2',
    name: 'Precise Strikes',
    description: 'Hit harder and more accurately',
    branch: 'Precision',
    tier: 2,
    prerequisite: 'duelist_precision_1',
    statBoosts: { strength: 2, dexterity: 2 },
    cost: 1,
  },
  {
    id: 'duelist_precision_3',
    name: 'Master Duelist',
    description: 'Peak physical combat prowess',
    branch: 'Precision',
    tier: 3,
    prerequisite: 'duelist_precision_2',
    statBoosts: { strength: 3, dexterity: 3 },
    cost: 1,
  },

  // Branch 2: Resilience (Constitution + Defense)
  {
    id: 'duelist_resilience_1',
    name: 'Toughness',
    description: 'Endure more punishment',
    branch: 'Resilience',
    tier: 1,
    statBoosts: { constitution: 1, defense: 1 },
    cost: 1,
  },
  {
    id: 'duelist_resilience_2',
    name: 'Battle Hardened',
    description: 'Veteran survivability',
    branch: 'Resilience',
    tier: 2,
    prerequisite: 'duelist_resilience_1',
    statBoosts: { constitution: 2, defense: 2 },
    cost: 1,
  },
  {
    id: 'duelist_resilience_3',
    name: 'Iron Constitution',
    description: 'Unbreakable fortitude',
    branch: 'Resilience',
    tier: 3,
    prerequisite: 'duelist_resilience_2',
    statBoosts: { constitution: 3, defense: 3 },
    cost: 1,
  },

  // Branch 3: Mobility (Speed)
  {
    id: 'duelist_mobility_1',
    name: 'Quick Step',
    description: 'Faster movement',
    branch: 'Mobility',
    tier: 1,
    statBoosts: { speed: 2 },
    cost: 1,
  },
  {
    id: 'duelist_mobility_2',
    name: 'Combat Flow',
    description: 'Fluid battlefield movement',
    branch: 'Mobility',
    tier: 2,
    prerequisite: 'duelist_mobility_1',
    statBoosts: { speed: 3 },
    cost: 1,
  },

  // Branch 4: Tactics (Faith - leadership/morale)
  {
    id: 'duelist_tactics_1',
    name: 'Battle Sense',
    description: 'Read the flow of combat',
    branch: 'Tactics',
    tier: 1,
    statBoosts: { faith: 2 },
    cost: 1,
  },
  {
    id: 'duelist_tactics_2',
    name: 'Tactical Mastery',
    description: 'Superior battlefield awareness',
    branch: 'Tactics',
    tier: 2,
    prerequisite: 'duelist_tactics_1',
    statBoosts: { faith: 3 },
    cost: 1,
  },

  // Branch 5: Arcane Defense (Arcana + Magic Resist)
  {
    id: 'duelist_arcane_1',
    name: 'Spell Resistance',
    description: 'Basic magic resistance',
    branch: 'Arcane Defense',
    tier: 1,
    statBoosts: { magicResist: 2, arcana: 1 },
    cost: 1,
  },
  {
    id: 'duelist_arcane_2',
    name: 'Warded Fighter',
    description: 'Enhanced magical defenses',
    branch: 'Arcane Defense',
    tier: 2,
    prerequisite: 'duelist_arcane_1',
    statBoosts: { magicResist: 3, arcana: 2 },
    cost: 1,
  },
]

// ============================================================================
// BRUTE — Tank focused on raw power and survivability
// Branches: Raw Power, Fortress, Berserker, Intimidation, Unstoppable
// ============================================================================

export const BRUTE_SKILLS: SkillNode[] = [
  // Branch 1: Raw Power (Strength)
  {
    id: 'brute_power_1',
    name: 'Brutal Strength',
    description: 'Devastating physical power',
    branch: 'Raw Power',
    tier: 1,
    statBoosts: { strength: 3 },
    cost: 1,
  },
  {
    id: 'brute_power_2',
    name: 'Crushing Blows',
    description: 'Obliterate opponents',
    branch: 'Raw Power',
    tier: 2,
    prerequisite: 'brute_power_1',
    statBoosts: { strength: 4 },
    cost: 1,
  },
  {
    id: 'brute_power_3',
    name: 'Titanic Force',
    description: 'Unstoppable destruction',
    branch: 'Raw Power',
    tier: 3,
    prerequisite: 'brute_power_2',
    statBoosts: { strength: 5 },
    cost: 1,
  },

  // Branch 2: Fortress (Constitution + Defense)
  {
    id: 'brute_fortress_1',
    name: 'Thick Skin',
    description: 'Enhanced durability',
    branch: 'Fortress',
    tier: 1,
    statBoosts: { constitution: 2, defense: 2 },
    cost: 1,
  },
  {
    id: 'brute_fortress_2',
    name: 'Living Wall',
    description: 'Impenetrable defense',
    branch: 'Fortress',
    tier: 2,
    prerequisite: 'brute_fortress_1',
    statBoosts: { constitution: 3, defense: 3 },
    cost: 1,
  },
  {
    id: 'brute_fortress_3',
    name: 'Immovable Object',
    description: 'Nothing can break you',
    branch: 'Fortress',
    tier: 3,
    prerequisite: 'brute_fortress_2',
    statBoosts: { constitution: 4, defense: 4 },
    cost: 1,
  },

  // Branch 3: Berserker (Constitution - health pool for rage)
  {
    id: 'brute_berserker_1',
    name: 'Raging Heart',
    description: 'Channel fury into vitality',
    branch: 'Berserker',
    tier: 1,
    statBoosts: { constitution: 3 },
    cost: 1,
  },
  {
    id: 'brute_berserker_2',
    name: 'Relentless Fury',
    description: 'Unyielding combat endurance',
    branch: 'Berserker',
    tier: 2,
    prerequisite: 'brute_berserker_1',
    statBoosts: { constitution: 4 },
    cost: 1,
  },

  // Branch 4: Intimidation (Faith - morale/willpower)
  {
    id: 'brute_intimidation_1',
    name: 'Menacing Presence',
    description: 'Intimidate through sheer presence',
    branch: 'Intimidation',
    tier: 1,
    statBoosts: { faith: 2 },
    cost: 1,
  },
  {
    id: 'brute_intimidation_2',
    name: 'Fearsome Warrior',
    description: 'Strike terror into enemies',
    branch: 'Intimidation',
    tier: 2,
    prerequisite: 'brute_intimidation_1',
    statBoosts: { faith: 3 },
    cost: 1,
  },

  // Branch 5: Unstoppable (Speed - mobility despite heavy build)
  {
    id: 'brute_unstoppable_1',
    name: 'Heavy Charge',
    description: 'Surprising mobility for your size',
    branch: 'Unstoppable',
    tier: 1,
    statBoosts: { speed: 2 },
    cost: 1,
  },
  {
    id: 'brute_unstoppable_2',
    name: 'Juggernaut',
    description: 'Nothing slows you down',
    branch: 'Unstoppable',
    tier: 2,
    prerequisite: 'brute_unstoppable_1',
    statBoosts: { speed: 3 },
    cost: 1,
  },
]

// ============================================================================
// ASSASSIN — Speed and precision, glass cannon
// Branches: Shadow Strike, Agility, Deadly Precision, Evasion, Poison Arts
// ============================================================================

export const ASSASSIN_SKILLS: SkillNode[] = [
  // Branch 1: Shadow Strike (Dexterity + Strength)
  {
    id: 'assassin_shadow_1',
    name: 'Silent Blade',
    description: 'Strike from the shadows',
    branch: 'Shadow Strike',
    tier: 1,
    statBoosts: { dexterity: 2, strength: 1 },
    cost: 1,
  },
  {
    id: 'assassin_shadow_2',
    name: 'Lethal Precision',
    description: 'Every strike finds its mark',
    branch: 'Shadow Strike',
    tier: 2,
    prerequisite: 'assassin_shadow_1',
    statBoosts: { dexterity: 3, strength: 2 },
    cost: 1,
  },
  {
    id: 'assassin_shadow_3',
    name: 'Death Incarnate',
    description: 'Perfect killing efficiency',
    branch: 'Shadow Strike',
    tier: 3,
    prerequisite: 'assassin_shadow_2',
    statBoosts: { dexterity: 4, strength: 3 },
    cost: 1,
  },

  // Branch 2: Agility (Speed)
  {
    id: 'assassin_agility_1',
    name: 'Swift Movement',
    description: 'Unmatched speed',
    branch: 'Agility',
    tier: 1,
    statBoosts: { speed: 3 },
    cost: 1,
  },
  {
    id: 'assassin_agility_2',
    name: 'Blinding Speed',
    description: 'Faster than the eye can follow',
    branch: 'Agility',
    tier: 2,
    prerequisite: 'assassin_agility_1',
    statBoosts: { speed: 4 },
    cost: 1,
  },
  {
    id: 'assassin_agility_3',
    name: 'Shadow Step',
    description: 'Supernatural velocity',
    branch: 'Agility',
    tier: 3,
    prerequisite: 'assassin_agility_2',
    statBoosts: { speed: 5 },
    cost: 1,
  },

  // Branch 3: Deadly Precision (Dexterity)
  {
    id: 'assassin_precision_1',
    name: 'Precise Strikes',
    description: 'Hit vital points',
    branch: 'Deadly Precision',
    tier: 1,
    statBoosts: { dexterity: 3 },
    cost: 1,
  },
  {
    id: 'assassin_precision_2',
    name: 'Surgical Accuracy',
    description: 'Pinpoint lethality',
    branch: 'Deadly Precision',
    tier: 2,
    prerequisite: 'assassin_precision_1',
    statBoosts: { dexterity: 4 },
    cost: 1,
  },

  // Branch 4: Evasion (Defense - dodge-based)
  {
    id: 'assassin_evasion_1',
    name: 'Elusive Fighter',
    description: 'Hard to hit',
    branch: 'Evasion',
    tier: 1,
    statBoosts: { defense: 2 },
    cost: 1,
  },
  {
    id: 'assassin_evasion_2',
    name: 'Untouchable',
    description: 'Dodge master',
    branch: 'Evasion',
    tier: 2,
    prerequisite: 'assassin_evasion_1',
    statBoosts: { defense: 3 },
    cost: 1,
  },

  // Branch 5: Poison Arts (Arcana - alchemical knowledge)
  {
    id: 'assassin_poison_1',
    name: 'Toxic Coating',
    description: 'Poison weapon knowledge',
    branch: 'Poison Arts',
    tier: 1,
    statBoosts: { arcana: 2, constitution: 1 },
    cost: 1,
  },
  {
    id: 'assassin_poison_2',
    name: 'Master Poisoner',
    description: 'Deadly toxin expertise',
    branch: 'Poison Arts',
    tier: 2,
    prerequisite: 'assassin_poison_1',
    statBoosts: { arcana: 3, constitution: 2 },
    cost: 1,
  },
]

// ============================================================================
// MAGE — Spellcaster focused on magic damage and utility
// Branches: Arcane Power, Spell Defense, Mystic Knowledge, Battle Mage, Divine Faith
// ============================================================================

export const MAGE_SKILLS: SkillNode[] = [
  // Branch 1: Arcane Power (Arcana)
  {
    id: 'mage_arcane_1',
    name: 'Arcane Initiate',
    description: 'Basic magical mastery',
    branch: 'Arcane Power',
    tier: 1,
    statBoosts: { arcana: 3 },
    cost: 1,
  },
  {
    id: 'mage_arcane_2',
    name: 'Arcane Scholar',
    description: 'Advanced spell knowledge',
    branch: 'Arcane Power',
    tier: 2,
    prerequisite: 'mage_arcane_1',
    statBoosts: { arcana: 4 },
    cost: 1,
  },
  {
    id: 'mage_arcane_3',
    name: 'Archmage',
    description: 'Master of the arcane arts',
    branch: 'Arcane Power',
    tier: 3,
    prerequisite: 'mage_arcane_2',
    statBoosts: { arcana: 5 },
    cost: 1,
  },

  // Branch 2: Spell Defense (Magic Resist + Defense)
  {
    id: 'mage_defense_1',
    name: 'Magical Wards',
    description: 'Protective enchantments',
    branch: 'Spell Defense',
    tier: 1,
    statBoosts: { magicResist: 2, defense: 1 },
    cost: 1,
  },
  {
    id: 'mage_defense_2',
    name: 'Reinforced Barriers',
    description: 'Stronger magical protection',
    branch: 'Spell Defense',
    tier: 2,
    prerequisite: 'mage_defense_1',
    statBoosts: { magicResist: 3, defense: 2 },
    cost: 1,
  },
  {
    id: 'mage_defense_3',
    name: 'Impenetrable Aegis',
    description: 'Ultimate magical defense',
    branch: 'Spell Defense',
    tier: 3,
    prerequisite: 'mage_defense_2',
    statBoosts: { magicResist: 4, defense: 3 },
    cost: 1,
  },

  // Branch 3: Mystic Knowledge (Arcana + Constitution)
  {
    id: 'mage_mystic_1',
    name: 'Mystic Studies',
    description: 'Deepen magical understanding',
    branch: 'Mystic Knowledge',
    tier: 1,
    statBoosts: { arcana: 2, constitution: 1 },
    cost: 1,
  },
  {
    id: 'mage_mystic_2',
    name: 'Esoteric Lore',
    description: 'Forbidden knowledge',
    branch: 'Mystic Knowledge',
    tier: 2,
    prerequisite: 'mage_mystic_1',
    statBoosts: { arcana: 3, constitution: 2 },
    cost: 1,
  },

  // Branch 4: Battle Mage (Strength + Dexterity)
  {
    id: 'mage_battle_1',
    name: 'Combat Caster',
    description: 'Physical prowess for battle mages',
    branch: 'Battle Mage',
    tier: 1,
    statBoosts: { strength: 2, dexterity: 2 },
    cost: 1,
  },
  {
    id: 'mage_battle_2',
    name: 'Spellblade',
    description: 'Master of magic and melee',
    branch: 'Battle Mage',
    tier: 2,
    prerequisite: 'mage_battle_1',
    statBoosts: { strength: 3, dexterity: 3 },
    cost: 1,
  },

  // Branch 5: Divine Faith (Faith + Speed)
  {
    id: 'mage_faith_1',
    name: 'Divine Insight',
    description: 'Channel divine energy',
    branch: 'Divine Faith',
    tier: 1,
    statBoosts: { faith: 3, speed: 1 },
    cost: 1,
  },
  {
    id: 'mage_faith_2',
    name: 'Sanctified Caster',
    description: 'Holy magic mastery',
    branch: 'Divine Faith',
    tier: 2,
    prerequisite: 'mage_faith_1',
    statBoosts: { faith: 4, speed: 2 },
    cost: 1,
  },
]

// ============================================================================
// Skill Tree Registry
// ============================================================================

export const SKILL_TREES: Record<string, SkillNode[]> = {
  Duelist: DUELIST_SKILLS,
  Brute: BRUTE_SKILLS,
  Assassin: ASSASSIN_SKILLS,
  Mage: MAGE_SKILLS,
}

/**
 * Get skill tree for a gladiator class
 */
export function getSkillTree(gladiatorClass: string): SkillNode[] {
  const tree = SKILL_TREES[gladiatorClass]
  if (!tree) {
    throw new Error(`Unknown gladiator class: ${gladiatorClass}`)
  }
  return tree
}

/**
 * Get a specific skill by ID
 */
export function getSkill(skillId: string): SkillNode | undefined {
  for (const tree of Object.values(SKILL_TREES)) {
    const skill = tree.find((s) => s.id === skillId)
    if (skill) return skill
  }
  return undefined
}

/**
 * Check if a skill can be unlocked (prerequisite met)
 */
export function canUnlockSkill(
  skillId: string,
  unlockedSkills: string[]
): boolean {
  const skill = getSkill(skillId)
  if (!skill) return false

  // Check prerequisite
  if (skill.prerequisite && !unlockedSkills.includes(skill.prerequisite)) {
    return false
  }

  // Already unlocked?
  if (unlockedSkills.includes(skillId)) {
    return false
  }

  return true
}
