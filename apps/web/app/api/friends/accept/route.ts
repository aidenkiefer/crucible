import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { friendId } = await req.json()

  // Update the friend request to accepted
  await prisma.friend.update({
    where: {
      userId_friendId: {
        userId: friendId,
        friendId: session.user.id,
      },
    },
    data: { status: 'accepted' },
  })

  // Create reciprocal friendship
  await prisma.friend.create({
    data: {
      userId: session.user.id,
      friendId: friendId,
      status: 'accepted',
    },
  })

  return Response.json({ success: true })
}
