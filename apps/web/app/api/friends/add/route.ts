import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { friendUsername } = await req.json()

  const friend = await prisma.user.findUnique({
    where: { username: friendUsername },
  })

  if (!friend) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  if (friend.id === session.user.id) {
    return Response.json({ error: 'Cannot add yourself' }, { status: 400 })
  }

  // Check if already friends
  const existing = await prisma.friend.findUnique({
    where: {
      userId_friendId: {
        userId: session.user.id,
        friendId: friend.id,
      },
    },
  })

  if (existing) {
    return Response.json({ error: 'Already friends' }, { status: 400 })
  }

  // Create friend request
  await prisma.friend.create({
    data: {
      userId: session.user.id,
      friendId: friend.id,
      status: 'pending',
    },
  })

  return Response.json({ success: true })
}
