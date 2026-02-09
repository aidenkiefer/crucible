interface ValidationError {
  entityType: 'equipment' | 'action'
  key: string
  field?: string
  message: string
  severity: 'error' | 'warning'
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export async function validateBundle(
  bundleId: string,
  prisma: any
): Promise<ValidationResult> {
  const errors: ValidationError[] = []

  // Fetch all templates in bundle
  const [equipmentTemplates, actionTemplates] = await Promise.all([
    prisma.equipmentTemplate.findMany({
      where: { bundleId },
      include: {
        actions: {
          include: {
            actionTemplate: true,
          },
        },
      },
    }),
    prisma.actionTemplate.findMany({
      where: { bundleId },
    }),
  ])

  // Validate action templates
  const actionKeys = new Set<string>()
  for (const action of actionTemplates) {
    // Unique key check
    if (actionKeys.has(action.key)) {
      errors.push({
        entityType: 'action',
        key: action.key,
        message: 'Duplicate key in bundle',
        severity: 'error',
      })
    }
    actionKeys.add(action.key)

    // Required fields
    if (!action.name || !action.category) {
      errors.push({
        entityType: 'action',
        key: action.key,
        message: 'Missing required fields (name or category)',
        severity: 'error',
      })
    }

    // Validate cooldown/costs
    if (action.cooldownMs < 0) {
      errors.push({
        entityType: 'action',
        key: action.key,
        field: 'cooldownMs',
        message: 'Cooldown cannot be negative',
        severity: 'error',
      })
    }

    if (action.staminaCost < 0 || action.manaCost < 0) {
      errors.push({
        entityType: 'action',
        key: action.key,
        field: 'staminaCost/manaCost',
        message: 'Costs cannot be negative',
        severity: 'error',
      })
    }

    // Validate JSON configs are valid JSON
    try {
      JSON.stringify(action.hitboxConfig)
      JSON.stringify(action.projectileConfig)
      JSON.stringify(action.damageConfig)
      JSON.stringify(action.effectConfig)
    } catch (err) {
      errors.push({
        entityType: 'action',
        key: action.key,
        message: 'Invalid JSON in config fields',
        severity: 'error',
      })
    }
  }

  // Validate equipment templates
  const equipKeys = new Set<string>()
  const actionIdMap = new Map(actionTemplates.map((a: { id: string; key: string }) => [a.id, a.key]))

  for (const equip of equipmentTemplates) {
    // Unique key check
    if (equipKeys.has(equip.key)) {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        message: 'Duplicate key in bundle',
        severity: 'error',
      })
    }
    equipKeys.add(equip.key)

    // Required fields
    if (!equip.name || !equip.type || !equip.slot || !equip.subtype) {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        message: 'Missing required fields (name/type/slot/subtype)',
        severity: 'error',
      })
    }

    // Validate JSON configs
    try {
      JSON.stringify(equip.baseStatMods)
      JSON.stringify(equip.scaling)
      JSON.stringify(equip.rarityRules)
      JSON.stringify(equip.ui)
    } catch (err) {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        message: 'Invalid JSON in config fields',
        severity: 'error',
      })
    }

    // Validate slot/type coherence
    if (equip.type === 'ARMOR' && !['HELMET', 'CHEST', 'GAUNTLETS', 'GREAVES'].includes(equip.slot)) {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        field: 'slot',
        message: 'ARMOR type must use HELMET/CHEST/GAUNTLETS/GREAVES slots',
        severity: 'error',
      })
    }

    if (equip.type === 'WEAPON' && !['MAIN_HAND', 'OFF_HAND'].includes(equip.slot)) {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        field: 'slot',
        message: 'WEAPON type typically uses MAIN_HAND or OFF_HAND',
        severity: 'warning',
      })
    }

    // Validate action references
    if (equip.type === 'WEAPON' && equip.actions.length === 0) {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        field: 'actions',
        message: 'WEAPON should grant at least one action',
        severity: 'warning',
      })
    }

    // Check all action references exist in bundle
    for (const ea of equip.actions) {
      if (!actionIdMap.has(ea.actionTemplateId)) {
        errors.push({
          entityType: 'equipment',
          key: equip.key,
          field: 'actions',
          message: `References action ID ${ea.actionTemplateId} not in bundle`,
          severity: 'error',
        })
      }
    }

    // Validate UI metadata (required for inventory rendering)
    // Block publish if any equipment template lacks required UI metadata
    const ui = equip.ui as any

    if (!ui || typeof ui !== 'object') {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        field: 'ui',
        message: 'Missing ui metadata (required for inventory rendering)',
        severity: 'error',
      })
    } else {
      // displayName is required
      if (!ui.displayName || typeof ui.displayName !== 'string') {
        errors.push({
          entityType: 'equipment',
          key: equip.key,
          field: 'ui.displayName',
          message: 'Missing ui.displayName (required for inventory)',
          severity: 'error',
        })
      }

      // icon is required
      if (!ui.icon || typeof ui.icon !== 'object') {
        errors.push({
          entityType: 'equipment',
          key: equip.key,
          field: 'ui.icon',
          message: 'Missing ui.icon (required for inventory rendering)',
          severity: 'error',
        })
      } else {
        // icon.source must be valid
        if (!ui.icon.source || !['LOCAL_PUBLIC', 'SUPABASE_STORAGE'].includes(ui.icon.source)) {
          errors.push({
            entityType: 'equipment',
            key: equip.key,
            field: 'ui.icon.source',
            message: 'ui.icon.source must be "LOCAL_PUBLIC" or "SUPABASE_STORAGE"',
            severity: 'error',
          })
        }

        // icon.path must be present
        if (!ui.icon.path || typeof ui.icon.path !== 'string') {
          errors.push({
            entityType: 'equipment',
            key: equip.key,
            field: 'ui.icon.path',
            message: 'Missing ui.icon.path (required for icon resolution)',
            severity: 'error',
          })
        } else {
          // Validate path prefix for LOCAL_PUBLIC
          if (ui.icon.source === 'LOCAL_PUBLIC' && !ui.icon.path.startsWith('/assets/')) {
            errors.push({
              entityType: 'equipment',
              key: equip.key,
              field: 'ui.icon.path',
              message: 'ui.icon.path for LOCAL_PUBLIC must start with "/assets/"',
              severity: 'error',
            })
          }
        }
      }
    }
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  }
}

/**
 * Validate UI metadata for a single equipment template (record-level)
 * Returns warnings (not errors) for missing fields
 */
export function validateEquipmentUIMetadata(ui: any): string[] {
  const warnings: string[] = []

  if (!ui || typeof ui !== 'object') {
    warnings.push('Missing ui metadata')
    return warnings
  }

  if (!ui.displayName || typeof ui.displayName !== 'string') {
    warnings.push('Missing ui.displayName')
  }

  if (!ui.icon || typeof ui.icon !== 'object') {
    warnings.push('Missing ui.icon')
  } else {
    if (!ui.icon.source || !['LOCAL_PUBLIC', 'SUPABASE_STORAGE'].includes(ui.icon.source)) {
      warnings.push('Invalid ui.icon.source')
    }

    if (!ui.icon.path || typeof ui.icon.path !== 'string') {
      warnings.push('Missing ui.icon.path')
    } else if (ui.icon.source === 'LOCAL_PUBLIC' && !ui.icon.path.startsWith('/assets/')) {
      warnings.push('ui.icon.path should start with /assets/')
    }
  }

  return warnings
}
