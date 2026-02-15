import { describe, it, expect } from 'vitest'
import {
  GladiatorClass,
  CLASS_STAT_WEIGHTS,
  getBaseStatWeights,
  rollBaseStats,
  rollBaseStatsWithVariance,
  statsToDBFormat,
  dbStatsToWeights,
} from '..'

describe('Class Stat Weights', () => {
  describe('CLASS_STAT_WEIGHTS', () => {
    it('should have weights for all 5 core classes', () => {
      expect(CLASS_STAT_WEIGHTS[GladiatorClass.Tank]).toBeDefined()
      expect(CLASS_STAT_WEIGHTS[GladiatorClass.Legionnaire]).toBeDefined()
      expect(CLASS_STAT_WEIGHTS[GladiatorClass.Duelist]).toBeDefined()
      expect(CLASS_STAT_WEIGHTS[GladiatorClass.Mage]).toBeDefined()
      expect(CLASS_STAT_WEIGHTS[GladiatorClass.Monk]).toBeDefined()
    })

    it('should have weights for legacy classes', () => {
      expect(CLASS_STAT_WEIGHTS[GladiatorClass.Brute]).toBeDefined()
      expect(CLASS_STAT_WEIGHTS[GladiatorClass.Assassin]).toBeDefined()
    })

    it('should have all 8 stats for each class', () => {
      const classes = [
        GladiatorClass.Tank,
        GladiatorClass.Legionnaire,
        GladiatorClass.Duelist,
        GladiatorClass.Mage,
        GladiatorClass.Monk,
      ]

      for (const cls of classes) {
        const weights = CLASS_STAT_WEIGHTS[cls]
        expect(weights.CON).toBeGreaterThan(0)
        expect(weights.STR).toBeGreaterThan(0)
        expect(weights.DEX).toBeGreaterThan(0)
        expect(weights.SPD).toBeGreaterThan(0)
        expect(weights.DEF).toBeGreaterThan(0)
        expect(weights.MR).toBeGreaterThan(0)
        expect(weights.ARC).toBeGreaterThan(0)
        expect(weights.FTH).toBeGreaterThan(0)
      }
    })

    it('should have Tank with high CON and DEF', () => {
      const weights = CLASS_STAT_WEIGHTS[GladiatorClass.Tank]
      expect(weights.CON).toBe(1.4)
      expect(weights.DEF).toBe(1.3)
    })

    it('should have Duelist with high DEX and SPD', () => {
      const weights = CLASS_STAT_WEIGHTS[GladiatorClass.Duelist]
      expect(weights.DEX).toBe(1.4)
      expect(weights.SPD).toBe(1.3)
    })

    it('should have Mage with high ARC and MR', () => {
      const weights = CLASS_STAT_WEIGHTS[GladiatorClass.Mage]
      expect(weights.ARC).toBe(1.4)
      expect(weights.MR).toBe(1.3)
    })
  })

  describe('getBaseStatWeights', () => {
    it('should return weights for a given class', () => {
      const weights = getBaseStatWeights(GladiatorClass.Tank)
      expect(weights).toEqual(CLASS_STAT_WEIGHTS[GladiatorClass.Tank])
    })
  })

  describe('rollBaseStats', () => {
    it('should distribute exactly totalPool points', () => {
      const totalPool = 50
      const stats = rollBaseStats(GladiatorClass.Tank, totalPool)
      const sum = Object.values(stats).reduce((acc, val) => acc + val, 0)
      expect(sum).toBe(totalPool)
    })

    it('should distribute according to weights (Tank favors CON)', () => {
      const stats = rollBaseStats(GladiatorClass.Tank, 50)
      // CON (1.4x) should be higher than DEX (0.7x)
      expect(stats.CON).toBeGreaterThan(stats.DEX)
    })

    it('should distribute according to weights (Duelist favors DEX)', () => {
      const stats = rollBaseStats(GladiatorClass.Duelist, 50)
      // DEX (1.4x) should be higher than CON (0.7x)
      expect(stats.DEX).toBeGreaterThan(stats.CON)
    })

    it('should work with different pool sizes', () => {
      const stats100 = rollBaseStats(GladiatorClass.Mage, 100)
      const sum = Object.values(stats100).reduce((acc, val) => acc + val, 0)
      expect(sum).toBe(100)
    })

    it('should handle small pools correctly', () => {
      const stats8 = rollBaseStats(GladiatorClass.Monk, 8)
      const sum = Object.values(stats8).reduce((acc, val) => acc + val, 0)
      expect(sum).toBe(8)
    })
  })

  describe('rollBaseStatsWithVariance', () => {
    it('should distribute exactly totalPool points', () => {
      const totalPool = 50
      const stats = rollBaseStatsWithVariance(GladiatorClass.Legionnaire, totalPool, 0.2)
      const sum = Object.values(stats).reduce((acc, val) => acc + val, 0)
      expect(sum).toBe(totalPool)
    })

    it('should still favor class strengths with variance', () => {
      // Run multiple times to account for randomness
      const results = Array.from({ length: 10 }, () =>
        rollBaseStatsWithVariance(GladiatorClass.Tank, 50, 0.2)
      )

      // On average, CON should be higher than DEX for Tank
      const avgCON = results.reduce((sum, s) => sum + s.CON, 0) / results.length
      const avgDEX = results.reduce((sum, s) => sum + s.DEX, 0) / results.length

      expect(avgCON).toBeGreaterThan(avgDEX)
    })

    it('should produce different results with variance', () => {
      const stats1 = rollBaseStatsWithVariance(GladiatorClass.Duelist, 50, 0.2)
      const stats2 = rollBaseStatsWithVariance(GladiatorClass.Duelist, 50, 0.2)

      // Very unlikely to be identical with randomness
      const identical = Object.keys(stats1).every(
        (key) => stats1[key as keyof typeof stats1] === stats2[key as keyof typeof stats2]
      )
      expect(identical).toBe(false)
    })
  })

  describe('statsToDBFormat', () => {
    it('should convert ClassStatWeights to DB format', () => {
      const weights = {
        CON: 10,
        STR: 9,
        DEX: 8,
        SPD: 7,
        DEF: 6,
        MR: 5,
        ARC: 4,
        FTH: 3,
      }

      const db = statsToDBFormat(weights)

      expect(db).toEqual({
        constitution: 10,
        strength: 9,
        dexterity: 8,
        speed: 7,
        defense: 6,
        magicResist: 5,
        arcana: 4,
        faith: 3,
      })
    })
  })

  describe('dbStatsToWeights', () => {
    it('should convert DB format to ClassStatWeights', () => {
      const dbStats = {
        constitution: 10,
        strength: 9,
        dexterity: 8,
        speed: 7,
        defense: 6,
        magicResist: 5,
        arcana: 4,
        faith: 3,
      }

      const weights = dbStatsToWeights(dbStats)

      expect(weights).toEqual({
        CON: 10,
        STR: 9,
        DEX: 8,
        SPD: 7,
        DEF: 6,
        MR: 5,
        ARC: 4,
        FTH: 3,
      })
    })
  })

  describe('Round-trip conversion', () => {
    it('should maintain values through DB conversion round-trip', () => {
      const original = rollBaseStats(GladiatorClass.Monk, 50)
      const db = statsToDBFormat(original)
      const roundTrip = dbStatsToWeights(db)

      expect(roundTrip).toEqual(original)
    })
  })
})
