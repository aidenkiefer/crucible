'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ClassStatBars } from '@/lib/class-stat-display'

const CLASS_NAMES = ['Tank', 'Legionnaire', 'Duelist', 'Mage', 'Monk'] as const

const CLASS_DISPLAY: Record<
  string,
  { name: string; description: string; strengths: string[] }
> = {
  Tank: {
    name: 'Tank',
    description:
      'Defensive bulwark with high constitution and defense. They absorb what would shatter others and hold the line.',
    strengths: ['Constitution', 'Defense'],
  },
  Legionnaire: {
    name: 'Legionnaire',
    description:
      'Physical warrior with strong offense and defense. They deliver crushing blows and weather the same in return.',
    strengths: ['Strength', 'Defense'],
  },
  Duelist: {
    name: 'Duelist',
    description:
      'Fast, agile fighter with high technique. Masters of the blade who read their opponents like an open scroll.',
    strengths: ['Dexterity', 'Speed'],
  },
  Mage: {
    name: 'Mage',
    description:
      'Arcane caster who bends reality to their will. Magic rewrites the battlefield; they wield that power.',
    strengths: ['Arcana', 'Magic Resist'],
  },
  Monk: {
    name: 'Monk',
    description:
      'Faith-driven fighter with durability and inner focus. They channel conviction into resilience and controlled force.',
    strengths: ['Faith', 'Constitution'],
  },
}

const CLASS_ICONS: Record<string, string> = {
  Tank: '/assets/ui/icons/tank-icon-clean.png',
  Legionnaire: '/assets/ui/icons/legionnaire-icon-clean.png',
  Duelist: '/assets/ui/icons/duelist-icon-clean.png',
  Mage: '/assets/ui/icons/mage-icon-clean.png',
  Monk: '/assets/ui/icons/monk-icon-clean.png',
}

export interface CreatedTestGladiator {
  id: string
  tokenId: number
  class: string
}

interface AdminCreateTestGladiatorModalProps {
  open: boolean
  onClose: () => void
  user: { id: string; email: string }
  onCreated: (gladiator: CreatedTestGladiator) => void
}

export function AdminCreateTestGladiatorModal({
  open,
  onClose,
  user,
  onCreated,
}: AdminCreateTestGladiatorModalProps) {
  const [selectedClass, setSelectedClass] = useState<string>('Tank')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedTestGladiator | null>(null)

  const handleCreate = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/test-gladiator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class: selectedClass }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create test gladiator')
        return
      }
      setCreated(data.gladiator)
    } catch {
      setError('Failed to create test gladiator')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDone = () => {
    if (created) onCreated(created)
    setCreated(null)
    setSelectedClass('Tank')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div
        className="panel-embossed max-h-[90vh] w-full max-w-6xl overflow-y-auto border-2 border-coliseum-bronze/50 p-6"
        role="dialog"
        aria-labelledby="admin-create-test-gladiator-title"
      >
        {created ? (
          <>
            <h2
              id="admin-create-test-gladiator-title"
              className="font-display text-xl uppercase tracking-wide text-coliseum-bronze"
            >
              Test Gladiator created
            </h2>
            <p className="mt-3 text-coliseum-sand">
              A test Gladiator ({created.class}, token #{created.tokenId}) was created for{' '}
              <span className="font-semibold text-coliseum-bronze">{user.email}</span>. They can
              name and manage it from Camp.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleDone}
                className="btn-raised px-6 py-2 text-sm uppercase"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2
                id="admin-create-test-gladiator-title"
                className="font-display text-xl uppercase tracking-wide text-coliseum-bronze"
              >
                Create test Gladiator for {user.email}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-coliseum-sand/60 hover:text-coliseum-sand text-sm uppercase"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>

            <div className="mb-6">
              <div className="mb-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-coliseum-bronze/30" />
                <h3 className="text-coliseum-bronze text-sm font-bold uppercase tracking-widest">
                  Choose class
                </h3>
                <div className="h-px flex-1 bg-coliseum-bronze/30" />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 min-[1600px]:grid-cols-5">
                {CLASS_NAMES.map((classId) => {
                  const info = CLASS_DISPLAY[classId]
                  const isSelected = selectedClass === classId
                  return (
                    <button
                      key={classId}
                      type="button"
                      onClick={() => setSelectedClass(classId)}
                      className={`
                        group relative min-w-0 text-left transition-all duration-150 border-2 bg-coliseum-stone p-8
                        ${isSelected
                          ? 'border-coliseum-bronze shadow-lg shadow-coliseum-bronze/20'
                          : 'border-coliseum-bronze/30 hover:border-coliseum-bronze/60'
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute left-0 right-0 top-0 h-1 bg-coliseum-bronze" />
                      )}
                      <div
                        className={`
                          mb-5 flex h-16 w-16 items-center justify-center overflow-hidden border-2
                          transition-colors duration-150
                          ${isSelected
                            ? 'border-coliseum-bronze bg-coliseum-black/50'
                            : 'border-coliseum-bronze/30 bg-coliseum-black/30 group-hover:border-coliseum-bronze/50'
                          }
                        `}
                      >
                        <Image
                          src={CLASS_ICONS[classId]}
                          alt={info.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <h3
                        className={`
                          font-display mb-2 text-2xl uppercase tracking-wide
                          ${isSelected ? 'text-coliseum-bronze' : 'text-coliseum-sand'}
                        `}
                      >
                        {info.name}
                      </h3>
                      <p className="mb-5 text-sm leading-relaxed text-coliseum-sand/70">
                        {info.description}
                      </p>
                      <div className="border-t border-coliseum-bronze/20 pt-4">
                        <ClassStatBars className={classId} />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {info.strengths.map((s) => (
                          <span
                            key={s}
                            className="border border-coliseum-bronze/20 bg-coliseum-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-coliseum-sand/80"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {error && (
              <p className="mb-4 text-sm text-red-400">{error}</p>
            )}

            <div className="flex justify-end gap-2">
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
                className="border-2 border-coliseum-bronze/50 bg-coliseum-bronze/20 px-4 py-2 text-sm font-bold uppercase text-coliseum-bronze disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create test Gladiator'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
