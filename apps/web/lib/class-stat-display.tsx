'use client'

import {
  getBaseStatWeights,
  type ClassStatWeights,
} from '@gladiator/shared/src/classes/class-stat-weights'
import { GladiatorClass } from '@gladiator/shared/src/types'

/** Standard stat order used across the app (CON, STR, DEX, SPD, DEF, MR, ARC, FTH). */
export const STAT_ORDER = ['CON', 'STR', 'DEX', 'SPD', 'DEF', 'MR', 'ARC', 'FTH'] as const
export type StatKey = (typeof STAT_ORDER)[number]

export const STAT_LABELS: Record<StatKey, string> = {
  CON: 'CON',
  STR: 'STR',
  DEX: 'DEX',
  SPD: 'SPD',
  DEF: 'DEF',
  MR: 'MR',
  ARC: 'ARC',
  FTH: 'FTH',
}

export type StatBiasLevel = 'high' | 'med' | 'low'

/** Map weight (1.4–0.7) to display bias: 1.4–1.3 high, 1.2–1.0 med, 0.9–0.7 low. */
export function weightToBias(weight: number): StatBiasLevel {
  if (weight >= 1.25) return 'high'
  if (weight >= 0.95) return 'med'
  return 'low'
}

/** Get stat bias for all 8 stats for a class (from shared CLASS_STAT_WEIGHTS). */
export function getClassStatBias(gladiatorClass: GladiatorClass): Record<StatKey, StatBiasLevel> {
  const weights = getBaseStatWeights(gladiatorClass)
  const out = {} as Record<StatKey, StatBiasLevel>
  for (const key of STAT_ORDER) {
    out[key] = weightToBias(weights[key as keyof ClassStatWeights] ?? 1)
  }
  return out
}

/** Get stat bias for class by string name (Tank, Legionnaire, etc.). */
export function getClassStatBiasByName(className: string): Record<StatKey, StatBiasLevel> {
  const c = className as GladiatorClass
  if (Object.values(GladiatorClass).includes(c)) return getClassStatBias(c)
  return STAT_ORDER.reduce((acc, k) => ({ ...acc, [k]: 'med' as StatBiasLevel }), {} as Record<StatKey, StatBiasLevel>)
}

export function ClassStatBar({ label, level }: { label: string; level: StatBiasLevel }) {
  const fillCount = level === 'high' ? 3 : level === 'med' ? 2 : 1
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-[10px] uppercase tracking-wider text-coliseum-sand/60">
        {label}
      </span>
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => {
          const filled = i <= fillCount
          return (
            <div
              key={i}
              className={
                filled
                  ? level === 'high'
                    ? 'h-1.5 w-3 bg-coliseum-bronze'
                    : level === 'med'
                      ? 'h-1.5 w-3 bg-coliseum-sand/70'
                      : 'h-1.5 w-3 bg-coliseum-sand/40'
                  : 'h-1.5 w-3 bg-coliseum-stone'
              }
            />
          )
        })}
      </div>
    </div>
  )
}

/** Renders all 8 stats in standard order for a given class. */
export function ClassStatBars({ className }: { className: string }) {
  const bias = getClassStatBiasByName(className)
  return (
    <div className="space-y-1.5">
      {STAT_ORDER.map((key) => (
        <ClassStatBar key={key} label={STAT_LABELS[key]} level={bias[key]} />
      ))}
    </div>
  )
}
