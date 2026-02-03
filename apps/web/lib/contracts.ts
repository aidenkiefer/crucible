import { parseAbi } from 'viem'

export const GLADIATOR_NFT_ADDRESS = process.env.NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS as `0x${string}`

export const GLADIATOR_NFT_ABI = parseAbi([
  'function mint(uint8 class) public returns (uint256)',
  'function getGladiator(uint256 tokenId) public view returns (tuple(uint8 class, uint8 strength, uint8 agility, uint8 endurance, uint8 technique, uint256 mintedAt))',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'event GladiatorMinted(uint256 indexed tokenId, address indexed owner, uint8 class)',
])

export enum GladiatorClass {
  Duelist = 0,
  Brute = 1,
  Assassin = 2,
}
