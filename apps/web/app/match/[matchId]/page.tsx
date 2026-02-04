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
      <div className="flex items-center justify-center min-h-screen bg-[#1E1B18]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Connecting to match...</p>
        </div>
      </div>
    )
  }

  const playerUnit = combatState?.units.get(gladiatorId) ?? null

  return (
    <div className="min-h-screen bg-[#1E1B18] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">
          Combat Arena
        </h1>

        <div className="flex justify-center mb-4">
          <ArenaCanvas
            combatState={combatState}
            playerUnitId={gladiatorId}
          />
        </div>

        <MatchHUD playerUnit={playerUnit} />

        {isComplete && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-gray-900 p-8 rounded-lg border-2 border-gray-700 text-center">
              <h2 className="text-3xl font-bold mb-4">
                {combatState?.winnerId === gladiatorId ? (
                  <span className="text-green-500">Victory!</span>
                ) : (
                  <span className="text-red-500">Defeat</span>
                )}
              </h2>
              <button
                onClick={() => window.location.reload()}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
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
