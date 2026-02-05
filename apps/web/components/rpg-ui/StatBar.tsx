'use client'

interface StatBarProps {
  label: string
  value: number
  maxValue: number
  type?: 'hp' | 'xp' | 'stamina' | 'mana'
  showNumbers?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StatBar({
  label,
  value,
  maxValue,
  type = 'hp',
  showNumbers = true,
  size = 'md',
}: StatBarProps) {
  const percentage = Math.min(100, (value / maxValue) * 100)

  const heightClass = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
  }[size]

  const textSizeClass = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  }[size]

  return (
    <div className="flex flex-col gap-1">
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <span className="text-coliseum-sand/80 text-xs uppercase tracking-wider font-bold">
          {label}
        </span>
        {showNumbers && (
          <span className={`text-coliseum-sand font-bold ${textSizeClass}`}>
            {Math.floor(value)} / {Math.floor(maxValue)}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className={`stat-bar ${heightClass}`}>
        <div
          className={`stat-bar-fill ${type}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
