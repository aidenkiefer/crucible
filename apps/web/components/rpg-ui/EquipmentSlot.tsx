'use client'

interface EquipmentSlotProps {
  slot: 'MAIN_HAND' | 'OFF_HAND' | 'HELMET' | 'CHEST' | 'GAUNTLETS' | 'GREAVES'
  icon?: string
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  isEmpty?: boolean
  onClick?: () => void
}

const slotIcons: Record<string, string> = {
  MAIN_HAND: '⚔️',
  OFF_HAND: '🛡️',
  HELMET: '🪖',
  CHEST: '🦺',
  GAUNTLETS: '🧤',
  GREAVES: '👢',
}

const slotLabels: Record<string, string> = {
  MAIN_HAND: 'Main Hand',
  OFF_HAND: 'Off Hand',
  HELMET: 'Helmet',
  CHEST: 'Chest',
  GAUNTLETS: 'Gauntlets',
  GREAVES: 'Greaves',
}

export function EquipmentSlot({
  slot,
  icon,
  rarity,
  isEmpty = true,
  onClick,
}: EquipmentSlotProps) {
  const displayIcon = icon || slotIcons[slot]
  const rarityClass = rarity ? `rarity-${rarity}` : ''

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className={`
          equipment-slot
          ${!isEmpty ? 'equipped' : ''}
          ${rarityClass}
        `}
        title={slotLabels[slot]}
      >
        <span className={isEmpty ? 'opacity-30' : ''}>{displayIcon}</span>
      </button>
      <span className="text-[10px] text-coliseum-sand/60 uppercase tracking-wider">
        {slotLabels[slot]}
      </span>
    </div>
  )
}
