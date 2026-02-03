# Crucible — Gladiator Coliseum

A **competitive 1v1 arena combat game** where players own Gladiators and equipment as on-chain assets and use them in skill-influenced battles.

**Timeline:** 4–6 weeks · **Team:** 2–3 developers

---

## Goal

Build a working demo proving:

1. The combat loop is fun and engaging  
2. NFT asset ownership integrates cleanly  
3. Multiplayer works smoothly without heavy server load  

---

## Vision

- **Game-first** — Fun before financialization  
- **Player-owned assets** — NFT-backed Gladiators and gear  
- **Entry-based competitive matches** — Not gambling  
- **Web-first, low-friction** — No heavy client  
- **Deterministic, server-authoritative** — Fair, cheat-resistant combat  

---

## Success Criteria (from Master Plan)

The demo succeeds when a user can:

- Mint a Gladiator NFT  
- Equip Gladiators with gear  
- Fight CPU opponents with smooth animations  
- Enter Quick Match against other players  
- Challenge friends to battles  
- Rely on deterministic, server-authoritative combat outcomes  
- Level up Gladiators and unlock skill trees  
- Earn loot drops with rarity tiers and use a crafting system  

---

## Status & Roadmap

**Sprint 0 (Setup)** and **Sprint 1 (Auth & NFT Minting)** are complete.

| Sprint | Focus | Status |
|--------|--------|--------|
| **0** | Project setup & infrastructure (monorepo, Supabase, contracts scaffold, CI) | ✅ Complete |
| **1** | Authentication & NFT minting (social auth, wallet, mint UI, event listener, admin) | ✅ Complete |
| **2** | Combat system — CPU battles (tick-based engine, actions, stamina, CPU AI, match persistence) | Next |
| **3** | Frontend — Combat UI & animations (Canvas arena, sprites, health/stamina, action UI, victory/defeat) | Planned |
| **4** | Progression & loot (XP, leveling, skill trees, equipment, loot engine, crafting, inventory) | Planned |
| **5** | Multiplayer — Quick Match & friend challenges (matchmaking, friends, challenges, real-time PvP, leaderboard) | Planned |
| **6** | Polish, testing & deployment (bug fixes, tests, Vercel + Railway, docs, mainnet guide) | Planned |

**Currently built:** Monorepo (pnpm, Turborepo), Next.js 14 frontend (auth, wallet, mint, admin), Express game server (Socket.io, blockchain event listener), Gladiator NFT contract (Hardhat), Supabase + Prisma.

Full plan: [Master Implementation Plan](docs/plans/00-MASTER-PLAN.md).

---

## Tech Stack (from Master Plan)

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 14 (App Router), TypeScript, React 18, TailwindCSS, wagmi + viem, NextAuth.js, Socket.io-client, Canvas API (2D) |
| **Backend** | Supabase (Postgres + Auth + Realtime), Node.js + TypeScript (game server), Socket.io, Express, Prisma |
| **Blockchain** | Solidity, Hardhat, OpenZeppelin, ethers.js, Polygon Mumbai testnet |
| **Infrastructure** | Vercel (frontend), Railway/Render (game server), Supabase Cloud, IPFS/Pinata (metadata, optional) |

---

## Key Design Decisions

- **Full TypeScript stack** — Shared types, single language, type-safe combat logic.  
- **1000 ms tick rate** — Server processes actions every 1 s; balances responsiveness and sync.  
- **Social auth + wallet linking** — Sign in with Google/Twitter; link wallet for minting/ownership.  
- **Supabase** — Postgres + Auth + Realtime; Prisma for schema and migrations.  
- **Separate game server** — Node.js + Express + Socket.io, independent of Next.js.  
- **Testnet only for demo** — Polygon Mumbai; mainnet migration documented post-demo.  
- **Programmer art first** — Simple shapes/placeholders; replace with pixel art later.  

Details: [Master Plan — Key Design Decisions](docs/plans/00-MASTER-PLAN.md#key-design-decisions).

---

## Out of Scope (Demo)

Not in scope for this demo:

- Marketplace UI for trading Gladiators/items  
- Loot boxes or gacha mechanics  
- Breeding or forging systems  
- Token economics or crypto rewards  
- Real-money guarantees or redemption  
- Advanced ranking (Elo, seasons), tournament brackets, guilds  
- Chat or social features beyond friend challenges  

---

## Project Structure

```
crucible/
├── apps/
│   ├── web/              # Next.js frontend (auth, wallet, mint, admin)
│   └── game-server/      # Express + Socket.io, combat engine, event listener
├── packages/
│   ├── shared/           # Shared types and constants
│   └── database/         # Prisma schema and client
├── contracts/            # Gladiator NFT (Hardhat)
├── docs/
│   ├── plans/            # 00-MASTER-PLAN + sprint plans (01–07)
│   ├── guides/           # Development setup, testing, deployment
│   ├── features/         # Combat, loot, etc.
│   ├── api/              # REST + WebSocket docs (as added)
│   ├── SPRINT-1-SUMMARY.md
│   └── SPRINT-2-SUMMARY.md
└── README.md
```

---

## Development

See [Development Setup](docs/guides/development-setup.md) for full instructions.

### Quick Start

```bash
pnpm install
# Copy .env.example → .env and packages/database/.env (DATABASE_URL, Supabase, OAuth, WalletConnect, contract address)

cd packages/database && pnpm db:push && cd ../..
pnpm dev
```

**Manual setup:** OAuth apps (Google/Twitter), WalletConnect project ID, testnet MATIC, deploy Gladiator contract and set `NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS`. See [Sprint 1 Summary](docs/SPRINT-1-SUMMARY.md).

---

## Documentation

| Document | Description |
|----------|-------------|
| [concept.md](./concept.md) | Vision, combat model, multiplayer architecture, design constraints |
| [docs/plans/00-MASTER-PLAN.md](docs/plans/00-MASTER-PLAN.md) | Master implementation plan, sprints 0–6, design decisions, data model, risks |
| [docs/architecture.md](docs/architecture.md) | System architecture |
| [docs/plans/01-sprint-0-setup.md](docs/plans/01-sprint-0-setup.md) | Sprint 0 plan (setup) |
| [docs/plans/02-sprint-1-auth-nft.md](docs/plans/02-sprint-1-auth-nft.md) | Sprint 1 plan (auth & NFT) |
| [docs/plans/03-sprint-2-combat-cpu.md](docs/plans/03-sprint-2-combat-cpu.md) | Sprint 2 plan (combat CPU) |
| [docs/SPRINT-1-SUMMARY.md](docs/SPRINT-1-SUMMARY.md) | Sprint 1 summary (complete) |
| [docs/SPRINT-2-SUMMARY.md](docs/SPRINT-2-SUMMARY.md) | Sprint 2 summary (combat) |
| [docs/guides/development-setup.md](docs/guides/development-setup.md) | Development environment setup |

---

## Post-Demo Roadmap

- **Phase 2:** Mainnet (Polygon/Base), pixel art, marketplace, tournaments, Elo matchmaking.  
- **Phase 3:** New classes, more equipment, PvE campaign, mobile, audio.  

See [Master Plan — Post-Demo Roadmap](docs/plans/00-MASTER-PLAN.md#post-demo-roadmap).
