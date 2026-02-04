import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'
import { validateBundle } from '@/lib/admin/validator'
import { exportBundleToStorage } from '@/lib/admin/exporter'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Step 1: Validate
  const validation = await validateBundle(params.id, prisma)
  if (!validation.valid) {
    return NextResponse.json({
      error: 'Validation failed',
      errors: validation.errors,
    }, { status: 400 })
  }

  // Step 2: Mark all templates in bundle as PUBLISHED
  await prisma.equipmentTemplate.updateMany({
    where: { bundleId: params.id },
    data: { status: 'PUBLISHED' },
  })

  await prisma.actionTemplate.updateMany({
    where: { bundleId: params.id },
    data: { status: 'PUBLISHED' },
  })

  // Step 3: Mark bundle as PUBLISHED
  const bundle = await prisma.gameDataBundle.update({
    where: { id: params.id },
    data: { status: 'PUBLISHED' },
  })

  // Step 4: Export to storage
  const exportPath = await exportBundleToStorage(params.id, prisma)

  // Step 5: Update bundle with export target
  await prisma.gameDataBundle.update({
    where: { id: params.id },
    data: { exportTarget: exportPath },
  })

  return NextResponse.json({ success: true, bundle, exportPath })
}
