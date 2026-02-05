'use client'

import { useEffect, useState } from 'react'

interface Equipment {
  id: string
  name: string
  type: string
  rarity: string
  rolledMods: any
  equippedBy?: Array<{
    id: string
    slot: string
    gladiator: {
      id: string
      class: string
    }
  }>
}

interface Props {
  gladiatorId?: string // If provided, show equip buttons
}

export function EquipmentInventory({ gladiatorId }: Props) {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [equipping, setEquipping] = useState<string | null>(null)

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      const res = await fetch('/api/equipment')
      const data = await res.json()
      setEquipment(data.equipment || [])
    } catch (error) {
      console.error('Failed to fetch equipment:', error)
    } finally {
      setLoading(false)
    }
  }

  const equipItem = async (equipmentId: string, slot: string) => {
    if (!gladiatorId) return

    try {
      setEquipping(equipmentId)
      const res = await fetch(`/api/gladiators/${gladiatorId}/equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentId, slot }),
      })

      const data = await res.json()

      if (data.success) {
        await fetchEquipment()
      } else {
        alert(data.error || 'Failed to equip')
      }
    } catch (error) {
      console.error('Failed to equip:', error)
      alert('Failed to equip')
    } finally {
      setEquipping(null)
    }
  }

  const unequipItem = async (slot: string) => {
    if (!gladiatorId) return

    try {
      const res = await fetch(
        `/api/gladiators/${gladiatorId}/equip?slot=${slot}`,
        { method: 'DELETE' }
      )

      const data = await res.json()

      if (data.success) {
        await fetchEquipment()
      } else {
        alert(data.error || 'Failed to unequip')
      }
    } catch (error) {
      console.error('Failed to unequip:', error)
      alert('Failed to unequip')
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'text-gray-400'
      case 'Uncommon':
        return 'text-green-400'
      case 'Rare':
        return 'text-blue-400'
      case 'Epic':
        return 'text-purple-400'
      case 'Legendary':
        return 'text-yellow-400'
      default:
        return 'text-coliseum-sand'
    }
  }

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'rarity-common'
      case 'Uncommon':
        return 'rarity-uncommon'
      case 'Rare':
        return 'rarity-rare'
      case 'Epic':
        return 'rarity-epic'
      case 'Legendary':
        return 'rarity-legendary'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coliseum-bronze mx-auto" />
        <p className="text-coliseum-sand/70 mt-4">Loading equipment...</p>
      </div>
    )
  }

  if (equipment.length === 0) {
    return (
      <div className="panel-inset p-8 text-center">
        <p className="text-coliseum-sand/70">
          No equipment yet. Win matches to earn loot boxes!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {equipment.map((item) => {
        const equippedBy = item.equippedBy ?? []
        const isEquipped = equippedBy.length > 0
        const equippedSlot = isEquipped ? equippedBy[0].slot : null
        const slot = item.type === 'WEAPON' ? 'MAIN_HAND' : 'CHEST'

        return (
          <div
            key={item.id}
            className={`panel-inset p-3 ${getRarityBorder(item.rarity)} ${
              isEquipped ? 'border-green-500/80 bg-green-900/20' : ''
            } hover:border-coliseum-bronze/60 transition-colors cursor-pointer`}
          >
            {/* Item Icon Placeholder */}
            <div className="w-full aspect-square panel-inset flex items-center justify-center text-4xl mb-2">
              {item.type === 'WEAPON' ? '⚔️' : '🛡️'}
            </div>

            {/* Item Name and Rarity */}
            <div className="text-center mb-2">
              <h3 className={`font-bold text-sm uppercase ${getRarityColor(item.rarity)}`}>
                {item.name}
              </h3>
              <p className="text-[10px] text-coliseum-sand/60 uppercase tracking-wider">
                {item.type}
              </p>
            </div>

            {/* Stats */}
            {item.rolledMods?.baseStatMods && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1 justify-center">
                  {Object.entries(item.rolledMods.baseStatMods).map(
                    ([stat, value]: [string, any]) => (
                      <span
                        key={stat}
                        className="text-[10px] px-1.5 py-0.5 bg-coliseum-black/50 border border-coliseum-bronze/20 text-coliseum-sand/80 uppercase"
                      >
                        +{value} {stat.substring(0, 3)}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Equip/Unequip */}
            {gladiatorId && (
              <div>
                {isEquipped && equippedSlot ? (
                  <div className="space-y-1">
                    <div className="text-[10px] text-green-400 uppercase text-center">
                      ✓ Equipped
                    </div>
                    <button
                      onClick={() => unequipItem(equippedSlot)}
                      className="btn-raised w-full text-[10px] px-2 py-1"
                    >
                      Unequip
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => equipItem(item.id, slot)}
                    disabled={equipping === item.id}
                    className="btn-raised w-full text-[10px] px-2 py-1 disabled:opacity-50"
                  >
                    {equipping === item.id ? 'Equipping...' : 'Equip'}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
