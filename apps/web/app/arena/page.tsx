'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import { useCreateMatch } from '@/hooks/useCreateMatch'
import { useActiveGladiator } from '@/contexts/ActiveGladiatorContext'

export default function ArenaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { createMatch, isCreating, error } = useCreateMatch()
  const { activeGladiator } = useActiveGladiator()
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreateCpuMatch = async () => {
    if (!session?.user) {
      setCreateError('You must be signed in to enter the arena')
      return
    }

    if (!activeGladiator) {
      setCreateError('Please select an active gladiator from the HUD')
      return
    }

    setCreateError(null)

    const matchId = await createMatch({
      userId: session.user.id || session.user.email || 'unknown',
      gladiatorId: activeGladiator.id,
      gladiatorStats: {
        constitution: activeGladiator.constitution,
        strength: activeGladiator.strength,
        dexterity: activeGladiator.dexterity,
        speed: activeGladiator.speed,
        defense: activeGladiator.defense,
        magicResist: activeGladiator.magicResist,
        arcana: activeGladiator.arcana,
        faith: activeGladiator.faith,
      },
      isCpuMatch: true,
    })

    if (matchId) {
      router.push(`/match/${matchId}`)
    } else {
      setCreateError(error || 'Failed to create match')
    }
  }

  return (
    <main className="min-h-screen bg-coliseum-black pt-[90px]">
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="panel-embossed p-8 space-y-6">
          <div className="text-6xl mb-4">⚔️</div>

          <h1 className="font-display text-3xl text-coliseum-bronze uppercase tracking-wide text-glow-bronze">
            Enter the Arena
          </h1>

          <p className="text-coliseum-sand/80 uppercase tracking-wider text-sm">
            Test your skills against the AI
          </p>

          {!session && (
            <div className="panel-inset p-4">
              <p className="text-red-400 text-sm uppercase tracking-wider">
                You must be signed in to enter the arena
              </p>
            </div>
          )}

          {session && !activeGladiator && (
            <div className="panel-inset p-4 border-2 border-yellow-500/50">
              <p className="text-yellow-400 text-sm uppercase tracking-wider">
                Select an active gladiator from the HUD above
              </p>
            </div>
          )}

          {session && activeGladiator && (
            <div className="panel-inset p-4">
              <p className="text-coliseum-sand text-sm uppercase tracking-wider mb-2">
                Fighting with:
              </p>
              <p className="text-coliseum-bronze font-bold text-lg">
                {activeGladiator.name || `Gladiator #${activeGladiator.tokenId}`}
              </p>
              <p className="text-coliseum-sand/60 text-xs uppercase tracking-wider">
                Lv. {activeGladiator.level} {activeGladiator.class}
              </p>
            </div>
          )}

          {(createError || error) && (
            <div className="panel-inset p-4 border-2 border-red-500/50">
              <p className="text-red-400 text-sm">
                {createError || error}
              </p>
            </div>
          )}

          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={handleCreateCpuMatch}
              disabled={isCreating || !session || !activeGladiator}
              className="btn-raised disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 text-lg"
            >
              {isCreating ? (
                <>
                  <span className="inline-block animate-spin mr-2">⚔</span>
                  Creating Match...
                </>
              ) : (
                'Fight CPU Opponent'
              )}
            </button>

            <Link href="/" className="btn-raised inline-block px-6 py-3">
              ← Back to Menu
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
