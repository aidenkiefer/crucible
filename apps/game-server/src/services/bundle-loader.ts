import { createClient } from '@supabase/supabase-js'
import { prisma } from '@gladiator/database/src/client'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface EquipmentTemplate {
  key: string
  name: string
  description: string | null
  type: string
  slot: string
  subtype: string
  tags: string[]
  baseStatMods: Record<string, any>
  scaling: Record<string, any>
  rarityRules: Record<string, any>
  ui: Record<string, any>
  grantedActions: string[]
}

interface ActionTemplate {
  key: string
  name: string
  description: string | null
  category: string
  cooldownMs: number
  castTimeMs: number
  staminaCost: number
  manaCost: number
  hitboxConfig: Record<string, any>
  projectileConfig: Record<string, any>
  damageConfig: Record<string, any>
  effectConfig: Record<string, any>
}

class BundleLoader {
  private equipmentTemplates: Map<string, EquipmentTemplate> = new Map()
  private actionTemplates: Map<string, ActionTemplate> = new Map()
  private loaded: boolean = false

  async load() {
    console.log('[BundleLoader] Loading active game data bundle...')

    // Fetch active bundle from DB
    const activeBundle = await prisma.gameDataBundle.findFirst({
      where: { isActive: true },
    })

    if (!activeBundle) {
      throw new Error('No active game data bundle found')
    }

    if (!activeBundle.exportTarget) {
      throw new Error('Active bundle has no export target')
    }

    console.log(`[BundleLoader] Active bundle: ${activeBundle.label}`)

    const basePath = activeBundle.exportTarget

    // Download JSON files from Supabase Storage
    const [equipmentRes, actionsRes] = await Promise.all([
      supabase.storage.from('gamedata').download(`${basePath}/equipment.templates.json`),
      supabase.storage.from('gamedata').download(`${basePath}/actions.templates.json`),
    ])

    if (equipmentRes.error) {
      throw new Error(`Failed to load equipment templates: ${equipmentRes.error.message}`)
    }

    if (actionsRes.error) {
      throw new Error(`Failed to load action templates: ${actionsRes.error.message}`)
    }

    // Parse JSON
    const equipmentData: EquipmentTemplate[] = JSON.parse(await equipmentRes.data.text())
    const actionData: ActionTemplate[] = JSON.parse(await actionsRes.data.text())

    // Cache in memory
    this.equipmentTemplates.clear()
    this.actionTemplates.clear()

    for (const equip of equipmentData) {
      this.equipmentTemplates.set(equip.key, equip)
    }

    for (const action of actionData) {
      this.actionTemplates.set(action.key, action)
    }

    this.loaded = true

    console.log(`[BundleLoader] Loaded ${this.equipmentTemplates.size} equipment templates`)
    console.log(`[BundleLoader] Loaded ${this.actionTemplates.size} action templates`)
  }

  getEquipmentTemplate(key: string): EquipmentTemplate | undefined {
    if (!this.loaded) {
      throw new Error('BundleLoader not initialized. Call load() first.')
    }
    return this.equipmentTemplates.get(key)
  }

  getActionTemplate(key: string): ActionTemplate | undefined {
    if (!this.loaded) {
      throw new Error('BundleLoader not initialized. Call load() first.')
    }
    return this.actionTemplates.get(key)
  }

  getAllEquipmentTemplates(): EquipmentTemplate[] {
    if (!this.loaded) {
      throw new Error('BundleLoader not initialized. Call load() first.')
    }
    return Array.from(this.equipmentTemplates.values())
  }

  getAllActionTemplates(): ActionTemplate[] {
    if (!this.loaded) {
      throw new Error('BundleLoader not initialized. Call load() first.')
    }
    return Array.from(this.actionTemplates.values())
  }
}

export const bundleLoader = new BundleLoader()
