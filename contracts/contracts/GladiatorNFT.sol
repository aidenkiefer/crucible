// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GladiatorNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    // Gladiator class types
    enum GladiatorClass { Duelist, Brute, Assassin }

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

        // Generate random stats (pseudo-random for demo)
        gladiators[tokenId] = Gladiator({
            class: gladiatorClass,
            constitution: _randomStat(gladiatorClass, 0),
            strength: _randomStat(gladiatorClass, 1),
            dexterity: _randomStat(gladiatorClass, 2),
            speed: _randomStat(gladiatorClass, 3),
            defense: _randomStat(gladiatorClass, 4),
            magicResist: _randomStat(gladiatorClass, 5),
            arcana: _randomStat(gladiatorClass, 6),
            faith: _randomStat(gladiatorClass, 7),
            mintedAt: block.timestamp
        });

        emit GladiatorMinted(tokenId, msg.sender, gladiatorClass);

        return tokenId;
    }

    function _randomStat(GladiatorClass gladiatorClass, uint256 seed) private view returns (uint8) {
        // Pseudo-random stat generation (NOT secure, demo only)
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            seed,
            _nextTokenId
        ))) % 30;

        uint8 baseMin = 50;
        uint8 variance = uint8(random);

        if (gladiatorClass == GladiatorClass.Duelist) {
            // High dexterity, speed, defense
            if (seed == 2 || seed == 3 || seed == 4) return baseMin + 20 + (variance % 10);
            return baseMin + variance;
        } else if (gladiatorClass == GladiatorClass.Brute) {
            // High constitution, strength, defense
            if (seed == 0 || seed == 1 || seed == 4) return baseMin + 20 + (variance % 10);
            return baseMin + variance;
        } else { // Assassin
            // High dexterity, speed, arcana
            if (seed == 2 || seed == 3 || seed == 6) return baseMin + 20 + (variance % 10);
            return baseMin + variance;
        }
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
