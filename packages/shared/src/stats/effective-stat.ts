/**
 * Effective Stat Soft-Cap Function
 *
 * Implements tiered soft caps to prevent runaway min-maxing while still rewarding specialization.
 *
 * Breakpoints and marginal efficiency:
 * - 0-10:  100% effectiveness (w1 = 1.00)
 * - 11-20: 70% effectiveness (w2 = 0.70)
 * - 21-30: 40% effectiveness (w3 = 0.40)
 * - 31+:   20% effectiveness (w4 = 0.20)
 *
 * Formula:
 * eff(s) = min(s, B1) * w1
 *        + max(min(s, B2) - B1, 0) * w2
 *        + max(min(s, B3) - B2, 0) * w3
 *        + max(s - B3, 0) * w4
 */

export interface EffectiveStatBreakpoints {
  B1: number; // First breakpoint (default 10)
  B2: number; // Second breakpoint (default 20)
  B3: number; // Third breakpoint (default 30)
  w1: number; // Weight for 0-B1 (default 1.00)
  w2: number; // Weight for B1-B2 (default 0.70)
  w3: number; // Weight for B2-B3 (default 0.40)
  w4: number; // Weight for B3+ (default 0.20)
}

/**
 * Default breakpoints from Stats & Scaling System wiki
 */
export const DEFAULT_BREAKPOINTS: EffectiveStatBreakpoints = {
  B1: 10,
  B2: 20,
  B3: 30,
  w1: 1.00,
  w2: 0.70,
  w3: 0.40,
  w4: 0.20,
};

/**
 * Calculate effective stat value with soft caps
 *
 * @param s - Raw stat value
 * @param breakpoints - Optional custom breakpoints (defaults to wiki values)
 * @returns Effective stat value after applying soft caps
 *
 * @example
 * eff(5)  // => 5.0  (100% efficiency)
 * eff(15) // => 13.5 (10 at 100% + 5 at 70%)
 * eff(25) // => 19.5 (10 at 100% + 10 at 70% + 5 at 40%)
 * eff(35) // => 22.5 (10 at 100% + 10 at 70% + 10 at 40% + 5 at 20%)
 */
export function eff(
  s: number,
  breakpoints: EffectiveStatBreakpoints = DEFAULT_BREAKPOINTS
): number {
  const { B1, B2, B3, w1, w2, w3, w4 } = breakpoints;

  // Tier 1: 0 to B1 at w1 efficiency
  const tier1 = Math.min(s, B1) * w1;

  // Tier 2: B1 to B2 at w2 efficiency
  const tier2 = Math.max(Math.min(s, B2) - B1, 0) * w2;

  // Tier 3: B2 to B3 at w3 efficiency
  const tier3 = Math.max(Math.min(s, B3) - B2, 0) * w3;

  // Tier 4: B3+ at w4 efficiency
  const tier4 = Math.max(s - B3, 0) * w4;

  return tier1 + tier2 + tier3 + tier4;
}
