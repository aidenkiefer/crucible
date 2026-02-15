import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateSkillTrees() {
  console.log('Migrating skill trees from class-specific to cross-class...')

  await prisma.$transaction(async (tx) => {
    // Get all gladiators
    const gladiators = await tx.gladiator.findMany()

    console.log(`Found ${gladiators.length} gladiators to migrate`)

    for (const gladiator of gladiators) {
      // Skip if already migrated (empty skills + has points)
      if (gladiator.unlockedSkills.length === 0 && gladiator.skillPointsAvailable > 0) {
        console.log(`Skipping gladiator ${gladiator.id} (already migrated)`)
        continue
      }

      // Migrate: clear skills and grant points
      await tx.gladiator.update({
        where: { id: gladiator.id },
        data: {
          unlockedSkills: [],
          skillPointsAvailable: gladiator.level,
        },
      })
      console.log(
        `Migrated gladiator ${gladiator.id} (level ${gladiator.level}): granted ${gladiator.level} skill points`
      )
    }

    console.log('Migration complete!')
  })
}

migrateSkillTrees()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
