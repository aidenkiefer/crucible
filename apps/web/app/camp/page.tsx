'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { EquipmentInventory } from '@/components/equipment/EquipmentInventory'
import { LootBoxInventory } from '@/components/loot/LootBoxInventory'
import { CraftingWorkshop } from '@/components/equipment/CraftingWorkshop'
import { CharacterSheet } from '@/components/rpg-ui/CharacterSheet'
import { useActiveGladiator } from '@/contexts/ActiveGladiatorContext'

interface Gladiator {
  id: string
  tokenId: number
  class: string
  level: number
  experience: number
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
}

type Tab = 'inventory' | 'crafting'

export default function CampPage() {
  const { data: session, status } = useSession()
  const { activeGladiator, setActiveGladiator } = useActiveGladiator()
  const [gladiators, setGladiators] = useState<Gladiator[]>([])
  const [tab, setTab] = useState<Tab>('inventory')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/gladiators')
        .then((res) => res.json())
        .then((data) => {
          const fetchedGladiators = data.gladiators || []
          setGladiators(fetchedGladiators)

          // Auto-select first gladiator if none active
          if (!activeGladiator && fetchedGladiators.length > 0) {
            setActiveGladiator(fetchedGladiators[0])
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [session?.user?.id, activeGladiator, setActiveGladiator])

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-coliseum-black">
        <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coliseum-bronze mx-auto" />
          <p className="text-coliseum-sand/70 mt-4">Loading camp...</p>
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-coliseum-black pt-[90px]">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
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
      <main className="min-h-screen bg-coliseum-black pt-[90px]">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
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
    <main className="min-h-screen bg-coliseum-black pt-[90px]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Side-by-Side Layout (stacks on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left: Character Sheet */}
          <div className="space-y-6">
            {/* Gladiator Selector */}
            {gladiators.length > 1 && (
              <div className="panel-embossed p-4">
                <label className="block text-coliseum-bronze uppercase text-xs tracking-wider font-bold mb-2">
                  Select Gladiator
                </label>
                <select
                  value={activeGladiator?.id || ''}
                  onChange={(e) => {
                    const selected = gladiators.find((g) => g.id === e.target.value)
                    if (selected) setActiveGladiator(selected)
                  }}
                  className="w-full panel-inset px-3 py-2 text-coliseum-sand font-bold uppercase text-sm border-none"
                >
                  {gladiators.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.class} #{g.tokenId} (Lv. {g.level})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Character Sheet */}
            {activeGladiator && <CharacterSheet gladiator={activeGladiator} />}
          </div>

          {/* Right: Tabbed Content */}
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2">
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
