import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GladiatorNFT contract...");

  const GladiatorNFT = await ethers.getContractFactory("GladiatorNFT");
  const gladiatorNFT = await GladiatorNFT.deploy();

  await gladiatorNFT.waitForDeployment();

  const address = await gladiatorNFT.getAddress();
  console.log(`✅ GladiatorNFT deployed to: ${address}`);

  // Save deployment info
  console.log("\nAdd this to your .env:");
  console.log(`NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
