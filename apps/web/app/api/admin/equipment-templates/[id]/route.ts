import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'
import { validateEquipmentUIMetadata } from '@/lib/admin/validator'
import { logAdminAction } from '@/lib/admin-logging'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const template = await prisma.equipmentTemplate.findUnique({
    where: { id: params.id },
    include: {
      bundle: true,
      actions: {
        include: {
          actionTemplate: true,
        },
      },
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

  // Validate weaponCoeff is only set for WEAPON type
  if (data.weaponCoeff !== undefined && data.type !== 'WEAPON') {
    return NextResponse.json(
      { error: 'weaponCoeff is only valid for WEAPON type' },
      { status: 400 }
    )
  }

  // Delete existing action connections
  await prisma.equipmentTemplateAction.deleteMany({
    where: { equipmentTemplateId: params.id },
  })

  // Update template with new action connections
  const template = await prisma.equipmentTemplate.update({
    where: { id: params.id },
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      slot: data.slot,
      subtype: data.subtype,
      rarity: data.rarity ?? undefined,
      ...(data.allowedClass !== undefined && { allowedClass: data.allowedClass }),
      ...(data.weaponCoeff !== undefined && { weaponCoeff: data.weaponCoeff }),
      tags: data.tags,
      baseStatMods: data.baseStatMods,
      scaling: data.scaling,
      rarityRules: data.rarityRules,
      ui: data.ui,
      status: data.status,
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

  // Validate UI metadata and return warnings (allow save for drafts)
  const uiWarnings = validateEquipmentUIMetadata(template.ui)

  // Log admin action (non-blocking)
  logAdminAction(session.user.id, session.user.email || 'Unknown', 'updated', 'EquipmentTemplate', {
    key: template.key,
    name: template.name,
    type: template.type,
    slot: template.slot,
  }).catch(console.error)

  return NextResponse.json({
    template,
    ...(uiWarnings.length > 0 && { uiWarnings }),
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Fetch template before deletion for logging
  const template = await prisma.equipmentTemplate.findUnique({
    where: { id: params.id },
    select: { key: true, name: true },
  })

  await prisma.equipmentTemplate.delete({
    where: { id: params.id },
  })

  // Log admin action (non-blocking)
  if (template) {
    logAdminAction(session.user.id, session.user.email || 'Unknown', 'deleted', 'EquipmentTemplate', {
      key: template.key,
      name: template.name,
    }).catch(console.error)
  }

  return NextResponse.json({ success: true })
}
