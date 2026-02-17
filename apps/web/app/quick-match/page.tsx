'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useActiveGladiator } from '@/contexts/ActiveGladiatorContext'

interface Gladiator {
  id: string
  tokenId: number
  name: string | null
  class: string
  level: number
}

export default function QuickMatchPage() {
  const [isSearching, setIsSearching] = useState(false)
  const [selectedGladiator, setSelectedGladiator] = useState<string>('')
  const [gladiators, setGladiators] = useState<Gladiator[]>([])
  const [loading, setLoading] = useState(true)
  const socket = useSocket()
  const router = useRouter()
  const { data: session } = useSession()
  const { activeGladiator } = useActiveGladiator()

  useEffect(() => {
    // Set activeGladiator as default selection if available
    if (activeGladiator) {
      setSelectedGladiator(activeGladiator.id)
    }
  }, [activeGladiator])

  useEffect(() => {
    // Fetch user's gladiators
    const fetchGladiators = async () => {
      if (!session?.user?.id) return

      try {
        const res = await fetch('/api/gladiators')
        if (res.ok) {
          const data = await res.json()
          setGladiators(data.gladiators || [])
        }
      } catch (error) {
        console.error('Failed to fetch gladiators:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGladiators()
  }, [session?.user?.id])

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

  const displayName = (gladiator: Gladiator) => {
    return gladiator.name || `Gladiator #${gladiator.tokenId}`
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
              <div className="panel-inset p-4">
                <label className="block mb-2 text-coliseum-sand/80 uppercase text-xs tracking-wider font-bold">
                  Select Gladiator:
                </label>
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-coliseum-sand/60 text-sm">Loading gladiators...</p>
                  </div>
                ) : gladiators.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-coliseum-sand/60 text-sm mb-2">No gladiators found</p>
                    <button
                      onClick={() => router.push('/mint')}
                      className="btn-raised px-4 py-2 text-xs"
                    >
                      Mint a Gladiator
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedGladiator}
                    onChange={e => setSelectedGladiator(e.target.value)}
                    className="w-full panel-inset px-3 py-2 text-coliseum-sand font-bold uppercase text-sm border-none bg-coliseum-black/50"
                  >
                    <option value="">-- Select a gladiator --</option>
                    {gladiators.map(gladiator => (
                      <option key={gladiator.id} value={gladiator.id}>
                        {displayName(gladiator)} (Lv. {gladiator.level} {gladiator.class})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                onClick={startSearch}
                disabled={!selectedGladiator || loading}
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
