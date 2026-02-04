'use client'

import { UnitState } from '@gladiator/shared/src/combat/types'

export type PlayerUnitForHUD = UnitState & { cooldowns?: Record<string, number> }

interface MatchHUDProps {
  playerUnit: PlayerUnitForHUD | null
}

export function MatchHUD({ playerUnit }: MatchHUDProps) {
  if (!playerUnit) return null

  const hpPercent = (playerUnit.hp / playerUnit.derived.hpMax) * 100
  const stamPercent = (playerUnit.stamina / playerUnit.derived.stamMax) * 100

  const attackCooldown = playerUnit.cooldowns?.['Attack'] ?? 0
  const dodgeCooldown = playerUnit.cooldowns?.['Dodge'] ?? 0

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 p-4 rounded-lg border border-gray-700 min-w-[400px]">
      {/* HP Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Health</span>
          <span>{Math.round(playerUnit.hp)} / {playerUnit.derived.hpMax}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all"
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Stamina Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Stamina</span>
          <span>{Math.round(playerUnit.stamina)} / {playerUnit.derived.stamMax}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${stamPercent}%` }}
          />
        </div>
      </div>

      {/* Cooldown Indicators */}
      <div className="flex gap-4 justify-center">
        <div className="text-center">
          <div className={`text-xs mb-1 ${attackCooldown > 0 ? 'text-gray-500' : 'text-green-400'}`}>
            Main Hand
          </div>
          <div className="text-[10px] text-gray-400">
            [SPACE / L-CLICK]
          </div>
          {attackCooldown > 0 && (
            <div className="text-xs text-gray-400">{(attackCooldown / 1000).toFixed(1)}s</div>
          )}
        </div>

        <div className="text-center">
          <div className={`text-xs mb-1 ${dodgeCooldown > 0 ? 'text-gray-500' : 'text-cyan-400'}`}>
            Dodge [SHIFT]
          </div>
          {dodgeCooldown > 0 && (
            <div className="text-xs text-gray-400">{(dodgeCooldown / 1000).toFixed(1)}s</div>
          )}
        </div>

        <div className="text-center">
          <div className={`text-xs mb-1 ${attackCooldown > 0 ? 'text-gray-500' : 'text-amber-400'}`}>
            Off Hand
          </div>
          <div className="text-[10px] text-gray-400">
            [R-CLICK]
          </div>
          {attackCooldown > 0 && (
            <div className="text-xs text-gray-400">{(attackCooldown / 1000).toFixed(1)}s</div>
          )}
        </div>
      </div>

      {/* Controls hint */}
      <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500 text-center">
        WASD: Move | Mouse: Aim & Attack | SHIFT: Dodge
      </div>
    </div>
  )
}
