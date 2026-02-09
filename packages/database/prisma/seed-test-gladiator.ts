/**
 * Creates one test Gladiator for a user without minting on-chain.
 * Usage (from repo root or packages/database):
 *   SEED_GLADIATOR_USER_EMAIL=you@example.com pnpm run seed:test-gladiator
 * If SEED_GLADIATOR_USER_EMAIL is not set, uses the first user in the DB.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_TOKEN_ID = 900001 // High ID to avoid clashing with real mints

async function main() {
  const email = process.env.SEED_GLADIATOR_USER_EMAIL

  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })

  if (!user) {
    if (email) {
      throw new Error(`No user found with email: ${email}`)
    }
    throw new Error('No users in database. Sign up first, then run this script.')
  }

  const existing = await prisma.gladiator.findUnique({
    where: { tokenId: TEST_TOKEN_ID },
  })

  if (existing) {
    if (existing.ownerId === user.id) {
      console.log(`Test Gladiator (tokenId=${TEST_TOKEN_ID}) already exists for ${user.email}.`)
      return
    }
    throw new Error(`tokenId ${TEST_TOKEN_ID} is already used by another owner. Pick another TEST_TOKEN_ID in seed-test-gladiator.ts.`)
  }

  await prisma.gladiator.create({
    data: {
      tokenId: TEST_TOKEN_ID,
      ownerId: user.id,
      class: 'Duelist',
      level: 1,
      xp: 0,
      constitution: 10,
      strength: 10,
      dexterity: 10,
      speed: 10,
      defense: 10,
      magicResist: 10,
      arcana: 10,
      faith: 10,
      skillPointsAvailable: 0,
      statPointsAvailable: 0,
      unlockedSkills: [],
    },
  })

  console.log(`Created test Gladiator (tokenId=${TEST_TOKEN_ID}) for ${user.email}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
