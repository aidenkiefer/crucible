import { ethers } from 'ethers'
import { GLADIATOR_NFT_ABI } from './abi'

const RPC_URL = process.env.POLYGON_MUMBAI_RPC_URL!
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS!

export class BlockchainListener {
  private provider: ethers.JsonRpcProvider
  private contract: ethers.Contract

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL)
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      GLADIATOR_NFT_ABI,
      this.provider
    )
  }

  async start(onMint: (tokenId: bigint, owner: string, gladiatorClass: number) => void) {
    console.log('🔗 Starting blockchain listener...')

    // Listen for GladiatorMinted events
    this.contract.on('GladiatorMinted', async (tokenId, owner, gladiatorClass, event) => {
      console.log(`📡 New Gladiator minted: ${tokenId}`)

      try {
        await onMint(tokenId, owner, Number(gladiatorClass))
      } catch (error) {
        console.error('Error processing mint event:', error)
      }
    })

    // Optionally: sync historical events on startup
    await this.syncHistoricalEvents(onMint)
  }

  async syncHistoricalEvents(onMint: (tokenId: bigint, owner: string, gladiatorClass: number) => void) {
    console.log('🔄 Syncing historical mint events...')

    const filter = this.contract.filters.GladiatorMinted()
    const events = await this.contract.queryFilter(filter, -10000) // Last ~10k blocks

    for (const event of events) {
      const e = event as ethers.EventLog
      if (!e.args || e.args.length < 3) continue
      const [tokenId, owner, gladiatorClass] = e.args
      await onMint(tokenId, owner, Number(gladiatorClass))
    }

    console.log(`✅ Synced ${events.length} historical events`)
  }

  async getGladiatorData(tokenId: bigint) {
    const gladiator = await this.contract.getGladiator(tokenId)
    return {
      class: Number(gladiator.class),
      constitution: Number(gladiator.constitution),
      strength: Number(gladiator.strength),
      dexterity: Number(gladiator.dexterity),
      speed: Number(gladiator.speed),
      defense: Number(gladiator.defense),
      magicResist: Number(gladiator.magicResist),
      arcana: Number(gladiator.arcana),
      faith: Number(gladiator.faith),
      mintedAt: Number(gladiator.mintedAt),
    }
  }
}
