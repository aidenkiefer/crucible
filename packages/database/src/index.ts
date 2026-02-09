// Re-export Prisma client
export { prisma } from './client'

// Re-export equipment UI types
export type {
  IconSource,
  EquipmentIcon,
  EquipmentUIMetadata,
} from './equipment-ui-types'

export {
  isIconSource,
  isEquipmentIcon,
  isEquipmentUIMetadata,
  validateEquipmentUIMetadata,
} from './equipment-ui-types'
