import { describe, it, expect } from 'vitest'
import {
  getSkillTree,
  getSkill,
  canUnlockSkill,
  calculateSkillPointsSpent,
  getAllTreeNames,
  getSkillStatBonuses,
} from '../skill-trees'

describe('Skill Trees', () => {
  describe('getAllTreeNames', () => {
    it('should return all 6 tree names', () => {
      const trees = getAllTreeNames()
      expect(trees).toHaveLength(6)
      expect(trees).toContain('Valor')
      expect(trees).toContain('Instinct')
      expect(trees).toContain('Discipline')
      expect(trees).toContain('Intellect')
      expect(trees).toContain('Zeal')
      expect(trees).toContain('Ferocity')
    })
  })

  describe('getSkillTree', () => {
    it('should return Valor tree with 18 skills', () => {
      const tree = getSkillTree('Valor')
      expect(tree).toHaveLength(18) // 15 tiers 1-5 + 3 capstones
    })

    it('should return Instinct tree with 18 skills', () => {
      const tree = getSkillTree('Instinct')
      expect(tree).toHaveLength(18)
    })

    it('should return Discipline tree with 18 skills', () => {
      const tree = getSkillTree('Discipline')
      expect(tree).toHaveLength(18)
    })

    it('should return Intellect tree with 18 skills', () => {
      const tree = getSkillTree('Intellect')
      expect(tree).toHaveLength(18)
    })

    it('should return Zeal tree with 18 skills', () => {
      const tree = getSkillTree('Zeal')
      expect(tree).toHaveLength(18)
    })

    it('should return Ferocity tree with 18 skills', () => {
      const tree = getSkillTree('Ferocity')
      expect(tree).toHaveLength(18)
    })

    it('should have correct tier distribution in each tree', () => {
      const treeNames = getAllTreeNames()
      treeNames.forEach((treeName) => {
        const tree = getSkillTree(treeName)
        const tierCounts = tree.reduce(
          (counts, skill) => {
            counts[skill.tier] = (counts[skill.tier] || 0) + 1
            return counts
          },
          {} as Record<number, number>
        )

        // Each tree should have 3 skills per tier 1-5, and 3 tier 6 capstones
        expect(tierCounts[1]).toBe(3)
        expect(tierCounts[2]).toBe(3)
        expect(tierCounts[3]).toBe(3)
        expect(tierCounts[4]).toBe(3)
        expect(tierCounts[5]).toBe(3)
        expect(tierCounts[6]).toBe(3)
      })
    })

    it('should have correct cost distribution in each tree', () => {
      const treeNames = getAllTreeNames()
      treeNames.forEach((treeName) => {
        const tree = getSkillTree(treeName)
        const tier1to5 = tree.filter((s) => s.tier >= 1 && s.tier <= 5)
        const tier6 = tree.filter((s) => s.tier === 6)

        // Tier 1-5 skills cost 1 point
        tier1to5.forEach((skill) => {
          expect(skill.cost).toBe(1)
        })

        // Tier 6 capstones cost 2 points
        tier6.forEach((skill) => {
          expect(skill.cost).toBe(2)
        })
      })
    })
  })

  describe('getSkill', () => {
    it('should find skill by ID', () => {
      const skill = getSkill('valor_t1_fortified_body')
      expect(skill).toBeDefined()
      expect(skill?.name).toBe('Fortified Body')
      expect(skill?.tier).toBe(1)
      expect(skill?.tree).toBe('Valor')
    })

    it('should find capstone skill by ID', () => {
      const skill = getSkill('valor_capstone_zone_of_denial')
      expect(skill).toBeDefined()
      expect(skill?.name).toBe('Zone of Denial')
      expect(skill?.tier).toBe(6)
      expect(skill?.cost).toBe(2)
    })

    it('should return undefined for non-existent skill', () => {
      const skill = getSkill('invalid_skill_id')
      expect(skill).toBeUndefined()
    })

    it('should find skills from different trees', () => {
      const valorSkill = getSkill('valor_t1_fortified_body')
      const instinctSkill = getSkill('instinct_t1_swift_reflexes')
      const disciplineSkill = getSkill('discipline_t1_weapon_training')

      expect(valorSkill?.tree).toBe('Valor')
      expect(instinctSkill?.tree).toBe('Instinct')
      expect(disciplineSkill?.tree).toBe('Discipline')
    })
  })

  describe('canUnlockSkill', () => {
    it('should allow unlocking tier 1 skill with no prerequisites', () => {
      const canUnlock = canUnlockSkill('valor_t1_fortified_body', [])
      expect(canUnlock).toBe(true)
    })

    it('should prevent unlocking tier 2 without tier 1', () => {
      const canUnlock = canUnlockSkill('valor_t2_enduring_stamina', [])
      expect(canUnlock).toBe(false)
    })

    it('should allow unlocking tier 2 with any tier 1 unlocked', () => {
      const canUnlock = canUnlockSkill('valor_t2_enduring_stamina', [
        'valor_t1_fortified_body',
      ])
      expect(canUnlock).toBe(true)
    })

    it('should allow unlocking tier 2 with different tier 1 skill unlocked', () => {
      const canUnlock = canUnlockSkill('valor_t2_enduring_stamina', [
        'valor_t1_iron_skin',
      ])
      expect(canUnlock).toBe(true)
    })

    it('should prevent unlocking tier 3 without tier 2', () => {
      const canUnlock = canUnlockSkill('valor_t3_battle_scars', [
        'valor_t1_fortified_body',
      ])
      expect(canUnlock).toBe(false)
    })

    it('should allow unlocking tier 3 with tier 2 unlocked', () => {
      const canUnlock = canUnlockSkill('valor_t3_battle_scars', [
        'valor_t1_fortified_body',
        'valor_t2_enduring_stamina',
      ])
      expect(canUnlock).toBe(true)
    })

    it('should prevent unlocking tier 6 capstone without tier 5', () => {
      const canUnlock = canUnlockSkill('valor_capstone_zone_of_denial', [
        'valor_t1_fortified_body',
        'valor_t2_enduring_stamina',
        'valor_t3_battle_scars',
        'valor_t4_steadfast_guard',
      ])
      expect(canUnlock).toBe(false)
    })

    it('should allow unlocking tier 6 capstone with tier 5 unlocked', () => {
      const canUnlock = canUnlockSkill('valor_capstone_zone_of_denial', [
        'valor_t1_fortified_body',
        'valor_t2_enduring_stamina',
        'valor_t3_battle_scars',
        'valor_t4_steadfast_guard',
        'valor_t5_second_wind',
      ])
      expect(canUnlock).toBe(true)
    })

    it('should prevent unlocking already unlocked skill', () => {
      const canUnlock = canUnlockSkill('valor_t1_fortified_body', [
        'valor_t1_fortified_body',
      ])
      expect(canUnlock).toBe(false)
    })

    it('should return false for invalid skill ID', () => {
      const canUnlock = canUnlockSkill('invalid_skill_id', [])
      expect(canUnlock).toBe(false)
    })

    it('should work across different trees', () => {
      // Can unlock tier 1 in any tree
      expect(canUnlockSkill('instinct_t1_swift_reflexes', [])).toBe(true)

      // Can unlock tier 2 with tier 1
      expect(
        canUnlockSkill('instinct_t2_momentum_flow', [
          'instinct_t1_swift_reflexes',
        ])
      ).toBe(true)

      // Cannot unlock tier 2 without tier 1
      expect(canUnlockSkill('instinct_t2_momentum_flow', [])).toBe(false)
    })
  })

  describe('calculateSkillPointsSpent', () => {
    it('should calculate 0 points for no skills', () => {
      const spent = calculateSkillPointsSpent([])
      expect(spent).toBe(0)
    })

    it('should calculate skill points spent correctly for tier 1-5 skills', () => {
      const spent = calculateSkillPointsSpent([
        'valor_t1_fortified_body', // tier 1, cost 1
        'valor_t2_enduring_stamina', // tier 2, cost 1
      ])
      expect(spent).toBe(2)
    })

    it('should count capstone cost as 2 points', () => {
      const spent = calculateSkillPointsSpent([
        'valor_t1_fortified_body', // 1
        'valor_t2_enduring_stamina', // 1
        'valor_t3_battle_scars', // 1
        'valor_t4_steadfast_guard', // 1
        'valor_t5_second_wind', // 1
        'valor_capstone_zone_of_denial', // 2 (capstone)
      ])
      expect(spent).toBe(7)
    })

    it('should calculate correctly for multiple capstones', () => {
      const spent = calculateSkillPointsSpent([
        'valor_t1_fortified_body', // 1
        'valor_t2_enduring_stamina', // 1
        'valor_t3_battle_scars', // 1
        'valor_t4_steadfast_guard', // 1
        'valor_t5_second_wind', // 1
        'valor_capstone_zone_of_denial', // 2
        'valor_capstone_last_bastion', // 2
      ])
      expect(spent).toBe(9)
    })

    it('should handle skills from multiple trees', () => {
      const spent = calculateSkillPointsSpent([
        'valor_t1_fortified_body', // 1
        'instinct_t1_swift_reflexes', // 1
        'discipline_t1_weapon_training', // 1
      ])
      expect(spent).toBe(3)
    })

    it('should ignore invalid skill IDs', () => {
      const spent = calculateSkillPointsSpent([
        'valor_t1_fortified_body', // 1
        'invalid_skill_id', // 0 (invalid)
      ])
      expect(spent).toBe(1)
    })

    it('should calculate full tree cost correctly', () => {
      // Unlock all 18 skills in a tree: 15 tier 1-5 (1 point each) + 3 tier 6 (2 points each) = 21 points
      const allValorSkills = getSkillTree('Valor').map((s) => s.id)
      const spent = calculateSkillPointsSpent(allValorSkills)
      expect(spent).toBe(21)
    })
  })

  describe('getSkillStatBonuses', () => {
    it('should return empty object for no skills', () => {
      const bonuses = getSkillStatBonuses([])
      expect(bonuses).toEqual({})
    })

    it('should calculate stat bonuses for single skill', () => {
      const bonuses = getSkillStatBonuses(['valor_t1_fortified_body'])
      expect(bonuses).toEqual({
        constitution: 2,
      })
    })

    it('should sum stat bonuses from multiple skills', () => {
      const bonuses = getSkillStatBonuses([
        'valor_t1_fortified_body', // +2 CON
        'valor_t2_enduring_stamina', // +2 CON +1 STR
      ])
      expect(bonuses).toEqual({
        constitution: 4,
        strength: 1,
      })
    })

    it('should calculate bonuses from capstone skills', () => {
      const bonuses = getSkillStatBonuses([
        'valor_capstone_zone_of_denial', // +30 DEF +20 CON
      ])
      expect(bonuses).toEqual({
        defense: 30,
        constitution: 20,
      })
    })

    it('should handle skills from multiple trees', () => {
      const bonuses = getSkillStatBonuses([
        'valor_t1_fortified_body', // +2 CON
        'instinct_t1_swift_reflexes', // +2 DEX
        'discipline_t1_weapon_training', // +2 STR
      ])
      expect(bonuses).toEqual({
        constitution: 2,
        dexterity: 2,
        strength: 2,
      })
    })

    it('should ignore invalid skill IDs', () => {
      const bonuses = getSkillStatBonuses([
        'valor_t1_fortified_body', // +2 CON
        'invalid_skill_id', // ignored
      ])
      expect(bonuses).toEqual({
        constitution: 2,
      })
    })

    it('should handle skills with no stat bonuses', () => {
      const bonuses = getSkillStatBonuses([
        'intellect_t5_spell_echo', // No stat bonuses (empty object)
      ])
      expect(bonuses).toEqual({})
    })
  })

  describe('Tier progression validation', () => {
    it('should enforce sequential tier unlocking', () => {
      // Start with tier 1
      expect(canUnlockSkill('valor_t1_fortified_body', [])).toBe(true)

      // Can't skip to tier 3
      expect(
        canUnlockSkill('valor_t3_battle_scars', ['valor_t1_fortified_body'])
      ).toBe(false)

      // Can unlock tier 2 with tier 1
      expect(
        canUnlockSkill('valor_t2_enduring_stamina', ['valor_t1_fortified_body'])
      ).toBe(true)

      // Can unlock tier 3 with tier 2
      expect(
        canUnlockSkill('valor_t3_battle_scars', [
          'valor_t1_fortified_body',
          'valor_t2_enduring_stamina',
        ])
      ).toBe(true)
    })

    it('should allow flexible prerequisite within same tier requirement', () => {
      // Any tier 1 skill unlocks tier 2
      expect(
        canUnlockSkill('valor_t2_enduring_stamina', ['valor_t1_iron_skin'])
      ).toBe(true)
      expect(
        canUnlockSkill('valor_t2_enduring_stamina', [
          'valor_t1_fortified_body',
        ])
      ).toBe(true)
      expect(
        canUnlockSkill('valor_t2_enduring_stamina', ['valor_t1_warded_flesh'])
      ).toBe(true)
    })
  })

  describe('Tree structure validation', () => {
    it('should have unique skill IDs across all trees', () => {
      const allSkillIds = new Set<string>()
      getAllTreeNames().forEach((treeName) => {
        const tree = getSkillTree(treeName)
        tree.forEach((skill) => {
          expect(allSkillIds.has(skill.id)).toBe(false) // No duplicates
          allSkillIds.add(skill.id)
        })
      })
      // 6 trees * 18 skills = 108 total skills
      expect(allSkillIds.size).toBe(108)
    })

    it('should have consistent tier structure across all trees', () => {
      getAllTreeNames().forEach((treeName) => {
        const tree = getSkillTree(treeName)

        // Each tree should have exactly 18 skills
        expect(tree).toHaveLength(18)

        // Count skills by tier
        const tierCounts = tree.reduce(
          (counts, skill) => {
            counts[skill.tier] = (counts[skill.tier] || 0) + 1
            return counts
          },
          {} as Record<number, number>
        )

        // 3 skills per tier
        expect(tierCounts[1]).toBe(3)
        expect(tierCounts[2]).toBe(3)
        expect(tierCounts[3]).toBe(3)
        expect(tierCounts[4]).toBe(3)
        expect(tierCounts[5]).toBe(3)
        expect(tierCounts[6]).toBe(3)
      })
    })

    it('should have correct prerequisiteTier values', () => {
      getAllTreeNames().forEach((treeName) => {
        const tree = getSkillTree(treeName)
        tree.forEach((skill) => {
          if (skill.tier === 1) {
            expect(skill.prerequisiteTier).toBeUndefined()
          } else {
            expect(skill.prerequisiteTier).toBe(skill.tier - 1)
          }
        })
      })
    })
  })
})
