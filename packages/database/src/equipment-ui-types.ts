/**
 * Equipment Template UI Metadata Types
 *
 * These types define the shape of the `ui` JSON field on EquipmentTemplate.
 * UI metadata is stored in the database and included in published bundles for runtime consumption.
 *
 * Related docs:
 * - docs/plans/specs/equipment-ui-metadata-db-bundles-spec.md
 * - docs/data-glossary.md §4.5 (Equipment UI Metadata)
 */

/**
 * Icon source enum
 * - LOCAL_PUBLIC: Icon lives in repo under apps/web/public/assets/
 * - SUPABASE_STORAGE: Icon uploaded to Supabase Storage
 */
export type IconSource = 'LOCAL_PUBLIC' | 'SUPABASE_STORAGE'

/**
 * Icon metadata
 * Defines where the icon asset lives and how to resolve it
 */
export interface EquipmentIcon {
  /**
   * Where the icon is stored
   */
  source: IconSource

  /**
   * Path or key to the icon
   * - LOCAL_PUBLIC: path relative to public root, e.g. "/assets/items/commons/iron-sword/icon.png"
   * - SUPABASE_STORAGE: storage key, e.g. "items/commons/iron-sword/icon.png"
   */
  path: string

  /**
   * Optional variant identifier (e.g. "small", "large")
   * Reserved for future use; not currently used by inventory UI
   */
  variant?: string
}

/**
 * Complete UI metadata for an equipment template
 * Stored in EquipmentTemplate.ui (JSON column)
 */
export interface EquipmentUIMetadata {
  /**
   * Display name shown in inventory and tooltips
   * Falls back to template.name if not provided
   */
  displayName: string

  /**
   * Short name for compact UI (optional)
   * E.g. "Longsword" instead of "Iron Longsword of the Bear"
   */
  shortName?: string

  /**
   * Flavor text or item description (optional)
   */
  description?: string

  /**
   * Icon metadata
   * Required for inventory rendering; server resolves to iconUrl at runtime
   */
  icon: EquipmentIcon

  /**
   * Rarity frame visual key (optional)
   * E.g. "gold_frame", "silver_frame"
   * Reserved for future rarity frame rendering
   */
  rarityFrameKey?: string

  /**
   * Sort order hint for inventory (optional)
   * Lower numbers appear first; defaults to alphabetical if not provided
   */
  sortOrder?: number

  /**
   * UI-specific tags (optional)
   * E.g. ["starter", "craftable", "hidden"]
   * Distinct from template.tags which are gameplay-focused
   */
  tags?: string[]
}

/**
 * Type guard: check if a value is a valid IconSource
 */
export function isIconSource(value: unknown): value is IconSource {
  return value === 'LOCAL_PUBLIC' || value === 'SUPABASE_STORAGE'
}

/**
 * Type guard: check if a value is a valid EquipmentIcon
 */
export function isEquipmentIcon(value: unknown): value is EquipmentIcon {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    isIconSource(obj.source) &&
    typeof obj.path === 'string' &&
    (obj.variant === undefined || typeof obj.variant === 'string')
  )
}

/**
 * Type guard: check if a value is a valid EquipmentUIMetadata
 */
export function isEquipmentUIMetadata(value: unknown): value is EquipmentUIMetadata {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.displayName === 'string' &&
    isEquipmentIcon(obj.icon) &&
    (obj.shortName === undefined || typeof obj.shortName === 'string') &&
    (obj.description === undefined || typeof obj.description === 'string') &&
    (obj.rarityFrameKey === undefined || typeof obj.rarityFrameKey === 'string') &&
    (obj.sortOrder === undefined || typeof obj.sortOrder === 'number') &&
    (obj.tags === undefined || (Array.isArray(obj.tags) && obj.tags.every(t => typeof t === 'string')))
  )
}

/**
 * Validation helper: get validation errors for ui metadata (if any)
 * Returns array of error messages; empty array means valid
 */
export function validateEquipmentUIMetadata(ui: unknown): string[] {
  const errors: string[] = []

  if (typeof ui !== 'object' || ui === null) {
    errors.push('ui must be an object')
    return errors
  }

  const obj = ui as Record<string, unknown>

  // Required: displayName
  if (!obj.displayName || typeof obj.displayName !== 'string') {
    errors.push('ui.displayName is required and must be a string')
  }

  // Required: icon
  if (!obj.icon || typeof obj.icon !== 'object') {
    errors.push('ui.icon is required and must be an object')
  } else {
    const icon = obj.icon as Record<string, unknown>

    // Required: icon.source
    if (!isIconSource(icon.source)) {
      errors.push('ui.icon.source must be "LOCAL_PUBLIC" or "SUPABASE_STORAGE"')
    }

    // Required: icon.path
    if (!icon.path || typeof icon.path !== 'string') {
      errors.push('ui.icon.path is required and must be a string')
    } else {
      // Path prefix validation for LOCAL_PUBLIC
      if (icon.source === 'LOCAL_PUBLIC' && !icon.path.startsWith('/assets/')) {
        errors.push('ui.icon.path for LOCAL_PUBLIC must start with "/assets/"')
      }
    }
  }

  return errors
}
