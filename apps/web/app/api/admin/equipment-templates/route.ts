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
      key: data.key, // unique identifier for the equipment
      name: data.name, // human-readable name for the equipment
      description: data.description || null, // optional description for the equipment
      status: 'DRAFT', // DRAFT, PUBLISHED, DEPRECATED
      version: 1,
      type: data.type, // WEAPON, ARMOR, CATALYST, TRINKET, AUGMENT, etc.
      slot: data.slot, // Main hand, Off hand, Head, Chest, Arms, Legs, etc.
      subtype: data.subtype, // Sword, Bow, Shield, Chestplate, Helmet, Gauntlets, Greaves, etc.
      tags: data.tags || [], // tags for the equipment
      baseStatMods: data.baseStatMods || {}, // base stat modifiers for the equipment
      scaling: data.scaling || {}, // scaling rules for the equipment
      rarityRules: data.rarityRules || {}, // rarity rules for the equipment
      ui: data.ui || {}, // UI metadata for the equipment
      bundleId: data.bundleId || null, // bundle ID for the equipment
      actions: {
        create: (data.actionTemplateIds || []).map((id: string) => ({
          actionTemplateId: id, // action template ID for the equipment
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
