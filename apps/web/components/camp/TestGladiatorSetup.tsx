'use client'

import { useState } from 'react'

const TEST_TOKEN_ID_MIN = 900_000
const CLASSES = ['Tank', 'Legionnaire', 'Duelist', 'Mage', 'Monk'] as const

interface TestGladiatorSetupProps {
  gladiatorId: string
  currentClass: string
  onSuccess: () => void
}

export function TestGladiatorSetup({ gladiatorId, currentClass, onSuccess }: TestGladiatorSetupProps) {
  const [classChoice, setClassChoice] = useState(currentClass || 'Tank')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateStats = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/gladiators/${gladiatorId}/setup`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class: classChoice }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate stats')
        return
      }
      onSuccess()
    } catch {
      setError('Failed to generate stats')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel-embossed p-4 space-y-3 border-2 border-amber-500/40">
      <h3 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold">
        Test gladiator — set class and generate stats
      </h3>
      <p className="text-coliseum-sand/80 text-xs">
        Choose a class and generate stats using the same weighted algorithm as the forge. You can re-roll anytime.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={classChoice}
          onChange={(e) => setClassChoice(e.target.value)}
          className="panel-inset px-3 py-2 text-coliseum-sand font-medium uppercase text-sm border border-coliseum-bronze/30"
        >
          {CLASSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleGenerateStats}
          disabled={submitting}
          className="px-4 py-2 bg-coliseum-bronze/20 text-coliseum-bronze border-2 border-coliseum-bronze/50 font-bold uppercase text-sm disabled:opacity-50"
        >
          {submitting ? 'Generating…' : 'Generate stats'}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}

export function isTestGladiator(tokenId: number): boolean {
  return tokenId >= TEST_TOKEN_ID_MIN
}
