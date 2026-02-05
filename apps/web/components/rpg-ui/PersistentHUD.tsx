'use client'

import { useActiveGladiator } from '@/contexts/ActiveGladiatorContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function PersistentHUD() {
  const { activeGladiator } = useActiveGladiator()
  const pathname = usePathname()

  // Calculate XP percentage for progress bar
  const xpPercentage = activeGladiator
    ? Math.min(100, (activeGladiator.experience / getXpForNextLevel(activeGladiator.level)) * 100)
    : 0

  // Navigation items
  const navItems = [
    { href: '/', label: 'Home', icon: '⚔️' },
    { href: '/camp', label: 'Camp', icon: '⛺' },
    { href: '/arena', label: 'Arena', icon: '🏛️' },
    { href: '/forge', label: 'Forge', icon: '🔨' },
    { href: '/friends', label: 'Friends', icon: '👥' },
  ]

  return (
    <div className="fixed top-0 left-0 right-0 h-[90px] panel-embossed z-50 flex items-center px-3 sm:px-6 gap-2 sm:gap-6 border-b-4 border-coliseum-bronze/40">
      {/* Left: Active Gladiator Info */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-[200px] sm:min-w-[300px]">
        {activeGladiator ? (
          <>
            {/* Gladiator Portrait Placeholder */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 panel-inset flex items-center justify-center text-2xl sm:text-3xl border-coliseum-bronze/50">
              🗿
            </div>

            {/* Gladiator Stats */}
            <div className="flex-1">
              <div className="flex items-baseline gap-1 sm:gap-2 mb-1 flex-wrap">
                <span className="text-coliseum-sand font-bold text-sm sm:text-lg">
                  <span className="hidden sm:inline">Gladiator </span>#{activeGladiator.tokenId}
                </span>
                <span className="text-coliseum-bronze text-xs sm:text-sm">Lv. {activeGladiator.level}</span>
                <span className="text-coliseum-sand/60 text-[10px] sm:text-xs uppercase hidden sm:inline">{activeGladiator.class}</span>
              </div>

              {/* XP Bar */}
              <div className="relative">
                <div className="stat-bar h-3 sm:h-4">
                  <div
                    className="stat-bar-fill xp"
                    style={{ width: `${xpPercentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] sm:text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      <span className="hidden sm:inline">{activeGladiator.experience} / {getXpForNextLevel(activeGladiator.level)} XP</span>
                      <span className="sm:hidden">{activeGladiator.experience} XP</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-coliseum-sand/60 text-xs sm:text-sm italic">
            No active gladiator
          </div>
        )}
      </div>

      {/* Center: Navigation (hidden on mobile) */}
      <nav className="hidden md:flex flex-1 items-center justify-center gap-2">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                px-4 py-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider
                transition-all duration-150
                ${
                  isActive
                    ? 'btn-pressed bg-coliseum-black/60 text-coliseum-bronze border-2 border-coliseum-bronze/50'
                    : 'btn-raised hover:border-coliseum-bronze'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Mobile Navigation (icon only) */}
      <nav className="flex md:hidden flex-1 items-center justify-center gap-1">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                w-10 h-10 flex items-center justify-center text-lg
                transition-all duration-150
                ${
                  isActive
                    ? 'btn-pressed bg-coliseum-black/60 text-coliseum-bronze border-2 border-coliseum-bronze/50'
                    : 'btn-raised hover:border-coliseum-bronze'
                }
              `}
              title={item.label}
            >
              <span>{item.icon}</span>
            </Link>
          )
        })}
      </nav>

      {/* Right: Gold & Notifications */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-[100px] sm:min-w-[200px] justify-end">
        {/* Gold Display */}
        <div className="flex items-center gap-1 sm:gap-2 panel-inset px-2 sm:px-4 py-1 sm:py-2">
          <span className="text-lg sm:text-2xl">💰</span>
          <span className="text-coliseum-bronze font-bold text-sm sm:text-base">
            {/* TODO: Fetch actual gold from user data */}
            <span className="hidden sm:inline">1,250</span>
            <span className="sm:hidden">1.2k</span>
          </span>
        </div>

        {/* Notifications Bell */}
        <button className="btn-raised w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl relative">
          🔔
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-600 text-white text-[8px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-coliseum-stone">
            3
          </span>
        </button>
      </div>
    </div>
  )
}

// Helper function to calculate XP needed for next level
function getXpForNextLevel(level: number): number {
  // Simple formula: 100 * level^1.5
  return Math.floor(100 * Math.pow(level, 1.5))
}
