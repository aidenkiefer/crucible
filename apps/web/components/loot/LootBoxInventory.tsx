'use client'

import { useEffect, useState } from 'react'

interface LootBox {
  id: string
  tier: string
  opened: boolean
  createdAt: string
  rewardedEquipment: {
    id: string
    name: string
    type: string
    rarity: string
  } | null
}

interface OpenedReward {
  name: string
  type: string
  rarity: string
  rolledMods: any
}

export function LootBoxInventory() {
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState<string | null>(null)
  const [rewardModal, setRewardModal] = useState<OpenedReward | null>(null)

  useEffect(() => {
    fetchLootBoxes()
  }, [])

  const fetchLootBoxes = async () => {
    try {
      const res = await fetch('/api/loot-boxes')
      const data = await res.json()
      setLootBoxes(data.lootBoxes || [])
    } catch (error) {
      console.error('Failed to fetch loot boxes:', error)
    } finally {
      setLoading(false)
    }
  }

  const openLootBox = async (lootBoxId: string) => {
    try {
      setOpening(lootBoxId)
      const res = await fetch('/api/loot-boxes/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lootBoxId }),
      })

      const data = await res.json()

      if (data.success) {
        // Show reward modal
        setRewardModal(data.equipment)
        // Refresh loot boxes
        await fetchLootBoxes()
      } else {
        alert(data.error || 'Failed to open loot box')
      }
    } catch (error) {
      console.error('Failed to open loot box:', error)
      alert('Failed to open loot box')
    } finally {
      setOpening(null)
    }
  }

  const unopenedBoxes = lootBoxes.filter(box => !box.opened)
  const openedBoxes = lootBoxes.filter(box => box.opened)

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coliseum-bronze mx-auto" />
        <p className="text-coliseum-sand/70 mt-4">Loading loot boxes...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Unopened Loot Boxes */}
      {unopenedBoxes.length === 0 ? (
        <div className="panel-inset p-8 text-center">
          <p className="text-coliseum-sand/70">
            No loot boxes available. Win CPU matches to earn more!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {unopenedBoxes.map((box) => (
            <div
              key={box.id}
              className="panel-inset p-4 text-center hover:border-coliseum-bronze/60 transition-colors cursor-pointer"
              onClick={() => openLootBox(box.id)}
            >
              <div className="text-5xl mb-2">📦</div>
              <p className="text-[10px] uppercase tracking-wider text-coliseum-sand/80 mb-2 capitalize">
                {box.tier}
              </p>
              <button
                disabled={opening === box.id}
                className="btn-raised w-full text-[10px] px-2 py-1 disabled:opacity-50"
              >
                {opening === box.id ? '...' : 'Open'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Opened Loot Boxes */}
      {openedBoxes.length > 0 && (
        <div className="mt-4">
          <h3 className="text-coliseum-sand/60 uppercase text-xs tracking-wider font-bold mb-2">
            Previously Opened ({openedBoxes.length})
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {openedBoxes.map((box) => (
              <div
                key={box.id}
                className="panel-inset p-2 text-center opacity-40"
              >
                <div className="text-2xl">📭</div>
                {box.rewardedEquipment && (
                  <p className="text-[8px] text-coliseum-bronze mt-1 truncate">
                    {box.rewardedEquipment.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reward Modal */}
      {rewardModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="panel-embossed p-8 max-w-md w-full text-center border-4 border-coliseum-bronze/60 shadow-2xl">
            <div className="text-6xl mb-4 animate-pulse">✨</div>
            <h2 className="font-display text-3xl text-coliseum-bronze uppercase mb-2 text-glow-bronze">
              Item Received!
            </h2>
            <h3 className="text-2xl text-coliseum-sand mb-4">
              {rewardModal.name}
            </h3>
            <div className="text-sm text-coliseum-sand/70 mb-6 panel-inset p-4">
              <p className="mb-2">
                Type: <span className="text-coliseum-sand font-bold">{rewardModal.type}</span>
              </p>
              <p className="mb-2">
                Rarity: <span className="text-coliseum-sand font-bold">{rewardModal.rarity}</span>
              </p>
              {rewardModal.rolledMods?.description && (
                <p className="text-xs italic mt-4 text-coliseum-sand/80">{rewardModal.rolledMods.description}</p>
              )}
            </div>
            <button
              onClick={() => setRewardModal(null)}
              className="btn-raised px-8 py-3"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
