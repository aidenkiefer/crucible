'use client'

import { useEffect, useState } from 'react'
import { calculateSalvageValue } from '@gladiator/shared/src/crafting/crafting-system'

interface Equipment {
  id: string
  name: string
  type: string
  rarity: string
  isStarterGear?: boolean
}

export function CraftingWorkshop() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [goldBalance, setGoldBalance] = useState(0)
  const [selectedForCrafting, setSelectedForCrafting] = useState<string[]>([])
  const [selectedForSalvage, setSelectedForSalvage] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [crafting, setCrafting] = useState(false)
  const [salvaging, setSalvaging] = useState(false)
  const [tab, setTab] = useState<'craft' | 'salvage'>('craft')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [equipRes, goldRes] = await Promise.all([
        fetch('/api/equipment'),
        fetch('/api/gold/balance'),
      ])

      const equipData = await equipRes.json()
      const goldData = await goldRes.json()

      setEquipment(equipData.equipment || [])
      setGoldBalance(goldData.balance || 0)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCraftSelection = (id: string) => {
    setSelectedForCrafting((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id)
      }
      if (prev.length >= 3) {
        return prev // Max 3 items
      }
      return [...prev, id]
    })
  }

  const toggleSalvageSelection = (id: string) => {
    setSelectedForSalvage((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const craftItems = async () => {
    if (selectedForCrafting.length !== 3) return

    try {
      setCrafting(true)
      const res = await fetch('/api/equipment/craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentIds: selectedForCrafting }),
      })

      const data = await res.json()

      if (data.success) {
        alert(`Crafted: ${data.craftedItem.name} (${data.craftedItem.rarity})!`)
        setSelectedForCrafting([])
        await fetchData()
      } else {
        alert(data.error || 'Failed to craft')
      }
    } catch (error) {
      console.error('Failed to craft:', error)
      alert('Failed to craft')
    } finally {
      setCrafting(false)
    }
  }

  const salvageItems = async () => {
    if (selectedForSalvage.length === 0) return

    try {
      setSalvaging(true)
      const res = await fetch('/api/equipment/salvage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentIds: selectedForSalvage }),
      })

      const data = await res.json()

      if (data.success) {
        alert(`Salvaged ${data.itemsSalvaged} items for ${data.goldAwarded} Gold!`)
        setSelectedForSalvage([])
        await fetchData()
      } else {
        alert(data.error || 'Failed to salvage')
      }
    } catch (error) {
      console.error('Failed to salvage:', error)
      alert('Failed to salvage')
    } finally {
      setSalvaging(false)
    }
  }

  const craftableEquipment = equipment.filter((e) => !e.isStarterGear)
  const salvageableEquipment = equipment.filter((e) => !e.isStarterGear)

  const totalSalvageValue = selectedForSalvage.reduce((sum, id) => {
    const item = equipment.find((e) => e.id === id)
    return sum + (item ? calculateSalvageValue(item.rarity as any) : 0)
  }, 0)

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coliseum-bronze mx-auto" />
        <p className="text-coliseum-sand/70 mt-4">Loading workshop...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel p-6 flex justify-between items-center">
        <h2 className="font-display text-3xl text-coliseum-bronze uppercase">
          Crafting Workshop
        </h2>
        <div className="text-right">
          <div className="text-3xl font-bold text-yellow-500">🪙 {goldBalance}</div>
          <div className="text-xs text-coliseum-sand/70 uppercase">Gold</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        <button
          onClick={() => setTab('craft')}
          className={`px-6 py-2 rounded ${
            tab === 'craft'
              ? 'bg-coliseum-bronze text-coliseum-black'
              : 'bg-gray-800 text-coliseum-sand hover:bg-gray-700'
          }`}
        >
          Crafting (3→1)
        </button>
        <button
          onClick={() => setTab('salvage')}
          className={`px-6 py-2 rounded ${
            tab === 'salvage'
              ? 'bg-coliseum-bronze text-coliseum-black'
              : 'bg-gray-800 text-coliseum-sand hover:bg-gray-700'
          }`}
        >
          Salvaging
        </button>
      </div>

      {/* Crafting Tab */}
      {tab === 'craft' && (
        <div className="space-y-4">
          <div className="panel p-6">
            <h3 className="font-display text-xl text-coliseum-sand uppercase mb-4">
              Select 3 Items to Craft ({selectedForCrafting.length}/3)
            </h3>
            <p className="text-sm text-coliseum-sand/70 mb-4">
              Combine 3 non-starter items into 1 higher-quality item. Starting gear (from loot boxes) cannot be used in crafting.
            </p>
            <button
              onClick={craftItems}
              disabled={selectedForCrafting.length !== 3 || crafting}
              className="btn-primary disabled:opacity-50"
            >
              {crafting ? 'Crafting...' : 'Craft Items'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {craftableEquipment.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCraftSelection(item.id)}
                className={`panel p-4 cursor-pointer transition-all ${
                  selectedForCrafting.includes(item.id)
                    ? 'border-coliseum-bronze bg-coliseum-bronze/10'
                    : 'hover:border-coliseum-sand/50'
                }`}
              >
                <h4 className="font-display text-lg text-coliseum-sand uppercase mb-2">
                  {item.name}
                </h4>
                <div className="flex justify-between text-sm">
                  <span className="text-coliseum-sand/70">{item.type}</span>
                  <span className="text-coliseum-bronze">{item.rarity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Salvage Tab */}
      {tab === 'salvage' && (
        <div className="space-y-4">
          <div className="panel p-6">
            <h3 className="font-display text-xl text-coliseum-sand uppercase mb-4">
              Select Items to Salvage ({selectedForSalvage.length} selected)
            </h3>
            <p className="text-sm text-coliseum-sand/70 mb-4">
              Break down non-starter items for Gold. Starting gear (from loot boxes) cannot be salvaged. Total value: 🪙 {totalSalvageValue}
            </p>
            <button
              onClick={salvageItems}
              disabled={selectedForSalvage.length === 0 || salvaging}
              className="btn-primary disabled:opacity-50"
            >
              {salvaging ? 'Salvaging...' : `Salvage for ${totalSalvageValue} Gold`}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salvageableEquipment.map((item) => {
              const salvageValue = calculateSalvageValue(item.rarity as any)
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSalvageSelection(item.id)}
                  className={`panel p-4 cursor-pointer transition-all ${
                    selectedForSalvage.includes(item.id)
                      ? 'border-red-500 bg-red-900/10'
                      : 'hover:border-coliseum-sand/50'
                  }`}
                >
                  <h4 className="font-display text-lg text-coliseum-sand uppercase mb-2">
                    {item.name}
                  </h4>
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-coliseum-sand/70">{item.type}</span>
                      <span className="text-coliseum-bronze ml-2">{item.rarity}</span>
                    </div>
                    <span className="text-yellow-500">🪙 {salvageValue}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
