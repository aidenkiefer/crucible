# Non-Documentation Index

Index of non-documentation files (config, source, schema, scripts) in the Crucible codebase. Excludes `.claude`, `.github`, `agents`, and `node_modules`. Use this to locate config files, entry points, services, and key modules.

---

## File and folder layout (non-docs)

```
crucible/
├── .env.example                 # Env template (DATABASE_URL, NEXTAUTH_*, etc.)
├── .gitignore                   # Git ignore patterns
├── package.json                 # Root: turbo scripts (dev, build, lint, test, clean)
├── pnpm-lock.yaml               # Lockfile
├── pnpm-workspace.yaml          # Workspaces: apps/*, packages/*, contracts
├── turbo.json                   # Turbo pipeline (build, dev, lint, test)
│
├── apps/
│   ├── game-server/
│   │   ├── package.json         # Game server deps and scripts
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts     # Vitest config for combat/ai tests
│   │   └── src/
│   │       ├── index.ts         # Entry: create server, start blockchain sync
│   │       ├── server.ts        # HTTP + WebSocket server setup
│   │       ├── ai/
│   │       │   ├── cpu-ai.ts    # CPU opponent: target selection, action choice, difficulty
│   │       │   └── __tests__/cpu-ai.test.ts
│   │       ├── combat/
│   │       │   ├── engine.ts    # 20Hz combat engine (tick, actions, collisions, events)
│   │       │   ├── damage-calculator.ts  # HP/stamina, damage, dodge/block
│   │       │   ├── physics.ts   # Movement, velocity, hitboxes, dodge roll
│   │       │   ├── types.ts     # Combatant, Action, CombatState, CombatEvent, COMBAT_CONSTANTS
│   │       │   └── __tests__/engine.test.ts
│   │       ├── services/
│   │       │   ├── abi.ts               # Gladiator NFT ABI for listener
│   │       │   ├── blockchain-listener.ts # Mint/transfer events → DB sync
│   │       │   ├── gladiator-sync.ts     # Start listener, ensure DB gladiators
│   │       │   ├── match-instance.ts     # Per-match state, combat tick loop
│   │       │   ├── match-manager.ts      # Create/join matches, CPU or PvP
│   │       │   └── bundle-loader.ts      # Load active game data bundle from Supabase Storage (Sprint 2.5)
│   │       └── sockets/
│   │           ├── index.ts     # Socket.IO setup, auth, namespaces
│   │           └── match-handlers.ts     # Join match, input, disconnect
│   │
│   └── web/
│       ├── .eslintrc.json
│       ├── package.json         # Next.js, NextAuth, wagmi, Tailwind, etc.
│       ├── next.config.js
│       ├── postcss.config.js
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       ├── app/
│       │   ├── layout.tsx       # Root layout, providers
│       │   ├── page.tsx         # Home
│       │   ├── globals.css      # Global styles
│       │   ├── admin/           # Admin UI (Sprint 2.5): dashboard, bundles, equipment/action templates
│       │   │   └── page.tsx     # Admin dashboard
│       │   ├── auth/signin/page.tsx
│       │   ├── mint/page.tsx    # Mint Gladiator NFT
│       │   └── api/
│       │       ├── auth/[...nextauth]/route.ts  # NextAuth API
│       │       ├── user/link-wallet/route.ts    # Link wallet to user
│       │       └── admin/   # Admin API (Sprint 2.5): bundles, action-templates, equipment-templates
│       ├── components/
│       │   ├── auth/SignInButton.tsx
│       │   ├── mint/MintGladiator.tsx
│       │   ├── providers/SessionProvider.tsx
│       │   ├── providers/WagmiProvider.tsx
│       │   └── wallet/ConnectWallet.tsx
│       ├── hooks/useMintGladiator.ts
│       ├── lib/
│       │   ├── auth.ts         # NextAuth config, session
│       │   ├── contracts.ts    # Contract addresses, ABIs
│       │   ├── wagmi.ts        # Wagmi config, chains
│       │   └── admin/          # Admin (Sprint 2.5): validator.ts, exporter.ts
│
├── contracts/
│   ├── hardhat.config.ts       # Network config, Solidity version
│   ├── package.json
│   ├── tsconfig.json
│   ├── contracts/
│   │   └── GladiatorNFT.sol    # ERC721 Gladiator NFT; mint(class), 8 stats, metadata
│   └── scripts/
│       ├── deploy.ts           # Deploy GladiatorNFT
│       └── verify.ts           # Verify contract on explorer
│
└── packages/
    ├── database/
    │   ├── package.json        # Prisma client
    │   ├── prisma/
    │   │   ├── schema.prisma   # Full schema: User, Gladiator, Equipment, Match, GameDataBundle, etc.
    │   │   └── migrations/20260203134839_add_8_stats_to_gladiator/migration.sql
    │   └── src/client.ts       # Prisma client singleton
    │
    └── shared/
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts        # Re-exports constants + types
            ├── constants/index.ts   # COMBAT_TICK_INTERVAL, BASE_*, ACTION_CONFIG, XP_*, LOOT_*
            └── types/index.ts  # GladiatorClass, User, Gladiator, Equipment, Match, CombatState, etc.
```

---

## Quick reference by purpose (non-docs)

| Purpose | Primary file(s) |
|--------|------------------|
| **Root scripts & monorepo** | [package.json](package.json), [pnpm-workspace.yaml](pnpm-workspace.yaml), [turbo.json](turbo.json) |
| **Game server entry** | [apps/game-server/src/index.ts](apps/game-server/src/index.ts), [server.ts](apps/game-server/src/server.ts) |
| **Combat (20Hz engine)** | [apps/game-server/src/combat/engine.ts](apps/game-server/src/combat/engine.ts), [physics.ts](apps/game-server/src/combat/physics.ts), [damage-calculator.ts](apps/game-server/src/combat/damage-calculator.ts) |
| **Match lifecycle** | [apps/game-server/src/services/match-manager.ts](apps/game-server/src/services/match-manager.ts), [match-instance.ts](apps/game-server/src/services/match-instance.ts) |
| **WebSocket / inputs** | [apps/game-server/src/sockets/match-handlers.ts](apps/game-server/src/sockets/match-handlers.ts) |
| **CPU AI** | [apps/game-server/src/ai/cpu-ai.ts](apps/game-server/src/ai/cpu-ai.ts) |
| **Blockchain → DB** | [apps/game-server/src/services/blockchain-listener.ts](apps/game-server/src/services/blockchain-listener.ts), [gladiator-sync.ts](apps/game-server/src/services/gladiator-sync.ts) |
| **Web app entry & layout** | [apps/web/app/layout.tsx](apps/web/app/layout.tsx), [page.tsx](apps/web/app/page.tsx) |
| **Auth** | [apps/web/app/api/auth/[...nextauth]/route.ts](apps/web/app/api/auth/[...nextauth]/route.ts), [lib/auth.ts](apps/web/lib/auth.ts) |
| **Wallet & mint** | [apps/web/lib/wagmi.ts](apps/web/lib/wagmi.ts), [lib/contracts.ts](apps/web/lib/contracts.ts), [hooks/useMintGladiator.ts](apps/web/hooks/useMintGladiator.ts) |
| **Admin UI (bundles, templates, validate/publish/export)** | apps/web/app/admin/*, apps/web/app/api/admin/*, apps/web/lib/admin/validator.ts, apps/web/lib/admin/exporter.ts |
| **Runtime game data (bundle loader)** | apps/game-server/src/services/bundle-loader.ts |
| **Database schema** | [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma) |
| **Shared types & constants** | [packages/shared/src/types/index.ts](packages/shared/src/types/index.ts), [constants/index.ts](packages/shared/src/constants/index.ts) |
| **Gladiator NFT contract** | [contracts/contracts/GladiatorNFT.sol](contracts/contracts/GladiatorNFT.sol), [scripts/deploy.ts](contracts/scripts/deploy.ts) |

---

## Non-documentation summaries

### Root

- **.env.example** — Template for env vars (e.g. DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET).
- **.gitignore** — Ignore node_modules, .env, build outputs, etc.
- **package.json** — Root package: turbo dev/build/lint/test/clean; packageManager pnpm.
- **pnpm-workspace.yaml** — Workspaces: apps/*, packages/*, contracts.
- **turbo.json** — Pipeline: build (outputs .next, dist), dev (persistent), lint, test.

### apps/game-server

- **index.ts** — Entry: load env, create HTTP+WS server, start gladiator sync (blockchain listener).
- **server.ts** — Express server, Socket.IO mount, CORS; no route logic (match logic in services/sockets).
- **combat/engine.ts** — 20Hz tick loop: apply actions (move, attack, dodge), physics, damage, collisions, emit CombatEvent.
- **combat/physics.ts** — Position/velocity, hitboxes, dodge roll, collision resolution.
- **combat/damage-calculator.ts** — HP/stamina init and regen, damage application, stamina costs, block/dodge outcomes.
- **combat/types.ts** — Combatant, CombatState, Action/ActionType (Move, Attack, Dodge), CombatEvent, COMBAT_CONSTANTS, WeaponType.
- **ai/cpu-ai.ts** — CPU decision: pick target, choose action (attack/dodge/block), optional difficulty tuning.
- **services/match-manager.ts** — Create match (CPU or PvP), assign match instance, track active matches.
- **services/match-instance.ts** — Single match: combat state, tick loop, input application, game-over handling.
- **services/blockchain-listener.ts** — Subscribe to GladiatorNFT Mint/Transfer; on event, sync gladiator to DB.
- **services/gladiator-sync.ts** — Start blockchain listener; ensure DB has gladiator records for minted tokens.
- **services/bundle-loader.ts** — Load active game data bundle from Supabase Storage at startup; getEquipmentTemplate(key), getActionTemplate(key) (Sprint 2.5).
- **services/abi.ts** — Gladiator NFT ABI used by listener.
- **sockets/index.ts** — Socket.IO server setup, auth middleware, match namespace.
- **sockets/match-handlers.ts** — Join match, receive client input, disconnect/cleanup.

### apps/web

- **app/layout.tsx** — Root layout; SessionProvider, WagmiProvider.
- **app/page.tsx** — Home page.
- **app/globals.css** — Global CSS (Tailwind base/components/utilities).
- **app/admin/page.tsx** — Admin dashboard; full Admin UI (Sprint 2.5): bundles, equipment/action template CRUD, validate, publish, export (see app/admin/, app/api/admin/, lib/admin/).
- **app/auth/signin/page.tsx** — Sign-in page.
- **app/mint/page.tsx** — Mint Gladiator NFT page (class selection, wallet).
- **app/api/auth/[...nextauth]/route.ts** — NextAuth API route (Google/Twitter, session).
- **app/api/user/link-wallet/route.ts** — Link wallet address to authenticated user.
- **lib/auth.ts** — NextAuth config (providers, callbacks, session).
- **lib/wagmi.ts** — Wagmi config (chains, transports).
- **lib/contracts.ts** — Contract addresses and ABIs for frontend.
- **hooks/useMintGladiator.ts** — Mint flow: write contract, wait for tx, optional refresh.
- **components/** — SignInButton, ConnectWallet, MintGladiator, SessionProvider, WagmiProvider.
- **next.config.js**, **tailwind.config.js**, **postcss.config.js**, **tsconfig.json**, **.eslintrc.json** — Next/Tailwind/TS/ESLint config.

### contracts

- **GladiatorNFT.sol** — ERC721 + Ownable; GladiatorClass enum; mint(class) with 8 stats; GladiatorMinted event; baseTokenURI.
- **scripts/deploy.ts** — Deploy GladiatorNFT, log address.
- **scripts/verify.ts** — Verify deployed contract on block explorer.
- **hardhat.config.ts** — Networks, Solidity version, paths.

### packages/database

- **prisma/schema.prisma** — Schema: User (NextAuth), Gladiator (8 stats, equipment relations), Equipment, Match, GameDataBundle, EquipmentTemplate, ActionTemplate, etc.; migrations.
- **prisma/migrations/.../migration.sql** — Migration: add 8 stats to Gladiator.
- **src/client.ts** — Singleton Prisma client export.

### packages/shared

- **src/index.ts** — Re-exports from constants and types.
- **src/constants/index.ts** — Combat (tick interval, health/stamina, ACTION_CONFIG), progression (XP_*), loot (LOOT_DROP_RATES).
- **src/types/index.ts** — GladiatorClass, User, Gladiator, Equipment, Match, CombatState, CombatantState, ActionLog, etc.

---

*Non-documentation index last updated from scan (excl. .claude, .github, agents, node_modules).*

---

# Documentation Index

Index of all markdown documentation in the Crucible (Gladiator Coliseum) codebase. Excludes `.claude`, `.github`, `agents`, and `node_modules`. Use this to find the right doc for vision, architecture, sprint plans, features, guides, and references.

---

## File and folder layout

```
crucible/
├── README.md                    # Project overview, goal, vision, status, roadmap, tech stack, game data, docs table
├── concept.md                   # Vision, demo scope, combat model, blockchain, design constraints, open questions
├── CLAUDE.md                    # Agent guidance: project overview, roadmap, repo structure, tech stack, conventions etc
├── INDEX.md                     # This file — documentation index
├── SKILLS_GUIDE.md              # How to find and use agent skills (superpowers)
├── claude-workflow-opt.md       # Workflow options for Claude
│
├── contracts/
│   └── DEPLOYMENT.md            # Smart contract deployment (testnet/mainnet), verification, env
│
└── docs/
    ├── architecture.md          # System architecture: frontend, game server, database, blockchain, data flow, security, deployment
    ├── data-glossary.md         # Database & game data: schema, enums, templates, instances, JSON shapes (§8), derived stats (§9), principles (§11)
    ├── design-guidelines.md     # Design principles: visual direction, typography, color, motion, accessibility, tone (placeholders)
    ├── mainnet-migration.md     # Mainnet migration (post-demo)
    ├── SPRINT-1-SUMMARY.md      # Sprint 1 complete: auth, wallet, mint, event listener, admin
    ├── SPRINT-2-SUMMARY.md      # Sprint 2 complete: 20Hz combat, WASD, sword, dodge, CPU AI, WebSocket
    ├── SPRINT-2.5-SUMMARY.md    # Sprint 2.5 complete: Admin UI — bundles, templates, validate/publish/export, bundle loader
    │
    ├── features/
    │   ├── admin-ui.md          # Admin UI plan: game data authoring, CRUD templates, validation, publish/export, immutable bundles
    │   ├── combat.md            # Combat feature spec: real-time model, actions, weapons, hitboxes, projectiles
    │   ├── equipment.md         # Equipment/loot/abilities design: template vs instance, slots, authoring, demo scope
    │   └── planned-features.md # Backlog: immediate/critical, abstract systems, post-launch, brainstorming (from concept + master plan)
    │
    ├── guides/
    │   ├── development-setup.md # Prerequisites, clone, install, env, database setup, run dev servers, troubleshooting (incl. Supabase DB)
    │   ├── testing-admin-ui.md  # How to test Admin UI locally: seed, isAdmin, Storage, dev servers, what to test
    │   └── vercel-deployment.md # Vercel: Root Directory apps/web, env vars (NEXT_PUBLIC_ vs server-only), checklist, optional turbo-ignore
    │
    └── plans/
        ├── 00-MASTER-PLAN.md    # Master plan: goal, success criteria, tech stack, 7 sprints (0–7), design decisions, data model, risks, out of scope, post-demo roadmap
        ├── 01-sprint-0-setup.md # Sprint 0: monorepo, Supabase, contracts scaffold, Next.js, game server, CI, docs
        ├── 02-sprint-1-auth-nft.md   # Sprint 1: social auth, wallet, mint UI, event listener, admin
        ├── 03-sprint-2-combat-cpu.md # Sprint 2: 20Hz combat engine, WASD, sword, dodge, CPU AI, WebSocket
        ├── 09-sprint-2.5-admin-ui.md  # Sprint 2.5: Admin UI — game data authoring, bundles, templates, publish/export (complete)
        ├── 04-sprint-3-frontend-animations.md # Sprint 3: Canvas 60 FPS, WASD + mouse, client prediction, interpolation
        ├── 05-sprint-4-weapons-projectiles.md # Sprint 4: Sword, Spear, Bow, Dagger; projectiles; weapon UI
        ├── 06-sprint-5-progression-loot.md     # Sprint 5: XP, leveling, skill tree, equipment, loot, crafting, inventory
        ├── 07-sprint-6-multiplayer.md          # Sprint 6: matchmaking, friends, challenges, real-time PvP, leaderboard
        └── 08-sprint-7-deployment.md           # Sprint 7: polish, tests, Vercel + Railway, mainnet guide, demo video
```

---

## Quick reference by purpose

| Purpose | Primary doc(s) |
|--------|----------------|
| **What is this project?** | [README.md](README.md), [concept.md](concept.md) |
| **Current status & roadmap** | [README.md](README.md) § Status & Roadmap, [docs/plans/00-MASTER-PLAN.md](docs/plans/00-MASTER-PLAN.md) |
| **System architecture** | [docs/architecture.md](docs/architecture.md) |
| **Database & game data (schema, templates, JSON)** | [docs/data-glossary.md](docs/data-glossary.md), [docs/features/equipment.md](docs/features/equipment.md) |
| **Admin UI (game data authoring, publish/export)** | [docs/features/admin-ui.md](docs/features/admin-ui.md) |
| **Combat design** | [docs/features/combat.md](docs/features/combat.md), [docs/SPRINT-2-SUMMARY.md](docs/SPRINT-2-SUMMARY.md) |
| **Equipment & loot design** | [docs/features/equipment.md](docs/features/equipment.md), [docs/data-glossary.md](docs/data-glossary.md) §5–8 |
| **Sprint plans (what to build)** | [docs/plans/00-MASTER-PLAN.md](docs/plans/00-MASTER-PLAN.md), [docs/plans/01-sprint-0-setup.md](docs/plans/01-sprint-0-setup.md) … [09-sprint-2.5-admin-ui.md](docs/plans/09-sprint-2.5-admin-ui.md), [08-sprint-7-deployment.md](docs/plans/08-sprint-7-deployment.md) |
| **What’s been built (Sprints 1, 2, 2.5)** | [docs/SPRINT-1-SUMMARY.md](docs/SPRINT-1-SUMMARY.md), [docs/SPRINT-2-SUMMARY.md](docs/SPRINT-2-SUMMARY.md), [docs/SPRINT-2.5-SUMMARY.md](docs/SPRINT-2.5-SUMMARY.md) |
| **Getting started (dev env)** | [docs/guides/development-setup.md](docs/guides/development-setup.md), [README.md](README.md) § Development |
| **Deploy web app (Vercel)** | [docs/guides/vercel-deployment.md](docs/guides/vercel-deployment.md) |
| **Contract deployment** | [contracts/DEPLOYMENT.md](contracts/DEPLOYMENT.md) |
| **Mainnet (post-demo)** | [docs/mainnet-migration.md](docs/mainnet-migration.md) |
| **Future ideas & backlog** | [docs/features/planned-features.md](docs/features/planned-features.md) |
| **Design (UI, visuals, tone)** | [docs/design-guidelines.md](docs/design-guidelines.md) |
| **Agent / Claude instructions** | [CLAUDE.md](CLAUDE.md), [SKILLS_GUIDE.md](SKILLS_GUIDE.md) |

---

## Document summaries

### Root

- **README.md** — Entry point: goal, vision, success criteria, status & sprint roadmap (0, 1, 2, 2.5, 3–7), tech stack, game data & equipment summary, out of scope, project structure, quick start, documentation table, post-demo roadmap.
- **concept.md** — Foundational vision and constraints: high-level vision, demo scope (in/out), Gladiators & Equipment (abstract), combat model (tick/turn, actions, server/client), multiplayer architecture, rendering & visuals, blockchain, wallets, data & indexing, tech stack, security, design constraints for AI, open questions (post-demo), definition of success.
- **CLAUDE.md** — Instructions for Claude: project overview, status & roadmap, repo structure, tech stack, architecture summary, core game concepts (Gladiators, Equipment, Actions, derived combat stats), out of scope, design constraints, key documentation table, conventions (incl. game data §11), skills, tool use, no review/QA, no build/compile, summary.
- **SKILLS_GUIDE.md** — How to discover and invoke agent skills (e.g. superpowers); when to use which skill.
- **claude-workflow-opt.md** — Workflow and optimization notes for Claude usage.

### contracts/

- **DEPLOYMENT.md** — How to deploy and verify the Gladiator NFT contract (testnet/mainnet), environment variables, scripts.

### docs/

- **architecture.md** — Three-tier architecture (frontend, backend, blockchain); component breakdown (frontend, game server with MatchManager, MatchInstance, CombatEngine, CpuAI, etc., database with schema overview and key models including GameDataBundle, EquipmentTemplate, ActionTemplate, derived combat stats), blockchain layer, data flow (minting, combat CPU, PvP), security, performance, scalability, deployment, technology rationale, future enhancements.
- **data-glossary.md** — Canonical reference for schema and game data: enums (GameDataStatus, EquipmentType, EquipmentSlot, ActionCategory), User/Friend, Gladiator/GladiatorLoadout, Equipment/GladiatorEquippedItem, Match/Challenge, GameDataBundle, EquipmentTemplate, ActionTemplate, EquipmentTemplateAction; action & attack vocabulary; suggested JSON shapes (§8: baseStatMods, scaling, rolledMods, hitboxConfig, projectileConfig, damageConfig, effectConfig); derived combat stats (§9); demo scope note (§10); guiding principles (§11).
- **design-guidelines.md** — Placeholder sections for visual direction, typography, color, spacing/layout, components, motion/animation, accessibility, tone/copy, references.
- **mainnet-migration.md** — Guidance for migrating from testnet to mainnet (post-demo).
- **SPRINT-1-SUMMARY.md** — What was delivered in Sprint 1: social auth (NextAuth, Google/Twitter), wallet connection (wagmi), Gladiator NFT contract enhancements, mint UI, blockchain event listener, admin dashboard; files created/modified, testing checklist, known limitations.
- **SPRINT-2-SUMMARY.md** — What was delivered in Sprint 2: 20Hz real-time combat, WASD movement, sword attacks, dodge roll with i-frames, CPU AI (adaptive strategies), match management, WebSocket handlers, 8-stat Gladiator (5 used in combat); architecture, testing, technical decisions, next steps (Sprint 3).
- **SPRINT-2.5-SUMMARY.md** — What was delivered in Sprint 2.5: Admin UI for game data management — User isAdmin, admin layout/nav, bundle management (CRUD, validate, publish, activate), action/equipment template CRUD, validation engine, export to Supabase Storage, runtime bundle loader on game server, seed data for demo bundle; architecture (authoring → publish → runtime), deployment considerations, testing checklist.

### docs/features/

- **admin-ui.md** — Admin UI plan (v0.1): internal UI for authoring and publishing game data (equipment templates, action templates, future spell templates); architecture (DB as authoring mirror, export to canonical bundle, runtime loads bundle at startup); auth and admin-only access; CRUD for GameDataBundle, EquipmentTemplate, ActionTemplate; record- and bundle-level validation; publishing and export; immutable bundle versions; non-goals (WYSIWYG, live hotpatching, economy tools).
- **combat.md** — Combat feature specification: real-time model, actions, weapons (Sword, Spear, Bow, Dagger), hitboxes, projectiles, stamina/HP, pacing; reference for implementation.
- **equipment.md** — Authoritative design for equipment, loot, abilities: template vs instance, slot-based equipping, weapon-based kits (demo), spells/loadouts, EquipmentTemplate responsibilities, action templates, static game data vs database, authoring workflow, demo scope, guiding principles.
- **planned-features.md** — Categorized backlog: Immediate/Critical (complete Sprints 3–7, demo success criteria, game data bundle); Abstract Game Systems (combat pacing, permadeath vs retirement, economy, loot acquisition, tournaments, non-crypto onboarding, visuals, class abilities, equipment-on-chain, art pipeline, indexing, fairness); Way Down the Line (marketplace, gacha, breeding, token economics, ranking, guilds, mainnet, pixel art, new classes, PvE, mobile, skins); Other/Brainstorming (design constraints, IPFS, account abstraction, spectator, durability, affixes, class abilities).

### docs/guides/

- **development-setup.md** — Prerequisites (Node, pnpm, Git, Supabase, MetaMask), clone, install, env configuration, database setup (Prisma push), optional seed for demo bundle (pnpm seed:admin), running frontend and game server, verification URLs, troubleshooting (database connection/Supabase P1001, port conflicts), Admin UI access (isAdmin, Supabase Storage gamedata bucket).
- **testing-admin-ui.md** — Step-by-step: seed demo data, grant isAdmin, create gamedata bucket, run dev servers, sign in, test dashboard/bundles/templates, publish flow, troubleshooting.
- **vercel-deployment.md** — Deploy Next.js (apps/web) to Vercel: Root Directory `apps/web`, env vars (public vs server-only, no secrets in NEXT_PUBLIC_), Production/Preview checklist, optional Ignored Build Step (turbo-ignore); game server runs elsewhere.

### docs/plans/

- **00-MASTER-PLAN.md** — Master implementation plan: goal, success criteria, architecture summary (tech stack, diagram), sprint breakdown (0–7 with deliverables and team split), key design decisions (TypeScript, testnet, 20Hz combat, programmer art, social auth, Supabase, separate game server), data model overview, development workflow, risk management, out of scope, post-demo roadmap (Phase 2 & 3), documentation structure, next steps.
- **01-sprint-0-setup.md** — Sprint 0: monorepo init (pnpm, turbo, workspace), frontend scaffold (Next.js), game server scaffold, database package (Prisma, Supabase), contracts scaffold, CI, directory structure, env template.
- **02-sprint-1-auth-nft.md** — Sprint 1: NextAuth (Google/Twitter), wallet connection and linking, Gladiator NFT contract deployment and minting UI, event listener, admin panel.
- **03-sprint-2-combat-cpu.md** — Sprint 2: real-time combat engine (20Hz), WASD movement, sword and dodge roll, stamina/HP, CPU AI, match lifecycle, WebSocket handlers.
- **09-sprint-2.5-admin-ui.md** — Sprint 2.5: Admin UI for game data authoring — bundles, equipment/action template CRUD, validation, publish, export to Supabase Storage, runtime bundle loader (complete).
- **04-sprint-3-frontend-animations.md** — Sprint 3: Canvas arena (60 FPS), WASD + mouse input, client prediction, interpolation, match HUD, victory/defeat; game data reference.
- **05-sprint-4-weapons-projectiles.md** — Sprint 4: weapon system (Sword, Spear, Bow, Dagger), attack patterns, server projectiles, client rendering, weapon switching; alignment with EquipmentTemplate/ActionTemplate and data-glossary §8.
- **06-sprint-5-progression-loot.md** — Sprint 5: XP and leveling (8 stats), skill tree, Equipment instances (templateId, rolledMods), GladiatorEquippedItem (slot-based), loot flow, inventory/equipment UI; references equipment.md and data-glossary.
- **07-sprint-6-multiplayer.md** — Sprint 6: matchmaking queue, friend system, challenges, dual-player WebSocket PvP, match history, leaderboard; effective build at match start (data-glossary §9).
- **08-sprint-7-deployment.md** — Sprint 7: bug fixes, tests, performance, Vercel + Railway deployment, env and secrets, mainnet guide, demo video; game data bundle publish step.

---

*Last updated from scan of all markdown files (excl. .claude, .github, agents, node_modules).*
