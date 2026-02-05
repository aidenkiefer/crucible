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
      <div className="mb-8">
        <h2 className="font-display text-2xl text-coliseum-bronze uppercase mb-4">
          Unopened Loot Boxes ({unopenedBoxes.length})
        </h2>

        {unopenedBoxes.length === 0 ? (
          <p className="text-coliseum-sand/70">
            No loot boxes available. Win CPU matches to earn more!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unopenedBoxes.map((box) => (
              <div
                key={box.id}
                className="panel p-6 text-center hover:border-coliseum-bronze transition-colors"
              >
                <div className="text-6xl mb-4">📦</div>
                <h3 className="font-display text-xl uppercase mb-2 capitalize">
                  {box.tier} Loot Box
                </h3>
                <button
                  onClick={() => openLootBox(box.id)}
                  disabled={opening === box.id}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {opening === box.id ? 'Opening...' : 'Open'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opened Loot Boxes */}
      {openedBoxes.length > 0 && (
        <div>
          <h2 className="font-display text-2xl text-coliseum-sand/70 uppercase mb-4">
            Previously Opened ({openedBoxes.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openedBoxes.map((box) => (
              <div
                key={box.id}
                className="panel p-6 text-center opacity-50"
              >
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm text-coliseum-sand/70 capitalize">{box.tier} Box</p>
                {box.rewardedEquipment && (
                  <p className="text-xs text-coliseum-bronze mt-2">
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="panel p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="font-display text-3xl text-coliseum-bronze uppercase mb-2">
              Item Received!
            </h2>
            <h3 className="text-2xl text-coliseum-sand mb-4">
              {rewardModal.name}
            </h3>
            <div className="text-sm text-coliseum-sand/70 mb-6">
              <p className="mb-2">
                Type: <span className="text-coliseum-sand">{rewardModal.type}</span>
              </p>
              <p className="mb-2">
                Rarity: <span className="text-coliseum-sand">{rewardModal.rarity}</span>
              </p>
              {rewardModal.rolledMods?.description && (
                <p className="text-xs italic mt-4">{rewardModal.rolledMods.description}</p>
              )}
            </div>
            <button
              onClick={() => setRewardModal(null)}
              className="btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
