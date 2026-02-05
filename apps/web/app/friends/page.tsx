'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Friend {
  id: string
  username: string
  isOnline?: boolean
  status: string
}

interface Challenge {
  id: string
  challenger: { username: string }
  opponent: { username: string }
  status: string
  createdAt: string
}

export default function FriendsPage() {
  const { data: session } = useSession()
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [friendUsername, setFriendUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // TODO: Fetch friends, pending requests, and challenges on mount
  useEffect(() => {
    // Placeholder - implement API calls to fetch data
  }, [])

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
      // TODO: Refresh friend list
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

      // TODO: Refresh friend list and pending requests
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept friend')
    }
  }

  const challengeFriend = async (friendId: string, gladiatorId: string) => {
    try {
      const res = await fetch('/api/challenges/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponentId: friendId,
          gladiatorId,
          opponentGladiatorId: 'placeholder', // TODO: Let opponent choose
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create challenge')
      }

      // TODO: Refresh challenges list
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

      // TODO: Navigate to match
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept challenge')
    }
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
                  key={request.id}
                  className="flex items-center justify-between panel-inset p-3"
                >
                  <span className="text-coliseum-sand font-bold">{request.username}</span>
                  <button
                    onClick={() => acceptFriend(request.id)}
                    className="btn-raised px-4 py-1 text-xs"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="mb-6 panel-embossed p-6">
          <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
            Friends
          </h2>
          {friends.length === 0 ? (
            <div className="panel-inset p-4 text-center">
              <p className="text-coliseum-sand/60">No friends yet. Add some!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map(friend => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between panel-inset p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-coliseum-sand font-bold">{friend.username}</span>
                    {friend.isOnline && (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  <button
                    onClick={() => challengeFriend(friend.id, 'placeholder-gladiator-id')}
                    className="btn-raised px-4 py-1 text-xs"
                  >
                    Challenge
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Challenges */}
        <div className="panel-embossed p-6">
          <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
            Active Challenges
          </h2>
          {challenges.length === 0 ? (
            <div className="panel-inset p-4 text-center">
              <p className="text-coliseum-sand/60">No active challenges.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {challenges.map(challenge => (
                <div
                  key={challenge.id}
                  className="flex items-center justify-between panel-inset p-3"
                >
                  <div>
                    <p className="text-coliseum-sand font-bold">
                      {challenge.challenger.username} vs {challenge.opponent.username}
                    </p>
                    <p className="text-xs text-coliseum-sand/60 uppercase tracking-wider">
                      Status: {challenge.status}
                    </p>
                  </div>
                  {challenge.status === 'pending' &&
                    challenge.opponent.username === session?.user?.name && (
                      <button
                        onClick={() => acceptChallenge(challenge.id)}
                        className="btn-raised px-4 py-1 text-xs"
                      >
                        Accept
                      </button>
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
