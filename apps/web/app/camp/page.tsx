'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { EquipmentInventory } from '@/components/equipment/EquipmentInventory'
import { LootBoxInventory } from '@/components/loot/LootBoxInventory'
import { CraftingWorkshop } from '@/components/equipment/CraftingWorkshop'
import { CharacterSheet } from '@/components/rpg-ui/CharacterSheet'
import { SkillTree } from '@/components/skills/SkillTree'
import { TestGladiatorSetup, isTestGladiator } from '@/components/camp/TestGladiatorSetup'
import { CreateTestGladiatorModal } from '@/components/camp/CreateTestGladiatorModal'
import { ActiveSkillsGrid } from '@/components/camp/ActiveSkillsGrid'
import { useActiveGladiator } from '@/contexts/ActiveGladiatorContext'

interface Gladiator {
  id: string
  tokenId: number
  name?: string | null
  class: string
  level: number
  experience?: number
  constitution: number
  strength: number
  dexterity: number
  speed: number
  defense: number
  magicResist: number
  arcana: number
  faith: number
  xp?: number
  skillPointsAvailable?: number
  statPointsAvailable?: number
  unlockedSkills?: string[]
}

type Tab = 'inventory' | 'crafting' | 'skills'

export default function CampPage() {
  const { data: session, status } = useSession()
  const { activeGladiator, setActiveGladiator } = useActiveGladiator()
  const [gladiators, setGladiators] = useState<Gladiator[]>([])
  const [tab, setTab] = useState<Tab>('inventory')
  const [loading, setLoading] = useState(true)
  const [createTestOpen, setCreateTestOpen] = useState(false)

  const refetchGladiators = () => {
    if (!session?.user?.id) return
    return fetch('/api/gladiators')
      .then((res) => res.json())
      .then((data) => {
        const fetchedGladiators = data.gladiators || []
        setGladiators(fetchedGladiators)
        // Keep active gladiator in sync with latest data (stats, XP, skill points, etc.)
        if (activeGladiator && fetchedGladiators.length > 0) {
          const updated = fetchedGladiators.find((g: Gladiator) => g.id === activeGladiator.id)
          if (updated) {
            setActiveGladiator({
              ...updated,
              experience: updated.xp ?? updated.experience ?? 0,
            })
          }
        }
        // Auto-select first gladiator if none active
        if (!activeGladiator && fetchedGladiators.length > 0) {
          const first = fetchedGladiators[0]
          setActiveGladiator({
            ...first,
            experience: first.xp ?? first.experience ?? 0,
          })
        }
      })
      .catch(console.error)
  }

  useEffect(() => {
    if (session?.user?.id) {
      refetchGladiators()?.finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [session?.user?.id])

  // Refetch when switching to Skills tab so stats/XP/skill points stay current
  useEffect(() => {
    if (tab === 'skills' && session?.user?.id) refetchGladiators()
  }, [tab])

  if (status === 'loading' || loading) {
    return (
      <main
        className="min-h-screen bg-coliseum-black relative"
        style={{
          backgroundImage: 'url(/assets/backgrounds/camp/camp-background.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-coliseum-black/50" />

        {/* Campfire in center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
          <img
            src="/assets/backgrounds/camp/campfire.gif"
            alt="Campfire"
            className="w-32 h-32 md:w-48 md:h-48"
          />
        </div>

        <div className="relative z-10">
          <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />
          <div className="max-w-4xl mx-auto px-6 py-16 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coliseum-bronze mx-auto" />
            <p className="text-coliseum-sand/70 mt-4">Loading camp...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main
        className="min-h-screen bg-coliseum-black pt-[90px] relative"
        style={{
          backgroundImage: 'url(/assets/backgrounds/camp/camp-background.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-coliseum-black/50" />

        {/* Campfire in center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
          <img
            src="/assets/backgrounds/camp/campfire.gif"
            alt="Campfire"
            className="w-32 h-32 md:w-48 md:h-48"
          />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 text-center">
          <div className="panel-embossed p-8">
            <h1 className="font-display text-2xl text-coliseum-sand uppercase mb-4">
              Camp
            </h1>
            <p className="text-coliseum-sand/70 mb-6">
              Sign in to view your gladiators, inventory, and crafting.
            </p>
            <Link href="/" className="btn-raised inline-block">
              Return to Gate
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (!activeGladiator && gladiators.length === 0) {
    return (
      <main
        className="min-h-screen bg-coliseum-black pt-[90px] relative"
        style={{
          backgroundImage: 'url(/assets/backgrounds/camp/camp-background.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-coliseum-black/50" />

        {/* Campfire in center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
          <img
            src="/assets/backgrounds/camp/campfire.gif"
            alt="Campfire"
            className="w-32 h-32 md:w-48 md:h-48"
          />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 text-center">
          <div className="panel-embossed p-8">
            <h1 className="font-display text-2xl text-coliseum-sand uppercase mb-4">
              No Gladiators
            </h1>
            <p className="text-coliseum-sand/70 mb-6">
              You don&apos;t have any gladiators yet. Mint one to get started.
            </p>
            <Link href="/mint" className="btn-raised inline-block">
              Mint Gladiator
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen bg-coliseum-black pt-[90px] relative"
      style={{
        backgroundImage: 'url(/assets/backgrounds/camp/camp-background.png)',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for content readability */}
      <div className="absolute inset-0 bg-coliseum-black/50" />

      {/* Campfire in center - positioned behind content */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
        <img
          src="/assets/backgrounds/camp/campfire.gif"
          alt="Campfire"
          className="w-32 h-32 md:w-48 md:h-48"
        />
      </div>

      {/* Content wrapper with higher z-index */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Side-by-Side Layout (stacks on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left: Character Sheet */}
          <div className="space-y-6">
            {/* Gladiator Selector + Create test */}
            <div className="panel-embossed p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-coliseum-bronze uppercase text-xs tracking-wider font-bold">
                  Select Gladiator
                </label>
                <button
                  type="button"
                  onClick={() => setCreateTestOpen(true)}
                  className="text-xs uppercase tracking-wider text-coliseum-bronze/90 hover:text-coliseum-bronze border border-coliseum-bronze/40 px-2 py-1 rounded"
                >
                  + Test gladiator
                </button>
              </div>
              {gladiators.length > 0 && (
                <select
                  value={activeGladiator?.id || ''}
                  onChange={(e) => {
                    const selected = gladiators.find((g) => g.id === e.target.value)
                    if (selected) {
                      setActiveGladiator({
                        ...selected,
                        experience: selected.xp ?? selected.experience ?? 0,
                      })
                    }
                  }}
                  className="w-full panel-inset px-3 py-2 text-coliseum-sand font-bold uppercase text-sm border-none"
                >
                  {gladiators.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name?.trim() || `${g.class} #${g.tokenId}`} (Lv. {g.level})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Test gladiator setup: class + generate stats (same as mint flow) */}
            {activeGladiator && isTestGladiator(activeGladiator.tokenId) && (
              <TestGladiatorSetup
                gladiatorId={activeGladiator.id}
                currentClass={activeGladiator.class}
                onSuccess={refetchGladiators}
              />
            )}

            {/* Character Sheet (stats, name, etc.) */}
            {activeGladiator && (
              <CharacterSheet
                gladiator={activeGladiator}
                onNameSet={refetchGladiators}
              />
            )}
          </div>

          <CreateTestGladiatorModal
            open={createTestOpen}
            onClose={() => setCreateTestOpen(false)}
            onCreated={(g) => {
              setActiveGladiator({
                ...g,
                experience: g.xp ?? 0,
              })
              refetchGladiators()
            }}
          />

          {/* Right: Tabbed Content */}
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTab('inventory')}
                className={
                  tab === 'inventory'
                    ? 'btn-pressed px-6 py-3 bg-coliseum-black/60 text-coliseum-bronze border-2 border-coliseum-bronze/50 uppercase tracking-wider font-bold text-sm'
                    : 'btn-raised uppercase tracking-wider font-bold text-sm'
                }
              >
                📦 Inventory
              </button>
              <button
                type="button"
                onClick={() => setTab('skills')}
                className={
                  tab === 'skills'
                    ? 'btn-pressed px-6 py-3 bg-coliseum-black/60 text-coliseum-bronze border-2 border-coliseum-bronze/50 uppercase tracking-wider font-bold text-sm'
                    : 'btn-raised uppercase tracking-wider font-bold text-sm'
                }
              >
                🌳 Skills
              </button>
              <button
                type="button"
                onClick={() => setTab('crafting')}
                className={
                  tab === 'crafting'
                    ? 'btn-pressed px-6 py-3 bg-coliseum-black/60 text-coliseum-bronze border-2 border-coliseum-bronze/50 uppercase tracking-wider font-bold text-sm'
                    : 'btn-raised uppercase tracking-wider font-bold text-sm'
                }
              >
                🔨 Crafting
              </button>
            </div>

            {/* Tab Content */}
            {tab === 'inventory' && (
              <div className="space-y-6">
                <div className="panel-embossed p-6">
                  <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
                    Loot Boxes
                  </h2>
                  <LootBoxInventory />
                </div>
                <div className="panel-embossed p-6">
                  <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
                    Equipment
                  </h2>
                  <EquipmentInventory />
                </div>
                <div className="panel-embossed p-6">
                  <h2 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold mb-4">
                    Active Skills
                  </h2>
                  <p className="text-coliseum-sand/70 text-xs mb-3">
                    Unlocked skills for your active gladiator. Hover for details.
                  </p>
                  <ActiveSkillsGrid
                    unlockedSkills={activeGladiator?.unlockedSkills ?? []}
                  />
                </div>
              </div>
            )}

            {tab === 'skills' && activeGladiator && (
              <div className="panel-embossed p-6">
                <SkillTree
                  gladiatorId={activeGladiator.id}
                  gladiatorClass={activeGladiator.class}
                  unlockedSkills={activeGladiator.unlockedSkills ?? []}
                  skillPointsAvailable={activeGladiator.skillPointsAvailable ?? 0}
                  onSkillUnlocked={() => {
                    fetch('/api/gladiators')
                      .then((res) => res.json())
                      .then((data) => {
                        const list = data.gladiators ?? []
                        const updated = list.find((g: Gladiator) => g.id === activeGladiator.id)
                        if (updated) {
                          setActiveGladiator({
                            ...updated,
                            experience: updated.xp ?? updated.experience ?? 0,
                          })
                        }
                      })
                  }}
                />
              </div>
            )}

            {tab === 'crafting' && (
              <div className="panel-embossed p-6">
                <CraftingWorkshop />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
