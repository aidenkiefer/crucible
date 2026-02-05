# Sprint 7: Security, Monitoring & Production Deployment

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Production-ready demo with security hardening, monitoring, and multi-instance deployment

**Duration:** Week 8-9
**Prerequisites:** Sprint 6 complete (multiplayer PvP + scaling infrastructure working)

**Focus Areas (from Architecture Audit):**
- Security: TLS, bundle checksums, comprehensive validation
- Monitoring: Error tracking, performance metrics, alerts
- Deployment: Load balancer, multi-instance, Redis cluster
- Reliability: Determinism testing, graceful failover
- Documentation: User guide, API docs, deployment guide
- Mainnet migration guide

---

## Task 0: TLS/WSS Configuration (2 hours)

**Goal:** Secure WebSocket connections with TLS

### Generate SSL Certificates

**For Development:**
```bash
# Self-signed cert (dev only)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

**For Production:**
- Use Let's Encrypt via Certbot
- Or managed certificates via Railway/Vercel

### Enable HTTPS on Game Server

**File:** `apps/game-server/src/index.ts` (update)

```typescript
import https from 'https'
import fs from 'fs'

const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH || './key.pem'),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH || './cert.pem'),
}

const httpServer = https.createServer(httpsOptions, app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  adapter: createAdapter(pubClient, subClient),
})
```

### Update Frontend WebSocket URL

**File:** `apps/web/hooks/useSocket.ts` (update)

```typescript
const socket = io(process.env.NEXT_PUBLIC_GAME_SERVER_URL, {
  secure: true, // Enable WSS
  rejectUnauthorized: process.env.NODE_ENV === 'production', // Verify cert in prod
})
```

### Verification

- [ ] WSS connections work (wss:// not ws://)
- [ ] Certificate valid in production
- [ ] Self-signed cert works in development
- [ ] No mixed content warnings

---

## Task 0.5: Bundle Version Checksums (1.5 hours)

**Goal:** Prevent client/server bundle mismatch

### Generate Bundle Hash

**File:** `apps/game-server/src/services/bundle-loader.ts` (update)

```typescript
import crypto from 'crypto'

export class BundleLoader {
  private bundleHash: string = ''

  async loadActiveBundle(): Promise<void> {
    // ... existing load logic ...

    // Generate hash of loaded bundle
    const bundleContent = JSON.stringify({
      equipment: this.equipmentTemplates,
      actions: this.actionTemplates,
    })

    this.bundleHash = crypto
      .createHash('sha256')
      .update(bundleContent)
      .digest('hex')

    console.log(`Bundle loaded with hash: ${this.bundleHash}`)
  }

  getBundleHash(): string {
    return this.bundleHash
  }
}
```

### Verify Bundle Hash on Connection

**File:** `apps/game-server/src/sockets/match-handlers.ts` (update)

```typescript
export function setupMatchHandlers(socket: Socket) {
  socket.on('match:join', (payload: JoinMatchPayload) => {
    const clientBundleHash = payload.bundleHash

    if (clientBundleHash !== bundleLoader.getBundleHash()) {
      socket.emit('match:error', {
        message: 'Bundle version mismatch. Please refresh.',
        code: 'BUNDLE_MISMATCH',
      })
      return
    }

    // ... existing join logic ...
  })
}
```

### Frontend Bundle Hash

**File:** `apps/web/lib/bundle-hash.ts`

```typescript
// Generated at build time from published bundle
export const BUNDLE_HASH = process.env.NEXT_PUBLIC_BUNDLE_HASH || 'dev'
```

**File:** `apps/web/hooks/useRealTimeMatch.ts` (update)

```typescript
useEffect(() => {
  socket?.emit('match:join', {
    matchId,
    bundleHash: BUNDLE_HASH,
  })
}, [socket, matchId])
```

### Build Script

**File:** `apps/web/scripts/generate-bundle-hash.js`

```javascript
const crypto = require('crypto')
const fs = require('fs')

// Read published bundle from Supabase Storage URL
// Generate hash, write to .env.local
```

### Verification

- [ ] Bundle hash generated on server startup
- [ ] Client sends bundle hash on connection
- [ ] Mismatch detected and rejected
- [ ] User prompted to refresh

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

**Game data bundle:** Ensure the **published game data bundle** (EquipmentTemplate + ActionTemplate exported to JSON/TS) is built and deployed so runtime loads from it; no live DB template queries in combat. See **docs/data-glossary.md** (authoring → publish → runtime) and **docs/features/equipment.md**.

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
   - Rate limiting on WebSocket events (done in Sprint 6)
   - Graceful shutdown handling

---

## Task 2.5: Monitoring & Alerting (3 hours)

**Goal:** Production monitoring for errors, performance, and server health

### Error Tracking (Sentry)

**Install Sentry:**
```bash
cd apps/game-server
pnpm add @sentry/node
cd ../web
pnpm add @sentry/nextjs
```

**Configure Game Server:**

**File:** `apps/game-server/src/index.ts` (update)

```typescript
import * as Sentry from '@sentry/node'

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of transactions
  })
}

// Wrap error handlers
app.use(Sentry.Handlers.errorHandler())
```

**Configure Frontend:**

**File:** `apps/web/sentry.client.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0, // Capture replays on errors
})
```

### Performance Monitoring

**File:** `apps/game-server/src/services/metrics.ts`

```typescript
export class MetricsCollector {
  private matchCount: number = 0
  private activeMatches: number = 0
  private tickLatencies: number[] = []

  recordMatchStart(): void {
    this.matchCount++
    this.activeMatches++
  }

  recordMatchEnd(): void {
    this.activeMatches = Math.max(0, this.activeMatches - 1)
  }

  recordTickLatency(latencyMs: number): void {
    this.tickLatencies.push(latencyMs)

    // Keep last 1000 samples
    if (this.tickLatencies.length > 1000) {
      this.tickLatencies.shift()
    }
  }

  getMetrics() {
    const avgLatency = this.tickLatencies.length > 0
      ? this.tickLatencies.reduce((a, b) => a + b) / this.tickLatencies.length
      : 0

    return {
      totalMatches: this.matchCount,
      activeMatches: this.activeMatches,
      avgTickLatency: avgLatency,
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
    }
  }
}

export const metrics = new MetricsCollector()
```

**Expose Metrics Endpoint:**

**File:** `apps/game-server/src/index.ts` (add route)

```typescript
app.get('/metrics', (req, res) => {
  res.json(metrics.getMetrics())
})

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
  })
})
```

### Alerts Configuration

Create alerts for:
- Error rate > 5% (Sentry)
- Average tick latency > 20ms (custom metric)
- Active matches > 500 per server (scale up trigger)
- CPU usage > 80% sustained
- Memory usage > 80%

### Verification

- [ ] Errors reported to Sentry
- [ ] Metrics endpoint returns data
- [ ] Health check responds
- [ ] Alerts configured (email/Slack)

---

## Task 2.75: Determinism Testing (2 hours)

**Goal:** Verify physics calculations are deterministic across runs

### Determinism Test Suite

**File:** `packages/shared/src/physics/__tests__/determinism.test.ts`

```typescript
import { Movement, Vector, Collision } from '../index'
import { PHYSICS_CONSTANTS } from '../constants'

describe('Determinism Tests', () => {
  test('vector calculations are deterministic', () => {
    const v1 = { x: 1.5, y: 2.7 }
    const v2 = { x: 3.2, y: 1.1 }

    // Run calculation multiple times
    const results = []
    for (let i = 0; i < 100; i++) {
      const result = Vector.normalize(Vector.add(v1, v2))
      results.push(result)
    }

    // All results should be identical
    for (let i = 1; i < results.length; i++) {
      expect(results[i].x).toBe(results[0].x)
      expect(results[i].y).toBe(results[0].y)
    }
  })

  test('position integration is deterministic', () => {
    const startPos = { x: 100, y: 200 }
    const velocity = { dx: 10, dy: -5 }
    const deltaTime = PHYSICS_CONSTANTS.TICK_INTERVAL / 1000

    const results = []
    for (let i = 0; i < 100; i++) {
      const result = Movement.integrate(startPos, velocity, deltaTime)
      results.push(result)
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i].x).toBe(results[0].x)
      expect(results[i].y).toBe(results[0].y)
    }
  })

  test('collision detection is deterministic', () => {
    const circle1 = { x: 100, y: 100, radius: 10 }
    const circle2 = { x: 115, y: 100, radius: 10 }

    const results = []
    for (let i = 0; i < 100; i++) {
      const result = Collision.circleCollision(circle1, circle2)
      results.push(result)
    }

    // All should be same collision state
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toBe(results[0])
    }
  })

  test('full match simulation is deterministic', () => {
    // Run simplified match simulation with fixed inputs
    const inputs = [
      { moveX: 1, moveY: 0 }, // tick 0
      { moveX: 0, moveY: 1 }, // tick 1
      { moveX: -1, moveY: 0 }, // tick 2
    ]

    const runSimulation = () => {
      let pos = { x: 100, y: 100 }

      for (const input of inputs) {
        const velocity = Movement.calculateVelocity(
          input,
          PHYSICS_CONSTANTS.PLAYER_SPEED
        )
        pos = Movement.integrate(
          pos,
          velocity,
          PHYSICS_CONSTANTS.TICK_INTERVAL / 1000
        )
      }

      return pos
    }

    const results = []
    for (let i = 0; i < 10; i++) {
      results.push(runSimulation())
    }

    // All final positions should be identical
    for (let i = 1; i < results.length; i++) {
      expect(results[i].x).toBeCloseTo(results[0].x, 10) // 10 decimal places
      expect(results[i].y).toBeCloseTo(results[0].y, 10)
    }
  })
})
```

### Run Tests

```bash
cd packages/shared
pnpm test determinism
```

### Verification

- [ ] All determinism tests pass
- [ ] No floating-point drift detected
- [ ] Calculations reproducible across runs

---

## Task 3: Multi-Instance Deployment with Load Balancer (6 hours)

**Goal:** Deploy multiple game server instances with Redis cluster and load balancer

### Redis Cluster Setup

**Option 1: Railway (Recommended)**

```bash
# Add Redis service to Railway project
railway add redis

# Get Redis URL
railway variables get REDIS_URL
```

**Option 2: Redis Cloud (Free Tier)**

1. Sign up at https://redis.com/try-free/
2. Create new database
3. Get connection URL
4. Add to environment variables

### Multi-Instance Game Server (Railway)

**Step 1: Configure for Multiple Instances**

**File:** `apps/game-server/railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 3,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Step 2: Environment Variables (All Instances)**

```bash
railway variables set REDIS_URL=<redis-url>
railway variables set DATABASE_URL=<supabase-url>
railway variables set FRONTEND_URL=https://your-app.vercel.app
railway variables set NODE_ENV=production
railway variables set SSL_ENABLED=true
```

**Step 3: Deploy Multiple Instances**

```bash
cd apps/game-server
railway up

# Scale to 3 instances
railway scale replicas=3
```

### Load Balancer Configuration

**Railway Built-in Load Balancing:**
- Automatically enabled for multi-instance deployments
- Round-robin load distribution
- Health checks on `/health` endpoint

**Custom NGINX (Alternative):**

**File:** `nginx.conf`

```nginx
upstream game_servers {
    # Sticky sessions based on IP hash
    ip_hash;

    server game-server-1:3001;
    server game-server-2:3001;
    server game-server-3:3001;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://game_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

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
- `NEXT_PUBLIC_GAME_SERVER_URL` (load balancer URL)
- `NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS`
- `NEXT_PUBLIC_BUNDLE_HASH` (from Task 0.5)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `SENTRY_DSN`
- OAuth credentials (Google, Twitter)

**Step 3: Deploy**

```bash
vercel --prod
```

### Database (Already on Supabase)

- No deployment needed
- Verify production connection string
- Run final migrations

### Deployment Verification

- [ ] 3 game server instances running
- [ ] Redis cluster accessible from all instances
- [ ] Load balancer distributing connections
- [ ] Health checks passing
- [ ] Frontend connects to load balancer
- [ ] Sticky sessions working (same user → same server)
- [ ] HTTPS/WSS working
- [ ] Monitoring/Sentry configured

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
