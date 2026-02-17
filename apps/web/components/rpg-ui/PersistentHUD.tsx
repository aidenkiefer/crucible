'use client'

import { useState, useEffect } from 'react'
import { useActiveGladiator } from '@/contexts/ActiveGladiatorContext'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatGold } from '@/lib/utils/format'

interface GladiatorOption {
  id: string
  tokenId: number
  name?: string | null
  class: string
  level: number
  xp?: number
  experience?: number
  constitution: number
  strength: number
  dexterity: number
  speed: number
  defense: number
  magicResist: number
  arcana: number
  faith: number
  skillPointsAvailable?: number
  unlockedSkills?: string[]
}

function displayName(g: GladiatorOption): string {
  return g.name?.trim() || `Gladiator #${g.tokenId}`
}

export function PersistentHUD() {
  const { data: session } = useSession()
  const { activeGladiator, setActiveGladiator } = useActiveGladiator()
  const [gladiators, setGladiators] = useState<GladiatorOption[]>([])
  const [gold, setGold] = useState<number | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/gladiators')
        .then((res) => res.json())
        .then((data) => setGladiators(data.gladiators ?? []))
        .catch(() => setGladiators([]))
    } else {
      setGladiators([])
    }
  }, [session?.user?.id])

  // Fetch user gold
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/gold/balance')
        .then((res) => res.json())
        .then((data) => setGold(data.balance ?? 0))
        .catch(() => setGold(0))
    } else {
      setGold(null)
    }
  }, [session?.user?.id])

  // Poll unread count every 5 seconds
  useEffect(() => {
    const poll = async () => {
      if (!session?.user?.id) return
      try {
        const res = await fetch('/api/notifications/unread-count')
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.count || 0)
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [session?.user?.id])

  const xpPercentage = activeGladiator
    ? Math.min(100, (activeGladiator.experience / getXpForNextLevel(activeGladiator.level)) * 100)
    : 0

  const hasMultiple = gladiators.length > 1

  const navItems = [
    { href: '/', label: 'Home', icon: '⚔️' },
    { href: '/camp', label: 'Camp', icon: '⛺' },
    { href: '/arena', label: 'Arena', icon: '🏛️' },
    { href: '/mint', label: 'Forge', icon: '🔨' },
    { href: '/friends', label: 'Friends', icon: '👥' },
  ]

  return (
    <div className="fixed top-0 left-0 right-0 h-[90px] panel-embossed z-50 flex items-center px-3 sm:px-6 gap-2 sm:gap-6 border-b-4 border-coliseum-bronze/40">
      {/* Left: Nickname + Legion dropdown (or single gladiator display) */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-[200px] sm:min-w-[300px]">
        {activeGladiator ? (
          <>
            <div className="w-12 h-12 sm:w-16 sm:h-16 panel-inset flex items-center justify-center text-2xl sm:text-3xl border-coliseum-bronze/50 shrink-0">
              🗿
            </div>

            <div className="flex-1 min-w-0">
              {hasMultiple ? (
                <select
                  value={activeGladiator.id}
                  onChange={(e) => {
                    const g = gladiators.find((x) => x.id === e.target.value)
                    if (g) {
                      setActiveGladiator({
                        ...g,
                        experience: g.xp ?? g.experience ?? 0,
                      })
                    }
                  }}
                  className="w-full panel-inset px-2 py-1 sm:px-3 sm:py-2 text-coliseum-sand font-bold text-sm sm:text-lg border border-coliseum-bronze/30 bg-coliseum-black/50 truncate"
                  title="Your Legion"
                >
                  {gladiators.map((g) => (
                    <option key={g.id} value={g.id}>
                      {displayName(g)} (Lv.{g.level})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-baseline gap-1 sm:gap-2 mb-1 flex-wrap">
                  <span className="text-coliseum-sand font-bold text-sm sm:text-lg">
                    {displayName(activeGladiator)}
                  </span>
                  <span className="text-coliseum-bronze text-xs sm:text-sm">Lv. {activeGladiator.level}</span>
                  <span className="text-coliseum-sand/60 text-[10px] sm:text-xs uppercase hidden sm:inline">{activeGladiator.class}</span>
                </div>
              )}

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
            {gold !== null ? formatGold(gold) : '---'}
          </span>
        </div>

        {/* Notifications Bell */}
        <button className="btn-raised w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl relative">
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-600 text-white text-[8px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-coliseum-stone">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
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
