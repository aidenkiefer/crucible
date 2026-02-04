import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations
)

interface ExportManifest {
  bundleLabel: string
  publishedAt: string
  equipmentCount: number
  actionCount: number
  files: string[]
}

export async function exportBundleToStorage(
  bundleId: string,
  prisma: any
): Promise<string> {
  // Fetch bundle
  const bundle = await prisma.gameDataBundle.findUnique({
    where: { id: bundleId },
    include: {
      equipmentTemplates: {
        include: {
          actions: {
            include: {
              actionTemplate: {
                select: { key: true },
              },
            },
          },
        },
      },
      actionTemplates: true,
    },
  })

  if (!bundle) {
    throw new Error('Bundle not found')
  }

  const basePath = `bundles/${bundle.label}`

  // Transform equipment templates for export
  const equipmentData = bundle.equipmentTemplates.map((et: any) => ({
    key: et.key,
    name: et.name,
    description: et.description,
    type: et.type,
    slot: et.slot,
    subtype: et.subtype,
    tags: et.tags,
    baseStatMods: et.baseStatMods,
    scaling: et.scaling,
    rarityRules: et.rarityRules,
    ui: et.ui,
    grantedActions: et.actions.map((a: any) => a.actionTemplate.key),
  }))

  // Transform action templates for export
  const actionData = bundle.actionTemplates.map((at: any) => ({
    key: at.key,
    name: at.name,
    description: at.description,
    category: at.category,
    cooldownMs: at.cooldownMs,
    castTimeMs: at.castTimeMs,
    staminaCost: at.staminaCost,
    manaCost: at.manaCost,
    hitboxConfig: at.hitboxConfig,
    projectileConfig: at.projectileConfig,
    damageConfig: at.damageConfig,
    effectConfig: at.effectConfig,
  }))

  // Sort by key for determinism
  equipmentData.sort((a: any, b: any) => a.key.localeCompare(b.key))
  actionData.sort((a: any, b: any) => a.key.localeCompare(b.key))

  // Create manifest
  const manifest: ExportManifest = {
    bundleLabel: bundle.label,
    publishedAt: new Date().toISOString(),
    equipmentCount: equipmentData.length,
    actionCount: actionData.length,
    files: [
      `${basePath}/equipment.templates.json`,
      `${basePath}/actions.templates.json`,
      `${basePath}/manifest.json`,
    ],
  }

  // Upload files
  await Promise.all([
    supabase.storage
      .from('gamedata')
      .upload(`${basePath}/equipment.templates.json`, JSON.stringify(equipmentData, null, 2), {
        contentType: 'application/json',
        upsert: true,
      }),
    supabase.storage
      .from('gamedata')
      .upload(`${basePath}/actions.templates.json`, JSON.stringify(actionData, null, 2), {
        contentType: 'application/json',
        upsert: true,
      }),
    supabase.storage
      .from('gamedata')
      .upload(`${basePath}/manifest.json`, JSON.stringify(manifest, null, 2), {
        contentType: 'application/json',
        upsert: true,
      }),
  ])

  return basePath
}
