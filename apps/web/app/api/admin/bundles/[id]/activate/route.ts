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

  // Check bundle is published
  const bundle = await prisma.gameDataBundle.findUnique({
    where: { id: params.id },
  })

  if (!bundle || bundle.status !== 'PUBLISHED') {
    return NextResponse.json({
      error: 'Bundle must be PUBLISHED to activate',
    }, { status: 400 })
  }

  // Deactivate all other bundles
  await prisma.gameDataBundle.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  })

  // Activate this bundle
  await prisma.gameDataBundle.update({
    where: { id: params.id },
    data: { isActive: true },
  })

  return NextResponse.json({ success: true })
}
