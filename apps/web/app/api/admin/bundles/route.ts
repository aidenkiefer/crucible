import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma, type Prisma } from '@gladiator/database'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const bundles = await prisma.gameDataBundle.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          equipmentTemplates: true,
          actionTemplates: true,
        },
      },
    },
  })

  return NextResponse.json({ bundles })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { label } = await req.json()

  if (!label || typeof label !== 'string') {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 })
  }

  // Check if label already exists
  const existing = await prisma.gameDataBundle.findUnique({
    where: { label },
  })

  if (existing) {
    return NextResponse.json({ error: 'Bundle with this label already exists' }, { status: 400 })
  }

  // Find active bundle to clone from
  const activeBundle = await prisma.gameDataBundle.findFirst({
    where: { isActive: true },
    include: {
      equipmentTemplates: {
        include: {
          actions: true,
        },
      },
      actionTemplates: true,
    },
  })

  // Create new bundle
  const newBundle = await prisma.gameDataBundle.create({
    data: {
      label,
      status: 'DRAFT',
      isActive: false,
    },
  })

  // Clone templates if active bundle exists
  if (activeBundle) {
    // Clone action templates first (no dependencies)
    const actionTemplateMap = new Map<string, string>()

    for (const actionTemplate of activeBundle.actionTemplates) {
      const cloned = await prisma.actionTemplate.create({
        data: {
          key: actionTemplate.key,
          name: actionTemplate.name,
          description: actionTemplate.description,
          status: 'DRAFT',
          version: actionTemplate.version,
          category: actionTemplate.category,
          cooldownMs: actionTemplate.cooldownMs,
          castTimeMs: actionTemplate.castTimeMs,
          staminaCost: actionTemplate.staminaCost,
          manaCost: actionTemplate.manaCost,
          hitboxConfig: actionTemplate.hitboxConfig as Prisma.InputJsonValue,
          projectileConfig: actionTemplate.projectileConfig as Prisma.InputJsonValue,
          damageConfig: actionTemplate.damageConfig as Prisma.InputJsonValue,
          effectConfig: actionTemplate.effectConfig as Prisma.InputJsonValue,
          bundleId: newBundle.id,
        },
      })
      actionTemplateMap.set(actionTemplate.id, cloned.id)
    }

    // Clone equipment templates with action references
    for (const equipTemplate of activeBundle.equipmentTemplates) {
      const cloned = await prisma.equipmentTemplate.create({
        data: {
          key: equipTemplate.key,
          name: equipTemplate.name,
          description: equipTemplate.description,
          status: 'DRAFT',
          version: equipTemplate.version,
          type: equipTemplate.type,
          slot: equipTemplate.slot,
          subtype: equipTemplate.subtype,
          tags: equipTemplate.tags,
          baseStatMods: equipTemplate.baseStatMods as Prisma.InputJsonValue,
          scaling: equipTemplate.scaling as Prisma.InputJsonValue,
          rarityRules: equipTemplate.rarityRules as Prisma.InputJsonValue,
          ui: equipTemplate.ui as Prisma.InputJsonValue,
          bundleId: newBundle.id,
          actions: {
            create: equipTemplate.actions.map((ea) => ({
              actionTemplateId: actionTemplateMap.get(ea.actionTemplateId)!,
            })),
          },
        },
      })
    }
  }

  return NextResponse.json({ bundle: newBundle })
}
