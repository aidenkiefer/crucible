import { prisma } from '@gladiator/database/src/client'
import { BlockchainListener } from './blockchain-listener'

const listener = new BlockchainListener()

export async function startGladiatorSync() {
  await listener.start(async (tokenId, ownerAddress, gladiatorClass) => {
    console.log(`Processing mint: tokenId=${tokenId}, owner=${ownerAddress}`)

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress: ownerAddress.toLowerCase() },
    })

    if (!user) {
      console.warn(`User not found for wallet: ${ownerAddress}`)
      return
    }

    // Check if already synced
    const existing = await prisma.gladiator.findUnique({
      where: { tokenId: Number(tokenId) },
    })

    if (existing) {
      console.log(`Gladiator ${tokenId} already synced`)
      return
    }

    // Fetch full gladiator data from contract
    const data = await listener.getGladiatorData(tokenId)

    // Create in database (8 stats from contract)
    await prisma.gladiator.create({
      data: {
        tokenId: Number(tokenId),
        ownerId: user.id,
        class: getClassName(gladiatorClass),
        level: 1,
        xp: 0,
        constitution: data.constitution,
        strength: data.strength,
        dexterity: data.dexterity,
        speed: data.speed,
        defense: data.defense,
        magicResist: data.magicResist,
        arcana: data.arcana,
        faith: data.faith,
        skillPointsAvailable: 0,
        unlockedSkills: [],
      },
    })

    console.log(`✅ Gladiator ${tokenId} synced to database`)
  })
}

function getClassName(classId: number): string {
  const classes = ['Duelist', 'Brute', 'Assassin']
  return classes[classId] || 'Duelist'
}
