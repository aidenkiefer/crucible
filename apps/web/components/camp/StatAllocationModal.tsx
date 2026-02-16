'use client'

import { useState } from 'react'

interface StatAllocationModalProps {
  open: boolean
  onClose: () => void
  gladiator: {
    id: string
    constitution: number
    strength: number
    dexterity: number
    speed: number
    defense: number
    magicResist: number
    arcana: number
    faith: number
    statPointsAvailable?: number
  }
  onSuccess: () => void
}

type StatKey =
  | 'constitution'
  | 'strength'
  | 'dexterity'
  | 'speed'
  | 'defense'
  | 'magicResist'
  | 'arcana'
  | 'faith'

interface PendingAllocations {
  constitution: number
  strength: number
  dexterity: number
  speed: number
  defense: number
  magicResist: number
  arcana: number
  faith: number
}

const STAT_DISPLAY_NAMES: Record<StatKey, string> = {
  constitution: 'Constitution',
  strength: 'Strength',
  dexterity: 'Dexterity',
  speed: 'Speed',
  defense: 'Defense',
  magicResist: 'Magic Resist',
  arcana: 'Arcana',
  faith: 'Faith',
}

const STAT_ORDER: StatKey[] = [
  'constitution',
  'strength',
  'dexterity',
  'speed',
  'defense',
  'magicResist',
  'arcana',
  'faith',
]

export function StatAllocationModal({
  open,
  onClose,
  gladiator,
  onSuccess,
}: StatAllocationModalProps) {
  const [pending, setPending] = useState<PendingAllocations>({
    constitution: 0,
    strength: 0,
    dexterity: 0,
    speed: 0,
    defense: 0,
    magicResist: 0,
    arcana: 0,
    faith: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate total allocated and remaining points
  const totalAllocated = Object.values(pending).reduce((sum, val) => sum + val, 0)
  const remainingPoints = (gladiator.statPointsAvailable ?? 0) - totalAllocated

  const handleIncrement = (stat: StatKey) => {
    if (remainingPoints > 0) {
      setPending((prev) => ({ ...prev, [stat]: prev[stat] + 1 }))
    }
  }

  const handleDecrement = (stat: StatKey) => {
    if (pending[stat] > 0) {
      setPending((prev) => ({ ...prev, [stat]: prev[stat] - 1 }))
    }
  }

  const handleAllocate = async () => {
    setLoading(true)
    setError(null)

    try {
      const allocations: Record<string, number> = {}
      for (const [stat, value] of Object.entries(pending)) {
        if (value > 0) {
          allocations[stat] = value
        }
      }

      const res = await fetch(`/api/gladiators/${gladiator.id}/stats/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to allocate stat points')
        return
      }

      // Reset pending allocations
      setPending({
        constitution: 0,
        strength: 0,
        dexterity: 0,
        speed: 0,
        defense: 0,
        magicResist: 0,
        arcana: 0,
        faith: 0,
      })

      // Call success callback and close modal
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Failed to allocate stat points:', err)
      setError('Failed to allocate stat points')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset pending allocations
    setPending({
      constitution: 0,
      strength: 0,
      dexterity: 0,
      speed: 0,
      defense: 0,
      magicResist: 0,
      arcana: 0,
      faith: 0,
    })
    setError(null)
    onClose()
  }

  if (!open) return null

  const hasChanges = totalAllocated > 0
  const canAllocate = hasChanges && remainingPoints >= 0 && !loading

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="panel-embossed p-6 max-w-2xl w-full border-4 border-coliseum-bronze/60 shadow-2xl">
        {/* Header */}
        <div className="border-b border-coliseum-bronze/30 pb-4 mb-4">
          <h2 className="font-display text-2xl text-coliseum-bronze uppercase mb-2 text-glow-bronze">
            Allocate Stat Points
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-coliseum-sand/70 uppercase text-sm tracking-wider">
              Remaining Points:
            </span>
            <span className={`text-2xl font-bold ${
              remainingPoints === 0 ? 'text-coliseum-sand/50' : 'text-coliseum-bronze'
            }`}>
              {remainingPoints}
            </span>
          </div>
        </div>

        {/* Stat Grid */}
        <div className="space-y-2 mb-6">
          {STAT_ORDER.map((stat) => (
            <div
              key={stat}
              className="panel-inset p-3 flex items-center gap-4"
            >
              {/* Stat Name */}
              <div className="flex-1 min-w-[140px]">
                <span className="text-coliseum-sand/90 uppercase text-sm tracking-wider font-medium">
                  {STAT_DISPLAY_NAMES[stat]}
                </span>
              </div>

              {/* Current Value */}
              <div className="text-center min-w-[60px]">
                <div className="text-xs text-coliseum-sand/60 uppercase tracking-wider mb-1">
                  Current
                </div>
                <div className="text-lg font-bold text-coliseum-sand">
                  {gladiator[stat]}
                </div>
              </div>

              {/* +/- Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDecrement(stat)}
                  disabled={pending[stat] === 0 || loading}
                  className="w-8 h-8 flex items-center justify-center bg-coliseum-stone border-2 border-coliseum-bronze/50 text-coliseum-sand font-bold text-lg hover:bg-coliseum-bronze/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Decrease ${STAT_DISPLAY_NAMES[stat]}`}
                >
                  −
                </button>
                <button
                  onClick={() => handleIncrement(stat)}
                  disabled={remainingPoints === 0 || loading}
                  className="w-8 h-8 flex items-center justify-center bg-coliseum-stone border-2 border-coliseum-bronze/50 text-coliseum-sand font-bold text-lg hover:bg-coliseum-bronze/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Increase ${STAT_DISPLAY_NAMES[stat]}`}
                >
                  +
                </button>
              </div>

              {/* Pending Change */}
              <div className="min-w-[80px] text-right">
                {pending[stat] > 0 ? (
                  <span className="text-green-400 font-bold text-lg">
                    +{pending[stat]}
                  </span>
                ) : (
                  <span className="text-coliseum-sand/30 text-sm">—</span>
                )}
              </div>

              {/* New Total */}
              {pending[stat] > 0 && (
                <div className="min-w-[60px] text-center">
                  <div className="text-xs text-coliseum-bronze uppercase tracking-wider mb-1">
                    New
                  </div>
                  <div className="text-lg font-bold text-coliseum-bronze">
                    {gladiator[stat] + pending[stat]}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 panel-inset p-3 border-red-500/50">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 justify-end pt-4 border-t border-coliseum-bronze/30">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="btn-raised px-6 py-3 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAllocate}
            disabled={!canAllocate}
            className="px-6 py-3 bg-coliseum-bronze/20 text-coliseum-bronze border-2 border-coliseum-bronze/50 font-bold uppercase tracking-wider text-sm hover:bg-coliseum-bronze/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Allocating...' : `Allocate ${totalAllocated} Point${totalAllocated !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
