'use client'

interface CurrencyDisplayProps {
  type: 'gold' | 'xp' | 'skill' | 'stat' | 'bronze'
  amount: number
  size?: 16 | 20 | 24 | 32
  showLabel?: boolean
  className?: string
}

const CURRENCY_CONFIG = {
  gold: {
    icon: '/assets/ui/icons/gold.png',
    label: 'Gold',
  },
  xp: {
    icon: '/assets/ui/icons/XP.png',
    label: 'XP',
  },
  skill: {
    icon: '/assets/ui/icons/skill-point.png',
    label: 'Skill Points',
  },
  stat: {
    icon: '/assets/ui/icons/bronze.png',
    label: 'Stat Points',
  },
  bronze: {
    icon: '/assets/ui/icons/bronze.png',
    label: 'Bronze',
  },
}

export function CurrencyDisplay({
  type,
  amount,
  size = 24,
  showLabel = false,
  className = '',
}: CurrencyDisplayProps) {
  const config = CURRENCY_CONFIG[type]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={config.icon}
        alt={config.label}
        width={size}
        height={size}
        className="inline-block"
      />
      <span className="text-coliseum-sand font-bold">
        {amount.toLocaleString()}
      </span>
      {showLabel && (
        <span className="text-coliseum-sand/70 text-sm uppercase tracking-wider">
          {config.label}
        </span>
      )}
    </div>
  )
}
