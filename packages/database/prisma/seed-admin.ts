import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo game data bundle...')

  // Create demo bundle
  const bundle = await prisma.gameDataBundle.create({
    data: {
      label: 'demo-v0.1',
      status: 'DRAFT',
      isActive: false,
    },
  })

  console.log(`Created bundle: ${bundle.label}`)

  // Create action templates
  const swordSlash = await prisma.actionTemplate.create({
    data: {
      key: 'atk_sword_slash',
      name: 'Sword Slash',
      description: 'A quick horizontal slash',
      category: 'WEAPON_ATTACK',
      cooldownMs: 800,
      staminaCost: 15,
      hitboxConfig: {
        shape: 'ARC',
        radius: 80,
        angleDeg: 90,
      },
      damageConfig: {
        base: 15,
        type: 'PHYSICAL',
        scaling: { str: 0.7, dex: 0.3 },
      },
      bundleId: bundle.id,
    },
  })

  const dodgeRoll = await prisma.actionTemplate.create({
    data: {
      key: 'mob_dodge_roll',
      name: 'Dodge Roll',
      description: 'Roll forward with invulnerability frames',
      category: 'MOBILITY',
      cooldownMs: 1000,
      staminaCost: 20,
      effectConfig: {
        iFramesMs: 200,
        distance: 100,
        durationMs: 300,
      },
      bundleId: bundle.id,
    },
  })

  console.log(`Created ${2} action templates`)

  // Create equipment templates
  const ironSword = await prisma.equipmentTemplate.create({
    data: {
      key: 'iron_longsword',
      name: 'Iron Longsword',
      description: 'A reliable sword for beginners',
      type: 'WEAPON',
      slot: 'MAIN_HAND',
      subtype: 'SWORD',
      tags: ['starter', 'melee', 'slash'],
      baseStatMods: {
        str: 5,
        dex: 2,
      },
      scaling: {
        str: 0.7,
        dex: 0.3,
      },
      ui: {
        iconKey: 'sword_iron',
      },
      bundleId: bundle.id,
      actions: {
        create: [
          { actionTemplateId: swordSlash.id },
        ],
      },
    },
  })

  const leatherArmor = await prisma.equipmentTemplate.create({
    data: {
      key: 'leather_chest',
      name: 'Leather Armor',
      description: 'Light chest protection',
      type: 'ARMOR',
      slot: 'CHEST',
      subtype: 'LIGHT',
      tags: ['starter', 'light'],
      baseStatMods: {
        def: 3,
      },
      ui: {
        iconKey: 'armor_leather',
      },
      bundleId: bundle.id,
    },
  })

  console.log(`Created ${2} equipment templates`)

  console.log('✅ Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
