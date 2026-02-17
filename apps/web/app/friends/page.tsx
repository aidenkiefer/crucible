'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useActiveGladiator } from '@/contexts/ActiveGladiatorContext'

interface FriendData {
  friendshipId: string
  friend: {
    id: string
    username: string | null
    email: string
    gladiators: Array<{
      id: string
      tokenId: number
      name: string | null
      class: string
      level: number
    }>
  }
  since: string
}

interface PendingRequest {
  requestId: string
  from: {
    id: string
    username: string | null
    email: string
  }
  createdAt: string
}

interface Challenge {
  id: string
  challengerId: string
  opponentId: string
  status: string
  expiresAt: string
  createdAt: string
  challenger: {
    id: string
    username: string | null
    email: string
  }
  opponent: {
    id: string
    username: string | null
    email: string
  }
  gladiator1: {
    id: string
    tokenId: number
    name: string | null
    class: string
    level: number
  } | null
  gladiator2: {
    id: string
    tokenId: number
    name: string | null
    class: string
    level: number
  } | null
}

export default function FriendsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { activeGladiator } = useActiveGladiator()
  const [friends, setFriends] = useState<FriendData[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [sentRequests, setSentRequests] = useState<PendingRequest[]>([])
  const [receivedChallenges, setReceivedChallenges] = useState<Challenge[]>([])
  const [sentChallenges, setSentChallenges] = useState<Challenge[]>([])
  const [friendUsername, setFriendUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return

    setFetchingData(true)
    try {
      // Fetch friends and requests
      const friendsRes = await fetch('/api/friends')
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json()
        setFriends(friendsData.friends || [])
        setPendingRequests(friendsData.pendingRequests || [])
        setSentRequests(friendsData.sentRequests || [])
      }

      // Fetch challenges
      const challengesRes = await fetch('/api/challenges')
      if (challengesRes.ok) {
        const challengesData = await challengesRes.json()
        setReceivedChallenges(challengesData.received || [])
        setSentChallenges(challengesData.sent || [])
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setFetchingData(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addFriend = async () => {
    if (!friendUsername.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendUsername }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add friend')
      }

      setFriendUsername('')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add friend')
    } finally {
      setLoading(false)
    }
  }

  const acceptFriend = async (friendId: string) => {
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept friend')
      }

      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept friend')
    }
  }

  const challengeFriend = async (friendId: string, opponentGladiatorId: string) => {
    if (!activeGladiator) {
      setError('No active gladiator selected')
      return
    }

    try {
      const res = await fetch('/api/challenges/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponentId: friendId,
          gladiatorId: activeGladiator.id,
          opponentGladiatorId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create challenge')
      }

      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge')
    }
  }

  const acceptChallenge = async (challengeId: string) => {
    try {
      const res = await fetch('/api/challenges/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept challenge')
      }

      if (data.matchId) {
        router.push(`/match/${data.matchId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept challenge')
    }
  }

  const displayName = (user: { username: string | null; email: string }) => {
    return user.username || user.email.split('@')[0]
  }

  const gladiatorDisplayName = (gladiator: { name: string | null; tokenId: number }) => {
    return gladiator.name || `Gladiator #${gladiator.tokenId}`
  }

  return (
    <main className="min-h-screen bg-coliseum-black pt-[90px]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="font-display text-3xl text-coliseum-bronze uppercase tracking-wide text-glow-bronze">
            Friends & Challenges
          </h1>
        </div>

        {error && (
          <div className="mb-6 panel-inset p-4 border-2 border-red-500/50">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-300 underline text-xs mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {fetchingData && (
          <div className="mb-6 panel-inset p-4 text-center">
            <p className="text-coliseum-sand/60">Loading...</p>
          </div>
        )}

        {/* Add Friend Section */}
        <div className="mb-6 panel-embossed p-6">
          <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
            Add Friend
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={friendUsername}
              onChange={e => setFriendUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFriend()}
              placeholder="Enter username..."
              className="flex-1 panel-inset px-3 py-2 text-coliseum-sand bg-coliseum-black/50 border-none placeholder:text-coliseum-sand/30"
            />
            <button
              onClick={addFriend}
              disabled={loading || !friendUsername.trim()}
              className="btn-raised px-6 py-2 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>

        {/* Pending Friend Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-6 panel-embossed p-6">
            <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
              Pending Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-2">
              {pendingRequests.map(request => (
                <div
                  key={request.requestId}
                  className="flex items-center justify-between panel-inset p-3"
                >
                  <span className="text-coliseum-sand font-bold">
                    {displayName(request.from)}
                  </span>
                  <button
                    onClick={() => acceptFriend(request.from.id)}
                    className="btn-raised px-4 py-1 text-xs"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent Friend Requests */}
        {sentRequests.length > 0 && (
          <div className="mb-6 panel-embossed p-6">
            <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
              Sent Requests ({sentRequests.length})
            </h2>
            <div className="space-y-2">
              {sentRequests.map(request => (
                <div
                  key={request.requestId}
                  className="flex items-center justify-between panel-inset p-3"
                >
                  <span className="text-coliseum-sand font-bold">
                    {displayName(request.from)}
                  </span>
                  <span className="text-coliseum-sand/60 text-xs uppercase tracking-wider">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Received Challenges */}
        {receivedChallenges.length > 0 && (
          <div className="mb-6 panel-embossed p-6">
            <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
              Incoming Challenges ({receivedChallenges.length})
            </h2>
            <div className="space-y-2">
              {receivedChallenges.map(challenge => (
                <div
                  key={challenge.id}
                  className="flex flex-col gap-2 panel-inset p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-coliseum-sand font-bold">
                        Challenge from {displayName(challenge.challenger)}
                      </p>
                      <p className="text-xs text-coliseum-sand/60 uppercase tracking-wider">
                        {challenge.gladiator1 && gladiatorDisplayName(challenge.gladiator1)} (Lv. {challenge.gladiator1?.level})
                      </p>
                    </div>
                    <button
                      onClick={() => acceptChallenge(challenge.id)}
                      className="btn-raised px-4 py-1 text-xs"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent Challenges */}
        {sentChallenges.length > 0 && (
          <div className="mb-6 panel-embossed p-6">
            <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
              Sent Challenges ({sentChallenges.length})
            </h2>
            <div className="space-y-2">
              {sentChallenges.map(challenge => (
                <div
                  key={challenge.id}
                  className="flex items-center justify-between panel-inset p-3"
                >
                  <div>
                    <p className="text-coliseum-sand font-bold">
                      Challenge to {displayName(challenge.opponent)}
                    </p>
                    <p className="text-xs text-coliseum-sand/60 uppercase tracking-wider">
                      Waiting for response...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="mb-6 panel-embossed p-6">
          <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
            Friends ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <div className="panel-inset p-4 text-center">
              <p className="text-coliseum-sand/60">No friends yet. Add some!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map(({ friendshipId, friend }) => (
                <div
                  key={friendshipId}
                  className="panel-inset p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-coliseum-sand font-bold">
                      {displayName(friend)}
                    </span>
                  </div>
                  {friend.gladiators.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {friend.gladiators.map(gladiator => (
                        <div
                          key={gladiator.id}
                          className="flex items-center justify-between bg-coliseum-black/30 p-2 rounded"
                        >
                          <div>
                            <span className="text-coliseum-sand/80 text-sm">
                              {gladiatorDisplayName(gladiator)}
                            </span>
                            <span className="text-coliseum-sand/60 text-xs ml-2">
                              (Lv. {gladiator.level} {gladiator.class})
                            </span>
                          </div>
                          <button
                            onClick={() => challengeFriend(friend.id, gladiator.id)}
                            disabled={!activeGladiator}
                            className="btn-raised px-3 py-1 text-xs disabled:opacity-50"
                            title={!activeGladiator ? 'Select an active gladiator first' : ''}
                          >
                            Challenge
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {friend.gladiators.length === 0 && (
                    <p className="text-coliseum-sand/40 text-xs mt-2">No gladiators</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
