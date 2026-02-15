import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

/**
 * GET /api/admin/users
 * List all users with gladiators and gold (admin only). For Manage Users panel.
 */
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      walletAddress: true,
      isAdmin: true,
      createdAt: true,
      gladiators: {
        select: {
          id: true,
          tokenId: true,
          class: true,
          level: true,
          xp: true,
          skillPointsAvailable: true,
          statPointsAvailable: true,
        },
      },
      gold: {
        select: { balance: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const withGold = users.map((u) => {
    const { gold, ...rest } = u
    return { ...rest, goldBalance: gold?.balance ?? 0 }
  })

  return NextResponse.json({ users: withGold })
}
