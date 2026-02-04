'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import { useCreateMatch } from '@/hooks/useCreateMatch'

export default function ArenaPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { createMatch, isCreating, error } = useCreateMatch()
  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreateCpuMatch = async () => {
    if (!session?.user) {
      setCreateError('You must be signed in to enter the arena')
      return
    }

    setCreateError(null)

    // TODO: Load gladiator from database
    // For now, use mock data
    const mockGladiatorId = 'player-gladiator-id'
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

    const matchId = await createMatch({
      userId: session.user.id || session.user.email || 'unknown',
      gladiatorId: mockGladiatorId,
      gladiatorStats: mockGladiatorStats,
      isCpuMatch: true,
    })

    if (matchId) {
      // Navigate to match page
      router.push(`/match/${matchId}`)
    } else {
      setCreateError(error || 'Failed to create match')
    }
  }

  return (
    <main className="min-h-screen bg-coliseum-black">
      <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />

      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="panel p-8 space-y-6">
          <h1 className="font-display text-2xl sm:text-3xl text-coliseum-sand uppercase tracking-wide">
            Enter the Arena
          </h1>

          <p className="text-coliseum-sand/80 uppercase tracking-wider text-sm">
            Test your skills against the AI
          </p>

          {!session && (
            <p className="text-coliseum-red text-sm">
              You must be signed in to enter the arena
            </p>
          )}

          {(createError || error) && (
            <div className="bg-coliseum-red/10 border border-coliseum-red rounded p-3">
              <p className="text-coliseum-red text-sm">
                {createError || error}
              </p>
            </div>
          )}

          <div className="pt-4 flex flex-col gap-4">
            <button
              onClick={handleCreateCpuMatch}
              disabled={isCreating || !session}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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

            <Link href="/" className="btn-secondary inline-block">
              Return to Camp
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
