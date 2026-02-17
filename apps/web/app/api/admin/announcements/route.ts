import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const isPublished = searchParams.get('published')

  const where = isPublished !== null ? { isPublished: isPublished === 'true' } : {}

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ announcements })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const data = await req.json()

  // Validate required fields
  if (!data.title || !data.message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: data.title,
      message: data.message,
      createdById: session.user.id,
      isPublished: false,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return NextResponse.json({ announcement })
}
