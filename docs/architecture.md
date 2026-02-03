# Gladiator Coliseum - Architecture Documentation

## System Overview

Gladiator Coliseum is built as a **three-tier architecture** with clear separation of concerns:

1. **Frontend** - Next.js web application
2. **Backend** - Game server + Supabase database
3. **Blockchain** - Smart contracts on Polygon Mumbai testnet

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Next.js    │  │  WebSocket   │  │   Wallet     │          │
│  │   Frontend   │  │   Client     │  │   (MetaMask) │          │
│  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘          │
└──────────┼─────────────────┼─────────────────┼─────────────────┘
           │                 │                 │
           │ HTTPS           │ WSS             │ JSON-RPC
           ▼                 ▼                 ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│    VERCEL        │  │  GAME SERVER     │  │  BLOCKCHAIN      │
│                  │  │  (Railway)       │  │  (Polygon Mumbai)│
│ - Next.js App    │  │                  │  │                  │
│ - API Routes     │  │ - Socket.io      │  │ - GladiatorNFT   │
│ - SSR/SSG        │  │ - Combat Engine  │  │   Contract       │
│ - Static Assets  │  │ - Matchmaking    │  │ - Events         │
└────────┬─────────┘  │ - CPU AI         │  └────────┬─────────┘
         │            │ - Match Manager  │           │
         │            └────────┬─────────┘           │
         │                     │                     │
         │                     │                     │
         └──────────┬──────────┴──────────┬──────────┘
                    │                     │
                    ▼                     ▼
            ┌───────────────┐    ┌────────────────┐
            │   SUPABASE    │    │ Event Listener │
            │               │    │ (Blockchain    │
            │ - PostgreSQL  │◄───┤  Indexer)      │
            │ - Auth        │    └────────────────┘
            │ - REST API    │
            └───────────────┘
```

---

## Component Breakdown

### 1. Frontend (Next.js)

**Location:** `apps/web/`

**Responsibilities:**
- User interface and experience
- Wallet connection management
- WebSocket client for real-time combat
- Canvas rendering for combat animations
- API communication with Supabase

**Key Technologies:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- wagmi/viem (Web3)
- Socket.io-client
- NextAuth.js

**Key Pages:**
- `/` - Home
- `/auth/signin` - Authentication
- `/mint` - NFT minting
- `/match/[matchId]` - Combat arena
- `/inventory` - Equipment management
- `/quick-match` - Matchmaking
- `/friends` - Social features
- `/admin` - Admin dashboard

**State Management:**
- React Context for global state
- React Query for server state
- Local state with `useState` for component state

---

### 2. Game Server (Node.js)

**Location:** `apps/game-server/`

**Responsibilities:**
- Real-time combat simulation
- WebSocket connection management
- Matchmaking queue
- CPU AI decision-making
- Match state persistence
- XP and loot generation

**Key Technologies:**
- Node.js + TypeScript
- Express (HTTP endpoints)
- Socket.io (WebSocket)
- Prisma (database client)

**Key Services:**

#### MatchManager
- Creates and manages active matches
- Coordinates match lifecycle (start → tick → complete)
- Broadcasts state updates to clients

#### CombatEngine
- Server-authoritative combat simulation
- Processes actions every 1000ms (tick rate)
- Calculates damage, stamina, health
- Determines match winner

#### MatchmakingService
- Maintains queue of players seeking matches
- Pairs players based on availability (FIFO)
- Creates PvP match instances

#### CpuAI
- Makes decisions for CPU opponents
- Simple decision tree based on health/stamina
- Three difficulty variants (normal, aggressive, defensive)

#### ProgressionService
- Awards XP after matches
- Handles leveling up
- Manages skill point distribution

#### LootService
- Generates equipment drops
- Determines rarity (Common/Rare/Epic)
- Creates items with randomized stats

#### BlockchainListener
- Listens to smart contract events
- Syncs minted NFTs to database
- Indexes ownership changes

---

### 3. Database (Supabase / PostgreSQL)

**Location:** `packages/database/`

**Schema Overview:**

```
User
├── Gladiator (1:N)
│   ├── Equipment (equipped weapon)
│   ├── Equipment (equipped armor)
│   └── Match (as player 1 or 2)
├── Equipment (N, owned items)
├── Match (as player 1 or 2)
├── Friend (N:N with other Users)
└── Challenge (sent or received)
```

**Key Models:**

**User**
- Social auth data (email, username)
- Wallet address (linked)
- Created timestamp

**Gladiator**
- Token ID (unique, from blockchain)
- Owner (User)
- Class (Duelist, Brute, Assassin)
- Base stats (strength, agility, endurance, technique)
- Level and XP
- Equipped gear
- Unlocked skills

**Equipment**
- Owner (User)
- Type (weapon, armor)
- Rarity (Common, Rare, Epic)
- Stat bonuses

**Match**
- Players (1 or 2)
- Gladiators (1 or 2)
- Winner
- Match log (JSON)
- Duration

**Friend**
- User pair
- Status (pending, accepted)

**Challenge**
- Challenger and opponent
- Gladiators
- Match (linked when accepted)

---

### 4. Blockchain Layer

**Location:** `contracts/`

**Smart Contracts:**

#### GladiatorNFT (ERC-721)

**Key Functions:**
- `mint(class)` - Mint new Gladiator NFT
- `getGladiator(tokenId)` - Fetch Gladiator stats
- `ownerOf(tokenId)` - Get owner address

**Events:**
- `GladiatorMinted(tokenId, owner, class)` - Emitted on mint

**On-Chain Data:**
- Token ID
- Class type
- Base stats (generated pseudo-randomly at mint)
- Mint timestamp

**Off-Chain Data (Database):**
- Level, XP
- Unlocked skills
- Match history
- Equipped gear

**Deployment:**
- Testnet: Polygon Mumbai
- Mainnet (future): Polygon or Base

**Metadata:**
- Placeholder: Centralized API
- Production: IPFS via Pinata

---

## Data Flow Diagrams

### Minting Flow

```
User → Connect Wallet → Frontend
         ↓
Frontend → Call mint() → Smart Contract
         ↓
Smart Contract → Emit GladiatorMinted → Blockchain
         ↓
Event Listener → Capture event → Game Server
         ↓
Game Server → Create Gladiator → Database
         ↓
Frontend → Poll/Fetch → Display NFT
```

### Combat Flow (CPU Match)

```
User → Select Gladiator → Frontend
         ↓
Frontend → Request CPU Match → Game Server
         ↓
Game Server → Create MatchInstance → Memory
         ↓
MatchInstance → Start tick loop (1000ms) → Combat Engine
         ↓ (every tick)
Combat Engine → Process actions → Update state
         ↓
Game Server → Broadcast state → WebSocket
         ↓
Frontend → Receive state → Render arena
         ↓
User → Submit action → Frontend
         ↓
Frontend → Send action → WebSocket → Game Server
         ↓
Game Server → Queue action → MatchInstance
         ↓ (next tick)
Combat Engine → Apply action → Calculate damage
         ↓
[Repeat until health = 0]
         ↓
Game Server → Save match → Database
Game Server → Award XP → Database
Game Server → Generate loot → Database
         ↓
Frontend → Show result → User
```

### PvP Match Flow

```
Player 1 → Join Queue → Game Server
Player 2 → Join Queue → Game Server
         ↓
Matchmaking → Pair players → Game Server
         ↓
Game Server → Create PvP Match → Memory
         ↓
Both Players → Join match room → WebSocket
         ↓
MatchInstance → Tick loop → Both players submit actions
         ↓
Combat Engine → Process both actions → Update state
         ↓
Game Server → Broadcast state → Both clients
         ↓
[Repeat until winner determined]
         ↓
Game Server → Save match → Database
Game Server → Award XP → Both gladiators
```

---

## Security Considerations

### Frontend
- Input validation on all forms
- Sanitize user-generated content
- HTTPS only
- Secure wallet connection (no private key handling)

### Game Server
- Server-authoritative combat (no client trust)
- Rate limiting on WebSocket events
- Action validation (stamina, cooldowns)
- Match state integrity checks

### Smart Contracts
- OpenZeppelin templates (audited)
- Minimal on-chain logic
- Ownership verification
- Event emission for all state changes

### Database
- Row Level Security (RLS) on Supabase
- Parameterized queries (Prisma prevents SQL injection)
- Encrypted connections
- Environment variables for secrets

---

## Performance Optimizations

### Frontend
- Code splitting (Next.js dynamic imports)
- Image optimization (next/image)
- Canvas rendering optimizations (RAF, dirty rectangles)
- WebSocket message compression

### Game Server
- Connection pooling (Prisma)
- Match instance cleanup
- Indexed database queries
- In-memory match state (not DB-backed during combat)

### Database
- Indexes on: `User.walletAddress`, `Gladiator.tokenId`, `Match.createdAt`
- Connection pooling
- Query optimization (avoid N+1 with `include`)

---

## Scalability Considerations

### Current Architecture (Demo)
- Single game server instance
- ~100 concurrent matches supported
- Supabase free tier (500 MB, 2 GB transfer)

### Future Scaling (Production)

**Horizontal Scaling:**
- Multiple game server instances behind load balancer
- Redis for shared matchmaking queue
- Sticky sessions for WebSocket connections

**Database Scaling:**
- Supabase Pro tier (8 GB, 250 GB transfer)
- Read replicas for match history queries
- Separate write/read connections

**Blockchain Scaling:**
- Batch minting (mint multiple NFTs in one transaction)
- Layer 2 for lower fees (already using Polygon)
- Caching blockchain data to reduce RPC calls

---

## Monitoring & Observability

**Metrics to Track:**
- Active WebSocket connections
- Match creation rate
- Average match duration
- API response times
- Database query performance
- Blockchain event processing lag

**Tools (Future):**
- Vercel Analytics (frontend)
- Railway Metrics (game server)
- Supabase Dashboard (database)
- Sentry (error tracking)
- OpenTelemetry (distributed tracing)

---

## Deployment Architecture

### Development

```
Local Machine
├── Frontend: localhost:3000 (pnpm dev)
├── Game Server: localhost:4000 (pnpm dev)
├── Database: Supabase Cloud (dev project)
└── Blockchain: Hardhat local node or Mumbai testnet
```

### Production

```
Vercel (Frontend)
├── Domain: app.gladiator-coliseum.com
├── SSL: Auto (Vercel)
└── CDN: Global edge network

Railway (Game Server)
├── Domain: api.gladiator-coliseum.com
├── SSL: Auto (Railway)
└── Region: us-west-1

Supabase (Database)
├── Region: us-west-1
├── SSL: Enforced
└── Backup: Daily

Polygon Mumbai (Blockchain)
├── RPC: Alchemy or Infura
└── Contract: 0x...
```

---

## Technology Choices Rationale

### Why Next.js?
- SSR for SEO and fast initial load
- API routes for simple backends
- Great DX with TypeScript
- Vercel deployment (zero config)

### Why Socket.io over raw WebSockets?
- Auto-reconnection
- Room-based broadcasting
- Fallback to HTTP long-polling
- Better DX

### Why Supabase over self-hosted Postgres?
- Fast setup (Sprint 0)
- Built-in auth (less code)
- Free tier generous
- Row Level Security

### Why Polygon Mumbai over Ethereum Sepolia?
- Lower fees (even on testnet)
- Faster block times (2 seconds vs 12 seconds)
- Polygon is production target

### Why Prisma over raw SQL?
- Type safety with TypeScript
- Migration management
- Prevents SQL injection
- Great DX

---

## Future Architecture Enhancements

### Phase 2 (Post-Demo)

1. **Marketplace Service**
   - Separate microservice for equipment trading
   - On-chain equipment NFTs (ERC-1155)

2. **Tournament Service**
   - Bracket generation
   - Scheduled matches
   - Prize distribution

3. **Analytics Service**
   - Player statistics
   - Combat balance analysis
   - Economy monitoring

4. **Notification Service**
   - Push notifications (PWA)
   - Email notifications
   - Discord webhooks

5. **Mobile Apps**
   - React Native for iOS/Android
   - Share game logic with web

---

## Conclusion

This architecture prioritizes:
- **Simplicity** - Easy to understand and maintain
- **Scalability** - Can grow with user base
- **Security** - Server-authoritative, validated actions
- **Developer Experience** - Modern tools, TypeScript everywhere
- **Cost Efficiency** - Free tiers for demo, pay-as-you-grow

The modular design allows independent scaling and iteration of each component.
