import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Fetch the announcement
  const announcement = await prisma.announcement.findUnique({
    where: { id: params.id },
  })

  if (!announcement) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
  }

  // Publish the announcement
  const updated = await prisma.announcement.update({
    where: { id: params.id },
    data: {
      isPublished: true,
      publishedAt: new Date(),
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  // Create notification for all users
  try {
    const users = await prisma.user.findMany({
      select: { id: true },
    })

    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          type: 'ANNOUNCEMENT',
          isRead: false,
          data: {
            title: updated.title,
            message: updated.message,
          },
        })),
      })
    }
  } catch (error) {
    console.error('Failed to create notifications for announcement:', error)
    // Don't fail the endpoint if notification creation fails
  }

  return NextResponse.json({ announcement: updated })
}
