# Sprint 7: Polish, Testing & Deployment

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Production-ready demo deployed with documentation

**Duration:** Week 8-9
**Prerequisites:** Sprint 6 complete (multiplayer PvP working)

**Focus Areas:**
- Bug fixes and edge cases
- Performance optimization
- Deployment to production
- Documentation
- Mainnet migration guide

---

## Task 1: Bug Fixes & Edge Cases (8 hours)

### Common Issues to Address

**Disconnection Handling**
- Player disconnects mid-match → forfeit after 30 seconds
- Reconnection flow for PvP matches

**Race Conditions**
- Multiple actions submitted in same tick
- Match starting before both players ready
- Concurrent equipment equipping

**Validation**
- Insufficient stamina check client-side
- Invalid action rejection
- Wallet ownership verification

**UI/UX Polish**
- Loading states for all async operations
- Error messages user-friendly
- Smooth transitions between screens
- Responsive design (mobile-friendly)

---

## Task 2: Performance Optimization (4 hours)

### Frontend Optimizations

1. **Canvas Rendering**
   - Use `requestAnimationFrame` properly
   - Minimize redraws
   - Sprite caching

2. **React Optimizations**
   - `useMemo` for expensive calculations
   - `useCallback` for event handlers
   - Code splitting with `next/dynamic`

3. **Network**
   - Debounce action submissions
   - Compress WebSocket messages
   - Cache static assets

### Backend Optimizations

1. **Database**
   - Add indexes on frequently queried fields
   - Optimize N+1 queries with `include`
   - Connection pooling

2. **Game Server**
   - Memory cleanup for completed matches
   - Rate limiting on WebSocket events
   - Graceful shutdown handling

---

## Task 3: Deployment to Vercel + Railway (6 hours)

### Frontend Deployment (Vercel)

**Step 1: Configure Vercel Project**

```bash
cd apps/web
vercel
```

**Step 2: Environment Variables**

Add to Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GAME_SERVER_URL`
- `NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- OAuth credentials

**Step 3: Deploy**

```bash
vercel --prod
```

### Game Server Deployment (Railway)

**Step 1: Create Railway Project**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd apps/game-server
railway init
```

**Step 2: Add Environment Variables**

```bash
railway variables set DATABASE_URL=<supabase-url>
railway variables set POLYGON_MUMBAI_RPC_URL=<rpc-url>
railway variables set NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=<contract-address>
```

**Step 3: Deploy**

```bash
railway up
```

**Step 4: Get Public URL**

```bash
railway domain
```

Update frontend env: `NEXT_PUBLIC_GAME_SERVER_URL`

### Database (Already on Supabase)

- No deployment needed
- Verify production connection string
- Run final migrations

---

## Task 4: Testing (4 hours)

### Manual QA Checklist

**Authentication Flow**
- [ ] Sign in with Google
- [ ] Sign in with Twitter
- [ ] Connect wallet
- [ ] Link wallet to account

**NFT Minting**
- [ ] Mint Duelist
- [ ] Mint Brute
- [ ] Mint Assassin
- [ ] NFT appears in wallet
- [ ] Blockchain event synced

**Combat (CPU)**
- [ ] Start CPU match
- [ ] Submit all action types
- [ ] Win match → XP awarded
- [ ] Lose match → XP awarded
- [ ] Loot drops

**Progression**
- [ ] Level up at correct XP
- [ ] Skill points awarded
- [ ] Unlock skills
- [ ] Equip items
- [ ] Stats update in combat

**Multiplayer**
- [ ] Add friend
- [ ] Accept friend request
- [ ] Challenge friend
- [ ] Accept challenge
- [ ] PvP match works
- [ ] Quick Match finds opponent

**Edge Cases**
- [ ] Disconnect during match
- [ ] Submit action with insufficient stamina
- [ ] Equip item already equipped
- [ ] Challenge offline friend

### Automated Tests

Run existing unit tests:

```bash
cd packages/shared
pnpm test

cd ../../apps/game-server
pnpm test
```

Expected: All tests pass

---

## Task 5: Documentation (6 hours)

### User Guide

**File:** `docs/guides/user-guide.md`

1. Getting Started
2. Creating Your First Gladiator
3. Fighting CPU Opponents
4. Leveling Up and Skills
5. Equipment and Crafting
6. Playing with Friends
7. Quick Match

### API Documentation

**File:** `docs/api/rest-api.md`

Document all REST endpoints:
- Authentication
- Gladiators
- Equipment
- Friends
- Challenges
- Matches

**File:** `docs/api/websocket-protocol.md`

Document WebSocket events:
- Connection
- Match events
- Matchmaking
- Actions

### Deployment Guide

**File:** `docs/guides/deployment-guide.md`

- Vercel setup
- Railway setup
- Environment variables
- Domain configuration
- SSL certificates
- Monitoring setup

---

## Task 6: Mainnet Migration Guide (2 hours)

**File:** `docs/mainnet-migration.md`

```markdown
# Mainnet Migration Guide

## Overview

This guide walks through deploying Gladiator Coliseum to mainnet (Polygon or Base).

⚠️ **WARNING:** This involves real funds and should only be done after thorough testing.

## Prerequisites

- [ ] All features tested on testnet
- [ ] Smart contracts audited (recommend: OpenZeppelin Defender)
- [ ] Gas costs estimated
- [ ] Mainnet RPC provider (Alchemy, Infura)
- [ ] Deployer wallet funded with MATIC/ETH

## Step 1: Update Contract Configuration

**File:** `contracts/hardhat.config.ts`

\`\`\`typescript
networks: {
  polygon: {
    url: process.env.POLYGON_RPC_URL,
    accounts: [process.env.MAINNET_PRIVATE_KEY],
    chainId: 137,
  },
  base: {
    url: process.env.BASE_RPC_URL,
    accounts: [process.env.MAINNET_PRIVATE_KEY],
    chainId: 8453,
  },
}
\`\`\`

## Step 2: Deploy Contracts

\`\`\`bash
cd contracts

# Polygon mainnet
pnpm hardhat run scripts/deploy.ts --network polygon

# OR Base mainnet
pnpm hardhat run scripts/deploy.ts --network base
\`\`\`

Save the contract address!

## Step 3: Verify Contract

\`\`\`bash
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
\`\`\`

## Step 4: Update Frontend Environment

\`\`\`bash
# Update Vercel environment variables
NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=<mainnet-address>
POLYGON_RPC_URL=<mainnet-rpc>
\`\`\`

## Step 5: Update Event Listener

Point blockchain listener to mainnet RPC in game server.

## Step 6: Test Thoroughly

- [ ] Mint test NFT on mainnet
- [ ] Verify metadata
- [ ] Test combat with mainnet gladiator
- [ ] Verify all events captured

## Step 7: Announce to Users

- Update website to show mainnet status
- Warn users about gas costs
- Provide clear instructions

## Cost Estimates

**Polygon Mainnet:**
- Contract deployment: ~$1-5 (varies with gas)
- Minting per NFT: ~$0.01-0.10

**Base Mainnet:**
- Contract deployment: ~$2-10
- Minting per NFT: ~$0.10-0.50

## Rollback Plan

If issues arise:
1. Pause contract (add pause functionality)
2. Announce maintenance
3. Fix issues on testnet
4. Redeploy if necessary
5. Resume

## Security Checklist

- [ ] Contract audited
- [ ] Admin keys secured (hardware wallet)
- [ ] Rate limiting enabled
- [ ] Monitoring alerts configured
- [ ] Bug bounty program (optional)

---

**DO NOT RUSH MAINNET DEPLOYMENT**

Test extensively on testnet first!
\`\`\`

---

## Task 7: Demo Video (2 hours)

Record walkthrough demonstrating:

1. Sign in
2. Mint Gladiator
3. Fight CPU opponent
4. Level up and unlock skill
5. Get loot drop
6. Equip item
7. Challenge friend
8. PvP match

Edit and upload to YouTube

---

## Verification Checklist

- [ ] All bugs from testing fixed
- [ ] Performance optimizations applied
- [ ] Frontend deployed to Vercel
- [ ] Game server deployed to Railway
- [ ] All environment variables set
- [ ] HTTPS working
- [ ] User guide written
- [ ] API documentation complete
- [ ] Deployment guide written
- [ ] Mainnet migration guide written
- [ ] Demo video recorded

---

## Post-Sprint 6

**Demo Complete! 🎉**

Project Status:
- ✅ Authentication working
- ✅ NFT minting functional
- ✅ CPU combat smooth
- ✅ Progression and loot systems
- ✅ PvP multiplayer working
- ✅ Deployed to production
- ✅ Documented

**Next Steps (Post-Demo):**
- Gather user feedback
- Plan Phase 2 features
- Consider mainnet deployment
- Iterate on combat balance
