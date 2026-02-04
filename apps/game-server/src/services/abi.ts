export const GLADIATOR_NFT_ABI = [
  'function mint(uint8 class) public returns (uint256)',
  'function getGladiator(uint256 tokenId) public view returns (tuple(uint8 class, uint8 constitution, uint8 strength, uint8 dexterity, uint8 speed, uint8 defense, uint8 magicResist, uint8 arcana, uint8 faith, uint256 mintedAt))',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'event GladiatorMinted(uint256 indexed tokenId, address indexed owner, uint8 class)',
]
