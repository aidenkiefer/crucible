import { prisma } from '@gladiator/database/src/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { challengeId } = await req.json()

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  })

  if (!challenge || challenge.opponentId !== session.user.id) {
    return Response.json({ error: 'Invalid challenge' }, { status: 400 })
  }

  // Create PvP match
  const match = await prisma.match.create({
    data: {
      player1Id: challenge.challengerId,
      player1GladiatorId: challenge.gladiator1Id,
      player2Id: challenge.opponentId,
      player2GladiatorId: challenge.gladiator2Id,
      isCpuMatch: false,
      matchLog: [],
      durationSeconds: 0,
    },
  })

  // Update challenge
  await prisma.challenge.update({
    where: { id: challengeId },
    data: {
      status: 'accepted',
      matchId: match.id,
    },
  })

  return Response.json({ success: true, matchId: match.id })
}
