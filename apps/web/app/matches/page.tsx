'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface MatchHistoryItem {
  id: string
  matchType: string
  winnerId: string | null
  durationSeconds: number
  completedAt: string
  matchStats: any
  rewardType: string | null
  rewardAmount: number | null
  lootBoxTier: string | null
  player1Gladiator: {
    id: string
    class: string
    owner: { username: string | null }
  }
  player2Gladiator: {
    id: string
    class: string
    owner: { username: string | null }
  } | null
  isCpuMatch: boolean
}

export default function MatchHistoryPage() {
  const { data: session } = useSession()
  const [matches, setMatches] = useState<MatchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchMatches()
  }, [filter])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const url = `/api/matches/history${filter ? `?type=${filter}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error('Failed to fetch match history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-coliseum-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-display text-4xl text-coliseum-sand uppercase tracking-wide">
            Match History
          </h1>
          <Link
            href="/arena"
            className="btn-secondary"
          >
            Back to Arena
          </Link>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded ${
              filter === null
                ? 'bg-coliseum-bronze text-coliseum-black'
                : 'bg-gray-800 text-coliseum-sand hover:bg-gray-700'
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilter('cpu')}
            className={`px-4 py-2 rounded ${
              filter === 'cpu'
                ? 'bg-coliseum-bronze text-coliseum-black'
                : 'bg-gray-800 text-coliseum-sand hover:bg-gray-700'
            }`}
          >
            CPU Matches
          </button>
          <button
            onClick={() => setFilter('ranked')}
            className={`px-4 py-2 rounded ${
              filter === 'ranked'
                ? 'bg-coliseum-bronze text-coliseum-black'
                : 'bg-gray-800 text-coliseum-sand hover:bg-gray-700'
            }`}
          >
            Ranked
          </button>
        </div>

        {/* Match list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coliseum-bronze mx-auto" />
            <p className="text-coliseum-sand/70 mt-4">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="panel p-8 text-center">
            <p className="text-coliseum-sand/70">No matches found.</p>
            <Link href="/arena" className="btn-primary mt-4 inline-block">
              Play Your First Match
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const userGladiatorId = match.player1Gladiator.owner.username === session?.user?.name
                ? match.player1Gladiator.id
                : match.player2Gladiator?.id

              const isWinner = match.winnerId === userGladiatorId
              const opponent = match.isCpuMatch
                ? 'CPU'
                : match.player1Gladiator.id === userGladiatorId
                  ? match.player2Gladiator?.owner?.username || 'Unknown'
                  : match.player1Gladiator.owner?.username || 'Unknown'

              return (
                <div
                  key={match.id}
                  className={`panel p-6 border-l-4 ${
                    isWinner
                      ? 'border-green-500 bg-green-900/10'
                      : 'border-red-500 bg-red-900/10'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`font-display text-xl uppercase ${
                            isWinner ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {isWinner ? 'Victory' : 'Defeat'}
                        </span>
                        <span className="text-coliseum-sand/50 text-sm">
                          vs {opponent}
                        </span>
                        <span className="px-2 py-1 bg-gray-800 rounded text-xs uppercase">
                          {match.matchType}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-coliseum-sand/70">Duration:</span>
                          <span className="text-coliseum-sand ml-2">
                            {formatDuration(match.durationSeconds)}
                          </span>
                        </div>
                        <div>
                          <span className="text-coliseum-sand/70">Damage Dealt:</span>
                          <span className="text-coliseum-sand ml-2">
                            {match.matchStats?.damageDealt?.player1 || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-coliseum-sand/70">Attacks Landed:</span>
                          <span className="text-coliseum-sand ml-2">
                            {match.matchStats?.attacksLanded?.player1 || 0}
                          </span>
                        </div>
                      </div>

                      {match.rewardType && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-coliseum-bronze text-sm">
                            ✨ Reward:
                          </span>
                          <span className="text-coliseum-sand text-sm">
                            {match.rewardAmount} {match.lootBoxTier} loot box
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right text-xs text-coliseum-sand/50">
                      {formatDate(match.completedAt)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
