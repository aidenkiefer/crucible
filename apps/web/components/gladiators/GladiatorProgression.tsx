'use client'

import { useEffect, useState } from 'react'

interface ProgressionData {
  id: string
  level: number
  xp: number
  xpForNextLevel: number
  isMaxLevel: boolean
  skillPointsAvailable: number
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

  useEffect(() => {
    fetchProgression()
  }, [gladiatorId])

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
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Constitution" value={progression.constitution} />
          <StatCard label="Strength" value={progression.strength} />
          <StatCard label="Dexterity" value={progression.dexterity} />
          <StatCard label="Speed" value={progression.speed} />
          <StatCard label="Defense" value={progression.defense} />
          <StatCard label="Magic Resist" value={progression.magicResist} />
          <StatCard label="Arcana" value={progression.arcana} />
          <StatCard label="Faith" value={progression.faith} />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-800 border border-coliseum-sand/20 rounded p-3 text-center">
      <div className="text-2xl font-bold text-coliseum-bronze">{value}</div>
      <div className="text-xs text-coliseum-sand/70 uppercase">{label}</div>
    </div>
  )
}
