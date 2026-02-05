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
      <div className="panel p-8 text-center">
        <p className="text-coliseum-sand/70">
          No equipment yet. Win matches to earn loot boxes!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {equipment.map((item) => {
        const isEquipped = item.equippedBy && item.equippedBy.length > 0
        const equippedSlot = isEquipped ? item.equippedBy[0].slot : null
        const slot = item.type === 'WEAPON' ? 'MAIN_HAND' : 'CHEST'

        return (
          <div
            key={item.id}
            className={`panel p-4 ${
              isEquipped ? 'border-green-500 bg-green-900/10' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-display text-lg text-coliseum-sand uppercase">
                  {item.name}
                </h3>
                <p className="text-xs text-coliseum-sand/70">{item.type}</p>
              </div>
              <span className={`font-bold ${getRarityColor(item.rarity)}`}>
                {item.rarity}
              </span>
            </div>

            {/* Stats */}
            {item.rolledMods?.baseStatMods && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(item.rolledMods.baseStatMods).map(
                    ([stat, value]: [string, any]) => (
                      <span
                        key={stat}
                        className="text-xs px-2 py-1 bg-gray-800 border border-coliseum-sand/20 rounded"
                      >
                        +{value} {stat}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {item.rolledMods?.description && (
              <p className="text-xs text-coliseum-sand/80 italic mb-3">
                {item.rolledMods.description}
              </p>
            )}

            {/* Equip/Unequip */}
            {gladiatorId && (
              <div>
                {isEquipped && equippedSlot ? (
                  <div className="space-y-2">
                    <div className="text-xs text-green-400 uppercase">
                      ✓ Equipped ({equippedSlot})
                    </div>
                    <button
                      onClick={() => unequipItem(equippedSlot)}
                      className="btn-secondary w-full text-sm"
                    >
                      Unequip
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => equipItem(item.id, slot)}
                    disabled={equipping === item.id}
                    className="btn-primary w-full text-sm disabled:opacity-50"
                  >
                    {equipping === item.id ? 'Equipping...' : `Equip (${slot})`}
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
