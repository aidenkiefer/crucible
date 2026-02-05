'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GladiatorProgression } from '@/components/gladiators/GladiatorProgression'
import { SkillTree } from '@/components/skills/SkillTree'
import { EquipmentInventory } from '@/components/equipment/EquipmentInventory'

type Tab = 'progression' | 'skills' | 'equipment'

interface GladiatorInfo {
  id: string
  class: string
  unlockedSkills: string[]
  skillPointsAvailable: number
}

export default function CampGladiatorPage() {
  const params = useParams()
  const router = useRouter()
  const gladiatorId = params.id as string
  const [tab, setTab] = useState<Tab>('progression')
  const [gladiator, setGladiator] = useState<GladiatorInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gladiatorId) return
    fetch(`/api/gladiators/${gladiatorId}/progression`)
      .then((res) => res.json())
      .then((data) => {
        if (data.gladiator) {
          setGladiator({
            id: data.gladiator.id,
            class: data.gladiator.class,
            unlockedSkills: data.gladiator.unlockedSkills || [],
            skillPointsAvailable: data.gladiator.skillPointsAvailable ?? 0,
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [gladiatorId])

  if (loading || !gladiator) {
    return (
      <main className="min-h-screen bg-coliseum-black">
        <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coliseum-bronze mx-auto" />
          <p className="text-coliseum-sand/70 mt-4">Loading gladiator...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-coliseum-black">
      <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/camp"
              className="text-coliseum-sand/70 hover:text-coliseum-sand text-sm uppercase tracking-wider"
            >
              ← Camp
            </Link>
            <h1 className="font-display text-2xl text-coliseum-sand uppercase">
              {gladiator.class}
            </h1>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          {(['progression', 'skills', 'equipment'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-6 py-2 rounded font-display uppercase tracking-wider ${
                tab === t
                  ? 'bg-coliseum-bronze text-coliseum-black'
                  : 'bg-coliseum-stone border border-coliseum-bronze/30 text-coliseum-sand hover:border-coliseum-bronze/60'
              }`}
            >
              {t === 'progression' && 'Progression & Stats'}
              {t === 'skills' && 'Skills'}
              {t === 'equipment' && 'Equipment'}
            </button>
          ))}
        </div>

        {tab === 'progression' && (
          <GladiatorProgression gladiatorId={gladiatorId} />
        )}

        {tab === 'skills' && (
          <div className="panel p-6">
            <SkillTree
              gladiatorId={gladiatorId}
              gladiatorClass={gladiator.class}
              unlockedSkills={gladiator.unlockedSkills}
              skillPointsAvailable={gladiator.skillPointsAvailable}
              onSkillUnlocked={() => {
                fetch(`/api/gladiators/${gladiatorId}/progression`)
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.gladiator) {
                      setGladiator((prev) =>
                        prev
                          ? {
                              ...prev,
                              unlockedSkills: data.gladiator.unlockedSkills || [],
                              skillPointsAvailable:
                                data.gladiator.skillPointsAvailable ?? 0,
                            }
                          : null
                      )
                    }
                  })
              }}
            />
          </div>
        )}

        {tab === 'equipment' && (
          <div>
            <EquipmentInventory gladiatorId={gladiatorId} />
          </div>
        )}
      </div>
    </main>
  )
}
