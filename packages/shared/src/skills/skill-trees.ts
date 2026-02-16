/**
 * Skill Tree System (Cross-Class 6-Tree Design)
 * 6 cross-class skill trees: Valor, Instinct, Discipline, Intellect, Zeal, Ferocity
 * Each tree: 15 tier 1-5 skills (1 point each) + 3 tier 6 capstones (2 points each)
 * Total: 108 skills across 6 trees
 */

export type SkillTreeName =
  | 'Valor'
  | 'Instinct'
  | 'Discipline'
  | 'Intellect'
  | 'Zeal'
  | 'Ferocity'

export type EffectType =
  | 'Passive Modifier'
  | 'Conditional Buff'
  | 'Defensive Effect'
  | 'Resource Effect'
  | 'Damage Amplifier'
  | 'Proc Trigger'
  | 'Mobility Effect'
  | 'Utility'
  | 'Activated Ability'

export type BuildRole =
  | 'Survivability'
  | 'Burst Damage'
  | 'Mobility'
  | 'Resource Economy'
  | 'Sustain'
  | 'Tempo Control'
  | 'Hybrid Support'

export interface SkillNode {
  id: string
  name: string
  description: string
  tree: SkillTreeName
  tier: number // 1-6 (tiers 1-5 cost 1 point, tier 6 capstones cost 2 points)
  prerequisiteTier?: number // Any tier N skill unlocks tier N+1 (flexible prerequisites)
  statBoosts: Record<string, number> // e.g. { constitution: 2, defense: 1 }
  scalingMod?: string // e.g. "1.10x Weapon damage"
  cost: number // Skill points required (1 for tiers 1-5, 2 for tier 6)
  effectType?: EffectType[]
  combatBehavior?: string
  buildRole?: BuildRole[]
  duration?: number // seconds
  cooldown?: number // seconds
  isActive?: boolean // true for activated abilities
}

// ============================================================================
// VALOR — Durability, Survival, Defensive Spikes
// Capstones: Zone of Denial, Last Bastion, Immutable Core
// ============================================================================

export const VALOR_SKILLS: SkillNode[] = [
  // Tier 1
  {
    id: 'valor_t1_fortified_body',
    name: 'Fortified Body',
    description: 'Passive: +2 CON',
    tree: 'Valor',
    tier: 1,
    statBoosts: { constitution: 2 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +2 CON',
    buildRole: ['Survivability'],
  },
  {
    id: 'valor_t1_iron_skin',
    name: 'Iron Skin',
    description: 'Passive: +2 DEF',
    tree: 'Valor',
    tier: 1,
    statBoosts: { defense: 2 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +2 DEF',
    buildRole: ['Survivability'],
  },
  {
    id: 'valor_t1_warded_flesh',
    name: 'Warded Flesh',
    description: 'Passive: +1 CON +1 MR',
    tree: 'Valor',
    tier: 1,
    statBoosts: { constitution: 1, magicResist: 1 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +1 CON +1 MR',
    buildRole: ['Survivability'],
  },

  // Tier 2
  {
    id: 'valor_t2_enduring_stamina',
    name: 'Enduring Stamina',
    description: 'Passive: +2 CON +1 STR, +5% stamina pool',
    tree: 'Valor',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { constitution: 2, strength: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Resource Effect'],
    combatBehavior: 'Passive: +2 CON +1 STR, +5% stamina pool',
    buildRole: ['Resource Economy', 'Survivability'],
  },
  {
    id: 'valor_t2_defensive_stance',
    name: 'Defensive Stance',
    description: 'Passive: +2 DEF +1 CON, Take 3% less damage while HP ≥ 70%',
    tree: 'Valor',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { defense: 2, constitution: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Defensive Effect'],
    combatBehavior:
      'Passive: +2 DEF +1 CON, Take 3% less damage while HP ≥ 70%',
    buildRole: ['Survivability'],
  },
  {
    id: 'valor_t2_arcane_resistance',
    name: 'Arcane Resistance',
    description: 'Passive: +1 DEF +1 MR +1 CON, +5% magic mitigation',
    tree: 'Valor',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { defense: 1, magicResist: 1, constitution: 1 },
    cost: 1,
    effectType: ['Defensive Effect', 'Passive Modifier'],
    combatBehavior: 'Passive: +1 DEF +1 MR +1 CON, +5% magic mitigation',
    buildRole: ['Survivability'],
  },

  // Tier 3
  {
    id: 'valor_t3_battle_scars',
    name: 'Battle Scars',
    description:
      'Passive: +2 CON +1 STR, Gain +1 DEF per 10% missing HP (max +5 DEF)',
    tree: 'Valor',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { constitution: 2, strength: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Passive Modifier'],
    combatBehavior:
      'Passive: +2 CON +1 STR, Gain +1 DEF per 10% missing HP (max +5 DEF)',
    buildRole: ['Burst Damage', 'Survivability'],
  },
  {
    id: 'valor_t3_unyielding_guard',
    name: 'Unyielding Guard',
    description: 'Passive: +3 DEF +1 CON, Block/parry recovery speed +10%',
    tree: 'Valor',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { defense: 3, constitution: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Resource Effect'],
    combatBehavior: 'Passive: +3 DEF +1 CON, Block/parry recovery speed +10%',
    buildRole: ['Survivability', 'Tempo Control'],
  },
  {
    id: 'valor_t3_vital_recovery',
    name: 'Vital Recovery',
    description: 'Passive: +2 CON +1 MR, Stamina regen +10% when HP ≥ 60%',
    tree: 'Valor',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { constitution: 2, magicResist: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Resource Effect'],
    combatBehavior: 'Passive: +2 CON +1 MR, Stamina regen +10% when HP ≥ 60%',
    buildRole: ['Resource Economy', 'Sustain'],
  },

  // Tier 4
  {
    id: 'valor_t4_steadfast_guard',
    name: 'Steadfast Guard',
    description: 'Passive: +6 CON +5 DEF, Take 10% less damage when HP ≥ 70%',
    tree: 'Valor',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { constitution: 6, defense: 5 },
    cost: 1,
    effectType: ['Conditional Buff', 'Defensive Effect'],
    combatBehavior:
      'Passive: +6 CON +5 DEF, Take 10% less damage when HP ≥ 70%',
    buildRole: ['Survivability'],
  },
  {
    id: 'valor_t4_titans_retaliation',
    name: "Titan's Retaliation",
    description:
      'Passive: +3 CON +3 STR, When damaged for ≥15% max HP gain +15% damage for 4s',
    tree: 'Valor',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { constitution: 3, strength: 3 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier', 'Proc Trigger'],
    combatBehavior:
      'Passive: +3 CON +3 STR, When damaged for ≥15% max HP gain +15% damage for 4s',
    buildRole: ['Burst Damage', 'Survivability'],
    duration: 4,
    cooldown: 8,
  },
  {
    id: 'valor_t4_bastion_of_will',
    name: 'Bastion of Will',
    description:
      'Passive: +3 DEF +2 MR +1 CON, Debuff durations -15%, stagger resistance +20%',
    tree: 'Valor',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { defense: 3, magicResist: 2, constitution: 1 },
    cost: 1,
    effectType: ['Defensive Effect', 'Passive Modifier'],
    combatBehavior:
      'Passive: +3 DEF +2 MR +1 CON, Debuff durations -15%, stagger resistance +20%',
    buildRole: ['Survivability', 'Tempo Control'],
  },

  // Tier 5
  {
    id: 'valor_t5_second_wind',
    name: 'Second Wind',
    description:
      'Active: Restore 10% HP and 25% stamina (can only use when HP > 25%), +4 CON +3 STR',
    tree: 'Valor',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { constitution: 4, strength: 3 },
    cost: 1,
    effectType: ['Activated Ability', 'Defensive Effect', 'Resource Effect'],
    combatBehavior:
      'Active: Restore 10% HP and 25% stamina (can only use when HP > 25%), +4 CON +3 STR',
    buildRole: ['Resource Economy', 'Survivability'],
    duration: 2,
    cooldown: 45,
    isActive: true,
  },
  {
    id: 'valor_t5_immovable_bulwark',
    name: 'Immovable Bulwark',
    description:
      'Passive: +5 DEF +4 CON, Damage reduction +5% per second while stationary (max 15%, resets on movement)',
    tree: 'Valor',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { defense: 5, constitution: 4 },
    cost: 1,
    effectType: ['Conditional Buff', 'Defensive Effect'],
    combatBehavior:
      'Passive: +5 DEF +4 CON, Damage reduction +5% per second while stationary (max 15%, resets on movement)',
    buildRole: ['Survivability', 'Tempo Control'],
  },
  {
    id: 'valor_t5_aegis_of_resolve',
    name: 'Aegis of Resolve',
    description:
      'Passive: +4 CON +3 DEF +2 MR, Healing effects on you grant +10% mitigation for 3s',
    tree: 'Valor',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { constitution: 4, defense: 3, magicResist: 2 },
    cost: 1,
    effectType: ['Conditional Buff', 'Defensive Effect'],
    combatBehavior:
      'Passive: +4 CON +3 DEF +2 MR, Healing effects on you grant +10% mitigation for 3s',
    buildRole: ['Survivability'],
    duration: 3,
  },

  // Tier 6 (Capstones)
  {
    id: 'valor_capstone_zone_of_denial',
    name: 'Zone of Denial',
    description:
      'Aura weakens nearby enemies (reduced movement & damage). Personal control resistance increased while active. Trigger: Remain stationary OR Defensive stance active',
    tree: 'Valor',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { defense: 30, constitution: 20 },
    cost: 2,
    effectType: ['Conditional Buff', 'Defensive Effect', 'Utility'],
    combatBehavior:
      'Effect: Aura weakens nearby enemies (reduced movement & damage), Effect: Personal control resistance increased while active, Trigger: Remain stationary OR Defensive stance active',
    buildRole: ['Hybrid Support', 'Survivability', 'Tempo Control'],
  },
  {
    id: 'valor_capstone_last_bastion',
    name: 'Last Bastion',
    description:
      'Gain temporary Damage Boost and increased Recovery Speed during counter window. Trigger: Take damage ≥ 10% Max HP',
    tree: 'Valor',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { constitution: 28, strength: 24 },
    cost: 2,
    effectType: [
      'Conditional Buff',
      'Damage Amplifier',
      'Defensive Effect',
      'Proc Trigger',
    ],
    combatBehavior:
      'Effect: Gain temporary Damage Boost, Effect: Increased Recovery Speed during counter window, Trigger: Take damage ≥ 10% Max HP',
    buildRole: ['Burst Damage', 'Survivability', 'Tempo Control'],
    duration: 3,
    cooldown: 12,
  },
  {
    id: 'valor_capstone_immutable_core',
    name: 'Immutable Core',
    description:
      'Gain stacking Damage Reduction from overheal. High stamina grants stagger resistance. DR decays when resources fall. Trigger: Overheal OR Stamina ≥ 80%',
    tree: 'Valor',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { constitution: 30, defense: 22 },
    cost: 2,
    effectType: ['Conditional Buff', 'Defensive Effect', 'Resource Effect'],
    combatBehavior:
      'Effect: DR decays when resources fall, Effect: Gain stacking Damage Reduction from overheal, Effect: High stamina grants stagger resistance, Trigger: Overheal OR Stamina ≥ 80%',
    buildRole: ['Survivability', 'Sustain', 'Tempo Control'],
  },
]

// ============================================================================
// INSTINCT — Movement, Dodge, Tempo
// Capstones: Hyper Awareness, Phase Reposition, Perfect Flow
// ============================================================================

export const INSTINCT_SKILLS: SkillNode[] = [
  // Tier 1
  {
    id: 'instinct_t1_swift_reflexes',
    name: 'Swift Reflexes',
    description: 'Passive: +2 DEX',
    tree: 'Instinct',
    tier: 1,
    statBoosts: { dexterity: 2 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +2 DEX',
    buildRole: ['Mobility'],
  },
  {
    id: 'instinct_t1_light_step',
    name: 'Light Step',
    description: 'Passive: +2 SPD',
    tree: 'Instinct',
    tier: 1,
    statBoosts: { speed: 2 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +2 SPD',
    buildRole: ['Mobility'],
  },
  {
    id: 'instinct_t1_balanced_agility',
    name: 'Balanced Agility',
    description: 'Passive: +1 DEX +1 SPD',
    tree: 'Instinct',
    tier: 1,
    statBoosts: { dexterity: 1, speed: 1 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +1 DEX +1 SPD',
    buildRole: ['Mobility'],
  },

  // Tier 2
  {
    id: 'instinct_t2_momentum_flow',
    name: 'Momentum Flow',
    description: 'Passive: +3 SPD +2 DEX, Faster dodge recovery',
    tree: 'Instinct',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { speed: 3, dexterity: 2 },
    cost: 1,
    effectType: ['Mobility Effect', 'Passive Modifier'],
    combatBehavior: 'Passive: +3 SPD +2 DEX, Faster dodge recovery',
    buildRole: ['Mobility'],
  },
  {
    id: 'instinct_t2_evasive_training',
    name: 'Evasive Training',
    description: 'Passive: +2 DEX +1 CON, +5% dodge i-frame duration',
    tree: 'Instinct',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { dexterity: 2, constitution: 1 },
    cost: 1,
    effectType: ['Defensive Effect', 'Passive Modifier'],
    combatBehavior: 'Passive: +2 DEX +1 CON, +5% dodge i-frame duration',
    buildRole: ['Mobility', 'Survivability'],
  },
  {
    id: 'instinct_t2_quick_recovery',
    name: 'Quick Recovery',
    description: 'Passive: +2 SPD +1 DEX, Recovery speed +5% after dodge',
    tree: 'Instinct',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { speed: 2, dexterity: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Resource Effect'],
    combatBehavior: 'Passive: +2 SPD +1 DEX, Recovery speed +5% after dodge',
    buildRole: ['Mobility', 'Tempo Control'],
  },

  // Tier 3
  {
    id: 'instinct_t3_predatory_movement',
    name: 'Predatory Movement',
    description: 'Passive: +2 SPD +1 STR, +8% movement speed for 2s after attacking',
    tree: 'Instinct',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { speed: 2, strength: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Mobility Effect', 'Proc Trigger'],
    combatBehavior:
      'Passive: +2 SPD +1 STR, +8% movement speed for 2s after attacking',
    buildRole: ['Burst Damage', 'Mobility'],
    duration: 2,
  },
  {
    id: 'instinct_t3_perfect_timing',
    name: 'Perfect Timing',
    description:
      'Passive: +3 DEX +1 SPD, Successful dodge reduces next attack cooldown by 10%',
    tree: 'Instinct',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { dexterity: 3, speed: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Proc Trigger', 'Resource Effect'],
    combatBehavior:
      'Passive: +3 DEX +1 SPD, Successful dodge reduces next attack cooldown by 10%',
    buildRole: ['Mobility', 'Tempo Control'],
  },
  {
    id: 'instinct_t3_fortified_reflexes',
    name: 'Fortified Reflexes',
    description: 'Passive: +2 DEX +1 CON, Dodge stamina cost -10%',
    tree: 'Instinct',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { dexterity: 2, constitution: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Resource Effect'],
    combatBehavior: 'Passive: +2 DEX +1 CON, Dodge stamina cost -10%',
    buildRole: ['Mobility', 'Resource Economy'],
  },

  // Tier 4
  {
    id: 'instinct_t4_phantom_step',
    name: 'Phantom Step',
    description:
      'Passive: +4 SPD +3 DEX, Dodge distance +15%, movement speed +8% for 3s after dodge',
    tree: 'Instinct',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { speed: 4, dexterity: 3 },
    cost: 1,
    effectType: ['Conditional Buff', 'Mobility Effect', 'Proc Trigger'],
    combatBehavior:
      'Passive: +4 SPD +3 DEX, Dodge distance +15%, movement speed +8% for 3s after dodge',
    buildRole: ['Mobility'],
    duration: 3,
  },
  {
    id: 'instinct_t4_counterstrike_reflex',
    name: 'Counterstrike Reflex',
    description:
      'Passive: +4 DEX +2 SPD, Attacks within 1.5s after dodge deal +12% damage',
    tree: 'Instinct',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { dexterity: 4, speed: 2 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier', 'Proc Trigger'],
    combatBehavior:
      'Passive: +4 DEX +2 SPD, Attacks within 1.5s after dodge deal +12% damage',
    buildRole: ['Burst Damage', 'Mobility'],
    duration: 1.5,
  },
  {
    id: 'instinct_t4_adaptive_defense',
    name: 'Adaptive Defense',
    description:
      'Passive: +3 DEX +2 CON +1 SPD, Each consecutive dodge in 5s grants +3% mitigation (stacks 3x)',
    tree: 'Instinct',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { dexterity: 3, constitution: 2, speed: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Defensive Effect', 'Proc Trigger'],
    combatBehavior:
      'Passive: +3 DEX +2 CON +1 SPD, Each consecutive dodge in 5s grants +3% mitigation (stacks 3x)',
    buildRole: ['Mobility', 'Survivability'],
    duration: 5,
  },

  // Tier 5
  {
    id: 'instinct_t5_killer_reflex',
    name: 'Killer Reflex',
    description: 'Passive: +6 SPD +5 DEX, +15% crit chance for 3s after dodge',
    tree: 'Instinct',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { speed: 6, dexterity: 5 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier', 'Proc Trigger'],
    combatBehavior:
      'Passive: +6 SPD +5 DEX, +15% crit chance for 3s after dodge',
    buildRole: ['Burst Damage', 'Mobility'],
    duration: 3,
    cooldown: 5,
  },
  {
    id: 'instinct_t5_phase_strike',
    name: 'Phase Strike',
    description:
      'Active: +5 DEX +4 SPD, Next attack after movement ability ignores 30% mitigation',
    tree: 'Instinct',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { dexterity: 5, speed: 4 },
    cost: 1,
    effectType: ['Activated Ability', 'Damage Amplifier', 'Mobility Effect'],
    combatBehavior:
      'Active: +5 DEX +4 SPD, Next attack after movement ability ignores 30% mitigation',
    buildRole: ['Burst Damage', 'Mobility'],
    cooldown: 6,
    isActive: true,
  },
  {
    id: 'instinct_t5_flow_state',
    name: 'Flow State',
    description:
      'Passive: +5 SPD +4 DEX, Consecutive dodges grant +5% attack speed (stacks 4x, decays after 3s)',
    tree: 'Instinct',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { speed: 5, dexterity: 4 },
    cost: 1,
    effectType: ['Conditional Buff', 'Passive Modifier', 'Proc Trigger'],
    combatBehavior:
      'Passive: +5 SPD +4 DEX, Consecutive dodges grant +5% attack speed (stacks 4x, decays after 3s)',
    buildRole: ['Mobility', 'Tempo Control'],
    duration: 3,
  },

  // Tier 6 (Capstones)
  {
    id: 'instinct_capstone_hyper_awareness',
    name: 'Hyper Awareness',
    description:
      'Automatic micro-evade OR damage dampening when you receive burst damage ≥ 15% Max HP. Internal cooldown prevents repeated triggers.',
    tree: 'Instinct',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { dexterity: 28, constitution: 22 },
    cost: 2,
    effectType: ['Defensive Effect', 'Mobility Effect', 'Proc Trigger'],
    combatBehavior:
      'Effect: Automatic micro-evade OR damage dampening, Effect: Internal cooldown prevents repeated triggers, Trigger: Receive burst damage ≥ 15% Max HP',
    buildRole: ['Mobility', 'Survivability', 'Tempo Control'],
    duration: 0.5,
    cooldown: 20,
  },
  {
    id: 'instinct_capstone_phase_reposition',
    name: 'Phase Reposition',
    description:
      'Next attack ignores portion of mitigation with increased impact/burst window. Trigger: Attack within 1s after movement ability.',
    tree: 'Instinct',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { speed: 32, dexterity: 20 },
    cost: 2,
    effectType: ['Defensive Effect', 'Mobility Effect', 'Proc Trigger'],
    combatBehavior:
      'Effect: Increased impact / burst window, Effect: Next attack ignores portion of mitigation, Trigger: Attack within 1s after movement ability',
    buildRole: ['Burst Damage', 'Mobility', 'Tempo Control'],
    duration: 1,
    cooldown: 6,
  },
  {
    id: 'instinct_capstone_perfect_flow',
    name: 'Perfect Flow',
    description:
      'Gain stacking Attack Speed and Critical Chance on successful dodge (i-frame avoidance). Stacks decay when not evading.',
    tree: 'Instinct',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { dexterity: 30, speed: 24 },
    cost: 2,
    effectType: [
      'Conditional Buff',
      'Damage Amplifier',
      'Mobility Effect',
      'Proc Trigger',
    ],
    combatBehavior:
      'Effect: Gain stacking Attack Speed, Effect: Gain stacking Critical Chance, Effect: Stacks decay when not evading, Trigger: Successful dodge (i-frame avoidance)',
    buildRole: ['Burst Damage', 'Mobility', 'Tempo Control'],
    duration: 6,
  },
]

// ============================================================================
// DISCIPLINE — Weapon Mastery, Stamina Economy
// Capstones: Disarm Technique, Endless Chain, Master Scaling
// ============================================================================

export const DISCIPLINE_SKILLS: SkillNode[] = [
  // Tier 1
  {
    id: 'discipline_t1_weapon_training',
    name: 'Weapon Training',
    description: 'Passive: +2 STR',
    tree: 'Discipline',
    tier: 1,
    statBoosts: { strength: 2 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +2 STR',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },
  {
    id: 'discipline_t1_precision_focus',
    name: 'Precision Focus',
    description: 'Passive: +2 DEX',
    tree: 'Discipline',
    tier: 1,
    statBoosts: { dexterity: 2 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +2 DEX',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },
  {
    id: 'discipline_t1_balanced_technique',
    name: 'Balanced Technique',
    description: 'Passive: +1 STR +1 DEX',
    tree: 'Discipline',
    tier: 1,
    statBoosts: { strength: 1, dexterity: 1 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +1 STR +1 DEX',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },

  // Tier 2
  {
    id: 'discipline_t2_power_strike',
    name: 'Power Strike',
    description: 'Passive: +2 STR +1 DEX, Heavy attacks +5% damage',
    tree: 'Discipline',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { strength: 2, dexterity: 1 },
    cost: 1,
    effectType: ['Damage Amplifier', 'Passive Modifier'],
    combatBehavior: 'Passive: +2 STR +1 DEX, Heavy attacks +5% damage',
    buildRole: ['Burst Damage'],
  },
  {
    id: 'discipline_t2_efficient_strikes',
    name: 'Efficient Strikes',
    description: 'Passive: +2 DEX +1 STR, Weapon attacks cost 5% less stamina',
    tree: 'Discipline',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { dexterity: 2, strength: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Resource Effect'],
    combatBehavior:
      'Passive: +2 DEX +1 STR, Weapon attacks cost 5% less stamina',
    buildRole: ['Resource Economy', 'Tempo Control'],
  },
  {
    id: 'discipline_t2_steadfast_blade',
    name: 'Steadfast Blade',
    description: 'Passive: +1 STR +1 DEX +1 CON, +5% weapon scaling',
    tree: 'Discipline',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { strength: 1, dexterity: 1, constitution: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Damage Amplifier'],
    combatBehavior: 'Passive: +1 STR +1 DEX +1 CON, +5% weapon scaling',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },

  // Tier 3
  {
    id: 'discipline_t3_relentless_assault',
    name: 'Relentless Assault',
    description:
      'Passive: +2 STR +1 SPD, Consecutive hits on same target grant +3% damage (stacks 3x)',
    tree: 'Discipline',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { strength: 2, speed: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier', 'Proc Trigger'],
    combatBehavior:
      'Passive: +2 STR +1 SPD, Consecutive hits on same target grant +3% damage (stacks 3x)',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },
  {
    id: 'discipline_t3_defensive_mastery',
    name: 'Defensive Mastery',
    description:
      'Passive: +2 DEX +1 DEF, Successful block/parry restores 5% stamina',
    tree: 'Discipline',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { dexterity: 2, defense: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Proc Trigger', 'Resource Effect'],
    combatBehavior:
      'Passive: +2 DEX +1 DEF, Successful block/parry restores 5% stamina',
    buildRole: ['Resource Economy', 'Survivability'],
  },
  {
    id: 'discipline_t3_stamina_conservation',
    name: 'Stamina Conservation',
    description: 'Passive: +2 DEX +1 CON, Stamina regen +10% during combat',
    tree: 'Discipline',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { dexterity: 2, constitution: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Resource Effect'],
    combatBehavior: 'Passive: +2 DEX +1 CON, Stamina regen +10% during combat',
    buildRole: ['Resource Economy', 'Sustain'],
  },

  // Tier 4
  {
    id: 'discipline_t4_combat_efficiency',
    name: 'Combat Efficiency',
    description:
      'Passive: +6 STR +4 DEX, 1.10x weapon damage, reduced stamina cost',
    tree: 'Discipline',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { strength: 6, dexterity: 4 },
    cost: 1,
    effectType: ['Damage Amplifier', 'Passive Modifier', 'Resource Effect'],
    combatBehavior:
      'Passive: +6 STR +4 DEX, 1.10x weapon damage, reduced stamina cost',
    buildRole: ['Burst Damage', 'Resource Economy'],
    scalingMod: '1.10x Weapon damage',
  },
  {
    id: 'discipline_t4_weapon_virtuoso',
    name: 'Weapon Virtuoso',
    description:
      'Passive: +4 DEX +3 DEF, Weapon recovery speed +12%, parry window +0.1s',
    tree: 'Discipline',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { dexterity: 4, defense: 3 },
    cost: 1,
    effectType: ['Passive Modifier', 'Defensive Effect'],
    combatBehavior:
      'Passive: +4 DEX +3 DEF, Weapon recovery speed +12%, parry window +0.1s',
    buildRole: ['Survivability', 'Tempo Control'],
  },
  {
    id: 'discipline_t4_berserker_rhythm',
    name: 'Berserker Rhythm',
    description:
      'Passive: +4 STR +2 SPD, Attack speed +5% per consecutive hit (max 15%)',
    tree: 'Discipline',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { strength: 4, speed: 2 },
    cost: 1,
    effectType: ['Conditional Buff', 'Passive Modifier', 'Proc Trigger'],
    combatBehavior:
      'Passive: +4 STR +2 SPD, Attack speed +5% per consecutive hit (max 15%)',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },

  // Tier 5
  {
    id: 'discipline_t5_weapon_mastery',
    name: 'Weapon Mastery',
    description: 'Passive: +6 STR +4 DEX, Increase weapon damage scaling',
    tree: 'Discipline',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { strength: 6, dexterity: 4 },
    cost: 1,
    effectType: ['Damage Amplifier', 'Passive Modifier'],
    combatBehavior:
      'Passive: +6 STR +4 DEX, Increase weapon damage scaling',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },
  {
    id: 'discipline_t5_endless_momentum',
    name: 'Endless Momentum',
    description:
      'Passive: +5 DEX +4 CON, Consecutive hits reduce stamina cost by 3% per hit (max 15%)',
    tree: 'Discipline',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { dexterity: 5, constitution: 4 },
    cost: 1,
    effectType: ['Passive Modifier', 'Proc Trigger', 'Resource Effect'],
    combatBehavior:
      'Passive: +5 DEX +4 CON, Consecutive hits reduce stamina cost by 3% per hit (max 15%)',
    buildRole: ['Resource Economy', 'Sustain'],
  },
  {
    id: 'discipline_t5_perfect_execution',
    name: 'Perfect Execution',
    description:
      'Passive: +6 STR +4 DEX, Heavy attacks vs stunned/staggered enemies deal +25% damage',
    tree: 'Discipline',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { strength: 6, dexterity: 4 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier'],
    combatBehavior:
      'Passive: +6 STR +4 DEX, Heavy attacks vs stunned/staggered enemies deal +25% damage',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },

  // Tier 6 (Capstones)
  {
    id: 'discipline_capstone_disarm_technique',
    name: 'Disarm Technique',
    description:
      'Apply Disarm debuff reducing enemy scaling and recovery speed. Trigger: Heavy strike OR stagger event.',
    tree: 'Discipline',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { dexterity: 28, defense: 22 },
    cost: 2,
    effectType: ['Defensive Effect', 'Proc Trigger', 'Utility'],
    combatBehavior:
      'Effect: Apply Disarm debuff reducing enemy scaling, Effect: Reduced enemy recovery speed, Trigger: Heavy strike OR stagger event',
    buildRole: ['Hybrid Support', 'Survivability', 'Tempo Control'],
    duration: 4,
    cooldown: 14,
  },
  {
    id: 'discipline_capstone_endless_chain',
    name: 'Endless Chain',
    description:
      'Stamina cost reduction stacks and minor attack speed ramp during sustained combat. Trigger: Consecutive hits within combo window.',
    tree: 'Discipline',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { dexterity: 26, constitution: 24 },
    cost: 2,
    effectType: ['Passive Modifier', 'Proc Trigger', 'Resource Effect'],
    combatBehavior:
      'Effect: Minor attack speed ramp during sustained combat, Effect: Stamina cost reduction stacks, Trigger: Consecutive hits within combo window',
    buildRole: ['Resource Economy', 'Sustain', 'Tempo Control'],
    duration: 8,
  },
  {
    id: 'discipline_capstone_master_scaling',
    name: 'Master Scaling',
    description:
      'Weapon scaling uses dominant offensive stat efficiently with improved hybrid stat conversion and increased weapon scaling coefficient.',
    tree: 'Discipline',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { strength: 28, dexterity: 28 },
    cost: 2,
    effectType: ['Damage Amplifier', 'Passive Modifier'],
    combatBehavior:
      'Effect: Improved hybrid stat conversion, Effect: Increased weapon scaling coefficient, Passive: Weapon scaling uses dominant offensive stat efficiently',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },
]

// ============================================================================
// INTELLECT — Arcane Power, Mana Loops
// Capstones: Reality Distortion, Spell Weaving, Arcane Overload
// ============================================================================

export const INTELLECT_SKILLS: SkillNode[] = [
  // Tier 1
  {
    id: 'intellect_t1_arcane_studies',
    name: 'Arcane Studies',
    description: 'Passive: +2 ARC',
    tree: 'Intellect',
    tier: 1,
    statBoosts: { arcana: 2 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +2 ARC',
    buildRole: ['Burst Damage', 'Resource Economy'],
  },
  {
    id: 'intellect_t1_mystic_wards',
    name: 'Mystic Wards',
    description: 'Passive: +2 MR',
    tree: 'Intellect',
    tier: 1,
    statBoosts: { magicResist: 2 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +2 MR',
    buildRole: ['Resource Economy', 'Survivability'],
  },
  {
    id: 'intellect_t1_balanced_attunement',
    name: 'Balanced Attunement',
    description: 'Passive: +1 ARC +1 MR',
    tree: 'Intellect',
    tier: 1,
    statBoosts: { arcana: 1, magicResist: 1 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +1 ARC +1 MR',
    buildRole: ['Burst Damage', 'Resource Economy'],
  },

  // Tier 2
  {
    id: 'intellect_t2_spell_power',
    name: 'Spell Power',
    description: 'Passive: +2 ARC +1 MR, +5% spell damage',
    tree: 'Intellect',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { arcana: 2, magicResist: 1 },
    cost: 1,
    effectType: ['Damage Amplifier', 'Passive Modifier'],
    combatBehavior: 'Passive: +2 ARC +1 MR, +5% spell damage',
    buildRole: ['Burst Damage'],
  },
  {
    id: 'intellect_t2_mana_efficiency',
    name: 'Mana Efficiency',
    description: 'Passive: +2 MR +1 ARC, Spell costs -5% mana',
    tree: 'Intellect',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { magicResist: 2, arcana: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Resource Effect'],
    combatBehavior: 'Passive: +2 MR +1 ARC, Spell costs -5% mana',
    buildRole: ['Resource Economy'],
  },
  {
    id: 'intellect_t2_battle_caster',
    name: 'Battle Caster',
    description: 'Passive: +1 ARC +1 DEX +1 MR, Cast speed +5%',
    tree: 'Intellect',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { arcana: 1, dexterity: 1, magicResist: 1 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +1 ARC +1 DEX +1 MR, Cast speed +5%',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },

  // Tier 3
  {
    id: 'intellect_t3_arcane_burst',
    name: 'Arcane Burst',
    description: 'Passive: +2 ARC +1 SPD, Spells cast while moving deal +8% damage',
    tree: 'Intellect',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { arcana: 2, speed: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier'],
    combatBehavior:
      'Passive: +2 ARC +1 SPD, Spells cast while moving deal +8% damage',
    buildRole: ['Burst Damage', 'Mobility'],
  },
  {
    id: 'intellect_t3_spell_resilience',
    name: 'Spell Resilience',
    description: 'Passive: +2 MR +1 CON, Taking damage restores 3% max mana',
    tree: 'Intellect',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { magicResist: 2, constitution: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Proc Trigger', 'Resource Effect'],
    combatBehavior:
      'Passive: +2 MR +1 CON, Taking damage restores 3% max mana',
    buildRole: ['Resource Economy', 'Survivability'],
    cooldown: 4,
  },
  {
    id: 'intellect_t3_focused_casting',
    name: 'Focused Casting',
    description:
      'Passive: +3 ARC +1 DEX, Consecutive spells on same target increase damage by 4% (stacks 3x)',
    tree: 'Intellect',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { arcana: 3, dexterity: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier', 'Proc Trigger'],
    combatBehavior:
      'Passive: +3 ARC +1 DEX, Consecutive spells on same target increase damage by 4% (stacks 3x)',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },

  // Tier 4
  {
    id: 'intellect_t4_arcane_feedback',
    name: 'Arcane Feedback',
    description: 'Passive: +7 ARC +5 MR, Regain mana on spell damage',
    tree: 'Intellect',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { arcana: 7, magicResist: 5 },
    cost: 1,
    effectType: ['Passive Modifier', 'Proc Trigger', 'Resource Effect'],
    combatBehavior: 'Passive: +7 ARC +5 MR, Regain mana on spell damage',
    buildRole: ['Resource Economy'],
    cooldown: 1,
  },
  {
    id: 'intellect_t4_spell_acceleration',
    name: 'Spell Acceleration',
    description: 'Passive: +4 ARC +3 SPD, Cast speed +12%, spell recovery -10%',
    tree: 'Intellect',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { arcana: 4, speed: 3 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior:
      'Passive: +4 ARC +3 SPD, Cast speed +12%, spell recovery -10%',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },
  {
    id: 'intellect_t4_arcane_fortification',
    name: 'Arcane Fortification',
    description:
      'Passive: +3 MR +3 CON +2 ARC, Mana shield: 15% of mana pool acts as damage buffer',
    tree: 'Intellect',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { magicResist: 3, constitution: 3, arcana: 2 },
    cost: 1,
    effectType: ['Defensive Effect', 'Passive Modifier', 'Resource Effect'],
    combatBehavior:
      'Passive: +3 MR +3 CON +2 ARC, Mana shield: 15% of mana pool acts as damage buffer',
    buildRole: ['Resource Economy', 'Survivability'],
  },

  // Tier 5
  {
    id: 'intellect_t5_spell_echo',
    name: 'Spell Echo',
    description: '15% chance to recast spell with reduced effectiveness',
    tree: 'Intellect',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: {},
    cost: 1,
    effectType: ['Damage Amplifier', 'Proc Trigger'],
    combatBehavior: '15% chance to recast spell with reduced effectiveness',
    buildRole: ['Burst Damage', 'Hybrid Support'],
    cooldown: 8,
  },
  {
    id: 'intellect_t5_arcane_supremacy',
    name: 'Arcane Supremacy',
    description: 'Passive: +6 ARC +4 MR, Spell damage +15% when mana ≥ 70%',
    tree: 'Intellect',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { arcana: 6, magicResist: 4 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier'],
    combatBehavior:
      'Passive: +6 ARC +4 MR, Spell damage +15% when mana ≥ 70%',
    buildRole: ['Burst Damage', 'Resource Economy'],
  },
  {
    id: 'intellect_t5_spellblade_synergy',
    name: 'Spellblade Synergy',
    description:
      'Active: +5 ARC +4 DEX, Weapon hit after spell empowers next spell by 20%, spell after weapon empowers next weapon by 20%',
    tree: 'Intellect',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { arcana: 5, dexterity: 4 },
    cost: 1,
    effectType: ['Activated Ability', 'Damage Amplifier', 'Utility'],
    combatBehavior:
      'Active: +5 ARC +4 DEX, Weapon hit after spell empowers next spell by 20%, spell after weapon empowers next weapon by 20%',
    buildRole: ['Burst Damage', 'Hybrid Support'],
    duration: 10,
    isActive: true,
  },

  // Tier 6 (Capstones)
  {
    id: 'intellect_capstone_reality_distortion',
    name: 'Reality Distortion',
    description:
      'Activate distortion field: Enemies inside lose mana and stamina regen.',
    tree: 'Intellect',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { magicResist: 30, arcana: 20 },
    cost: 2,
    effectType: ['Activated Ability', 'Resource Effect', 'Utility'],
    combatBehavior:
      'Effect: Enemies inside lose mana regen, Effect: Enemies inside lose stamina regen, Trigger: Activate distortion field',
    buildRole: ['Hybrid Support', 'Resource Economy', 'Tempo Control'],
    duration: 6,
    cooldown: 24,
    isActive: true,
  },
  {
    id: 'intellect_capstone_spell_weaving',
    name: 'Spell Weaving',
    description:
      'Next ability empowered and resource efficiency increased during hybrid chains. Trigger: Cast after weapon hit OR strike after casting.',
    tree: 'Intellect',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { arcana: 28, dexterity: 22 },
    cost: 2,
    effectType: ['Passive Modifier', 'Proc Trigger', 'Resource Effect'],
    combatBehavior:
      'Effect: Next ability empowered, Effect: Resource efficiency increased during hybrid chains, Trigger: Cast after weapon hit OR strike after casting',
    buildRole: ['Burst Damage', 'Hybrid Support', 'Resource Economy'],
    duration: 2,
    cooldown: 10,
  },
  {
    id: 'intellect_capstone_arcane_overload',
    name: 'Arcane Overload',
    description:
      'Increased spell damage scaling and casting speed when mana ≥ 70%. Buff weakens as mana drops.',
    tree: 'Intellect',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { arcana: 30, magicResist: 22 },
    cost: 2,
    effectType: ['Conditional Buff', 'Damage Amplifier', 'Resource Effect'],
    combatBehavior:
      'Effect: Buff weakens as mana drops, Effect: Increased casting speed, Effect: Increased spell damage scaling, Trigger: Mana ≥ 70%',
    buildRole: ['Burst Damage', 'Resource Economy', 'Tempo Control'],
  },
]

// ============================================================================
// ZEAL — Faith, Sustain, Resilience
// Capstones: Holy Sanctum, Radiant Conversion, Divine Overflow
// ============================================================================

export const ZEAL_SKILLS: SkillNode[] = [
  // Tier 1
  {
    id: 'zeal_t1_divine_favor',
    name: 'Divine Favor',
    description: 'Passive: +2 FTH',
    tree: 'Zeal',
    tier: 1,
    statBoosts: { faith: 2 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +2 FTH',
    buildRole: ['Burst Damage', 'Sustain'],
  },
  {
    id: 'zeal_t1_sacred_endurance',
    name: 'Sacred Endurance',
    description: 'Passive: +2 CON',
    tree: 'Zeal',
    tier: 1,
    statBoosts: { constitution: 2 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +2 CON',
    buildRole: ['Survivability', 'Sustain'],
  },
  {
    id: 'zeal_t1_holy_balance',
    name: 'Holy Balance',
    description: 'Passive: +1 FTH +1 CON',
    tree: 'Zeal',
    tier: 1,
    statBoosts: { faith: 1, constitution: 1 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +1 FTH +1 CON',
    buildRole: ['Survivability', 'Sustain'],
  },

  // Tier 2
  {
    id: 'zeal_t2_radiant_power',
    name: 'Radiant Power',
    description: 'Passive: +2 FTH +1 STR, Divine damage +5%',
    tree: 'Zeal',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { faith: 2, strength: 1 },
    cost: 1,
    effectType: ['Damage Amplifier', 'Passive Modifier'],
    combatBehavior: 'Passive: +2 FTH +1 STR, Divine damage +5%',
    buildRole: ['Burst Damage'],
  },
  {
    id: 'zeal_t2_sacred_vitality',
    name: 'Sacred Vitality',
    description: 'Passive: +2 CON +1 FTH, Healing received +8%',
    tree: 'Zeal',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { constitution: 2, faith: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Resource Effect'],
    combatBehavior: 'Passive: +2 CON +1 FTH, Healing received +8%',
    buildRole: ['Survivability', 'Sustain'],
  },
  {
    id: 'zeal_t2_faithful_defense',
    name: 'Faithful Defense',
    description: 'Passive: +1 FTH +1 MR +1 CON, Debuff resistance +5%',
    tree: 'Zeal',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { faith: 1, magicResist: 1, constitution: 1 },
    cost: 1,
    effectType: ['Defensive Effect', 'Passive Modifier'],
    combatBehavior: 'Passive: +1 FTH +1 MR +1 CON, Debuff resistance +5%',
    buildRole: ['Survivability'],
  },

  // Tier 3
  {
    id: 'zeal_t3_holy_fury',
    name: 'Holy Fury',
    description: 'Passive: +2 FTH +1 STR, Dealing damage heals 2% of damage dealt',
    tree: 'Zeal',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { faith: 2, strength: 1 },
    cost: 1,
    effectType: ['Damage Amplifier', 'Passive Modifier', 'Resource Effect'],
    combatBehavior:
      'Passive: +2 FTH +1 STR, Dealing damage heals 2% of damage dealt',
    buildRole: ['Burst Damage', 'Sustain'],
  },
  {
    id: 'zeal_t3_blessed_resilience',
    name: 'Blessed Resilience',
    description: 'Passive: +2 CON +1 MR, Heal effects grant +5% mitigation for 3s',
    tree: 'Zeal',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { constitution: 2, magicResist: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Defensive Effect', 'Proc Trigger'],
    combatBehavior:
      'Passive: +2 CON +1 MR, Heal effects grant +5% mitigation for 3s',
    buildRole: ['Survivability', 'Sustain'],
    duration: 3,
  },
  {
    id: 'zeal_t3_divine_fervor',
    name: 'Divine Fervor',
    description:
      'Passive: +3 FTH +1 DEX, Healing yourself grants +8% damage for 4s',
    tree: 'Zeal',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { faith: 3, dexterity: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier', 'Proc Trigger'],
    combatBehavior:
      'Passive: +3 FTH +1 DEX, Healing yourself grants +8% damage for 4s',
    buildRole: ['Burst Damage', 'Sustain'],
    duration: 4,
  },

  // Tier 4
  {
    id: 'zeal_t4_sacred_retaliation',
    name: 'Sacred Retaliation',
    description: 'Passive: Reflect 10% post-mitigation damage',
    tree: 'Zeal',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: {},
    cost: 1,
    effectType: ['Defensive Effect', 'Passive Modifier', 'Proc Trigger'],
    combatBehavior: 'Passive: Reflect 10% post-mitigation damage',
    buildRole: ['Survivability', 'Sustain'],
    cooldown: 5,
  },
  {
    id: 'zeal_t4_righteous_assault',
    name: 'Righteous Assault',
    description: 'Passive: +4 FTH +3 STR, Damage +10% when HP > 80%',
    tree: 'Zeal',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { faith: 4, strength: 3 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier'],
    combatBehavior: 'Passive: +4 FTH +3 STR, Damage +10% when HP > 80%',
    buildRole: ['Burst Damage'],
  },
  {
    id: 'zeal_t4_sanctified_body',
    name: 'Sanctified Body',
    description:
      'Passive: +3 CON +3 FTH +2 MR, Overheal persists as temporary HP up to 15% max HP',
    tree: 'Zeal',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { constitution: 3, faith: 3, magicResist: 2 },
    cost: 1,
    effectType: ['Passive Modifier', 'Resource Effect'],
    combatBehavior:
      'Passive: +3 CON +3 FTH +2 MR, Overheal persists as temporary HP up to 15% max HP',
    buildRole: ['Survivability', 'Sustain'],
  },

  // Tier 5
  {
    id: 'zeal_t5_divine_resilience',
    name: 'Divine Resilience',
    description: 'Passive: +6 FTH +5 CON, Reduced debuff duration',
    tree: 'Zeal',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { faith: 6, constitution: 5 },
    cost: 1,
    effectType: ['Defensive Effect', 'Passive Modifier'],
    combatBehavior: 'Passive: +6 FTH +5 CON, Reduced debuff duration',
    buildRole: ['Survivability', 'Sustain'],
  },
  {
    id: 'zeal_t5_radiant_surge',
    name: 'Radiant Surge',
    description: 'Active: +5 FTH +4 CON, Heal 15% max HP and gain +20% damage for 6s',
    tree: 'Zeal',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { faith: 5, constitution: 4 },
    cost: 1,
    effectType: ['Activated Ability', 'Damage Amplifier', 'Resource Effect'],
    combatBehavior:
      'Active: +5 FTH +4 CON, Heal 15% max HP and gain +20% damage for 6s',
    buildRole: ['Burst Damage', 'Sustain'],
    duration: 6,
    cooldown: 30,
    isActive: true,
  },
  {
    id: 'zeal_t5_holy_conviction',
    name: 'Holy Conviction',
    description:
      'Passive: +5 FTH +3 STR +2 DEX, While HP ≥ 70% gain +12% healing power and +10% damage',
    tree: 'Zeal',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { faith: 5, strength: 3, dexterity: 2 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier', 'Passive Modifier'],
    combatBehavior:
      'Passive: +5 FTH +3 STR +2 DEX, While HP ≥ 70% gain +12% healing power and +10% damage',
    buildRole: ['Burst Damage', 'Sustain'],
  },

  // Tier 6 (Capstones)
  {
    id: 'zeal_capstone_holy_sanctum',
    name: 'Holy Sanctum',
    description:
      'Activate aura: Immune to Status Conditions and debuffs. Remove enemy buffs.',
    tree: 'Zeal',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { constitution: 28, faith: 22 },
    cost: 2,
    effectType: ['Activated Ability', 'Defensive Effect', 'Utility'],
    combatBehavior:
      'Effect: Immune to Status Conditions, Effect: Immune to debuffs, Effect: Remove enemy buffs, Trigger: Activate aura',
    buildRole: ['Hybrid Support', 'Survivability', 'Tempo Control'],
    duration: 5,
    cooldown: 25,
    isActive: true,
  },
  {
    id: 'zeal_capstone_radiant_conversion',
    name: 'Radiant Conversion',
    description:
      'Portion of damage dealt converts to healing. Healing scales with damage output.',
    tree: 'Zeal',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { faith: 28, strength: 22 },
    cost: 2,
    effectType: ['Defensive Effect', 'Passive Modifier', 'Resource Effect'],
    combatBehavior:
      'Effect: Healing scales with damage output, Passive: Portion of damage dealt converts to healing',
    buildRole: ['Resource Economy', 'Survivability', 'Sustain'],
  },
  {
    id: 'zeal_capstone_divine_overflow',
    name: 'Divine Overflow',
    description:
      'Gain stacking damage bonus when you heal ≥ 10% Max HP. Trigger: Heal ≥ 10% Max HP.',
    tree: 'Zeal',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { faith: 30, constitution: 22 },
    cost: 2,
    effectType: [
      'Conditional Buff',
      'Damage Amplifier',
      'Proc Trigger',
      'Resource Effect',
    ],
    combatBehavior:
      'Effect: Gain stacking damage bonus, Trigger: Heal ≥ 10% Max HP',
    buildRole: ['Burst Damage', 'Hybrid Support', 'Sustain'],
    duration: 8,
  },
]

// ============================================================================
// FEROCITY — Aggression, Execute, Berserker
// Capstones: Frenzy Pressure, Blood Surge, Predator Momentum
// ============================================================================

export const FEROCITY_SKILLS: SkillNode[] = [
  // Tier 1
  {
    id: 'ferocity_t1_raw_power',
    name: 'Raw Power',
    description: 'Passive: +2 STR',
    tree: 'Ferocity',
    tier: 1,
    statBoosts: { strength: 2 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +2 STR',
    buildRole: ['Burst Damage'],
  },
  {
    id: 'ferocity_t1_aggressive_pursuit',
    name: 'Aggressive Pursuit',
    description: 'Passive: +2 SPD',
    tree: 'Ferocity',
    tier: 1,
    statBoosts: { speed: 2 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +2 SPD',
    buildRole: ['Burst Damage', 'Mobility'],
  },
  {
    id: 'ferocity_t1_relentless_drive',
    name: 'Relentless Drive',
    description: 'Passive: +1 STR +1 SPD',
    tree: 'Ferocity',
    tier: 1,
    statBoosts: { strength: 1, speed: 1 },
    cost: 1,
    effectType: ['Passive Modifier'],
    combatBehavior: 'Passive: +1 STR +1 SPD',
    buildRole: ['Burst Damage', 'Mobility'],
  },

  // Tier 2
  {
    id: 'ferocity_t2_savage_strength',
    name: 'Savage Strength',
    description: 'Passive: +2 STR +1 CON, +5% damage vs targets below 50% HP',
    tree: 'Ferocity',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { strength: 2, constitution: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier'],
    combatBehavior:
      'Passive: +2 STR +1 CON, +5% damage vs targets below 50% HP',
    buildRole: ['Burst Damage'],
  },
  {
    id: 'ferocity_t2_hunters_speed',
    name: "Hunter's Speed",
    description: 'Passive: +2 SPD +1 STR, +8% movement speed toward wounded enemies',
    tree: 'Ferocity',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { speed: 2, strength: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Mobility Effect'],
    combatBehavior:
      'Passive: +2 SPD +1 STR, +8% movement speed toward wounded enemies',
    buildRole: ['Burst Damage', 'Mobility'],
  },
  {
    id: 'ferocity_t2_brutal_momentum',
    name: 'Brutal Momentum',
    description:
      'Passive: +1 STR +1 SPD +1 DEF, Consecutive attacks increase damage by 3% (stacks 3x)',
    tree: 'Ferocity',
    tier: 2,
    prerequisiteTier: 1,
    statBoosts: { strength: 1, speed: 1, defense: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier', 'Proc Trigger'],
    combatBehavior:
      'Passive: +1 STR +1 SPD +1 DEF, Consecutive attacks increase damage by 3% (stacks 3x)',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },

  // Tier 3
  {
    id: 'ferocity_t3_blood_frenzy',
    name: 'Blood Frenzy',
    description:
      'Passive: +2 STR +1 SPD, Dealing damage grants +2% attack speed for 4s (stacks 5x)',
    tree: 'Ferocity',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { strength: 2, speed: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Passive Modifier', 'Proc Trigger'],
    combatBehavior:
      'Passive: +2 STR +1 SPD, Dealing damage grants +2% attack speed for 4s (stacks 5x)',
    buildRole: ['Burst Damage', 'Tempo Control'],
    duration: 4,
  },
  {
    id: 'ferocity_t3_predatory_instinct',
    name: 'Predatory Instinct',
    description: 'Passive: +2 SPD +1 DEX, Stamina cost -15% when target HP < 40%',
    tree: 'Ferocity',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { speed: 2, dexterity: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Resource Effect'],
    combatBehavior:
      'Passive: +2 SPD +1 DEX, Stamina cost -15% when target HP < 40%',
    buildRole: ['Mobility', 'Resource Economy'],
  },
  {
    id: 'ferocity_t3_unrelenting_force',
    name: 'Unrelenting Force',
    description:
      'Passive: +3 STR +1 DEF, Heavy attacks stagger enemies 20% more effectively',
    tree: 'Ferocity',
    tier: 3,
    prerequisiteTier: 2,
    statBoosts: { strength: 3, defense: 1 },
    cost: 1,
    effectType: ['Passive Modifier', 'Utility'],
    combatBehavior:
      'Passive: +3 STR +1 DEF, Heavy attacks stagger enemies 20% more effectively',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },

  // Tier 4
  {
    id: 'ferocity_t4_execute_mastery',
    name: 'Execute Mastery',
    description: 'Passive: +4 STR +3 SPD, Damage +15% vs enemies below 30% HP',
    tree: 'Ferocity',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { strength: 4, speed: 3 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier'],
    combatBehavior:
      'Passive: +4 STR +3 SPD, Damage +15% vs enemies below 30% HP',
    buildRole: ['Burst Damage'],
  },
  {
    id: 'ferocity_t4_rampage',
    name: 'Rampage',
    description:
      'Passive: +4 SPD +2 STR +1 CON, Killing blow grants +25% movement speed and +15% attack speed for 5s',
    tree: 'Ferocity',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { speed: 4, strength: 2, constitution: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Mobility Effect', 'Proc Trigger'],
    combatBehavior:
      'Passive: +4 SPD +2 STR +1 CON, Killing blow grants +25% movement speed and +15% attack speed for 5s',
    buildRole: ['Burst Damage', 'Mobility'],
    duration: 5,
  },
  {
    id: 'ferocity_t4_titans_fury',
    name: "Titan's Fury",
    description:
      'Passive: +3 STR +3 DEF +1 CON, Taking damage increases damage dealt by 5% (stacks 3x, lasts 6s)',
    tree: 'Ferocity',
    tier: 4,
    prerequisiteTier: 3,
    statBoosts: { strength: 3, defense: 3, constitution: 1 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier', 'Proc Trigger'],
    combatBehavior:
      'Passive: +3 STR +3 DEF +1 CON, Taking damage increases damage dealt by 5% (stacks 3x, lasts 6s)',
    buildRole: ['Burst Damage', 'Survivability'],
    duration: 6,
  },

  // Tier 5
  {
    id: 'ferocity_t5_primal_instinct',
    name: 'Primal Instinct',
    description: 'Passive: Ignore stamina penalties when stamina < 20%',
    tree: 'Ferocity',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: {},
    cost: 1,
    effectType: ['Conditional Buff', 'Mobility Effect', 'Resource Effect'],
    combatBehavior: 'Passive: Ignore stamina penalties when stamina < 20%',
    buildRole: ['Mobility', 'Resource Economy'],
    duration: 5,
    cooldown: 20,
  },
  {
    id: 'ferocity_t5_brutal_finish',
    name: 'Brutal Finish',
    description: 'Passive: +7 STR +5 SPD, 1.12x damage when enemy HP < 30%',
    tree: 'Ferocity',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { strength: 7, speed: 5 },
    cost: 1,
    effectType: ['Conditional Buff', 'Damage Amplifier'],
    combatBehavior: 'Passive: +7 STR +5 SPD, 1.12x damage when enemy HP < 30%',
    buildRole: ['Burst Damage'],
    scalingMod: '1.12x Damage',
  },
  {
    id: 'ferocity_t5_berserkers_rage',
    name: "Berserker's Rage",
    description:
      'Active: +6 STR +4 SPD, Gain +30% damage and +20% attack speed for 8s, take +15% damage during duration',
    tree: 'Ferocity',
    tier: 5,
    prerequisiteTier: 4,
    statBoosts: { strength: 6, speed: 4 },
    cost: 1,
    effectType: ['Activated Ability', 'Conditional Buff', 'Damage Amplifier'],
    combatBehavior:
      'Active: +6 STR +4 SPD, Gain +30% damage and +20% attack speed for 8s, take +15% damage during duration',
    buildRole: ['Burst Damage', 'Tempo Control'],
    duration: 8,
    cooldown: 45,
    isActive: true,
  },

  // Tier 6 (Capstones)
  {
    id: 'ferocity_capstone_frenzy_pressure',
    name: 'Frenzy Pressure',
    description:
      'Apply Fatigue debuff causing enemy to lose stamina regen and suffer increased guard break chance. Trigger: Land 3 consecutive hits OR heavy strike.',
    tree: 'Ferocity',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { strength: 28, defense: 22 },
    cost: 2,
    effectType: [
      'Damage Amplifier',
      'Proc Trigger',
      'Resource Effect',
      'Utility',
    ],
    combatBehavior:
      'Effect: Apply Fatigue, Effect: Fatigued enemy loses stamina regen, Effect: Fatigued enemy suffers increased guard break chance, Trigger: Land 3 consecutive hits OR heavy strike',
    buildRole: ['Resource Economy', 'Sustain', 'Tempo Control'],
    duration: 6,
    cooldown: 16,
  },
  {
    id: 'ferocity_capstone_blood_surge',
    name: 'Blood Surge',
    description:
      'Gain surge of movement speed and cooldown recovery boost when target HP below threshold. Surge ends if enemy escapes combat for 2s.',
    tree: 'Ferocity',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { speed: 28, strength: 24 },
    cost: 2,
    effectType: [
      'Conditional Buff',
      'Mobility Effect',
      'Proc Trigger',
      'Resource Effect',
    ],
    combatBehavior:
      'Effect: Gain cooldown recovery boost, Effect: Gain surge of movement speed, Effect: Surge ends if enemy escapes combat for 2s, Trigger: Target HP below threshold',
    buildRole: ['Burst Damage', 'Mobility', 'Tempo Control'],
    duration: 4,
    cooldown: 20,
  },
  {
    id: 'ferocity_capstone_predator_momentum',
    name: 'Predator Momentum',
    description:
      'Damage increases as target HP decreases. Trigger: Target HP below threshold.',
    tree: 'Ferocity',
    tier: 6,
    prerequisiteTier: 5,
    statBoosts: { strength: 32, speed: 20 },
    cost: 2,
    effectType: ['Conditional Buff', 'Damage Amplifier'],
    combatBehavior:
      'Effect: Damage increases as target HP decreases, Trigger: Target HP below threshold',
    buildRole: ['Burst Damage', 'Tempo Control'],
  },
]

// ============================================================================
// Skill Tree Registry
// ============================================================================

export const SKILL_TREES: Record<SkillTreeName, SkillNode[]> = {
  Valor: VALOR_SKILLS,
  Instinct: INSTINCT_SKILLS,
  Discipline: DISCIPLINE_SKILLS,
  Intellect: INTELLECT_SKILLS,
  Zeal: ZEAL_SKILLS,
  Ferocity: FEROCITY_SKILLS,
}

/**
 * Get skill tree by name
 */
export function getSkillTree(treeName: SkillTreeName): SkillNode[] {
  const tree = SKILL_TREES[treeName]
  if (!tree) {
    throw new Error(`Unknown skill tree: ${treeName}`)
  }
  return tree
}

/**
 * Get all tree names
 */
export function getAllTreeNames(): SkillTreeName[] {
  return Object.keys(SKILL_TREES) as SkillTreeName[]
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
 * Check if a skill can be unlocked (flexible tier-based prerequisites)
 * A skill at tier N can be unlocked if ANY tier N-1 skill in that tree is unlocked
 */
export function canUnlockSkill(
  skillId: string,
  unlockedSkills: string[]
): boolean {
  const skill = getSkill(skillId)
  if (!skill) return false

  // Already unlocked?
  if (unlockedSkills.includes(skillId)) {
    return false
  }

  // Tier 1 skills have no prerequisites
  if (skill.tier === 1) {
    return true
  }

  // For tiers 2-6, check if player has unlocked ANY skill from prerequisite tier
  if (skill.prerequisiteTier !== undefined) {
    const tree = getSkillTree(skill.tree)
    const hasPrerequisiteTier = tree
      .filter((s) => s.tier === skill.prerequisiteTier)
      .some((s) => unlockedSkills.includes(s.id))

    if (!hasPrerequisiteTier) {
      return false
    }
  }

  return true
}

/**
 * Calculate total skill points spent
 */
export function calculateSkillPointsSpent(unlockedSkills: string[]): number {
  return unlockedSkills.reduce((total, skillId) => {
    const skill = getSkill(skillId)
    return total + (skill?.cost || 0)
  }, 0)
}

/**
 * Get total stat bonuses from unlocked skills
 */
export function getSkillStatBonuses(
  unlockedSkills: string[]
): Record<string, number> {
  const totals: Record<string, number> = {}

  unlockedSkills.forEach((skillId) => {
    const skill = getSkill(skillId)
    if (skill) {
      Object.entries(skill.statBoosts).forEach(([stat, bonus]) => {
        totals[stat] = (totals[stat] || 0) + bonus
      })
    }
  })

  return totals
}

/**
 * Find a skill by ID across all skill trees
 * Alias for getSkill() - Used for validation in skill unlock API
 * @returns SkillNode if found, null otherwise
 */
export function findSkillById(skillId: string): SkillNode | null {
  return getSkill(skillId) ?? null
}
