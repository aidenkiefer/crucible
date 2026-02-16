'use client'

import { useState } from 'react'

const CLASSES = ['Tank', 'Legionnaire', 'Duelist', 'Mage', 'Monk'] as const

export interface CreatedTestGladiator {
  id: string
  tokenId: number
  class: string
  name?: string | null
  level: number
  xp: number
  constitution: number
  strength: number
  dexterity: number
  speed: number
  defense: number
  magicResist: number
  arcana: number
  faith: number
  skillPointsAvailable: number
  statPointsAvailable: number
  unlockedSkills: string[]
}

interface CreateTestGladiatorModalProps {
  open: boolean
  onClose: () => void
  onCreated: (gladiator: CreatedTestGladiator) => void
}

export function CreateTestGladiatorModal({ open, onClose, onCreated }: CreateTestGladiatorModalProps) {
  const [classChoice, setClassChoice] = useState<'Tank' | 'Legionnaire' | 'Duelist' | 'Mage' | 'Monk'>('Tank')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/gladiators/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class: classChoice }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create test gladiator')
        return
      }
      onCreated(data.gladiator)
      onClose()
    } catch {
      setError('Failed to create test gladiator')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div
        className="panel-embossed p-6 max-w-md w-full space-y-4 border-2 border-coliseum-bronze/50"
        role="dialog"
        aria-labelledby="create-test-gladiator-title"
      >
        <h2 id="create-test-gladiator-title" className="text-lg font-bold text-coliseum-bronze uppercase">
          Create test gladiator
        </h2>
        <p className="text-sm text-coliseum-sand/80">
          Same flow as the forge: pick a class, stats are generated with the weighted algorithm, then you can name them in Camp.
        </p>
        <div>
          <label htmlFor="test-class" className="block text-xs text-coliseum-sand/70 uppercase tracking-wider mb-1">
            Class
          </label>
          <select
            id="test-class"
            value={classChoice}
            onChange={(e) => setClassChoice(e.target.value as (typeof CLASSES)[number])}
            className="w-full panel-inset px-3 py-2 text-coliseum-sand border border-coliseum-sand/20"
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-raised px-4 py-2 text-sm uppercase"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            className="px-4 py-2 text-sm uppercase bg-coliseum-bronze/20 text-coliseum-bronze border-2 border-coliseum-bronze/50 font-bold disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
