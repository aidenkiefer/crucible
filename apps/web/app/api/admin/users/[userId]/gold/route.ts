import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

/**
 * PATCH /api/admin/users/[userId]/gold
 * Update a user's gold balance (admin only). For testing.
 * Body: { balance: number } (must be >= 0)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId } = await params
  const body = await req.json()

  if (typeof body.balance !== 'number' || body.balance < 0) {
    return NextResponse.json(
      { error: 'Body must include balance (number >= 0)' },
      { status: 400 }
    )
  }

  const gold = await prisma.userGold.upsert({
    where: { userId },
    create: { userId, balance: body.balance },
    update: { balance: body.balance },
  })

  return NextResponse.json({ gold })
}
