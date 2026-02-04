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
- `/` - Home (marketing landing when signed out; logged-in dashboard: Forge, Glory Battle, Enter Arena, Arena Status, War Council for admins)
- `/auth/signin` - Authentication
- `/mint` - NFT minting
- `/arena` - Arena entry; create CPU match (**Sprint 3.5**), navigate to `/match/[matchId]`
- `/match/[matchId]` - Real-time combat (Canvas, sprites, WASD + mouse, client prediction, 4 weapons, projectiles, WeaponSelector, MatchHUD; **Sprints 3–4**)
- `/admin` - Admin dashboard (game data authoring; **Sprint 2.5**)
  - `/admin/bundles` - List/create bundles, validate, publish, activate
  - `/admin/equipment-templates` - CRUD equipment templates
  - `/admin/action-templates` - CRUD action templates
  - Admin routes are protected by middleware; only users with `isAdmin` can access.
- *(Planned: `/inventory`, `/quick-match`, `/friends` — Sprints 5–6)*

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
- Creates, starts, stops, and removes active matches
- Tracks all active matches; cleans up completed ones
- `mapGladiatorStats()` — maps 8 database stats to combat stats
- `createPlayerConfig()` — creates player config from gladiator data

#### MatchInstance
- Runs a single match lifecycle
- Executes combat engine at **20Hz (50ms tick)**; combatants have **equipped weapon** (default Sword)
- Processes player actions via `submitAction()`; engine dispatches by weapon (melee vs projectile)
- Generates CPU AI actions automatically
- Combat state includes **projectiles** map (Sprint 4); broadcast in `match:state`
- Emits combat events (damage, deaths, dodges, projectile spawn)
- Handles match completion and cleanup

#### CombatEngine
- Server-authoritative **real-time** combat simulation (**Sprints 2–4**)
- **20Hz (50ms) tick rate** — continuous movement and actions
- **Physics:** Uses **shared physics** package (`packages/shared/src/physics`); WASD velocity-based movement, arena bounds, body collision, dodge roll
- **Multi-weapon (Sprint 4):** Sword (90° arc), Spear (30° thrust), Bow (projectile), Dagger (60° quick); each with range, damage, scaling (STR/DEX), stamina cost, cooldown
- **Projectiles:** Server-side simulation for Bow; spawn, move, collide, damage; removed on hit/expiry/out-of-bounds
- **Dodge roll:** Deterministic i-frames; stamina and cooldown from constants
- **Stamina & HP:** Regen and pools scale with CON; DEF for damage reduction
- **Damage:** Uses **shared combat** library (`packages/shared/src/combat`) for pure damage calculations
- Determines match winner; emits combat events (damage, projectile spawn, etc.)

#### MatchmakingService
- Maintains queue of players seeking matches (PvP in Sprint 6)
- Pairs players based on availability (FIFO)
- Creates PvP match instances

#### CpuAI
- **3 adaptive strategies:** Aggressive (HP > 70%), Defensive (HP < 30%), Opportunistic (30–70%)
- Decision interval **200ms** (every 4 ticks) to avoid over-reactive behavior
- Context-aware: dodge when player attacks and close; attack when in range and player vulnerable; manage stamina and cooldowns
- Movement: chase, retreat/kite, circular strafing, perpendicular dodge rolls

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

#### BundleLoader (**Sprint 2.5**)
- Loads the **active** published game data bundle from Supabase Storage at server startup
- Fetches `equipment.templates.json`, `actions.templates.json`, and `manifest.json` from the bundle’s `exportTarget` path
- Caches templates in memory for O(1) lookups: `getEquipmentTemplate(key)`, `getActionTemplate(key)`
- Combat and match logic read template data from BundleLoader; no runtime DB queries for templates

---

### 3. Shared Libraries (`packages/shared`)

**Physics (Sprint 3.5)** — `src/physics/`
- Pure, deterministic movement and collision used by **both** game server (authoritative) and frontend (client prediction)
- Types: Vec2, Velocity, BoundingBox, Circle, Rectangle
- Vector math: normalize, magnitude, distance, lerp, clampMagnitude
- Movement: integrate, clampToArena, calculateVelocity, calculateDodgeVelocity
- Collision: circle-vs-circle, combatant hitbox, melee arc
- Constants: TICK_RATE, ARENA dimensions, movement/dodge/stamina values
- No Node-only dependencies; runs in browser and Node

**Combat (Sprint 4)** — `src/combat/`
- Pure stat and damage calculations; weapon definitions; projectile physics
- **stats.ts:** calculateDerivedStats, stamina regen, hasStamina, consumeStamina
- **damage.ts:** calculateRawDamage, calculateFinalDamage, applyDamageToHp
- **weapons.ts:** WEAPONS constant (Sword, Spear, Bow, Dagger) with range, pattern, damage, scaling, cooldowns
- **projectiles.ts:** createProjectile, updateProjectilePosition, expiry, bounds, collision checks
- **types.ts:** BaseAttributes, DerivedStats, WeaponDefinition, ProjectileState, WeaponType, AttackPattern
- Server uses for authoritative simulation; client can use for prediction or UI (e.g. cooldown display)

---

### 4. Database (Supabase / PostgreSQL)

**Location:** `packages/database/`

**Design rule:** Templates (equipment, actions) are authored in the DB and **published to JSON/TS**. Runtime combat logic reads **published static data**, not the database. The DB is an authoring and collaboration layer; instances (player-owned items, equipped gear, gladiators) live in the DB.

**Schema Overview:**

```
User
├── Gladiator (1:N)
│   ├── GladiatorEquippedItem (slot → Equipment)  # slot-based equipping
│   ├── GladiatorLoadout (prepared spells, equipped abilities)
│   ├── Equipment (legacy: equippedWeapon, equippedArmor — transitional)
│   └── Match (as player 1 or 2)
├── Equipment (N, owned instances → EquipmentTemplate)
├── Match (as player 1 or 2)
├── Friend (N:N with other Users)
└── Challenge (sent or received)

Game data (authoring / publishing)
├── GameDataBundle (label, status DRAFT/PUBLISHED/DEPRECATED, export target)
│   ├── EquipmentTemplate[] (key, type, slot, baseStatMods, scaling, actions)
│   └── ActionTemplate[] (key, category, cooldown, hitbox/projectile/damage config)
└── EquipmentTemplateAction (equipment ↔ action join)
```

**Key Models:**

**User**
- Social auth data (email, username)
- Wallet address (linked)
- **isAdmin** (Boolean): gates access to `/admin/*` routes (Admin UI for game data authoring; **Sprint 2.5**)
- Created timestamp

**Gladiator**
- Token ID (unique, from blockchain), Owner (User), Class (Duelist, Brute, Assassin)
- **8 base stats:** constitution, strength, dexterity, speed, defense, magicResist, arcana, faith (5 used in combat: CON, STR, DEX, SPD, DEF; MRES, ARC, FTH for magic later)
- Level, XP, skillPointsAvailable, unlockedSkills (skill IDs)
- **Legacy:** equippedWeaponId, equippedArmorId (transitional)
- **Slot-based equipping:** GladiatorEquippedItem (one item per slot: MAIN_HAND, OFF_HAND, HELMET, CHEST, GAUNTLETS, GREAVES)
- **Loadout:** GladiatorLoadout (preparedSpellIds, equippedAbilityIds — references; behavior from static data)

**Equipment** (player-owned instance)
- Owner (User), templateId → EquipmentTemplate (what the item “is”)
- rolledMods (JSON), grantedPerkIds (String[])
- Legacy: type, rarity, name; attackBonus, defenseBonus, speedBonus (transitional)
- Equipped via GladiatorEquippedItem (slot-based)

**GladiatorEquippedItem**
- gladiatorId, slot (EquipmentSlot), equipmentId
- Unique per (gladiatorId, slot) — one item per slot

**GladiatorLoadout**
- One per gladiator; preparedSpellIds (catalyst spell slots), equippedAbilityIds (class abilities later)

**GameDataBundle**
- label (e.g. demo-v0, season-1), status (DRAFT/PUBLISHED/DEPRECATED), isActive
- exportTarget (e.g. R2 path), gitCommitSha
- Groups EquipmentTemplate and ActionTemplate for publishing

**EquipmentTemplate**
- key (canonical ID for JSON/TS), name, description, type (WEAPON, ARMOR, CATALYST, TRINKET, AUGMENT), slot (EquipmentSlot), subtype, tags
- baseStatMods, scaling, rarityRules, ui (JSON)
- status, version; bundleId (optional)
- actions: EquipmentTemplateAction → ActionTemplate (actions granted by this item)

**ActionTemplate**
- key, name, description, category (WEAPON_ATTACK, CAST, MOBILITY, UTILITY)
- cooldownMs, castTimeMs, staminaCost, manaCost
- hitboxConfig, projectileConfig, damageConfig, effectConfig (JSON)
- status, version; bundleId (optional)

**Derived combat stats (runtime)**  
At match start the server computes an effective build: Gladiator base stats + `EquipmentTemplate.baseStatMods` + `Equipment.rolledMods` + passive perks. This aggregated stat block is immutable for the duration of the match, cached, and the sole input to combat calculations. Runtime combat code must not query templates or instances mid-match. JSON shapes for the config fields and full conventions: **docs/data-glossary.md** §8 (Suggested JSON Shapes), §9 (Derived Combat Stats), §11 (Guiding Principles).

**Match**
- player1Gladiator, player2Gladiator (optional for CPU), isCpuMatch
- winnerId, matchLog (JSON), durationSeconds
- player1, player2 (User)

**Friend** — User pair, status (pending, accepted)

**Challenge** — Challenger vs opponent, gladiators, status; matchId when completed

Full field list and enums: **docs/data-glossary.md**. Equipment design: **docs/features/equipment.md**.

---

### 5. Blockchain Layer

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
- **8 base stats** (generated pseudo-randomly at mint): constitution, strength, dexterity, speed, defense, magicResist, arcana, faith (class bonuses: Duelist +DEX/SPD/DEF, Brute +CON/STR/DEF, Assassin +DEX/SPD/ARC)
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
User → Open /arena → Frontend (Sprint 3.5: "Fight CPU" → useCreateMatch)
         ↓
Frontend → match:create (CPU) → Game Server (WebSocket)
         ↓
Game Server → Create MatchInstance → MatchManager
         ↓
Frontend → match:created (matchId) → Frontend navigates to /match/[matchId]
         ↓
Frontend → match:start → Game Server
         ↓
MatchInstance → Start 20Hz tick loop (50ms) → Combat Engine
         ↓ (every 50ms)
Combat Engine → Process player + CPU actions → Physics (shared), damage (shared), projectiles (Sprint 4)
         ↓
Game Server → Broadcast match:state (combatants + projectiles) → WebSocket (20Hz)
         ↓
Frontend → Receive state → Client prediction for local player (Sprint 3.5); interpolate opponent; render projectiles (Sprint 4)
         ↓
User → WASD / mouse / attack (L/R click, Space) / dodge / weapon 1–4 → Frontend
         ↓
Frontend → match:input (throttled ~60Hz) → Game Server
         ↓
MatchInstance → submitAction() → Next tick
         ↓
[Repeat until health = 0]
         ↓
Game Server → match:complete → Frontend
Game Server → Save match → Database
         ↓
Frontend → Victory/Defeat; "Fight Again" creates new match (Sprint 3.5) → User
```

**WebSocket events (combat):** Client → Server: `match:create`, `match:start`, `match:input`, `match:join`, `match:leave`. Server → Client: `match:created`, `match:started`, `match:state` (20Hz; includes projectiles), `match:events`, `match:complete`, `match:error`.

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

### Game Data Flow (Authoring → Runtime) (**Sprint 2.5**)

```
Admin → Next.js Admin UI (/admin/*) → Create/edit EquipmentTemplate, ActionTemplate in DB (per bundle)
         ↓
Admin → Validate bundle → API runs validation engine (keys, refs, JSON, slot/type rules)
         ↓
Admin → Publish bundle → Mark templates PUBLISHED, export to Supabase Storage (gamedata bucket)
         ↓
         bundles/{label}/equipment.templates.json, actions.templates.json, manifest.json
         ↓
Admin → Activate bundle → Set bundle isActive = true (only one active)
         ↓
Game Server (on startup) → BundleLoader.load() → Fetch active bundle exportTarget from DB
         ↓
BundleLoader → Download JSON from Supabase Storage → Cache in memory
         ↓
Combat / match code → getEquipmentTemplate(key), getActionTemplate(key) (no DB at runtime)
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
