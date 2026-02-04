import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const template = await prisma.actionTemplate.findUnique({
    where: { id: params.id },
    include: {
      bundle: true,
    },
  })

  if (!template) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ template })
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const data = await req.json()

  const template = await prisma.actionTemplate.update({
    where: { id: params.id },
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      cooldownMs: data.cooldownMs,
      castTimeMs: data.castTimeMs,
      staminaCost: data.staminaCost,
      manaCost: data.manaCost,
      hitboxConfig: data.hitboxConfig,
      projectileConfig: data.projectileConfig,
      damageConfig: data.damageConfig,
      effectConfig: data.effectConfig,
      status: data.status,
    },
  })

  return NextResponse.json({ template })
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  await prisma.actionTemplate.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
