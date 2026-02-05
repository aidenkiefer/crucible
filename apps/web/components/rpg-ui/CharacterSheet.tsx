'use client'

import { StatBar } from './StatBar'
import { EquipmentSlot } from './EquipmentSlot'

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
}

interface CharacterSheetProps {
  gladiator: Gladiator
}

export function CharacterSheet({ gladiator }: CharacterSheetProps) {
  // Derive max HP and stamina from stats (same formulas as combat engine)
  const maxHp = 100 + gladiator.constitution * 10
  const maxStamina = 100 + gladiator.constitution * 5

  // Mock current values (in real implementation, fetch from active match or last known state)
  const currentHp = maxHp
  const currentStamina = maxStamina

  // Mock XP calculation
  const xpForNextLevel = Math.floor(100 * Math.pow(gladiator.level, 1.5))

  return (
    <div className="panel-embossed p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-coliseum-bronze/30 pb-4">
        <div className="flex items-center gap-4">
          {/* Portrait */}
          <div className="w-20 h-20 panel-inset flex items-center justify-center text-4xl border-coliseum-bronze/50">
            🗿
          </div>

          {/* Identity */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-coliseum-sand">
              Gladiator #{gladiator.tokenId}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-coliseum-bronze font-bold">Level {gladiator.level}</span>
              <span className="text-coliseum-sand/60 uppercase text-sm">{gladiator.class}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="space-y-3">
        <h3 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold">
          Resources
        </h3>
        <StatBar
          label="Health"
          value={currentHp}
          maxValue={maxHp}
          type="hp"
          size="md"
        />
        <StatBar
          label="Stamina"
          value={currentStamina}
          maxValue={maxStamina}
          type="stamina"
          size="md"
        />
        <StatBar
          label="Experience"
          value={gladiator.experience}
          maxValue={xpForNextLevel}
          type="xp"
          size="md"
        />
      </div>

      {/* Attributes Section */}
      <div className="space-y-2">
        <h3 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold">
          Attributes
        </h3>
        <div className="grid grid-cols-2 gap-3 panel-inset p-4">
          <AttributeStat label="Constitution" value={gladiator.constitution} />
          <AttributeStat label="Strength" value={gladiator.strength} />
          <AttributeStat label="Dexterity" value={gladiator.dexterity} />
          <AttributeStat label="Speed" value={gladiator.speed} />
          <AttributeStat label="Defense" value={gladiator.defense} />
          <AttributeStat label="Magic Resist" value={gladiator.magicResist} />
          <AttributeStat label="Arcana" value={gladiator.arcana} />
          <AttributeStat label="Faith" value={gladiator.faith} />
        </div>
      </div>

      {/* Equipment Section */}
      <div className="space-y-3">
        <h3 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold">
          Equipment
        </h3>
        <div className="panel-inset p-6">
          {/* Top Row: Main Hand, Helmet, Off Hand */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <EquipmentSlot slot="MAIN_HAND" rarity="rare" isEmpty={false} />
            <EquipmentSlot slot="HELMET" isEmpty={true} />
            <EquipmentSlot slot="OFF_HAND" isEmpty={true} />
          </div>

          {/* Middle Row: Chest (centered) */}
          <div className="flex items-center justify-center mb-8">
            <EquipmentSlot slot="CHEST" isEmpty={true} />
          </div>

          {/* Bottom Row: Gauntlets, Greaves */}
          <div className="flex items-center justify-center gap-8">
            <EquipmentSlot slot="GAUNTLETS" isEmpty={true} />
            <EquipmentSlot slot="GREAVES" isEmpty={true} />
          </div>
        </div>
      </div>
    </div>
  )
}

function AttributeStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-coliseum-sand/70 text-sm uppercase tracking-wider">
        {label}
      </span>
      <span className="text-coliseum-sand font-bold text-lg">
        {value}
      </span>
    </div>
  )
}
