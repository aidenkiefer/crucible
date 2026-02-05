# Gladiator Coliseum - Master Implementation Plan

**Project:** Competitive 1v1 arena combat game with NFT Gladiators
**Timeline:** 4-6 weeks
**Team Size:** 2-3 developers
**Status:** In progress — Sprint 0, 1, 2, 2.5 complete; Sprint 3 (Frontend Real-Time Combat UI) next

---

## Project Overview

### Goal
Build a working demo of Gladiator Coliseum proving:
1. The combat loop is fun and engaging
2. NFT asset ownership integrates cleanly
3. Multiplayer works smoothly without heavy server load

### Success Criteria
- User can mint a Gladiator NFT
- User can equip Gladiators with gear
- User can fight CPU opponents with smooth animations
- User can enter Quick Match against other players
- User can challenge friends to battles
- Deterministic, server-authoritative combat outcomes
- Gladiators level up and unlock skill trees
- Loot drops with rarity tiers and crafting system

---

## Architecture Summary

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- React 18
- TailwindCSS
- wagmi + viem (Web3)
- NextAuth.js (Social auth)
- Socket.io-client (WebSocket)
- Canvas API (2D rendering)

**Backend:**
- Supabase (Postgres + Auth + Realtime)
- Node.js + TypeScript (Game Server)
- Socket.io (WebSocket server)
- Express (REST API for game logic)
- Prisma (ORM)

**Blockchain:**
- Solidity (Smart contracts)
- Hardhat (Development framework)
- OpenZeppelin (Contract templates)
- ethers.js (Blockchain interaction)
- Polygon Mumbai Testnet (Deployment target)

**Infrastructure:**
- Vercel (Frontend hosting)
- Railway/Render (Game server hosting)
- Supabase Cloud (Database)
- IPFS/Pinata (NFT metadata - optional for demo)

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI/Canvas  │  │  WebSocket   │  │   Wallet     │      │
│  │   Renderer   │  │   Client     │  │   Connect    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│   Supabase   │    │   Game Server    │    │  Blockchain  │
│              │    │                  │    │              │
│ - Postgres   │    │ - WebSocket      │    │ - NFT        │
│ - Auth       │    │ - Combat Engine  │    │   Contract   │
│ - REST API   │    │ - Matchmaking    │    │ - Events     │
│              │    │ - CPU AI         │    │              │
└──────────────┘    └──────────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Event Listener   │
                    │  (Blockchain      │
                    │   Indexer)        │
                    └───────────────────┘
```

---

## Sprint Breakdown (7 Sprints)

### Sprint 0: Project Setup & Infrastructure (Week 1)
**Goal:** Set up development environment and core infrastructure

**Deliverables:**
- Repository structure and monorepo setup
- Supabase project and database schema
- Smart contract scaffold and local testing
- Next.js frontend scaffold
- Game server scaffold
- CI/CD pipeline basics
- Developer documentation

**Team Split:**
- Dev 1: Frontend + Supabase setup
- Dev 2: Smart contracts + blockchain tooling
- Dev 3: Game server + WebSocket infrastructure

### Sprint 1: Core Systems - Authentication & NFT Minting (Week 2)
**Goal:** Users can authenticate and mint Gladiators

**Deliverables:**
- Social auth (Google/Twitter) working
- Wallet connection and linking
- Gladiator NFT contract deployed to testnet
- Minting UI and flow
- NFT metadata generation
- Blockchain event listener
- Basic admin panel

**Team Split:**
- Dev 1: Auth integration + wallet linking
- Dev 2: Smart contract deployment + minting UI
- Dev 3: Event listener + admin panel

### Sprint 2: Combat System - CPU Battles (Week 3)
**Goal:** Players can fight CPU opponents with real-time combat

**Deliverables:**
- Real-time combat engine (20Hz server tick)
- Continuous WASD movement with physics
- Attack and dodge roll actions (Sword weapon)
- Stamina and HP systems with stat scaling (CON, STR, DEX, SPD, DEF)
- Dodge roll with i-frames (deterministic, no RNG)
- CPU AI for movement and combat decisions
- Match state management at 20Hz
- Combat result persistence with event log

**Team Split:**
- Dev 1: Real-time combat engine + physics
- Dev 2: CPU AI for real-time movement + actions
- Dev 3: Match management + WebSocket handlers

### Sprint 2.5: Admin UI — Game Data Authoring (inserted)
**Goal:** Content authors can create, validate, publish, and activate game data bundles; game server loads published data at runtime.

**Deliverables (complete):**
- User `isAdmin` flag and middleware protecting `/admin/*`
- Admin UI: dashboard, bundles (create/clone, validate, publish, activate), equipment templates CRUD, action templates CRUD
- Validation engine (keys, refs, JSON, slot/type rules)
- Export to Supabase Storage (`gamedata` bucket); manifest + equipment/actions JSON
- BundleLoader on game server: load active bundle at startup, cache templates in memory
- Seed script for demo bundle (`pnpm seed:admin`)

See **docs/SPRINT-2.5-SUMMARY.md** and **docs/features/admin-ui.md**.

### Sprint 3: Frontend - Real-Time Combat UI (Week 4-5)
**Goal:** Real-time 2D combat visualization with WASD controls

**Deliverables:**
- Canvas-based arena renderer (60 FPS)
- Real-time WASD movement input handling
- Mouse aim for facing direction
- Client prediction for player movement
- Interpolation for opponent movement
- Gladiator sprite rendering (circles with facing indicators)
- HP/stamina bars above units
- Match HUD with cooldown indicators
- Victory/defeat screens

**Team Split:**
- Dev 1: Canvas rendering + 60 FPS render loop
- Dev 2: Input handling (WASD + mouse) + client prediction
- Dev 3: WebSocket integration + state interpolation

### Sprint 4: Weapons & Projectiles (Week 5-6)
**Goal:** Implement additional weapon types and projectile system

**Deliverables:**
- Weapon system with 4 types (Sword, Spear, Bow, Dagger)
- Different attack patterns per weapon (arc, thrust, projectile, quick)
- Server-side projectile simulation
- Client-side projectile rendering
- Weapon switching UI
- Weapon-specific damage scaling (STR/DEX)
- Weapon-specific cooldowns and stamina costs

**Team Split:**
- Dev 1: Weapon system + attack patterns
- Dev 2: Projectile system (server + client)
- Dev 3: Weapon UI + switching

### Sprint 5: Progression & Loot Systems + Match Persistence (Week 6-7)
**Goal:** Gladiators level up, unlock skills, and earn loot; matches persist for progression

**Deliverables:**
- **Match persistence:** Store match results (winner, duration, events)
- **Match history:** UI for viewing past matches
- XP system and leveling (awarded after match persistence)
- Skill tree (3 skills per Gladiator class)
- Equipment system (weapons, armor) with slot-based equipping
- Loot generation engine (Common/Rare/Epic)
- Crafting system (combine items)
- Inventory UI
- Equipment screen

**Architecture Changes:**
- Transition from ephemeral to persistent matches
- Match results written to DB after completion
- Foundation for disconnect handling (Sprint 6)

**Team Split:**
- Dev 1: Match persistence + progression system + skill tree logic
- Dev 2: Loot engine + crafting
- Dev 3: Inventory + equipment UI + match history

### Sprint 6: Multiplayer PvP + Production Scaling (Week 7-8)
**Goal:** Real-time PvP combat with matchmaking; production-ready scaling infrastructure

**Deliverables:**
- **Scaling Infrastructure (Architecture Audit):**
  - Redis pub/sub for cross-server coordination
  - Sticky sessions via socket.io-redis adapter
  - 60Hz internal simulation, 20Hz broadcast (improved hit detection)
  - Client interpolation for projectiles and opponents
  - Input validation and rate limiting (anti-cheat)
  - Match logging for disputes (optional: headless validator)
- **PvP Features:**
  - Matchmaking queue system
  - Friend system (add/remove friends)
  - Challenge creation and acceptance
  - Dual-player WebSocket synchronization
  - PvP match handling (2 human inputs per tick)
  - Match history (uses Sprint 5 persistence)
  - Leaderboard (simple win/loss ranking)
- **Reliability:**
  - Disconnect handling (30s reconnection window)
  - State snapshots for reconnection
  - Graceful server failover

**Architecture Changes:**
- Horizontal scaling support
- Improved tick rate (60Hz internal)
- Persistence snapshots for disconnects
- Input validation layer

**Team Split:**
- Dev 1: Scaling infrastructure (Redis, sticky sessions, tick rate upgrade)
- Dev 2: PvP matchmaking + friend system + challenges
- Dev 3: Match history + leaderboard + disconnect handling

### Sprint 7: Polish, Security & Production Deployment (Week 8-9)
**Goal:** Production-ready demo deployed with security and monitoring

**Deliverables:**
- **Security & Reliability (Architecture Audit):**
  - TLS for all WebSocket connections
  - Bundle version checksums (prevent client/server mismatch)
  - Comprehensive input validation (stamina, cooldowns, ranges)
  - Rate limiting on client inputs (anti-cheat)
  - Determinism testing (floating-point edge cases)
  - Monitoring and alerting (Sentry, Datadog, or similar)
- **Deployment:**
  - Load balancer configuration (sticky sessions)
  - Multi-instance game server deployment
  - Redis cluster setup
  - HTTPS/WSS certificates
  - Environment-specific configs (staging + prod)
- **Polish:**
  - Bug fixes and edge case handling
  - Unit tests for critical game logic
  - Performance optimization (real-time combat, rendering)
  - User-facing documentation
  - Mainnet migration guide
  - Demo video/walkthrough

**Team Split:**
- All devs: Bug fixing, testing, polish
- Dev 1: Frontend deployment + TLS + monitoring + docs
- Dev 2: Contract audit + mainnet guide + security testing
- Dev 3: Game server deployment (multi-instance) + Redis + load balancer

---

## Key Design Decisions

### 1. Backend Technology: Full TypeScript Stack
**Decision:** Use Node.js + TypeScript for all backend services

**Rationale:**
- Shared types between frontend/backend (game state, API contracts)
- Single language reduces context switching
- Excellent WebSocket ecosystem (Socket.io)
- Type safety for combat calculations

**Alternative Considered:** Python + FastAPI (better for heavy numerical work, but adds complexity)

### 2. Blockchain: Testnet Only for Demo
**Decision:** Deploy to Polygon Mumbai testnet

**Rationale:**
- Free transactions, fast iteration
- Real blockchain environment without mainnet risk
- Easy for demo users (no real funds needed)

**Post-Demo Path:** Migration guide will document mainnet deployment (Polygon or Base)

### 3. Combat System: Real-Time with Server-Authoritative Simulation
**Decision:** Real-time combat with continuous movement, server-authoritative simulation (demo: 20Hz, production: 60Hz internal + 20Hz broadcast)

**Rationale:**
- ROTMG-inspired "bullet-hell roguelike" feel with free movement
- More engaging and skill-based than turn-based
- WASD movement + mouse aim creates action game feel
- **Demo (Sprint 1-5):** 20Hz simulation + broadcast (simpler, proves mechanics)
- **Production (Sprint 6+):** 60Hz internal simulation for precise hit detection, 20Hz broadcast for network efficiency
- Client prediction provides lag-free local movement (Sprint 3.5)
- Client interpolation for smooth opponent rendering
- Server authority prevents cheating

**Key Features:**
- Continuous 2D movement (WASD/arrows)
- Weapon-based attacks with cooldowns
- Dodge roll with deterministic i-frames (no RNG)
- Server-authoritative positions, damage, hit detection
- Client interpolation for smooth opponent/projectile movement
- Input validation and rate limiting (anti-cheat)
- Deterministic floating-point physics

**Scaling Considerations (Architecture Audit):**
- Increase tick rate to 60Hz for production (better hit detection)
- Throttle broadcast to 20Hz (network efficiency)
- Input buffering and validation server-side
- Fixed timestep simulation for determinism

**Alternative Considered:** Turn-based with 1000ms ticks (simpler but less engaging)

### 4. Art Strategy: Programmer Art First
**Decision:** Use simple geometric shapes and placeholder sprites for demo

**Rationale:**
- Unblocks development (no artist dependency)
- Proves mechanics before investing in art
- Easier to iterate on animations

**Post-Demo Path:** Replace with custom pixel art sprites

### 5. Authentication: Social Auth + Wallet Linking
**Decision:** Login with Google/Twitter, link wallet afterward for NFT features

**Rationale:**
- Lower friction onboarding (non-crypto users)
- Users can play before connecting wallet
- Wallet only required for minting/ownership

**Flow:**
1. User signs in with social account
2. User plays with non-NFT gladiator (tutorial)
3. User prompted to link wallet to mint

### 6. Database: Supabase
**Decision:** Use Supabase for all data persistence

**Rationale:**
- Fast setup (day 1 productivity)
- Postgres + Auth + Realtime in one service
- Generous free tier
- Built-in Row Level Security

**Schema Ownership:** Use Prisma for migrations and type generation

### 7. Game Server: Separate Node.js Service
**Decision:** Run game server separately from Next.js

**Rationale:**
- Next.js API routes not ideal for WebSocket long-polling
- Independent scaling (game server can scale separately)
- Clearer separation of concerns

**Deployment:** Railway or Render for game server, Vercel for frontend

### 8. Match Persistence: Ephemeral Demo → Persistent Production
**Decision:** Matches ephemeral in demo (Sprint 1-4), add persistence in Sprint 5 for progression/loot

**Rationale:**
- **Demo (Sprint 1-4):** Ephemeral matches
  - Faster iteration (no DB schema for matches)
  - Simpler server (no persistence layer during combat)
  - Focus on proving combat mechanics are fun
- **Sprint 5+:** Minimal persistence
  - Match results stored after completion
  - Enables XP/loot rewards
  - Enables match history
  - Foundation for disconnect handling (Sprint 6)

**What Gets Persisted (Sprint 5+):**
- Match results: winner, duration, basic stats
- Events log: compressed for potential replay/debugging
- XP/loot awards: tied to match completion

**What Stays Ephemeral:**
- Active match state (in-memory only during combat)
- Real-time tick data (not written to DB every 50ms)

**Future Considerations:**
- Disconnect handling: snapshot state for reconnection (Sprint 6)
- Dispute resolution: full event logs for high-stakes matches
- Analytics: aggregated stats for balance tuning

**Trade-offs:**
- Ephemeral = fast iteration, but disconnects lose match
- Persistence = match history + progression, but adds complexity

### 9. Scalability Path: Single Server → Horizontal Scaling
**Decision:** Demo runs on single game server, production adds horizontal scaling infrastructure

**Demo (Sprint 1-5):**
- Single Node.js game server instance
- All matches in one process (memory)
- Good for ~50-100 concurrent matches
- Simple deployment, fast iteration

**Production (Sprint 6+):**
- **Sticky sessions** via load balancer (socket.io-redis adapter)
- **Redis pub/sub** for cross-server event coordination
- Multiple game server instances (horizontal scaling)
- Each instance handles subset of matches
- WebSocket connections sticky to specific server
- Good for ~1,000+ concurrent players

**Scaling Bottlenecks (Architecture Audit Findings):**
- ⚠ Node.js single-threaded: Run one process per core
- ⚠ 20Hz match loops: Can bottleneck CPU (upgrade to 60Hz internal in Sprint 6)
- ⚠ WebSocket scaling: Needs sticky sessions + shared state layer

**Sprint 6 Improvements:**
- Add Redis for pub/sub and session management
- Implement sticky sessions with socket.io-redis
- Increase internal tick to 60Hz, throttle broadcast to 20Hz
- Add monitoring for match load per server
- Graceful failover for crashed servers

**Deployment Architecture (Production):**
```
[Load Balancer + Sticky Sessions]
          ↓
    [Game Server 1] ← Redis → [Game Server 2]
          ↓                          ↓
    [Matches A-M]              [Matches N-Z]
```

---

## Data Model Overview

### Core Entities

**Users**
- id (uuid)
- email (social auth)
- wallet_address (nullable, linked later)
- username
- created_at

**Gladiators**
- id (uuid)
- user_id (foreign key)
- token_id (blockchain NFT ID)
- class (Duelist, Brute, Assassin)
- level (starts at 1)
- xp (experience points)
- base_stats (strength, agility, endurance, technique)
- equipped_weapon_id
- equipped_armor_id
- skill_points_available
- unlocked_skills (array of skill IDs)

**Equipment**
- id (uuid)
- owner_id (user_id)
- type (weapon, armor)
- rarity (common, rare, epic)
- stats (attack, defense, speed modifiers)
- name
- icon (placeholder string)

**Matches**
- id (uuid)
- player1_gladiator_id
- player2_gladiator_id (null for CPU matches)
- is_cpu_match (boolean)
- winner_id
- match_log (JSON array of actions)
- duration_seconds
- created_at

**Friends**
- user_id
- friend_id
- status (pending, accepted)
- created_at

**Challenges**
- id (uuid)
- challenger_id
- opponent_id
- gladiator1_id
- gladiator2_id
- status (pending, accepted, declined, completed)
- match_id (nullable, set when match completes)

---

## Development Workflow

### Daily Standups
- What did you ship yesterday?
- What are you shipping today?
- Any blockers?

### Branch Strategy
- `main` - stable, deployable code
- `dev` - integration branch
- `feature/<name>` - feature branches
- Merge to `dev` after review, weekly merges to `main`

### Code Review
- All PRs require 1 approval
- Review checklist:
  - Does it match the plan?
  - Are critical paths tested?
  - Is it properly typed (no `any`)?
  - Does it follow DRY/YAGNI?

### Testing Strategy
- Unit tests for:
  - Combat damage calculations
  - Loot drop probability
  - XP and leveling formulas
  - Skill tree unlocks
- Manual QA for:
  - UI/UX flows
  - Animations
  - Multiplayer synchronization

---

## Risk Management

### High-Risk Areas

**1. WebSocket Synchronization**
- Risk: Clients desync during combat
- Mitigation: Server is source of truth, clients interpolate only
- Fallback: Refresh match state every 5 seconds

**2. Blockchain Network Issues**
- Risk: Testnet downtime or slow confirmations
- Mitigation: Queue NFT mints, show pending state
- Fallback: Admin can manually mark mints as complete

**3. Combat Balance**
- Risk: One strategy dominates (e.g., always block)
- Mitigation: Playtesting after Sprint 3
- Adjustment: Tune damage/stamina values

**4. Scope Creep**
- Risk: Adding features beyond demo scope
- Mitigation: Strict adherence to sprint plans
- Reminder: No marketplace, no breeding, no token economics

**5. Scalability and Performance (Architecture Audit)**
- Risk: Node.js single-threaded bottleneck, 20Hz insufficient for precise hit detection, WebSocket scaling issues
- Mitigation:
  - Sprint 6: Upgrade to 60Hz internal simulation, 20Hz broadcast
  - Sprint 6: Add Redis pub/sub + sticky sessions for horizontal scaling
  - Sprint 7: Deploy multi-instance with load balancer
- Monitoring: Track match load per server, alert on CPU/memory thresholds
- Reference: See `docs/architecture-audit.md` for full analysis

**6. Match State Volatility**
- Risk: Server crashes lose active matches, disputes for high-stakes games
- Mitigation:
  - Sprint 5: Add match persistence (results + events)
  - Sprint 6: Snapshot state for disconnect handling
  - Future: Headless validator for dispute resolution (high-stakes matches)
- Trade-off: Persistence adds complexity but required for progression/reliability

**7. Determinism and Floating-Point Drift**
- Risk: Physics calculations desync across platforms (floating-point precision)
- Mitigation:
  - Use fixed timestep simulation (50ms ticks)
  - Sprint 7: Determinism testing suite
  - Consider: Fixed-point math for critical calculations (future)
- Server authority prevents gameplay impact, but replays may drift

---

## Out of Scope (Explicitly Excluded)

These features are documented but NOT implemented in the demo:

- ❌ Marketplace UI for trading Gladiators/items
- ❌ Loot boxes or gacha mechanics
- ❌ Breeding or forging systems
- ❌ Token economics or cryptocurrency rewards
- ❌ Real-money guarantees or redemption
- ❌ Advanced ranking ladders (Elo, seasons)
- ❌ Tournament brackets
- ❌ Guild/clan systems
- ❌ Chat or social features (beyond friend challenges)

---

## Post-Demo Roadmap

### Phase 2: Production Release (Months 2-3)
- Deploy to mainnet (Polygon or Base)
- Replace programmer art with custom pixel art
- Add marketplace for equipment trading
- Implement tournament system
- Advanced matchmaking (Elo ranking)

### Phase 3: Expansion (Months 4-6)
- New Gladiator classes
- More equipment types (shields, accessories)
- PvE campaign mode
- Mobile responsive design
- Sound effects and music

---

## Documentation Structure

```
docs/
├── plans/
│   ├── 00-MASTER-PLAN.md (this file)
│   ├── 01-sprint-0-setup.md
│   ├── 02-sprint-1-auth-nft.md
│   ├── 03-sprint-2-combat-cpu.md
│   ├── 04-sprint-3-frontend-animations.md
│   ├── 05-sprint-4-weapons-projectiles.md
│   ├── 06-sprint-5-progression-loot.md
│   ├── 07-sprint-6-multiplayer.md
│   ├── 08-sprint-7-deployment.md
│   └── sprint-3.5.md
├── architecture.md
├── architecture-audit.md    # Performance, scalability, reliability review
├── features/
│   ├── combat.md
│   ├── equipment.md
│   └── admin-ui.md
├── data-glossary.md          # Database & game data reference
├── mainnet-migration.md
├── SPRINT-1-SUMMARY.md
├── SPRINT-2-SUMMARY.md
├── SPRINT-2.5-SUMMARY.md
├── SPRINT-3.5-SUMMARY.md
├── SPRINT-4-SUMMARY.md
├── api/                    # (as added)
│   ├── rest-api.md
│   └── websocket-protocol.md
└── guides/
    └── development-setup.md
```

---

## Next Steps

1. **Current:** Sprint 3 — Frontend Real-Time Combat UI (Canvas 60 FPS, WASD + mouse aim, client prediction, interpolation). See `docs/plans/04-sprint-3-frontend-animations.md`.
2. Review individual sprint plans (01-08) for upcoming work.
3. After Sprint 3: Sprint 4 (Weapons & Projectiles), then Sprint 5 (Progression & Loot), Sprint 6 (Multiplayer), Sprint 7 (Deployment).

**Questions or changes needed?** Provide feedback and we'll iterate on the plan.
