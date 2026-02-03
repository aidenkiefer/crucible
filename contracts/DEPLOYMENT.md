# GladiatorNFT Contract Deployment Guide

## Prerequisites

1. **Get Testnet MATIC**
   - Visit https://faucet.polygon.technology/
   - Select Mumbai testnet (or Polygon Amoy if Mumbai is deprecated)
   - Enter your wallet address
   - Request test MATIC

2. **Environment Variables**

   Create or update `/contracts/.env`:
   ```bash
   # Your deployer wallet private key (NEVER commit this!)
   PRIVATE_KEY=your_private_key_here

   # Polygon Mumbai RPC URL
   POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com

   # PolygonScan API key for verification
   POLYGONSCAN_API_KEY=your_polygonscan_api_key
   ```

## Deployment Steps

### Step 1: Compile Contract

```bash
cd contracts
pnpm compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### Step 2: Deploy to Mumbai Testnet

```bash
pnpm deploy:testnet
```

Expected output:
```
Deploying GladiatorNFT contract...
✅ GladiatorNFT deployed to: 0x1234...5678

Add this to your .env:
NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=0x1234...5678
```

### Step 3: Update Environment Variables

Add the contract address to your `.env` files:

**Root `.env.example`** (update and copy to `.env`):
```bash
NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=0x... # from deployment output
```

**`apps/web/.env.local`**:
```bash
NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=0x... # from deployment output
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

**`apps/game-server/.env`**:
```bash
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=0x... # from deployment output
```

### Step 4: Verify Contract on PolygonScan

Option A - Using Hardhat:
```bash
npx hardhat verify --network mumbai <CONTRACT_ADDRESS>
```

Option B - Using the verify script:
```bash
# Make sure NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS is in .env
npx hardhat run scripts/verify.ts --network mumbai
```

Expected output:
```
Verifying contract on PolygonScan...
Successfully submitted source code for contract
✅ Contract verified!
```

## Verification

1. Visit PolygonScan Mumbai: https://mumbai.polygonscan.com/
2. Search for your contract address
3. Check that:
   - Contract is verified (green checkmark)
   - Contract name is "GladiatorNFT"
   - You can read contract functions (getGladiator, etc.)
   - You can write contract functions (mint, etc.)

## Post-Deployment

After deploying:
1. Run `pnpm db:push` in `packages/database` to sync database schema
2. Start the game server to begin listening for mint events
3. Test minting a Gladiator through the web UI

## Troubleshooting

**Problem:** "Insufficient funds for gas"
- **Solution:** Get more test MATIC from the faucet

**Problem:** "Nonce too high"
- **Solution:** Reset your MetaMask account (Settings > Advanced > Reset Account)

**Problem:** Mumbai testnet deprecated
- **Solution:** Use Polygon Amoy testnet instead. Update `hardhat.config.ts` network configuration.

## Important Notes

- **NEVER** commit your private key or `.env` file
- Mumbai testnet is deprecated; consider using Polygon Amoy testnet
- Contract uses `block.prevrandao` which requires EVM supporting post-merge Ethereum
- Stat generation is pseudo-random and NOT cryptographically secure (demo only)
