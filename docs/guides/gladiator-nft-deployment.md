# Deploying the Gladiator NFT Contract

This guide covers deploying the **GladiatorNFT** contract (5-class system: Tank, Legionnaire, Duelist, Mage, Monk) to a local Hardhat network or to Polygon Mumbai testnet.

## Prerequisites

- Node.js 20+ and pnpm
- For testnet: a wallet with test MATIC (e.g. [Mumbai faucet](https://faucet.polygon.technology/)) and a private key you’re comfortable using for deployment
- Root `.env` (or `contracts/.env`) with the variables below

## 1. Contract and config

- **Contract:** `contracts/contracts/GladiatorNFT.sol`
- **Deploy script:** `contracts/scripts/deploy.ts`
- **Config:** `contracts/hardhat.config.ts` (reads `../.env` for RPC and keys)

The contract uses a 5-class enum: `Tank = 0`, `Legionnaire = 1`, `Duelist = 2`, `Mage = 3`, `Monk = 4`. The frontend and game-server sync logic expect these values.

## 2. Environment variables

In the **repository root** `.env` (Hardhat loads `../.env` from `contracts/`):

| Variable | Required for | Description |
|----------|----------------|-------------|
| `PRIVATE_KEY` | Testnet deploy | Deployer wallet private key (no `0x` prefix). Must have test MATIC on Mumbai. |
| `POLYGON_MUMBAI_RPC_URL` | Testnet deploy | Mumbai RPC URL (e.g. `https://rpc-mumbai.maticvigil.com` or from Alchemy/Infura). |
| `POLYGONSCAN_API_KEY` | Verification | Optional; from [Polygonscan](https://polygonscan.com/apis) for `verify` script. |

After deployment you’ll set:

- **Web app & game server:** `NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=<deployed address>`

## 3. Install and compile

From the repo root:

```bash
pnpm install
cd contracts
pnpm run compile
```

If compilation succeeds, you’re ready to deploy.

## 4. Deploy

### Option A: Local Hardhat network

Useful for testing without spending testnet MATIC.

1. Start a local node (in a separate terminal):

   ```bash
   cd contracts
   npx hardhat node
   ```

2. Deploy to that network:

   ```bash
   pnpm run deploy:local
   ```

3. Copy the printed contract address and set it in `.env` as `NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS` for the web app and game server. The local chain resets when you stop the node, so you’ll need to redeploy and update the address after each restart.

### Option B: Polygon Mumbai testnet

1. Ensure `.env` has:
   - `PRIVATE_KEY` – deployer private key
   - `POLYGON_MUMBAI_RPC_URL` – Mumbai RPC URL

2. From `contracts/`:

   ```bash
   pnpm run deploy:testnet
   ```

3. The script prints the deployed contract address. Example:

   ```
   ✅ GladiatorNFT deployed to: 0x...

   Add this to your .env:
   NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=0x...
   ```

4. Add that line to the **root** `.env` (and to any environment where the web app or game server run: Vercel, Railway, etc.).

## 5. Verify on Polygonscan (optional)

After a Mumbai deployment, you can verify the contract so the source appears on Polygonscan:

1. In root `.env`, set `NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS` to the address you just deployed (and `POLYGONSCAN_API_KEY` from [Polygonscan](https://polygonscan.com/apis)).
2. From `contracts/`:

   ```bash
   npx hardhat run scripts/verify.ts --network mumbai
   ```

The verify script reads the contract address from `NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS` and submits the source to Polygonscan.

## 6. After deployment

- **Web app:** Set `NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS` so the mint page and wagmi use the new contract.
- **Game server:** Set the same `NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS` (and `POLYGON_MUMBAI_RPC_URL` for Mumbai) so the blockchain listener indexes mints and syncs gladiators to the DB with the correct 5-class names (Tank, Legionnaire, Duelist, Mage, Monk).

Existing deployments that used the old 3-class contract (Duelist, Brute, Assassin) are unchanged on-chain; only new mints from this deployment will use the 5-class enum and stat logic.
