'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { ArenaCanvas } from '@/components/arena/ArenaCanvas'
import { MatchHUD } from '@/components/arena/MatchHUD'
import { WeaponSelector } from '@/components/arena/WeaponSelector'
import { useRealTimeMatch } from '@/hooks/useRealTimeMatch'
import { useGameInput } from '@/hooks/useGameInput'
import { useClientPrediction } from '@/hooks/useClientPrediction'
import { useCreateMatch } from '@/hooks/useCreateMatch'
import { WeaponType, Weapons } from '@gladiator/shared/src/combat'

export default function MatchPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const matchId = params.matchId as string

  // TODO: Load gladiator ID from match data or query param
  const gladiatorId = 'player-gladiator-id'

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { combatState, isConnected, isComplete, submitInput } = useRealTimeMatch(matchId, gladiatorId)
  const { createMatch, isCreating } = useCreateMatch()
  const [fightAgainError, setFightAgainError] = useState<string | null>(null)

  // Weapon selection (Sprint 4)
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>(WeaponType.Sword)
  const weapons = Weapons.getAllWeaponTypes()

  const handleWeaponChange = (weaponIndex: number) => {
    if (weaponIndex >= 0 && weaponIndex < weapons.length) {
      setCurrentWeapon(weapons[weaponIndex])
    }
  }

  const input = useGameInput(canvasRef, {
    onWeaponChange: handleWeaponChange,
  })

  // Client-side prediction for local player
  const playerCombatantData =
    combatState?.combatant1.id === gladiatorId
      ? combatState.combatant1
      : combatState?.combatant2.id === gladiatorId
        ? combatState.combatant2
        : null

  const predictedState = useClientPrediction(
    playerCombatantData
      ? {
          position: playerCombatantData.position,
          facing: playerCombatantData.facingAngle,
          moveSpeed: 150, // TODO: Get from derived stats when available
        }
      : null,
    input,
    true // Always predict for local player
  )

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
        derived: { maxHp: 100, maxStamina: 100, staminaRegen: 1, moveSpeed: 1, damageReduction: 0 },
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
            predictedState={predictedState}
          />
        </div>

        <div className="flex justify-center mb-4">
          <WeaponSelector
            currentWeapon={currentWeapon}
            onWeaponChange={setCurrentWeapon}
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
              {fightAgainError && (
                <p className="text-coliseum-red text-sm mb-4">
                  {fightAgainError}
                </p>
              )}
              <button
                onClick={async () => {
                  setFightAgainError(null)

                  // Create new match with same stats
                  const mockGladiatorStats = {
                    constitution: 10,
                    strength: 10,
                    dexterity: 10,
                    speed: 10,
                    defense: 10,
                    magicResist: 10,
                    arcana: 10,
                    faith: 10,
                  }

                  const newMatchId = await createMatch({
                    userId: session?.user?.id || session?.user?.email || 'unknown',
                    gladiatorId,
                    gladiatorStats: mockGladiatorStats,
                    isCpuMatch: true,
                  })

                  if (newMatchId) {
                    router.push(`/match/${newMatchId}`)
                  } else {
                    setFightAgainError('Failed to create new match')
                  }
                }}
                disabled={isCreating}
                className="btn-primary disabled:opacity-50"
              >
                {isCreating ? 'Creating Match...' : 'Fight Again'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
