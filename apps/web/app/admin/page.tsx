import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  // Fetch stats
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
      _count: {
        select: {
          equipmentTemplates: true,
          actionTemplates: true,
        },
      },
    },
  })

  const recentGladiators = await prisma.gladiator.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: {
        select: { email: true, walletAddress: true },
      },
    },
  })

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-wide text-amber-500 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-stone-400">
          Logged in as <span className="text-stone-200">{session?.user.email}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Users" value={userCount} color="blue" />
        <StatCard label="Gladiators" value={gladiatorCount} color="green" />
        <StatCard label="Matches" value={matchCount} color="purple" />
        <StatCard label="Bundles" value={bundleCount} color="amber" />
        <StatCard label="Equipment Templates" value={templateCount} color="red" />
        <StatCard label="Action Templates" value={actionCount} color="cyan" />
      </div>

      {/* Active Bundle */}
      <div className="mb-8 p-6 bg-stone-800 border-2 border-amber-700 rounded">
        <h2 className="text-2xl font-bold uppercase text-amber-500 mb-4">Active Bundle</h2>
        {activeBundle ? (
          <div>
            <div className="text-xl font-bold text-stone-100 mb-2">{activeBundle.label}</div>
            <div className="text-sm text-stone-400 space-y-1">
              <div>Status: <span className="text-green-400 font-bold">{activeBundle.status}</span></div>
              <div>Equipment Templates: {activeBundle._count.equipmentTemplates}</div>
              <div>Action Templates: {activeBundle._count.actionTemplates}</div>
              <div>Published: {new Date(activeBundle.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div className="text-stone-400">No active bundle. Create and publish one.</div>
        )}
      </div>

      {/* Recent Gladiators */}
      <div>
        <h2 className="text-2xl font-bold uppercase text-amber-500 mb-4">Recent Gladiators</h2>
        <div className="bg-stone-800 border-2 border-stone-700 rounded overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-stone-950 border-b-2 border-stone-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Token ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Class</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Level</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-700">
              {recentGladiators.map((g) => (
                <tr key={g.id} className="hover:bg-stone-750">
                  <td className="px-6 py-4 text-stone-200">{g.tokenId}</td>
                  <td className="px-6 py-4 text-stone-200">{g.class}</td>
                  <td className="px-6 py-4 text-stone-200">{g.level}</td>
                  <td className="px-6 py-4 text-sm text-stone-300">
                    {g.owner.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-400">
                    {new Date(g.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-600 bg-blue-950',
    green: 'border-green-600 bg-green-950',
    purple: 'border-purple-600 bg-purple-950',
    amber: 'border-amber-600 bg-amber-950',
    red: 'border-red-600 bg-red-950',
    cyan: 'border-cyan-600 bg-cyan-950',
  }

  return (
    <div className={`p-6 border-2 rounded ${colorClasses[color]}`}>
      <div className="text-3xl font-bold text-stone-100">{value}</div>
      <div className="text-sm font-bold uppercase text-stone-400 tracking-wide">{label}</div>
    </div>
  )
}
