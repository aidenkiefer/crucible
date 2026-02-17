import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch accepted friends
  const friends = await prisma.friend.findMany({
    where: {
      OR: [
        { userId: session.user.id, status: 'accepted' },
        { friendId: session.user.id, status: 'accepted' },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          gladiators: {
            select: {
              id: true,
              tokenId: true,
              name: true,
              class: true,
              level: true,
            },
          },
        },
      },
      friend: {
        select: {
          id: true,
          username: true,
          email: true,
          gladiators: {
            select: {
              id: true,
              tokenId: true,
              name: true,
              class: true,
              level: true,
            },
          },
        },
      },
    },
  })

  // Fetch pending friend requests (received)
  const pendingRequests = await prisma.friend.findMany({
    where: {
      friendId: session.user.id,
      status: 'pending',
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  })

  // Fetch sent requests (that are still pending)
  const sentRequests = await prisma.friend.findMany({
    where: {
      userId: session.user.id,
      status: 'pending',
    },
    include: {
      friend: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  })

  // Normalize friends list (handle bidirectional relationship)
  const normalizedFriends = friends.map((friendship) => {
    const isSender = friendship.userId === session.user.id
    const friendData = isSender ? friendship.friend : friendship.user

    return {
      friendshipId: `${friendship.userId}-${friendship.friendId}`,
      friend: friendData,
      since: friendship.createdAt,
    }
  })

  return Response.json({
    friends: normalizedFriends,
    pendingRequests: pendingRequests.map((req) => ({
      requestId: `${req.userId}-${req.friendId}`,
      from: req.user,
      createdAt: req.createdAt,
    })),
    sentRequests: sentRequests.map((req) => ({
      requestId: `${req.userId}-${req.friendId}`,
      to: req.friend,
      createdAt: req.createdAt,
    })),
  })
}
