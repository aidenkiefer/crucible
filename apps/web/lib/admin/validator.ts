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
  const actionIdMap = new Map(actionTemplates.map(a => [a.id, a.key]))

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
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  }
}
