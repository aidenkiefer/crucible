// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GladiatorNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    // 5-class system: Tank, Legionnaire, Duelist, Mage, Monk (uint8 0-4)
    enum GladiatorClass { Tank, Legionnaire, Duelist, Mage, Monk }

    // Stat order: 0=CON, 1=STR, 2=DEX, 3=SPD, 4=DEF, 5=MR, 6=ARC, 7=FTH
    uint256 internal constant TOTAL_BASE_STATS = 50;
    uint256 internal constant MIN_PER_STAT = 1;
    uint256 internal constant RANGE = 10000;

    // Gladiator metadata
    struct Gladiator {
        GladiatorClass class;
        uint8 constitution;
        uint8 strength;
        uint8 dexterity;
        uint8 speed;
        uint8 defense;
        uint8 magicResist;
        uint8 arcana;
        uint8 faith;
        uint256 mintedAt;
    }

    // Mapping from token ID to Gladiator data
    mapping(uint256 => Gladiator) public gladiators;

    // Base URI for metadata
    string private _baseTokenURI;

    event GladiatorMinted(
        uint256 indexed tokenId,
        address indexed owner,
        GladiatorClass class
    );

    constructor() ERC721("Gladiator", "GLAD") Ownable(msg.sender) {
        _baseTokenURI = "https://api.gladiator-coliseum.com/metadata/";
    }

    function mint(GladiatorClass gladiatorClass) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        _safeMint(msg.sender, tokenId);

        bytes32 baseRand = keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            tokenId
        ));
        uint8[8] memory rolled = _rollWeightedStats(gladiatorClass, baseRand);

        gladiators[tokenId] = Gladiator({
            class: gladiatorClass,
            constitution: rolled[0],
            strength: rolled[1],
            dexterity: rolled[2],
            speed: rolled[3],
            defense: rolled[4],
            magicResist: rolled[5],
            arcana: rolled[6],
            faith: rolled[7],
            mintedAt: block.timestamp
        });

        emit GladiatorMinted(tokenId, msg.sender, gladiatorClass);

        return tokenId;
    }

    /// @dev Returns weight for each stat (0=CON..7=FTH). Scaled: 1.4->140, 0.7->70.
    function _getClassWeights(GladiatorClass c) internal pure returns (uint16[8] memory w) {
        if (c == GladiatorClass.Tank) {
            // CON140, DEF130, MR120, ARC110, STR100, FTH90, SPD80, DEX70
            return [uint16(140), 100, 70, 80, 130, 120, 110, 90];
        }
        if (c == GladiatorClass.Legionnaire) {
            // STR140, DEF130, DEX120, CON110, SPD100, ARC90, FTH80, MR70
            return [uint16(110), 140, 120, 100, 130, 70, 90, 80];
        }
        if (c == GladiatorClass.Duelist) {
            // DEX140, SPD130, STR120, MR110, DEF100, FTH90, ARC80, CON70
            return [uint16(70), 120, 140, 130, 100, 110, 80, 90];
        }
        if (c == GladiatorClass.Mage) {
            // ARC140, MR130, SPD120, DEX110, FTH100, CON90, DEF80, STR70
            return [uint16(90), 70, 110, 120, 80, 130, 140, 100];
        }
        // Monk: FTH140, CON130, SPD120, MR110, DEX100, DEF90, ARC80, STR70
        return [uint16(130), 70, 100, 120, 90, 110, 80, 140];
    }

    /// @dev Allocates TOTAL_BASE_STATS across 8 stats using class weights and weighted random shares. Sum is exactly 50.
    function _rollWeightedStats(GladiatorClass c, bytes32 baseRand) internal pure returns (uint8[8] memory out) {
        uint16[8] memory w = _getClassWeights(c);
        uint256 remaining = TOTAL_BASE_STATS - 8 * MIN_PER_STAT; // 42

        uint256 sumS = 0;
        uint256[8] memory s;
        uint256[8] memory remainder;

        for (uint256 i = 0; i < 8; i++) {
            uint256 r = (uint256(keccak256(abi.encodePacked(baseRand, i))) % RANGE) + 1;
            s[i] = r * uint256(w[i]);
            sumS += s[i];
        }

        for (uint256 i = 0; i < 8; i++) {
            uint256 raw = (remaining * s[i]) / sumS;
            out[i] = uint8(MIN_PER_STAT + raw);
            remainder[i] = (remaining * s[i]) % sumS;
        }

        uint256 sumAlloc = 0;
        for (uint256 i = 0; i < 8; i++) {
            sumAlloc += out[i];
        }
        uint256 leftover = TOTAL_BASE_STATS - sumAlloc;

        while (leftover > 0) {
            uint256 maxRem = 0;
            uint256 maxIdx = 0;
            for (uint256 i = 0; i < 8; i++) {
                if (remainder[i] > maxRem) {
                    maxRem = remainder[i];
                    maxIdx = i;
                }
            }
            out[maxIdx] += 1;
            remainder[maxIdx] = 0;
            sumAlloc += 1;
            leftover--;
        }

        return out;
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function getGladiator(uint256 tokenId) public view returns (Gladiator memory) {
        require(ownerOf(tokenId) != address(0), "Gladiator does not exist");
        return gladiators[tokenId];
    }
}
