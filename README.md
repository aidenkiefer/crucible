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

**Sprint 0 through Sprint 5** are complete. **Next: Sprint 6 (Multiplayer PvP)**.

| Sprint | Focus | Status |
|--------|--------|--------|
| **0** | Project setup & infrastructure (monorepo, Supabase, contracts scaffold, CI) | ✅ Complete |
| **1** | Authentication & NFT minting (social auth, wallet, mint UI, event listener, admin) | ✅ Complete |
| **2** | Combat system — CPU battles (20Hz real-time engine, WASD movement, sword, dodge roll, CPU AI, WebSocket) | ✅ Complete |
| **2.5** | Admin UI — game data authoring (bundles, equipment/action templates, validate, publish, export, runtime bundle loader) | ✅ Complete |
| **3** | Frontend — Real-time combat UI (Canvas 60 FPS, sprites, WASD + mouse, interpolation, MatchHUD, match page) | ✅ Complete |
| **3.5** | Frontend — Shared physics, client prediction, mouse main/off-hand, match creation flow, verification | ✅ Complete |
| **4** | Weapons & projectiles (Sword, Spear, Bow, Dagger; shared combat lib; server projectiles; WeaponSelector; client projectile rendering) | ✅ Complete |
| **5** | Progression & loot (XP/level/skill trees, loot boxes, equipment, crafting/salvage, match history, gold) | ✅ Complete |
| **6** | Multiplayer — Real-time PvP (matchmaking, friends, challenges, dual-player WebSocket) | **Next** |
| **7** | Polish, testing & deployment (bug fixes, tests, Vercel + Railway, mainnet guide) | Planned |

**Currently built:** Monorepo (pnpm, Turborepo), Next.js 14 frontend (auth, wallet, mint, **admin UI**; **arena** at `/arena` with match creation; **camp** at `/camp` for managing gladiators, inventory, crafting, and spending stat/skill points; **match page** with Canvas, `MatchHUD`, `WeaponSelector`, client prediction, 4 weapons, projectiles; **match history** at `/matches`; **progression** (level, XP bar, skill trees, stat points); **loot boxes** (inventory, open, reward modal); **equipment** (inventory, equip, **crafting** 3→1, **salvage** for gold); marketing/landing, Blood & Bronze UI), Express game server (20Hz combat, multi-weapon, projectiles, CPU AI; **match persistence**, **rewards**, **XP/progression**, **loot drops**; bundle loader, blockchain listener), **packages/shared** (physics, combat, **loot** starter-gear, **skills** skill-trees, **crafting** 3→1), Gladiator NFT (Hardhat, 8 stats), Supabase + Prisma (**Match** completion/rewards, **LootBox**, **UserGold**).

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
- **Real-time 20Hz (50ms) server tick** — Continuous WASD movement, client prediction, server-authoritative combat (ROTMG-inspired).  
- **Social auth + wallet linking** — Sign in with Google/Twitter; link wallet for minting/ownership.  
- **Supabase** — Postgres + Auth + Realtime; Prisma for schema and migrations.  
- **Separate game server** — Node.js + Express + Socket.io, independent of Next.js.  
- **Testnet only for demo** — Polygon Mumbai; mainnet migration documented post-demo.  
- **Programmer art first** — Simple shapes/placeholders; replace with pixel art later.  

Details: [Master Plan — Key Design Decisions](docs/plans/00-MASTER-PLAN.md#key-design-decisions).

---

## Game data & equipment

Equipment and combat actions follow a **template / instance** model:

- **Templates** (EquipmentTemplate, ActionTemplate) define item archetypes and actions; they are authored in the DB and **published to JSON/TS** for runtime. Combat logic reads **published static data**, not the database.
- **Instances** (Equipment) are player-owned items; they reference a template and store rolled stats, rarity, and perks.
- **Equipping** is **slot-based** (GladiatorEquippedItem): MAIN_HAND, OFF_HAND, HELMET, CHEST, GAUNTLETS, GREAVES (and future slots). One item per slot per gladiator.
- **Loadouts** (GladiatorLoadout) store prepared spell IDs and equipped ability IDs (references); behavior comes from static definitions.
- **Derived combat stats:** At match start the server computes an effective build (Gladiator base + template `baseStatMods` + instance `rolledMods` + perks); that aggregate is immutable for the match and the sole input to combat. Runtime never queries templates or instances mid-match.
- **JSON shapes** for template/action config (e.g. `baseStatMods`, `hitboxConfig`, `damageConfig`) and **guiding principles** (no hardcoded slots, no runtime DB for templates): **[docs/data-glossary.md](docs/data-glossary.md)** §8–11.

See **[docs/features/equipment.md](docs/features/equipment.md)** for design and **[docs/data-glossary.md](docs/data-glossary.md)** for schema, terms, and conventions.

---

## Out of Scope (Demo)

Not in scope for this demo:

- Marketplace UI for trading Gladiators/items  
- Breeding or forging systems (in-demo: loot boxes and 3→1 crafting are in scope)  
- Token economics or crypto rewards  
- Real-money guarantees or redemption  
- Advanced ranking (Elo, seasons), tournament brackets, guilds  
- Chat or social features beyond friend challenges  

---

## Project Structure

```
crucible/
├── apps/
│   ├── web/              # Next.js frontend (auth, wallet, mint, arena, match UI, admin UI, progression, loot, equipment)
│   └── game-server/      # Express + Socket.io, 20Hz combat, match persistence, rewards, progression, loot
├── packages/
│   ├── shared/           # Shared types, constants, physics (3.5), combat (4), loot/skills/crafting (5)
│   └── database/         # Prisma schema and client
├── contracts/            # Gladiator NFT (Hardhat)
├── docs/
│   ├── plans/            # 00-MASTER-PLAN + sprint plans (01–09, sprint-3.5)
│   ├── guides/           # Development setup, testing, deployment
│   ├── features/         # Combat, equipment, planned-features
│   ├── SPRINT-1-SUMMARY.md … SPRINT-5-SUMMARY.md
│   └── SPRINT-2.5-SUMMARY.md, SPRINT-3.5-SUMMARY.md
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
| [docs/plans/00-MASTER-PLAN.md](docs/plans/00-MASTER-PLAN.md) | Master implementation plan, sprints 0–7, design decisions, data model, risks |
| [docs/architecture.md](docs/architecture.md) | System architecture |
| [docs/plans/01-sprint-0-setup.md](docs/plans/01-sprint-0-setup.md) | Sprint 0 plan (setup) |
| [docs/plans/02-sprint-1-auth-nft.md](docs/plans/02-sprint-1-auth-nft.md) | Sprint 1 plan (auth & NFT) |
| [docs/plans/03-sprint-2-combat-cpu.md](docs/plans/03-sprint-2-combat-cpu.md) | Sprint 2 plan (real-time combat CPU) |
| [docs/plans/09-sprint-2.5-admin-ui.md](docs/plans/09-sprint-2.5-admin-ui.md) | Sprint 2.5 plan (Admin UI — game data authoring, complete) |
| [docs/plans/04-sprint-3-frontend-animations.md](docs/plans/04-sprint-3-frontend-animations.md) | Sprint 3 plan (frontend real-time combat UI) |
| [docs/plans/sprint-3.5.md](docs/plans/sprint-3.5.md) | Sprint 3.5 plan (remaining items: client prediction, match creation) |
| [docs/plans/05-sprint-4-weapons-projectiles.md](docs/plans/05-sprint-4-weapons-projectiles.md) | Sprint 4 plan (weapons & projectiles) |
| [docs/plans/06-sprint-5-progression-loot.md](docs/plans/06-sprint-5-progression-loot.md) | Sprint 5 plan (progression & loot) |
| [docs/plans/07-sprint-6-multiplayer.md](docs/plans/07-sprint-6-multiplayer.md) | Sprint 6 plan (multiplayer PvP) — **next** |
| [docs/plans/08-sprint-7-deployment.md](docs/plans/08-sprint-7-deployment.md) | Sprint 7 plan (deployment) |
| [docs/SPRINT-1-SUMMARY.md](docs/SPRINT-1-SUMMARY.md) | Sprint 1 summary (complete) |
| [docs/SPRINT-2-SUMMARY.md](docs/SPRINT-2-SUMMARY.md) | Sprint 2 summary (real-time combat, complete) |
| [docs/SPRINT-2.5-SUMMARY.md](docs/SPRINT-2.5-SUMMARY.md) | Sprint 2.5 summary (Admin UI — bundles, templates, validate/publish/export, bundle loader, complete) |
| [docs/SPRINT-3-SUMMARY.md](docs/SPRINT-3-SUMMARY.md) | Sprint 3 summary (Canvas arena, sprites, input, WebSocket, MatchHUD, match page) |
| [docs/SPRINT-3.5-SUMMARY.md](docs/SPRINT-3.5-SUMMARY.md) | Sprint 3.5 summary (shared physics, client prediction, match creation, verification) |
| [docs/SPRINT-4-SUMMARY.md](docs/SPRINT-4-SUMMARY.md) | Sprint 4 summary (weapons, projectiles, WeaponSelector, shared combat) |
| [docs/SPRINT-5-SUMMARY.md](docs/SPRINT-5-SUMMARY.md) | Sprint 5 summary (progression, loot boxes, equipment, crafting/salvage, match history, gold) |
| [docs/guides/development-setup.md](docs/guides/development-setup.md) | Development environment setup |
| [docs/guides/vercel-deployment.md](docs/guides/vercel-deployment.md) | Vercel deployment — Root Directory, env vars, checklist |
| [docs/features/equipment.md](docs/features/equipment.md) | Equipment, loot, abilities — template/instance design, slots, authoring |
| [docs/features/admin-ui.md](docs/features/admin-ui.md) | Admin UI plan — game data authoring, CRUD, validation, publish/export |
| [docs/data-glossary.md](docs/data-glossary.md) | Database & game data glossary — schema, enums, templates, actions |

---

## Post-Demo Roadmap

- **Phase 2:** Mainnet (Polygon/Base), pixel art, marketplace, tournaments, Elo matchmaking.  
- **Phase 3:** New classes, more equipment, PvE campaign, mobile, audio.  

See [Master Plan — Post-Demo Roadmap](docs/plans/00-MASTER-PLAN.md#post-demo-roadmap).
