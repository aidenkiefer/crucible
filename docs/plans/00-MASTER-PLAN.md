# Gladiator Coliseum - Master Implementation Plan

**Project:** Competitive 1v1 arena combat game with NFT Gladiators
**Timeline:** 4-6 weeks
**Team Size:** 2-3 developers
**Status:** Planning Phase

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

## Sprint Breakdown (6 Sprints × 1 Week Each)

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
**Goal:** Players can fight CPU opponents with animated combat

**Deliverables:**
- Combat engine (tick-based, 1000ms intervals)
- Action system (Light/Heavy Attack, Block, Dodge)
- Stamina and health systems
- Damage calculation
- CPU AI (simple decision tree)
- Match state management
- Combat result persistence

**Team Split:**
- Dev 1: Combat engine + game logic
- Dev 2: CPU AI + match management
- Dev 3: Database schema for matches + APIs

### Sprint 3: Frontend - Combat UI & Animations (Week 3-4)
**Goal:** Smooth 2D combat visualization with programmer art

**Deliverables:**
- Canvas-based arena renderer
- Gladiator sprite rendering (simple rectangles + color)
- Attack/defend/dodge animations
- Health/stamina bars
- Action button UI
- Combat log
- Victory/defeat screens

**Team Split:**
- Dev 1: Canvas rendering + animation system
- Dev 2: UI components + combat controls
- Dev 3: State synchronization with game server

### Sprint 4: Progression & Loot Systems (Week 4-5)
**Goal:** Gladiators level up, unlock skills, and earn loot

**Deliverables:**
- XP system and leveling
- Skill tree (3 skills per Gladiator class)
- Equipment system (weapons, armor)
- Loot generation engine (Common/Rare/Epic)
- Crafting system (combine items)
- Inventory UI
- Equipment screen

**Team Split:**
- Dev 1: Progression system + skill tree logic
- Dev 2: Loot engine + crafting
- Dev 3: Inventory + equipment UI

### Sprint 5: Multiplayer - Quick Match & Friend Challenges (Week 5-6)
**Goal:** Real-time PvP combat working smoothly

**Deliverables:**
- Matchmaking queue system
- Friend system (add/remove friends)
- Challenge creation and acceptance
- Real-time WebSocket combat
- Spectator mode (optional)
- Match history
- Leaderboard (simple win/loss ranking)

**Team Split:**
- Dev 1: Matchmaking + queue system
- Dev 2: Friend system + challenges
- Dev 3: Match history + leaderboard

### Sprint 6: Polish, Testing & Deployment (Week 6)
**Goal:** Production-ready demo deployed and documented

**Deliverables:**
- Bug fixes and edge case handling
- Unit tests for critical game logic
- Performance optimization
- Deployment to Vercel + Railway
- User-facing documentation
- Mainnet migration guide
- Demo video/walkthrough

**Team Split:**
- All devs: Bug fixing, testing, polish
- Dev 1: Frontend deployment + docs
- Dev 2: Contract audit + mainnet guide
- Dev 3: Game server deployment + monitoring

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

### 3. Combat Timing: 1000ms Tick Rate
**Decision:** Server processes actions every 1000ms (1 second)

**Rationale:**
- Balances responsiveness with network tolerance
- Allows strategic decision-making (not twitch-based)
- Easier to synchronize across clients
- CPU can "think" between ticks

**Tuning:** Can adjust to 500ms or 1500ms based on playtesting

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
│   ├── 05-sprint-4-progression-loot.md
│   ├── 06-sprint-5-multiplayer.md
│   ├── 07-sprint-6-deployment.md
│   ├── architecture.md
│   ├── data-models.md
│   ├── combat-system.md
│   ├── loot-system.md
│   └── mainnet-migration.md
├── api/
│   ├── rest-api.md
│   └── websocket-protocol.md
└── guides/
    ├── development-setup.md
    ├── testing-guide.md
    └── deployment-guide.md
```

---

## Next Steps

1. Review this master plan
2. Review individual sprint plans (01-07)
3. Set up project infrastructure (Sprint 0)
4. Begin Sprint 1 development

**Questions or changes needed?** Provide feedback and we'll iterate on the plan before starting implementation.
