import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Fetch pending challenges (received by user)
  const receivedChallenges = await prisma.challenge.findMany({
    where: {
      opponentId: session.user.id,
      status: 'pending',
      expiresAt: {
        gt: now, // Only show non-expired challenges
      },
    },
    include: {
      challenger: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      gladiator1: {
        select: {
          id: true,
          tokenId: true,
          name: true,
          class: true,
          level: true,
        },
      },
      gladiator2: {
        select: {
          id: true,
          tokenId: true,
          name: true,
          class: true,
          level: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Fetch sent challenges (created by user)
  const sentChallenges = await prisma.challenge.findMany({
    where: {
      challengerId: session.user.id,
      status: 'pending',
      expiresAt: {
        gt: now,
      },
    },
    include: {
      opponent: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      gladiator1: {
        select: {
          id: true,
          tokenId: true,
          name: true,
          class: true,
          level: true,
        },
      },
      gladiator2: {
        select: {
          id: true,
          tokenId: true,
          name: true,
          class: true,
          level: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Fetch completed/accepted challenges involving user
  const completedChallenges = await prisma.challenge.findMany({
    where: {
      OR: [
        { challengerId: session.user.id },
        { opponentId: session.user.id },
      ],
      status: {
        in: ['accepted', 'completed', 'expired'],
      },
    },
    include: {
      challenger: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      opponent: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      gladiator1: {
        select: {
          id: true,
          tokenId: true,
          name: true,
          class: true,
          level: true,
        },
      },
      gladiator2: {
        select: {
          id: true,
          tokenId: true,
          name: true,
          class: true,
          level: true,
        },
      },
      match: {
        select: {
          id: true,
          winnerId: true,
          completedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10, // Limit to recent completed challenges
  })

  return Response.json({
    received: receivedChallenges,
    sent: sentChallenges,
    completed: completedChallenges,
  })
}
