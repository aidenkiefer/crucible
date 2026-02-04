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
  const bundleId = searchParams.get('bundleId')

  const where = bundleId ? { bundleId } : {}

  const templates = await prisma.actionTemplate.findMany({
    where,
    orderBy: { key: 'asc' },
  })

  return NextResponse.json({ templates })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const data = await req.json()

  // Validate required fields
  if (!data.key || !data.name || !data.category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check key uniqueness
  const existing = await prisma.actionTemplate.findUnique({
    where: { key: data.key },
  })

  if (existing) {
    return NextResponse.json({ error: 'Key already exists' }, { status: 400 })
  }

  const template = await prisma.actionTemplate.create({
    data: {
      key: data.key,
      name: data.name,
      description: data.description || null,
      status: 'DRAFT',
      version: 1,
      category: data.category,
      cooldownMs: data.cooldownMs || 0,
      castTimeMs: data.castTimeMs || 0,
      staminaCost: data.staminaCost || 0,
      manaCost: data.manaCost || 0,
      hitboxConfig: data.hitboxConfig || {},
      projectileConfig: data.projectileConfig || {},
      damageConfig: data.damageConfig || {},
      effectConfig: data.effectConfig || {},
      bundleId: data.bundleId || null,
    },
  })

  return NextResponse.json({ template })
}
