'use client'

import { useState } from 'react'
import { StatBar } from './StatBar'
import { EquipmentSlot } from './EquipmentSlot'
import { StatAllocationModal } from '../camp/StatAllocationModal'

interface Gladiator {
  id: string
  tokenId: number
  name?: string | null
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
  skillPointsAvailable?: number
  statPointsAvailable?: number
}

interface CharacterSheetProps {
  gladiator: Gladiator
  onNameSet?: () => void
}

export function CharacterSheet({ gladiator, onNameSet }: CharacterSheetProps) {
  const [statModalOpen, setStatModalOpen] = useState(false)

  // Use base stats with fallbacks (e.g. from API or context)
  const con = gladiator.constitution ?? 0
  const xp = gladiator.experience ?? (gladiator as { xp?: number }).xp ?? 0

  // Derive max HP and stamina from stats (same formulas as combat engine)
  const maxHp = 100 + con * 10
  const maxStamina = 100 + con * 5

  // In camp, show full bars (no active match); in-match would use current values
  const currentHp = maxHp
  const currentStamina = maxStamina

  // XP to next level (same curve as progression)
  const xpForNextLevel = Math.floor(100 * Math.pow(gladiator.level, 1.5))

  const displayName = gladiator.name?.trim() || null
  const canName = !displayName

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
              {displayName ?? `Gladiator #${gladiator.tokenId}`}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-coliseum-bronze font-bold">Level {gladiator.level}</span>
              <span className="text-coliseum-sand/60 uppercase text-sm">{gladiator.class}</span>
            </div>
            {canName && (
              <NameGladiatorForm
                gladiatorId={gladiator.id}
                onSuccess={onNameSet}
              />
            )}
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

        {/* Experience with icon */}
        <div className="flex items-center gap-2">
          <img
            src="/assets/ui/icons/XP.png"
            alt="XP"
            className="w-5 h-5"
          />
          <div className="flex-1">
            <StatBar
              label="Experience"
              value={xp}
              maxValue={xpForNextLevel}
              type="xp"
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Skill & Stat Points */}
      <div className="grid grid-cols-2 gap-3">
        {/* Skill Points */}
        <div className="panel-inset p-3 flex items-center gap-2">
          <img
            src="/assets/ui/icons/skill-point.png"
            alt="Skill Points"
            className="w-6 h-6"
          />
          <div className="flex-1">
            <p className="text-coliseum-sand/70 text-xs uppercase tracking-wider">
              Skill Points
            </p>
            <p className="text-coliseum-sand font-bold text-lg">
              {gladiator.skillPointsAvailable || 0}
            </p>
          </div>
        </div>

        {/* Stat Points */}
        <div
          className={`panel-inset p-3 flex items-center gap-2 ${
            (gladiator.statPointsAvailable || 0) > 0
              ? 'cursor-pointer hover:bg-coliseum-bronze/10 transition-colors'
              : ''
          }`}
          onClick={() => {
            if ((gladiator.statPointsAvailable || 0) > 0) {
              setStatModalOpen(true)
            }
          }}
        >
          <img
            src="/assets/ui/icons/bronze.png"
            alt="Stat Points"
            className="w-6 h-6"
          />
          <div className="flex-1">
            <p className="text-coliseum-sand/70 text-xs uppercase tracking-wider">
              Stat Points
            </p>
            <p className="text-coliseum-sand font-bold text-lg">
              {gladiator.statPointsAvailable || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Attributes Section */}
      <div className="space-y-2">
        <h3 className="text-coliseum-bronze uppercase tracking-wider text-sm font-bold">
          Attributes
        </h3>
        <div className="grid grid-cols-2 gap-3 panel-inset p-4">
          <AttributeStat label="Constitution" value={gladiator.constitution ?? 0} />
          <AttributeStat label="Strength" value={gladiator.strength ?? 0} />
          <AttributeStat label="Dexterity" value={gladiator.dexterity ?? 0} />
          <AttributeStat label="Speed" value={gladiator.speed ?? 0} />
          <AttributeStat label="Defense" value={gladiator.defense ?? 0} />
          <AttributeStat label="Magic Resist" value={gladiator.magicResist ?? 0} />
          <AttributeStat label="Arcana" value={gladiator.arcana ?? 0} />
          <AttributeStat label="Faith" value={gladiator.faith ?? 0} />
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

      {/* Stat Allocation Modal */}
      <StatAllocationModal
        open={statModalOpen}
        onClose={() => setStatModalOpen(false)}
        gladiator={gladiator}
        onSuccess={onNameSet}
      />
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

const MAX_NAME_LENGTH = 32

function NameGladiatorForm({
  gladiatorId,
  onSuccess,
}: {
  gladiatorId: string
  onSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed || !understood) return
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/gladiators/${gladiatorId}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to set name')
        return
      }
      setOpen(false)
      setName('')
      setUnderstood(false)
      onSuccess?.()
    } catch {
      setError('Failed to set name')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-sm text-coliseum-bronze hover:text-coliseum-bronze/80 underline uppercase tracking-wider"
      >
        Name your Gladiator
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div
            className="panel-embossed p-6 max-w-md w-full space-y-4 border-2 border-coliseum-bronze/50"
            role="dialog"
            aria-labelledby="name-gladiator-title"
          >
            <h3 id="name-gladiator-title" className="text-lg font-bold text-coliseum-bronze uppercase">
              Name your Gladiator
            </h3>
            <p className="text-sm text-amber-400/90 font-medium">
              This name assignment cannot be undone or changed. Choose carefully.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="gladiator-name" className="block text-xs text-coliseum-sand/70 uppercase tracking-wider mb-1">
                  Display name
                </label>
                <input
                  id="gladiator-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                  maxLength={MAX_NAME_LENGTH}
                  placeholder="Enter name"
                  className="w-full panel-inset px-3 py-2 text-coliseum-sand bg-coliseum-black/50 border border-coliseum-sand/20 rounded"
                  disabled={submitting}
                  autoFocus
                />
                <p className="mt-1 text-xs text-coliseum-sand/50">
                  {name.length} / {MAX_NAME_LENGTH}
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  disabled={submitting}
                  className="rounded border-coliseum-bronze/50"
                />
                <span className="text-sm text-coliseum-sand/90">
                  I understand that this name cannot be changed later.
                </span>
              </label>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setError(null); setName(''); setUnderstood(false); }}
                  className="btn-raised px-4 py-2 text-sm uppercase"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !understood || submitting}
                  className="px-4 py-2 text-sm uppercase bg-coliseum-bronze/20 text-coliseum-bronze border-2 border-coliseum-bronze/50 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving…' : 'Confirm name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
