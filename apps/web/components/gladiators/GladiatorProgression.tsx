'use client'

import { useEffect, useState } from 'react'

interface ProgressionData {
  id: string
  level: number
  xp: number
  xpForNextLevel: number
  isMaxLevel: boolean
  skillPointsAvailable: number
  statPointsAvailable: number
  constitution: number
  strength: number
  dexterity: number
  speed: number
  defense: number
  magicResist: number
  arcana: number
  faith: number
}

interface Props {
  gladiatorId: string
}

export function GladiatorProgression({ gladiatorId }: Props) {
  const [progression, setProgression] = useState<ProgressionData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProgression = async () => {
    try {
      const res = await fetch(`/api/gladiators/${gladiatorId}/progression`)
      const data = await res.json()
      setProgression(data.gladiator)
    } catch (error) {
      console.error('Failed to fetch progression:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProgression()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gladiatorId])

  const allocateStat = async (stat: string) => {
    if (!progression || progression.statPointsAvailable < 1) return
    try {
      const res = await fetch(`/api/gladiators/${gladiatorId}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stat }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchProgression()
      } else {
        alert(data.error || 'Failed to allocate stat')
      }
    } catch (error) {
      console.error('Failed to allocate stat:', error)
      alert('Failed to allocate stat')
    }
  }

  if (loading) {
    return (
      <div className="panel p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coliseum-bronze mx-auto" />
        <p className="text-coliseum-sand/70 mt-4">Loading progression...</p>
      </div>
    )
  }

  if (!progression) {
    return (
      <div className="panel p-6 text-center">
        <p className="text-coliseum-sand/70">Failed to load progression data</p>
      </div>
    )
  }

  const xpPercent = progression.isMaxLevel
    ? 100
    : (progression.xp / progression.xpForNextLevel) * 100

  return (
    <div className="space-y-6">
      {/* Level & XP */}
      <div className="panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-3xl text-coliseum-bronze uppercase">
              Level {progression.level}
            </h3>
            {!progression.isMaxLevel && (
              <p className="text-coliseum-sand/70 text-sm">
                {progression.xp} / {progression.xpForNextLevel} XP
              </p>
            )}
            {progression.isMaxLevel && (
              <p className="text-coliseum-bronze text-sm">MAX LEVEL</p>
            )}
          </div>
          <div className="flex gap-6">
            {progression.skillPointsAvailable > 0 && (
              <div className="text-center">
                <div className="text-4xl text-coliseum-bronze">
                  {progression.skillPointsAvailable}
                </div>
                <p className="text-xs text-coliseum-sand/70 uppercase">
                  Skill Points
                </p>
              </div>
            )}
            {progression.statPointsAvailable > 0 && (
              <div className="text-center">
                <div className="text-4xl text-amber-400">
                  {progression.statPointsAvailable}
                </div>
                <p className="text-xs text-coliseum-sand/70 uppercase">
                  Stat Points
                </p>
              </div>
            )}
          </div>
        </div>

        {/* XP Bar */}
        {!progression.isMaxLevel && (
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-coliseum-bronze to-yellow-600 h-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="panel p-6">
        <h4 className="font-display text-xl text-coliseum-sand uppercase mb-4">
          Combat Stats
          {progression.statPointsAvailable > 0 && (
            <span className="ml-2 text-sm font-normal text-amber-400">
              (+{progression.statPointsAvailable} points to spend)
            </span>
          )}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Constitution"
            value={progression.constitution}
            onAdd={progression.statPointsAvailable > 0 ? () => allocateStat('constitution') : undefined}
          />
          <StatCard
            label="Strength"
            value={progression.strength}
            onAdd={progression.statPointsAvailable > 0 ? () => allocateStat('strength') : undefined}
          />
          <StatCard
            label="Dexterity"
            value={progression.dexterity}
            onAdd={progression.statPointsAvailable > 0 ? () => allocateStat('dexterity') : undefined}
          />
          <StatCard
            label="Speed"
            value={progression.speed}
            onAdd={progression.statPointsAvailable > 0 ? () => allocateStat('speed') : undefined}
          />
          <StatCard
            label="Defense"
            value={progression.defense}
            onAdd={progression.statPointsAvailable > 0 ? () => allocateStat('defense') : undefined}
          />
          <StatCard
            label="Magic Resist"
            value={progression.magicResist}
            onAdd={progression.statPointsAvailable > 0 ? () => allocateStat('magicResist') : undefined}
          />
          <StatCard
            label="Arcana"
            value={progression.arcana}
            onAdd={progression.statPointsAvailable > 0 ? () => allocateStat('arcana') : undefined}
          />
          <StatCard
            label="Faith"
            value={progression.faith}
            onAdd={progression.statPointsAvailable > 0 ? () => allocateStat('faith') : undefined}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  onAdd,
}: {
  label: string
  value: number
  onAdd?: () => void
}) {
  return (
    <div className="bg-gray-800 border border-coliseum-sand/20 rounded p-3 text-center">
      <div className="flex items-center justify-center gap-1">
        <span className="text-2xl font-bold text-coliseum-bronze">{value}</span>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="ml-1 w-6 h-6 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 text-sm font-bold leading-none"
            title={`+1 ${label}`}
          >
            +
          </button>
        )}
      </div>
      <div className="text-xs text-coliseum-sand/70 uppercase">{label}</div>
    </div>
  )
}
