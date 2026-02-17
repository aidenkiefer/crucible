import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { opponentId, gladiatorId, opponentGladiatorId } = await req.json()

  // Verify friendship
  const friendship = await prisma.friend.findFirst({
    where: {
      userId: session.user.id,
      friendId: opponentId,
      status: 'accepted',
    },
  })

  if (!friendship) {
    return Response.json({ error: 'Not friends' }, { status: 400 })
  }

  // Create challenge
  const challenge = await prisma.challenge.create({
    data: {
      challengerId: session.user.id,
      opponentId,
      gladiator1Id: gladiatorId,
      gladiator2Id: opponentGladiatorId,
      status: 'pending',
    },
  })

  // Create notification for opponent (expires in 30 seconds)
  const expiresAt = new Date(Date.now() + 30 * 1000)
  await createNotification({
    userId: opponentId,
    type: 'CHALLENGE',
    data: {
      challengeId: challenge.id,
      fromUserId: session.user.id,
      fromUsername: session.user.name || session.user.email || 'Unknown',
      gladiatorId: challenge.gladiator1Id,
    },
    expiresAt,
  })

  return Response.json({ success: true, challengeId: challenge.id })
}
