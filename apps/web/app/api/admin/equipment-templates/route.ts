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

  const templates = await prisma.equipmentTemplate.findMany({
    where,
    orderBy: { key: 'asc' },
    include: {
      actions: {
        include: {
          actionTemplate: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
        },
      },
    },
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
  if (!data.key || !data.name || !data.type || !data.slot || !data.subtype) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check key uniqueness
  const existing = await prisma.equipmentTemplate.findUnique({
    where: { key: data.key },
  })

  if (existing) {
    return NextResponse.json({ error: 'Key already exists' }, { status: 400 })
  }

  const template = await prisma.equipmentTemplate.create({
    data: {
      key: data.key,
      name: data.name,
      description: data.description || null,
      status: 'DRAFT',
      version: 1,
      type: data.type,
      slot: data.slot,
      subtype: data.subtype,
      tags: data.tags || [],
      baseStatMods: data.baseStatMods || {},
      scaling: data.scaling || {},
      rarityRules: data.rarityRules || {},
      ui: data.ui || {},
      bundleId: data.bundleId || null,
      actions: {
        create: (data.actionTemplateIds || []).map((id: string) => ({
          actionTemplateId: id,
        })),
      },
    },
    include: {
      actions: {
        include: {
          actionTemplate: true,
        },
      },
    },
  })

  return NextResponse.json({ template })
}
