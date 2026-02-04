import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'
import { AnimatedTorch } from '@/components/ui/AnimatedTorch'

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="group p-5 bg-coliseum-stone border-2 border-coliseum-bronze/30 hover:border-coliseum-bronze/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-display text-3xl text-coliseum-sand">{value}</span>
      </div>
      <div className="text-xs font-bold uppercase tracking-wider text-coliseum-sand/60">{label}</div>
    </div>
  )
}

function NavLink({ href, label, icon, active = false }: { href: string; label: string; icon: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-3 border-l-2 transition-all
        ${active
          ? 'border-coliseum-bronze bg-coliseum-bronze/10 text-coliseum-sand'
          : 'border-transparent text-coliseum-sand/60 hover:border-coliseum-bronze/50 hover:text-coliseum-sand hover:bg-coliseum-stone/50'
        }
      `}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm uppercase tracking-wider">{label}</span>
    </Link>
  )
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  const [userCount, gladiatorCount, matchCount, bundleCount, templateCount, actionCount] = await Promise.all([
    prisma.user.count(),
    prisma.gladiator.count(),
    prisma.match.count(),
    prisma.gameDataBundle.count(),
    prisma.equipmentTemplate.count(),
    prisma.actionTemplate.count(),
  ])

  const activeBundle = await prisma.gameDataBundle.findFirst({
    where: { isActive: true },
    include: {
      _count: { select: { equipmentTemplates: true, actionTemplates: true } },
    },
  })

  const recentGladiators = await prisma.gladiator.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { owner: { select: { email: true, walletAddress: true } } },
  })

  return (
    <div className="min-h-screen bg-coliseum-black">
      {/* Top bar */}
      <div className="h-1 bg-gradient-to-r from-transparent via-coliseum-bronze to-transparent" />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-coliseum-stone/50 border-r border-coliseum-bronze/20">
          <div className="p-6 border-b border-coliseum-bronze/20">
            <div className="flex items-center gap-3">
              <AnimatedTorch size="sm" />
              <div>
                <h1 className="font-display text-xl text-coliseum-sand uppercase">War Council</h1>
                <p className="text-[10px] uppercase tracking-widest text-coliseum-sand/50">Admin Panel</p>
              </div>
            </div>
          </div>

          <nav className="py-4 space-y-1">
            <NavLink href="/admin" label="Dashboard" icon="📊" active />
            <NavLink href="/admin/bundles" label="Bundles" icon="📦" />
            <NavLink href="/admin/equipment-templates" label="Equipment" icon="⚔️" />
            <NavLink href="/admin/action-templates" label="Actions" icon="💥" />
          </nav>

          <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-coliseum-bronze/20">
            <Link href="/" className="flex items-center gap-2 text-coliseum-sand/50 hover:text-coliseum-sand text-sm transition-colors">
              <span>←</span>
              <span className="uppercase tracking-wider text-xs">Return to Gate</span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-display text-3xl text-coliseum-sand uppercase tracking-wide">Command Center</h2>
              </div>
              <p className="text-coliseum-sand/50 text-sm">
                Logged in as <span className="text-coliseum-sand/80">{session?.user.email}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AnimatedTorch size="sm" />
              <AnimatedTorch size="sm" mirror />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-coliseum-bronze uppercase tracking-widest text-xs font-bold">Overview</h3>
              <div className="h-px flex-1 bg-coliseum-bronze/20" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard label="Users" value={userCount} icon="👤" />
              <StatCard label="Gladiators" value={gladiatorCount} icon="⚔️" />
              <StatCard label="Matches" value={matchCount} icon="🏟️" />
              <StatCard label="Bundles" value={bundleCount} icon="📦" />
              <StatCard label="Equipment" value={templateCount} icon="🛡️" />
              <StatCard label="Actions" value={actionCount} icon="💥" />
            </div>
          </div>

          {/* Active Bundle */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-coliseum-bronze uppercase tracking-widest text-xs font-bold">Active Bundle</h3>
              <div className="h-px flex-1 bg-coliseum-bronze/20" />
            </div>
            <div className="p-6 bg-coliseum-stone border-2 border-coliseum-bronze/40">
              {activeBundle ? (
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">📦</span>
                      <span className="font-display text-2xl text-coliseum-sand uppercase">{activeBundle.label}</span>
                      <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-green-900/50 text-green-400 border border-green-700">
                        {activeBundle.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-sm">
                      <div>
                        <p className="text-coliseum-sand/50 uppercase text-[10px] tracking-wider mb-1">Equipment</p>
                        <p className="text-coliseum-sand font-bold">{activeBundle._count.equipmentTemplates} templates</p>
                      </div>
                      <div>
                        <p className="text-coliseum-sand/50 uppercase text-[10px] tracking-wider mb-1">Actions</p>
                        <p className="text-coliseum-sand font-bold">{activeBundle._count.actionTemplates} templates</p>
                      </div>
                      <div>
                        <p className="text-coliseum-sand/50 uppercase text-[10px] tracking-wider mb-1">Published</p>
                        <p className="text-coliseum-sand font-bold">{new Date(activeBundle.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/admin/bundles/${activeBundle.id}`}
                    className="px-4 py-2 text-xs uppercase tracking-wider bg-coliseum-bronze/20 text-coliseum-bronze border border-coliseum-bronze/50 hover:bg-coliseum-bronze/30 transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-coliseum-sand/50 mb-4">No active bundle deployed</p>
                  <Link
                    href="/admin/bundles"
                    className="inline-block px-6 py-2 text-sm uppercase tracking-wider bg-coliseum-bronze text-coliseum-black font-bold hover:brightness-110 transition-all"
                  >
                    Create Bundle
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Gladiators */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-coliseum-bronze uppercase tracking-widest text-xs font-bold">Recent Gladiators</h3>
              <div className="h-px flex-1 bg-coliseum-bronze/20" />
            </div>
            <div className="bg-coliseum-stone border-2 border-coliseum-bronze/20 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-coliseum-black/50 border-b border-coliseum-bronze/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Token</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Class</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Level</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Owner</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-coliseum-sand/50">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coliseum-bronze/10">
                  {recentGladiators.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-coliseum-sand/40">
                        No gladiators forged yet
                      </td>
                    </tr>
                  ) : (
                    recentGladiators.map((g) => (
                      <tr key={g.id} className="hover:bg-coliseum-black/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-coliseum-bronze">#{g.tokenId}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-coliseum-black/50 text-coliseum-sand border border-coliseum-bronze/20">
                            {g.class}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-coliseum-sand">{g.level}</td>
                        <td className="px-6 py-4 text-sm text-coliseum-sand/70 truncate max-w-[200px]">{g.owner.email}</td>
                        <td className="px-6 py-4 text-sm text-coliseum-sand/50">{new Date(g.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
