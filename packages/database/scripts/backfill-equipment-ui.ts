/**
 * Backfill Equipment Template UI Metadata
 *
 * This script updates existing EquipmentTemplate rows with ui metadata:
 * - displayName: from template.name
 * - icon.source: LOCAL_PUBLIC
 * - icon.path: deterministic path based on rarity and key
 *
 * Usage:
 *   pnpm --filter @gladiator/database backfill-ui
 *
 * Related:
 * - docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md
 * - docs/plans/tickets/05-equipment-ui-backfill-ui-metadata.md
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const RARITY_TO_FOLDER: Record<string, string> = {
  COMMON: 'commons',
  UNCOMMON: 'uncommons',
  RARE: 'rares',
  EPIC: 'epics',
  LEGENDARY: 'legendaries',
}

async function backfillEquipmentUI() {
  console.log('🔍 Fetching equipment templates...')

  const templates = await prisma.equipmentTemplate.findMany({
    select: {
      id: true,
      key: true,
      name: true,
      rarity: true,
      ui: true,
    },
  })

  console.log(`📦 Found ${templates.length} templates`)

  let updated = 0
  let skipped = 0

  for (const template of templates) {
    const currentUi = template.ui as Record<string, any>

    // Skip if ui metadata is already complete
    if (
      currentUi?.displayName &&
      currentUi?.icon?.source &&
      currentUi?.icon?.path
    ) {
      console.log(`  ⏭️  Skipping ${template.key} (ui already complete)`)
      skipped++
      continue
    }

    // Determine icon path
    const rarityFolder = RARITY_TO_FOLDER[template.rarity || 'COMMON'] || 'commons'
    const iconPath = `/assets/items/${rarityFolder}/${template.key}/icon.png`

    // Construct ui metadata
    const newUi = {
      ...currentUi,
      displayName: currentUi?.displayName || template.name,
      icon: {
        source: 'LOCAL_PUBLIC',
        path: currentUi?.icon?.path || iconPath,
        ...(currentUi?.icon || {}),
      },
    }

    // Update template
    await prisma.equipmentTemplate.update({
      where: { id: template.id },
      data: { ui: newUi },
    })

    console.log(`  ✅ Updated ${template.key}`)
    console.log(`     displayName: ${newUi.displayName}`)
    console.log(`     icon.path: ${newUi.icon.path}`)
    updated++
  }

  console.log('\n✨ Backfill complete!')
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
}

backfillEquipmentUI()
  .catch((error) => {
    console.error('❌ Backfill failed:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
