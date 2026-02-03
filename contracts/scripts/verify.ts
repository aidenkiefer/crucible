import { run } from 'hardhat'

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS!

  console.log('Verifying contract on PolygonScan...')

  await run('verify:verify', {
    address: contractAddress,
    constructorArguments: [],
  })

  console.log('✅ Contract verified!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
