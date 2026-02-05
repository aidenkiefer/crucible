'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function QuickMatchPage() {
  const [isSearching, setIsSearching] = useState(false)
  const [selectedGladiator, setSelectedGladiator] = useState<string | null>(null)
  const socket = useSocket()
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    if (!socket) return

    socket.on('match:found', ({ matchId }: { matchId: string }) => {
      console.log('Match found:', matchId)
      router.push(`/match/${matchId}`)
    })

    socket.on('matchmaking:joined', () => {
      console.log('Joined matchmaking queue')
    })

    socket.on('matchmaking:error', ({ message }: { message: string }) => {
      console.error('Matchmaking error:', message)
      setIsSearching(false)
    })

    return () => {
      socket.off('match:found')
      socket.off('matchmaking:joined')
      socket.off('matchmaking:error')
    }
  }, [socket, router])

  const startSearch = () => {
    if (!selectedGladiator || !session?.user?.id) return

    setIsSearching(true)

    socket?.emit('matchmaking:join', {
      userId: session.user.id,
      gladiatorId: selectedGladiator,
    })
  }

  const cancelSearch = () => {
    socket?.emit('matchmaking:leave')
    setIsSearching(false)
  }

  return (
    <main className="min-h-screen bg-coliseum-black pt-[90px]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="panel-embossed p-8 space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="font-display text-3xl text-coliseum-bronze uppercase tracking-wide text-glow-bronze mb-2">
              Quick Match
            </h1>
            <p className="text-coliseum-sand/70 text-sm">
              Find a random opponent and battle for glory
            </p>
          </div>

          {!isSearching ? (
            <>
              {/* TODO: Replace with GladiatorSelector component */}
              <div className="panel-inset p-4">
                <label className="block mb-2 text-coliseum-sand/80 uppercase text-xs tracking-wider font-bold">
                  Select Gladiator:
                </label>
                <select
                  onChange={e => setSelectedGladiator(e.target.value)}
                  className="w-full panel-inset px-3 py-2 text-coliseum-sand font-bold uppercase text-sm border-none bg-coliseum-black/50"
                >
                  <option value="">-- Select a gladiator --</option>
                  {/* TODO: Fetch and display user's gladiators */}
                  <option value="placeholder-gladiator-id">Placeholder Gladiator</option>
                </select>
              </div>

              <button
                onClick={startSearch}
                disabled={!selectedGladiator}
                className="btn-raised w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Find Match
              </button>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="panel-inset p-6">
                <p className="text-coliseum-bronze text-xl mb-4 uppercase tracking-wider">
                  Searching for opponent...
                </p>
                <div className="animate-spin w-16 h-16 border-4 border-coliseum-bronze border-t-transparent rounded-full mx-auto"></div>
              </div>
              <button
                onClick={cancelSearch}
                className="btn-raised px-6 py-3 hover:brightness-90"
              >
                Cancel Search
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
