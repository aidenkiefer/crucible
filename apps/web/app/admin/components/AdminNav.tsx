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
    <nav className="bg-stone-950 border-b-2 border-amber-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin" className="text-amber-500 font-bold text-xl uppercase tracking-wider">
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
                        ? 'bg-amber-700 text-black'
                        : 'text-stone-300 hover:bg-stone-800'
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
            className="text-stone-400 hover:text-stone-200 text-sm font-bold uppercase"
          >
            ← Exit Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}
