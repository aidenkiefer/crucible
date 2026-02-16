'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AdminCreateTestGladiatorModal } from './components/AdminCreateTestGladiatorModal'

interface GladiatorRow {
  id: string
  tokenId: number
  class: string
  level: number
  xp: number
  skillPointsAvailable: number
  statPointsAvailable: number
}

interface UserRow {
  id: string
  email: string
  username: string | null
  walletAddress: string | null
  isAdmin: boolean
  createdAt: string
  gladiators: GladiatorRow[]
  goldBalance: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [createTestForUser, setCreateTestForUser] = useState<UserRow | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load users')
      setUsers(data.users ?? [])
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Failed to load' })
    } finally {
      setLoading(false)
    }
  }

  async function updateGladiatorResources(
    gladiatorId: string,
    payload: { level?: number; xp?: number; skillPointsAvailable?: number; statPointsAvailable?: number }
  ) {
    setSaving(gladiatorId)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/gladiators/${gladiatorId}/resources`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setMessage({ type: 'ok', text: 'Gladiator updated' })
      await fetchUsers()
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Update failed' })
    } finally {
      setSaving(null)
    }
  }

  async function updateUserGold(userId: string, balance: number) {
    setSaving(`gold-${userId}`)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/gold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setMessage({ type: 'ok', text: 'Gold updated' })
      await fetchUsers()
    } catch (e) {
      setMessage({ type: 'err', text: e instanceof Error ? e.message : 'Update failed' })
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <p className="text-coliseum-sand/60">Loading users...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl uppercase tracking-wide text-coliseum-bronze">
          Manage Users
        </h1>
        <Link
          href="/admin"
          className="text-coliseum-sand/60 hover:text-coliseum-sand text-sm uppercase tracking-wider"
        >
          ← Dashboard
        </Link>
      </div>

      <p className="text-coliseum-sand/70 text-sm mb-6">
        Update user gold and gladiator resources (XP, level, skill points, stat points) for testing.
      </p>

      {message && (
        <div
          className={`mb-4 px-4 py-2 rounded border ${
            message.type === 'ok'
              ? 'bg-green-900/30 border-green-600 text-green-300'
              : 'bg-red-900/30 border-red-600 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {users.length === 0 ? (
          <div className="panel p-8 text-center text-coliseum-sand/50">
            No users found.
          </div>
        ) : (
          users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onUpdateGladiator={updateGladiatorResources}
              onUpdateGold={updateUserGold}
              onCreateTestGladiator={() => setCreateTestForUser(user)}
              saving={saving}
            />
          ))
        )}

      {createTestForUser && (
        <AdminCreateTestGladiatorModal
          open={!!createTestForUser}
          onClose={() => setCreateTestForUser(null)}
          user={{ id: createTestForUser.id, email: createTestForUser.email }}
          onCreated={() => {
            setCreateTestForUser(null)
            fetchUsers()
          }}
        />
      )}
      </div>
    </div>
  )
}

function UserCard({
  user,
  onUpdateGladiator,
  onUpdateGold,
  onCreateTestGladiator,
  saving,
}: {
  user: UserRow
  onUpdateGladiator: (
    id: string,
    p: { level?: number; xp?: number; skillPointsAvailable?: number; statPointsAvailable?: number }
  ) => Promise<void>
  onUpdateGold: (userId: string, balance: number) => Promise<void>
  onCreateTestGladiator: () => void
  saving: string | null
}) {
  const [goldInput, setGoldInput] = useState<string>(String(user.goldBalance))
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setGoldInput(String(user.goldBalance))
  }, [user.goldBalance])

  return (
    <div className="panel p-6 border-2 border-coliseum-bronze/20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="font-display text-lg text-coliseum-sand uppercase">
            {user.email}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-coliseum-sand/60">
            {user.username && <span>@{user.username}</span>}
            {user.walletAddress && (
              <span className="font-mono truncate max-w-[200px]">{user.walletAddress}</span>
            )}
            {user.isAdmin && (
              <span className="px-2 py-0.5 bg-amber-900/50 border border-amber-600 text-amber-400 text-xs uppercase">
                Admin
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase text-coliseum-sand/50">Gold</label>
            <input
              type="number"
              min={0}
              value={goldInput}
              onChange={(e) => setGoldInput(e.target.value)}
              className="w-24 px-2 py-1.5 bg-coliseum-black border border-coliseum-bronze/40 text-coliseum-sand rounded text-sm"
            />
            <button
              type="button"
              onClick={() => onUpdateGold(user.id, parseInt(goldInput, 10) || 0)}
              disabled={saving === `gold-${user.id}`}
              className="px-3 py-1.5 text-xs uppercase bg-coliseum-bronze/30 border border-coliseum-bronze text-coliseum-sand hover:bg-coliseum-bronze/50 disabled:opacity-50"
            >
              {saving === `gold-${user.id}` ? 'Saving…' : 'Set'}
            </button>
          </div>
          <button
            type="button"
            onClick={onCreateTestGladiator}
            className="px-3 py-1.5 text-xs uppercase border border-coliseum-bronze/50 bg-coliseum-bronze/20 text-coliseum-bronze hover:bg-coliseum-bronze/30"
          >
            + Test gladiator
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-sm uppercase text-coliseum-bronze hover:underline"
          >
            {expanded ? 'Hide' : 'Show'} gladiators ({user.gladiators.length})
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 pt-6 border-t border-coliseum-bronze/20 space-y-4">
          {user.gladiators.length === 0 ? (
            <p className="text-coliseum-sand/50 text-sm">No gladiators</p>
          ) : (
            user.gladiators.map((g) => (
              <GladiatorResourceForm
                key={g.id}
                gladiator={g}
                onSave={onUpdateGladiator}
                saving={saving === g.id}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function GladiatorResourceForm({
  gladiator,
  onSave,
  saving,
}: {
  gladiator: GladiatorRow
  onSave: (
    id: string,
    p: { level?: number; xp?: number; skillPointsAvailable?: number; statPointsAvailable?: number }
  ) => Promise<void>
  saving: boolean
}) {
  const [level, setLevel] = useState(String(gladiator.level))
  const [xp, setXp] = useState(String(gladiator.xp))
  const [skillPoints, setSkillPoints] = useState(String(gladiator.skillPointsAvailable))
  const [statPoints, setStatPoints] = useState(String(gladiator.statPointsAvailable))

  useEffect(() => {
    setLevel(String(gladiator.level))
    setXp(String(gladiator.xp))
    setSkillPoints(String(gladiator.skillPointsAvailable))
    setStatPoints(String(gladiator.statPointsAvailable))
  }, [gladiator])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(gladiator.id, {
      level: Math.min(20, Math.max(1, parseInt(level, 10) || 1)),
      xp: Math.max(0, parseInt(xp, 10) || 0),
      skillPointsAvailable: Math.max(0, parseInt(skillPoints, 10) || 0),
      statPointsAvailable: Math.max(0, parseInt(statPoints, 10) || 0),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 p-4 bg-coliseum-black/40 rounded border border-coliseum-bronze/10"
    >
      <div className="font-display text-coliseum-bronze uppercase">
        #{gladiator.tokenId} {gladiator.class}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-coliseum-sand/50 w-12">Level</label>
        <input
          type="number"
          min={1}
          max={20}
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-16 px-2 py-1 bg-coliseum-black border border-coliseum-bronze/40 text-coliseum-sand rounded text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-coliseum-sand/50 w-8">XP</label>
        <input
          type="number"
          min={0}
          value={xp}
          onChange={(e) => setXp(e.target.value)}
          className="w-24 px-2 py-1 bg-coliseum-black border border-coliseum-bronze/40 text-coliseum-sand rounded text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-coliseum-sand/50 w-20">Skill pts</label>
        <input
          type="number"
          min={0}
          value={skillPoints}
          onChange={(e) => setSkillPoints(e.target.value)}
          className="w-16 px-2 py-1 bg-coliseum-black border border-coliseum-bronze/40 text-coliseum-sand rounded text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-coliseum-sand/50 w-20">Stat pts</label>
        <input
          type="number"
          min={0}
          value={statPoints}
          onChange={(e) => setStatPoints(e.target.value)}
          className="w-16 px-2 py-1 bg-coliseum-black border border-coliseum-bronze/40 text-coliseum-sand rounded text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-1.5 text-xs uppercase bg-coliseum-bronze text-coliseum-black font-bold hover:brightness-110 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Update'}
      </button>
    </form>
  )
}
