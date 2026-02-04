'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '⚔️' },
  { href: '/admin/bundles', label: 'Bundles', icon: '📦' },
  { href: '/admin/equipment-templates', label: 'Equipment', icon: '🗡️' },
  { href: '/admin/action-templates', label: 'Actions', icon: '⚡' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-coliseum-black border-b-2 border-coliseum-bronze/40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin" className="text-coliseum-bronze font-display text-xl uppercase tracking-wider">
              Crucible Admin
            </Link>
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      px-4 py-2 text-sm font-bold uppercase tracking-wide transition
                      ${isActive
                        ? 'bg-coliseum-bronze text-coliseum-black'
                        : 'text-coliseum-sand/70 hover:bg-coliseum-stone/60 hover:text-coliseum-sand'
                      }
                    `}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <Link
            href="/"
            className="text-coliseum-sand/50 hover:text-coliseum-sand text-sm font-bold uppercase transition-colors"
          >
            ← Exit Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}
