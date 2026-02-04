'use client'

import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { ArenaCanvas } from '@/components/arena/ArenaCanvas'
import { MatchHUD } from '@/components/arena/MatchHUD'
import { useRealTimeMatch } from '@/hooks/useRealTimeMatch'
import { useGameInput } from '@/hooks/useGameInput'

export default function MatchPage() {
  const params = useParams()
  const { data: session } = useSession()
  const matchId = params.matchId as string

  // TODO: Load gladiator ID from match data or query param
  const gladiatorId = 'player-gladiator-id'

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { combatState, isConnected, isComplete, submitInput } = useRealTimeMatch(matchId, gladiatorId)
  const input = useGameInput(canvasRef)

  // Submit input continuously
  useEffect(() => {
    if (isConnected && !isComplete) {
      submitInput(input)
    }
  }, [input, isConnected, isComplete, submitInput])

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-coliseum-black">
        <div className="text-center panel px-8 py-10 inner-shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coliseum-bronze mx-auto mb-4" />
          <p className="text-coliseum-sand/70 uppercase tracking-widest text-xs">
            Connecting to match...
          </p>
        </div>
      </div>
    )
  }

  const playerCombatant =
    combatState?.combatant1.id === gladiatorId
      ? combatState.combatant1
      : combatState?.combatant2.id === gladiatorId
        ? combatState.combatant2
        : null
  const playerUnit = playerCombatant
    ? {
        id: playerCombatant.id,
        name: '',
        pos: playerCombatant.position,
        facing: playerCombatant.facingAngle,
        hp: playerCombatant.currentHp,
        stamina: playerCombatant.currentStamina,
        isInvulnerable: playerCombatant.isInvulnerable,
        currentAction: playerCombatant.currentAction,
        derived: { hpMax: 100, stamMax: 100, staminaRegen: 1, moveSpeed: 1, damageReduction: 0 },
        cooldowns: {} as Record<string, number>,
      }
    : null

  return (
    <div className="min-h-screen bg-coliseum-black">
      <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="font-display text-3xl sm:text-4xl text-center mb-6 text-coliseum-sand uppercase tracking-wide">
          Combat Arena
        </h1>

        <div className="flex justify-center mb-4">
          <ArenaCanvas
            combatState={combatState}
            playerGladiatorId={gladiatorId}
          />
        </div>

        <MatchHUD playerUnit={playerUnit} />

        {isComplete && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
            <div className="panel p-8 text-center max-w-md w-[min(28rem,calc(100vw-2rem))] inner-shadow">
              <h2 className="font-display text-3xl uppercase tracking-wide mb-4">
                {combatState?.winner === gladiatorId ? (
                  <span className="text-coliseum-bronze">Victory</span>
                ) : (
                  <span className="text-coliseum-red">Defeat</span>
                )}
              </h2>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Fight Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
