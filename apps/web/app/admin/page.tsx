import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@gladiator/database/src/client'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch stats
  const [userCount, gladiatorCount, matchCount] = await Promise.all([
    prisma.user.count(),
    prisma.gladiator.count(),
    prisma.match.count(),
  ])

  const recentGladiators = await prisma.gladiator.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: {
        select: { email: true, walletAddress: true },
      },
    },
  })

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-6 bg-blue-100 rounded-lg">
          <div className="text-3xl font-bold">{userCount}</div>
          <div className="text-gray-600">Total Users</div>
        </div>
        <div className="p-6 bg-green-100 rounded-lg">
          <div className="text-3xl font-bold">{gladiatorCount}</div>
          <div className="text-gray-600">Total Gladiators</div>
        </div>
        <div className="p-6 bg-purple-100 rounded-lg">
          <div className="text-3xl font-bold">{matchCount}</div>
          <div className="text-gray-600">Total Matches</div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Gladiators</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Token ID</th>
                <th className="px-6 py-3 text-left">Class</th>
                <th className="px-6 py-3 text-left">Level</th>
                <th className="px-6 py-3 text-left">Owner</th>
                <th className="px-6 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentGladiators.map((g) => (
                <tr key={g.id}>
                  <td className="px-6 py-4">{g.tokenId}</td>
                  <td className="px-6 py-4">{g.class}</td>
                  <td className="px-6 py-4">{g.level}</td>
                  <td className="px-6 py-4 text-sm">
                    {g.owner.email}
                    <br />
                    <span className="text-gray-500 text-xs">
                      {g.owner.walletAddress?.slice(0, 10)}...
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
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
