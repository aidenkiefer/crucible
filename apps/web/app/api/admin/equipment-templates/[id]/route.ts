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

  await prisma.equipmentTemplate.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
