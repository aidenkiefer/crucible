# Mainnet Migration Guide

## ⚠️ IMPORTANT WARNING

**DO NOT deploy to mainnet until:**
- ✅ All features thoroughly tested on testnet
- ✅ Smart contracts professionally audited
- ✅ Security review completed
- ✅ Gas costs estimated and budgeted
- ✅ Legal compliance verified
- ✅ User communication plan ready

Mainnet deployment involves **real money** and **real user funds**. Proceed with extreme caution.

---

## Overview

This guide documents the process of migrating Gladiator Coliseum from Polygon Mumbai testnet to Polygon mainnet (or Base mainnet).

**Recommended Target:** Polygon Mainnet
- Lower gas fees than Ethereum
- High throughput (7,000+ TPS)
- EVM-compatible
- Strong ecosystem

**Alternative:** Base Mainnet
- Coinbase's L2
- Even lower fees
- Growing ecosystem
- EVM-compatible

---

## Prerequisites Checklist

### Technical Prerequisites

- [ ] **Smart Contract Audit**
  - Recommend: OpenZeppelin Defender, CertiK, or Trail of Bits
  - Budget: $5,000-$20,000 depending on complexity
  - Timeline: 2-4 weeks

- [ ] **Security Review**
  - Penetration testing of frontend + backend
  - Recommend: HackerOne, Immunefi, or in-house security team

- [ ] **Gas Cost Analysis**
  - Estimate deployment cost
  - Estimate per-mint cost
  - Plan for gas price spikes

- [ ] **Infrastructure Scaling**
  - Upgrade Supabase to Pro tier (if needed)
  - Scale game server instances
  - Set up monitoring and alerts

- [ ] **RPC Provider**
  - Alchemy or Infura mainnet plan
  - Budget: $49-$299/month depending on traffic
  - Fallback RPC for redundancy

### Business Prerequisites

- [ ] **Legal Review**
  - NFT regulatory compliance
  - Terms of Service
  - Privacy Policy
  - Jurisdiction considerations

- [ ] **User Communication**
  - Migration announcement
  - User guide for mainnet
  - Gas cost transparency
  - Support channels

- [ ] **Incident Response Plan**
  - Pause mechanism
  - Rollback procedure
  - Communication templates
  - Support escalation

---

## Step-by-Step Migration

### Phase 1: Preparation (Week 1-2)

#### 1.1 Smart Contract Audit

Send contracts to auditing firm:
- `contracts/contracts/GladiatorNFT.sol`
- Any upgradeable proxies (if applicable)

Wait for audit report and address findings.

#### 1.2 Create Mainnet Deployment Plan

**File:** `contracts/scripts/deploy-mainnet.ts`

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying to MAINNET...");
  console.log("⚠️  This will cost real ETH/MATIC!");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  // Confirm deployment
  console.log("\n⚠️  Are you SURE you want to deploy to mainnet?");
  console.log("Press Ctrl+C to cancel, or wait 10 seconds to proceed...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log("Deploying GladiatorNFT...");
  const GladiatorNFT = await ethers.getContractFactory("GladiatorNFT");
  const gladiatorNFT = await GladiatorNFT.deploy();

  await gladiatorNFT.waitForDeployment();

  const address = await gladiatorNFT.getAddress();
  console.log(`✅ GladiatorNFT deployed to: ${address}`);

  // Save deployment info
  const deployment = {
    network: "polygon",
    contractAddress: address,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log("\n📋 Deployment Info:");
  console.log(JSON.stringify(deployment, null, 2));

  console.log("\n⚠️  IMPORTANT: Save this contract address!");
  console.log(`NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

#### 1.3 Set Up Mainnet Configuration

**File:** `contracts/hardhat.config.ts` (add mainnet networks)

```typescript
networks: {
  // ... existing networks ...

  polygon: {
    url: process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com",
    accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
    chainId: 137,
    gasPrice: "auto",
  },

  base: {
    url: process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org",
    accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
    chainId: 8453,
    gasPrice: "auto",
  },
},
```

#### 1.4 Prepare Deployer Wallet

1. **Create dedicated deployer wallet**
   - Use hardware wallet (Ledger, Trezor) for production
   - Never use the same wallet as development

2. **Fund deployer wallet**
   - Polygon mainnet: ~20-50 MATIC
   - Base mainnet: ~0.05-0.1 ETH

3. **Secure private key**
   - Store in password manager
   - Never commit to git
   - Use `.env` file (git ignored)

#### 1.5 Set Up Mainnet RPC

**Recommended: Alchemy**

1. Sign up at https://alchemy.com
2. Create new app (Polygon Mainnet or Base Mainnet)
3. Get API key
4. Add to `.env`:

```bash
POLYGON_MAINNET_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
MAINNET_PRIVATE_KEY=your_deployer_private_key_here
```

---

### Phase 2: Deployment (Day 1-2)

#### 2.1 Final Testnet Verification

Before mainnet deployment, verify EVERYTHING on testnet:

- [ ] Minting works correctly
- [ ] Metadata displays correctly
- [ ] Combat uses NFT stats correctly
- [ ] Event listener captures all events
- [ ] All edge cases tested

#### 2.2 Deploy Smart Contract

```bash
cd contracts

# Double-check you're on mainnet network
echo "Deploying to POLYGON MAINNET in 10 seconds..."
sleep 10

# Deploy
npx hardhat run scripts/deploy-mainnet.ts --network polygon
```

**Expected Output:**
```
🚀 Deploying to MAINNET...
Deploying with account: 0x1234...5678
Account balance: 50.0 MATIC
Deploying GladiatorNFT...
✅ GladiatorNFT deployed to: 0xABCD...EF01

NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=0xABCD...EF01
```

**Save this address immediately!**

#### 2.3 Verify Contract on PolygonScan

```bash
npx hardhat verify --network polygon 0xABCD...EF01
```

**Verify manually:**
1. Go to https://polygonscan.com/address/0xABCD...EF01
2. Check "Contract" tab shows verified source code
3. Check "Read Contract" and "Write Contract" tabs work

#### 2.4 Test Mainnet Contract

**Create test script:** `contracts/scripts/test-mainnet.ts`

```typescript
async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS!;

  const GladiatorNFT = await ethers.getContractAt("GladiatorNFT", contractAddress);

  console.log("Testing contract at:", contractAddress);

  // Test 1: Check contract is callable
  const name = await GladiatorNFT.name();
  console.log("✅ Contract name:", name);

  // Test 2: Mint test NFT
  console.log("Minting test Gladiator (Duelist)...");
  const tx = await GladiatorNFT.mint(0); // Duelist
  const receipt = await tx.wait();

  console.log("✅ Minted! Transaction:", receipt.hash);

  // Test 3: Verify mint
  const tokenId = 0; // First mint is tokenId 0
  const gladiator = await GladiatorNFT.getGladiator(tokenId);
  console.log("✅ Gladiator stats:", gladiator);
}
```

Run test:

```bash
npx hardhat run scripts/test-mainnet.ts --network polygon
```

Expected: Mint succeeds, NFT visible on PolygonScan

---

### Phase 3: Backend Migration (Day 2-3)

#### 3.1 Update Environment Variables

**Frontend (Vercel):**

```bash
# Vercel dashboard → Settings → Environment Variables

# Update to mainnet contract address
NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=0xABCD...EF01

# Update RPC URL
NEXT_PUBLIC_ALCHEMY_ID=mainnet_alchemy_key
```

**Game Server (Railway):**

```bash
# Railway dashboard → Variables

POLYGON_MAINNET_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=0xABCD...EF01
```

#### 3.2 Update Blockchain Listener

**File:** `apps/game-server/src/services/blockchain-listener.ts` (update)

```typescript
const RPC_URL = process.env.NODE_ENV === 'production'
  ? process.env.POLYGON_MAINNET_RPC_URL!
  : process.env.POLYGON_MUMBAI_RPC_URL!;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS!;
```

#### 3.3 Deploy Updated Backend

```bash
# Game server
cd apps/game-server
git push railway main

# Frontend
cd apps/web
vercel --prod
```

#### 3.4 Monitor Event Listener

Check game server logs:

```bash
railway logs -f
```

Expected:
```
🔗 Starting blockchain listener...
📡 Connected to Polygon mainnet
🔄 Syncing historical mint events...
✅ Synced 0 historical events (fresh contract)
```

---

### Phase 4: Frontend Updates (Day 3-4)

#### 4.1 Add Mainnet Network Switching

**File:** `apps/web/lib/wagmi.ts` (update)

```typescript
import { polygon } from 'wagmi/chains' // Change from polygonMumbai

export const config = createConfig({
  chains: [polygon], // Mainnet
  // ... rest of config
})
```

#### 4.2 Update User-Facing Messaging

**Key Changes:**

1. **Minting Page** - Add gas cost warning:

```typescript
<div className="warning">
  ⚠️ Minting costs approximately $0.01-0.10 in MATIC.
  Make sure you have enough MATIC in your wallet.
</div>
```

2. **Home Page** - Add mainnet badge:

```typescript
<div className="badge">
  ✅ Live on Polygon Mainnet
</div>
```

3. **FAQ/Help** - Add:
   - How to get MATIC
   - Gas cost explanations
   - Mainnet vs testnet differences

#### 4.3 Add Network Detection

**File:** `apps/web/components/NetworkGuard.tsx`

```typescript
'use client'

import { useNetwork } from 'wagmi'
import { polygon } from 'wagmi/chains'

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { chain } = useNetwork()

  if (chain && chain.id !== polygon.id) {
    return (
      <div className="error-page">
        <h1>Wrong Network</h1>
        <p>Please switch to Polygon Mainnet in your wallet.</p>
        <p>Current network: {chain.name}</p>
      </div>
    )
  }

  return <>{children}</>
}
```

Wrap app:

```typescript
// apps/web/app/layout.tsx
<NetworkGuard>
  {children}
</NetworkGuard>
```

---

### Phase 5: Testing & Monitoring (Day 4-5)

#### 5.1 End-to-End Test on Mainnet

**Test Checklist:**

- [ ] Sign in with Google/Twitter
- [ ] Connect wallet (MetaMask on Polygon mainnet)
- [ ] Mint Gladiator NFT (pay real gas)
- [ ] Verify NFT appears in wallet (MetaMask, OpenSea)
- [ ] Verify NFT synced to database
- [ ] Start CPU match with mainnet NFT
- [ ] Complete match, verify XP awarded
- [ ] Verify loot drop
- [ ] Test PvP match (with second test account)
- [ ] Verify match history

#### 5.2 Set Up Monitoring

**Metrics to Track:**

1. **Contract Metrics**
   - Total mints
   - Active holders
   - Transfer events

2. **App Metrics**
   - Mint success rate
   - Event listener lag
   - API error rates

3. **User Metrics**
   - Daily active users
   - Matches played
   - Retention

**Tools:**

- PolygonScan API for contract metrics
- Vercel Analytics for frontend
- Railway Metrics for game server
- Sentry for error tracking

#### 5.3 Set Up Alerts

**Critical Alerts:**

- Event listener stopped (no events for 1 hour)
- High error rate (>5% of requests)
- Database connection failures
- Smart contract paused/disabled

**Recommended:** Use Sentry, PagerDuty, or similar

---

### Phase 6: User Migration & Communication (Day 5-7)

#### 6.1 Announcement Plan

**1 Week Before Mainnet:**
- Blog post announcing mainnet date
- Email to beta testers
- Social media announcement
- Discord/Telegram notification

**Day of Mainnet:**
- "We're live on mainnet!" announcement
- User guide for minting on mainnet
- Gas cost FAQ
- Support channels ready

**1 Week After Mainnet:**
- User success stories
- Stats (total mints, active players)
- Feedback collection

#### 6.2 Testnet Sunset Plan

**Option 1: Keep testnet running**
- Good for: Continued development
- Users can test features before mainnet
- Requires: Separate frontend deployment

**Option 2: Sunset testnet**
- Announce 2 weeks before shutdown
- Archive testnet data
- Redirect all users to mainnet

**Recommended:** Keep testnet for 1 month, then sunset

#### 6.3 User Support

**Common User Questions:**

Q: How do I get MATIC?
A: Link to Coinbase, Binance, or on-ramp services

Q: How much does minting cost?
A: Approximately $0.01-0.10, varies with gas prices

Q: Can I transfer my testnet NFTs to mainnet?
A: No, you'll need to mint new NFTs on mainnet

Q: What if gas prices are high?
A: Wait for lower gas times (check Polygonscan gas tracker)

---

## Cost Estimates

### Polygon Mainnet

**One-Time Costs:**
- Contract deployment: ~$1-5 (varies with gas)
- Contract verification: Free

**Per-User Costs:**
- NFT minting: ~$0.01-0.10 per mint
- Transfers: ~$0.005-0.05 per transfer

**Monthly Costs:**
- RPC provider (Alchemy): $49-$299/month
- Infrastructure: Existing (Vercel, Railway, Supabase)

**Example Budget for 1,000 Users:**
- Infrastructure: $150/month
- RPC: $49-$299/month
- Total: ~$200-$450/month

### Base Mainnet

**One-Time Costs:**
- Contract deployment: ~$2-10 (ETH-based gas)
- Contract verification: Free

**Per-User Costs:**
- NFT minting: ~$0.10-0.50 per mint

**Monthly Costs:**
- RPC provider: $49-$299/month
- Infrastructure: $150/month

---

## Rollback Plan

**If Issues Arise Post-Deployment:**

### Immediate Actions (Hour 1)

1. **Pause Contract (if pause functionality added)**

```solidity
function pause() public onlyOwner {
    _pause();
}
```

```bash
npx hardhat run scripts/pause-contract.ts --network polygon
```

2. **Announce Maintenance**

Template:
```
⚠️ MAINTENANCE MODE

We've detected an issue and have paused the contract
while we investigate. Your NFTs are safe. We'll update
you within 2 hours.
```

3. **Investigate Issue**
- Check error logs (Sentry, Railway)
- Review recent transactions
- Identify root cause

### Short-Term Fix (Day 1-2)

**Option 1: Bug Fix + Contract Upgrade**

If using upgradeable proxy:
1. Fix bug in new implementation
2. Test thoroughly on testnet
3. Deploy new implementation
4. Upgrade proxy
5. Unpause contract

**Option 2: Deploy New Contract**

If critical bug and not upgradeable:
1. Deploy new fixed contract
2. Migrate NFT ownership (if possible)
3. Update all environment variables
4. Communicate to users

### Long-Term (Week 1+)

1. Conduct incident post-mortem
2. Update testing procedures
3. Add monitoring to prevent recurrence
4. Compensate affected users (if applicable)

---

## Security Checklist

Before deploying to mainnet, ensure:

### Smart Contract Security

- [ ] OpenZeppelin contracts used (audited)
- [ ] No unsafe external calls
- [ ] Reentrancy protection
- [ ] Integer overflow protection (Solidity 0.8+)
- [ ] Access control on sensitive functions
- [ ] Events emitted for all state changes
- [ ] Pause mechanism (optional but recommended)
- [ ] Upgrade mechanism (if using proxies)

### Backend Security

- [ ] API rate limiting
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma does this)
- [ ] CORS configured correctly
- [ ] HTTPS enforced
- [ ] Environment variables secured
- [ ] No private keys in code

### Frontend Security

- [ ] No wallet private key handling
- [ ] Input sanitization
- [ ] XSS prevention
- [ ] CSRF protection (NextAuth handles this)
- [ ] Secure cookie settings

---

## Post-Mainnet Checklist

After successful mainnet deployment:

### Week 1

- [ ] Monitor contract events hourly
- [ ] Check error logs daily
- [ ] Respond to user support tickets
- [ ] Track minting rate
- [ ] Monitor gas costs

### Week 2-4

- [ ] Collect user feedback
- [ ] Plan bug fixes if needed
- [ ] Analyze user behavior
- [ ] Plan Phase 2 features

### Month 2+

- [ ] Review smart contract (any exploits discovered?)
- [ ] Optimize gas costs if possible
- [ ] Scale infrastructure if needed
- [ ] Plan marketing push

---

## Common Issues & Solutions

### Issue: High Gas Costs

**Solution:**
- Use gas optimization in contract (pack variables, reduce storage writes)
- Batch operations where possible
- Wait for low gas times (weekends, late nights UTC)
- Consider L2 with lower fees (already on Polygon, which is L2)

### Issue: Event Listener Missing Events

**Solution:**
- Increase RPC rate limit (upgrade Alchemy plan)
- Add retry logic for failed event fetches
- Use multiple RPC providers as fallbacks
- Add manual sync button in admin panel

### Issue: Contract Not Verified on PolygonScan

**Solution:**
```bash
# Manually verify with constructor arguments
npx hardhat verify --network polygon \
  --constructor-args scripts/constructor-args.js \
  0xYOUR_CONTRACT_ADDRESS
```

### Issue: Users on Wrong Network

**Solution:**
- Add network detection (see Phase 4.3)
- Auto-prompt network switch (wagmi `useSwitchNetwork`)
- Clear error messages

---

## Legal & Compliance Notes

**Disclaimer:** This section is not legal advice. Consult a lawyer.

**Considerations:**

1. **Securities Law**
   - Are NFTs securities? (Depends on jurisdiction)
   - Howey Test (US): Is there an expectation of profit?
   - Recommendation: Avoid "investment" language

2. **Terms of Service**
   - Clearly state NFTs are digital collectibles
   - No guarantees of value
   - Risk disclosures

3. **Privacy Policy**
   - GDPR compliance (if EU users)
   - Data collection transparency
   - User data rights

4. **Tax Implications**
   - NFT sales may be taxable
   - Users responsible for their own taxes
   - Consider adding tax disclaimer

---

## Conclusion

Mainnet migration is a **critical milestone** requiring careful planning and execution.

**Key Takeaways:**
- ✅ Audit smart contracts before deployment
- ✅ Test everything thoroughly on testnet
- ✅ Have a rollback plan
- ✅ Communicate clearly with users
- ✅ Monitor closely after launch

**When ready to deploy:**
1. Complete all checklist items
2. Get team sign-off
3. Schedule deployment during low-traffic time
4. Have all hands on deck for monitoring
5. Celebrate success! 🎉

---

**Remember:** Mainnet deployment is irreversible. When in doubt, wait and test more.

Good luck! ⚔️
