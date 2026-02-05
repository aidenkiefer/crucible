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
│   │       │   ├── engine.ts    # 20Hz combat; multi-weapon (Sword, Spear, Bow, Dagger); projectiles (Sprint 4)
│   │       │   ├── damage-calculator.ts  # Thin wrapper over shared combat; HP/stamina, damage
│   │       │   ├── physics.ts   # Uses shared physics (Sprint 3.5); movement, hitboxes, dodge
│   │       │   ├── types.ts     # Combatant, CombatState, CombatEvent, WeaponType, projectiles
│   │       │   └── __tests__/engine.test.ts
│   │       ├── services/
│   │       │   ├── abi.ts               # Gladiator NFT ABI for listener
│   │       │   ├── blockchain-listener.ts # Mint/transfer events → DB sync
│   │       │   ├── gladiator-sync.ts     # Start listener, ensure DB gladiators
│   │       │   ├── match-instance.ts     # Per-match state, combat tick loop; Sprint 5: persistence, rewards, XP
│   │       │   ├── match-manager.ts      # Create/join matches, CPU or PvP
│   │       │   ├── progression.ts        # Sprint 5: XP, leveling, getXPForLevel, awardXP, skill points
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
│       ├── vercel.json         # Vercel: framework Next.js
│       ├── tsconfig.json
│       ├── app/
│       │   ├── layout.tsx       # Root layout, providers
│       │   ├── page.tsx         # Home (marketing landing + logged-in dashboard: Camp, Forge, Glory Battle, Enter Arena, Arena Status, admin shortcuts)
│       │   ├── globals.css      # Global styles (Blood & Bronze palette, shared components)
│       │   ├── admin/           # Admin UI (Sprint 2.5): dashboard, bundles, equipment/action templates
│       │   │   ├── layout.tsx   # Admin layout, AdminNav
│       │   │   ├── page.tsx     # Admin dashboard
│       │   │   ├── bundles/     # List + [id] (validate, publish, activate)
│       │   │   ├── equipment-templates/  # List, [id], new
│       │   │   ├── action-templates/    # List, [id], new
│       │   │   ├── unauthorized/page.tsx
│       │   │   └── components/AdminNav.tsx, JsonEditor.tsx
│       │   ├── arena/page.tsx   # Sprint 3.5: match creation (Fight CPU), navigate to /match/[matchId]
│       │   ├── camp/page.tsx    # Sprint 5 adj: Camp hub for gladiators, inventory, crafting
│       │   ├── camp/gladiators/[id]/page.tsx # Camp: single gladiator (progression, skills, equipment)
│       │   ├── quick-match/page.tsx # Sprint 6: Quick Match UI — join/leave matchmaking queue, listen for match:found
│       │   ├── friends/page.tsx # Sprint 6: Friends & Challenges UI — add/accept friends, create/accept challenges (data fetch WIP)
│       │   ├── auth/signin/page.tsx
│       │   ├── mint/page.tsx    # Mint Gladiator NFT
│       │   ├── matches/page.tsx # Sprint 5: match history, filters, rewards display
│       │   ├── match/[matchId]/page.tsx  # Sprint 3+: real-time match (Canvas, HUD, prediction, weapons, projectiles)
│       │   └── api/
│       │       ├── auth/[...nextauth]/route.ts  # NextAuth API
│       │       ├── user/link-wallet/route.ts    # Link wallet to user
│       │       ├── admin/   # Admin API (Sprint 2.5): bundles, action-templates, equipment-templates
│       │       ├── matches/history/route.ts     # Sprint 5: match history
│       │       ├── loot-boxes/route.ts, open/route.ts  # Sprint 5: loot box inventory, open
│       │       ├── gladiators/route.ts          # List current user's gladiators (Camp)
│       │       ├── gladiators/[gladiatorId]/progression/route.ts, skills/unlock/route.ts, equip/route.ts, stats/route.ts  # Sprint 5 progression, skills, equip, stat allocation
│       │       ├── equipment/route.ts, craft/route.ts, salvage/route.ts  # Sprint 5: inventory, craft 3→1, salvage
│       │       └── gold/balance/route.ts        # Sprint 5: gold balance
│       ├── components/
│       │   ├── auth/SignInForm.tsx, SignInButton.tsx
│       │   ├── arena/          # Sprint 3–4: interpolation, renderer, ArenaCanvas, MatchHUD, WeaponSelector
│       │   ├── equipment/      # Sprint 5: CraftingWorkshop.tsx, EquipmentInventory.tsx
│       │   ├── gladiators/     # Sprint 5: GladiatorProgression.tsx
│       │   ├── loot/           # Sprint 5: LootBoxInventory.tsx
│       │   ├── mint/MintGladiator.tsx
│       │   ├── providers/SessionProvider.tsx, WagmiProvider.tsx
│       │   ├── skills/         # Sprint 5: SkillTree.tsx
│       │   ├── ui/AnimatedTorch.tsx
│       │   └── wallet/ConnectWallet.tsx
│       ├── hooks/
│       │   ├── useMintGladiator.ts
│       │   ├── useSocket.ts           # Sprint 3: singleton Socket.io to game server
│       │   ├── useRealTimeMatch.ts    # Sprint 3: match:join/state/input/complete; projectile Map (Sprint 4)
│       │   ├── useGameInput.ts        # Sprint 3–3.5: WASD, mouse aim, Space/Shift, L/R click main/off-hand; 1–4 weapon (Sprint 4)
│       │   ├── useClientPrediction.ts # Sprint 3.5: local player prediction, reconciliation
│       │   └── useCreateMatch.ts      # Sprint 3.5: match:create, match:start, navigate to match
│       ├── lib/
│       │   ├── auth.ts         # NextAuth config, session
│       │   ├── arena.ts        # Arena status (open/closed messages, NEXT_PUBLIC_ARENA_OPEN)
│       │   ├── contracts.ts    # Contract addresses, ABIs
│       │   ├── wagmi.ts        # Wagmi config, chains
│       │   ├── sprites/        # Sprint 3: types.ts, SpriteLoader.ts, AnimationPlayer.ts
│       │   └── admin/         # Admin (Sprint 2.5): validator.ts, exporter.ts
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
    │   ├── package.json        # Prisma client, build = prisma generate
    │   ├── prisma/
    │   │   ├── schema.prisma   # User, Gladiator, Equipment, Match (persistence, rewards), LootBox, UserGold (Sprint 5), GameDataBundle, etc.
    │   │   └── migrations/    # add_8_stats_to_gladiator; Sprint 5: Match/LootBox/UserGold as needed
    │   └── src/client.ts       # Prisma client singleton
    │
    └── shared/
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts        # Re-exports constants, types, physics, combat
            ├── constants/index.ts   # COMBAT_TICK_INTERVAL, BASE_*, ACTION_CONFIG, XP_*, LOOT_*
            ├── types/index.ts  # GladiatorClass, User, Gladiator, Equipment, Match, etc.
            ├── loot/           # Sprint 5: starter-gear.ts (loot box pool: armor sets, weapons)
            ├── skills/         # Sprint 5: skill-trees.ts (4 classes, branches, SkillNode)
            ├── crafting/       # Sprint 5: crafting-system.ts (3→1, rarity upgrade, determineCraftedRarity)
            ├── combat/         # Sprint 4: types, stats, damage, weapons, projectiles, index
            │   ├── types.ts    # CombatState, WeaponDefinition, ProjectileState, BaseAttributes, etc.
            │   ├── stats.ts    # Pure derived stats, stamina
            │   ├── damage.ts   # Pure damage calculations
            │   ├── weapons.ts  # WEAPONS (Sword, Spear, Bow, Dagger)
            │   ├── projectiles.ts # Pure projectile position/expiry/collision
            │   └── index.ts
            └── physics/        # Sprint 3.5: pure deterministic physics (server + client prediction)
                ├── types.ts   # Vec2, Velocity, BoundingBox, etc.
                ├── constants.ts # TICK_RATE, ARENA_*, movement/dodge constants
                ├── vector.ts   # normalize, magnitude, lerp, clampMagnitude
                ├── movement.ts # integrate, clampToArena, calculateVelocity
                ├── collision.ts # circle, combatant, melee arc
                └── index.ts
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
| **Match UI (Sprints 3–4)** | apps/web/app/arena/page.tsx, app/match/[matchId]/page.tsx, components/arena/*, hooks/useSocket.ts, useRealTimeMatch.ts, useGameInput.ts, useClientPrediction.ts, useCreateMatch.ts, lib/sprites/* |
| **Shared physics (client prediction)** | packages/shared/src/physics/* |
| **Shared combat (weapons, damage, projectiles)** | packages/shared/src/combat/* |
| **Progression & loot (Sprint 5)** | apps/game-server/src/services/progression.ts, apps/web/app/api/matches/history, api/loot-boxes, api/gladiators/[id]/progression|skills|equip|stats, api/equipment, api/gold/balance, components/loot, gladiators, equipment, skills; packages/shared/src/loot, skills, crafting |
| **Multiplayer (Sprint 6 — WIP)** | apps/game-server/src/services/matchmaking-service.ts, sockets/index.ts, sockets/matchmaking-handlers.ts; apps/web/app/quick-match/page.tsx, app/friends/page.tsx, app/api/friends/*, app/api/challenges/* |
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
- **combat/engine.ts** — 20Hz tick; multi-weapon (Sword, Spear, Bow, Dagger); melee + projectile attacks; updateProjectiles(); CombatEvent.
- **combat/physics.ts** — Uses shared physics package; position/velocity, hitboxes, dodge roll, collision.
- **combat/damage-calculator.ts** — Thin wrapper over shared combat (damage, stats); HP/stamina, apply damage.
- **combat/types.ts** — Combatant (weapon), CombatState (projectiles map), CombatEvent, WeaponType, ProjectileState.
- **ai/cpu-ai.ts** — CPU decision: pick target, choose action (attack/dodge/block), optional difficulty tuning.
- **services/match-manager.ts** — Create match (CPU or PvP), assign match instance, track active matches.
- **services/match-instance.ts** — Single match: combat state, tick loop, input application, game-over; Sprint 5: match persistence, stats, loot drop, XP award.
- **services/progression.ts** — Sprint 5: getXPForLevel, awardXP, level cap 20, skill points on level up.
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
- **app/arena/page.tsx** — Sprint 3.5: arena entry; create CPU match via useCreateMatch, navigate to /match/[matchId].
- **app/matches/page.tsx** — Sprint 5: match history UI; filters, victory/defeat styling, rewards display.
- **app/match/[matchId]/page.tsx** — Sprints 3–4: real-time match (ArenaCanvas, MatchHUD, WeaponSelector, useRealTimeMatch, useGameInput, useClientPrediction; Fight Again creates new match).
- **app/api/auth/[...nextauth]/route.ts** — NextAuth API route (Google/Twitter, session).
- **app/api/user/link-wallet/route.ts** — Link wallet address to authenticated user.
- **app/api/matches/history/route.ts** — Sprint 5: match history with filters.
- **app/api/loot-boxes/route.ts**, **loot-boxes/open/route.ts** — Sprint 5: loot box inventory, open box.
- **app/api/gladiators/[gladiatorId]/progression/route.ts**, **skills/unlock/route.ts**, **equip/route.ts** — Sprint 5: XP/level, unlock skill, equip/unequip.
- **app/api/equipment/route.ts**, **equipment/craft/route.ts**, **equipment/salvage/route.ts** — Sprint 5: equipment inventory, craft 3→1, salvage for gold.
- **app/api/gold/balance/route.ts** — Sprint 5: gold balance.
- **lib/auth.ts** — NextAuth config (providers, callbacks, session).
- **lib/wagmi.ts** — Wagmi config (chains, transports).
- **lib/contracts.ts** — Contract addresses and ABIs for frontend.
- **hooks/useMintGladiator.ts** — Mint flow: write contract, wait for tx, optional refresh.
- **hooks/useSocket.ts** — Singleton Socket.io client to game server (NEXT_PUBLIC_GAME_SERVER_URL).
- **hooks/useRealTimeMatch.ts** — Match room: match:join/leave, match:state, match:input, match:complete; submitInput throttled.
- **hooks/useGameInput.ts** — WASD + mouse aim, Space/Shift; L/R click main/off-hand (Sprint 3.5); 1–4 weapon switch (Sprint 4).
- **hooks/useClientPrediction.ts** — Sprint 3.5: local player prediction, reconcile with server (shared physics).
- **hooks/useCreateMatch.ts** — Sprint 3.5: match:create, match:start, returns matchId for navigation.
- **lib/arena.ts** — Arena status copy (open/closed), getArenaStatus(), NEXT_PUBLIC_ARENA_OPEN.
- **lib/sprites/** — SpriteLoader, AnimationPlayer, types (SpriteManifest, Direction, etc.).
- **components/arena/** — interpolation.ts, renderer.ts (drawProjectile in Sprint 4), ArenaCanvas.tsx, MatchHUD.tsx, WeaponSelector.tsx (Sprint 4).
- **components/loot/LootBoxInventory.tsx** — Sprint 5: loot box list, open, reward modal.
- **components/gladiators/GladiatorProgression.tsx** — Sprint 5: level, XP bar, stats.
- **components/skills/SkillTree.tsx** — Sprint 5: skill branches, unlock UI.
- **components/equipment/CraftingWorkshop.tsx**, **EquipmentInventory.tsx** — Sprint 5: craft 3→1, salvage, equipment list, equip.
- **components/ui/AnimatedTorch.tsx** — Reusable torch with sizes, mirror, glow.
- **components/auth/** — SignInForm, SignInButton.
- **components/** — ConnectWallet, MintGladiator, SessionProvider, WagmiProvider.
- **next.config.js**, **tailwind.config.js**, **vercel.json**, **postcss.config.js**, **tsconfig.json**, **.eslintrc.json** — Next/Tailwind/Vercel/TS/ESLint config.

### contracts

- **GladiatorNFT.sol** — ERC721 + Ownable; GladiatorClass enum; mint(class) with 8 stats; GladiatorMinted event; baseTokenURI.
- **scripts/deploy.ts** — Deploy GladiatorNFT, log address.
- **scripts/verify.ts** — Verify deployed contract on block explorer.
- **hardhat.config.ts** — Networks, Solidity version, paths.

### packages/database

- **prisma/schema.prisma** — User, Gladiator (8 stats, level, xp, skillPointsAvailable, unlockedSkills), Equipment, Match (matchType, matchStats, rewardType, lootBoxTier, completedAt — Sprint 5), LootBox, UserGold (Sprint 5), GameDataBundle, EquipmentTemplate, ActionTemplate, etc.; migrations.
- **prisma/migrations/** — add_8_stats_to_gladiator; Sprint 5 migrations as applied.
- **src/client.ts** — Singleton Prisma client export.

### packages/shared

- **src/index.ts** — Re-exports from constants and types.
- **src/constants/index.ts** — Combat (tick interval, health/stamina, ACTION_CONFIG), progression (XP_*), loot (LOOT_DROP_RATES).
- **src/types/index.ts** — GladiatorClass, User, Gladiator, Equipment, Match, etc.
- **src/loot/starter-gear.ts** — Sprint 5: starter gear definitions (4 armor sets, 7 weapons) for loot box pool.
- **src/skills/skill-trees.ts** — Sprint 5: skill tree definitions (4 classes, branches, SkillNode, tier prerequisites).
- **src/crafting/crafting-system.ts** — Sprint 5: 3→1 crafting, determineCraftedRarity, rarity tiers.
- **src/combat/** — Sprint 4: types (weapon, projectile, stats), stats.ts, damage.ts, weapons.ts (WEAPONS), projectiles.ts, index.
- **src/physics/** — Sprint 3.5: types, constants, vector, movement, collision, index; used by server and client prediction.

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
    ├── design-guidelines.md     # Design principles: visual direction, typography, color, motion, accessibility, tone — source of the Blood & Bronze UI pass
    ├── mainnet-migration.md     # Mainnet migration (post-demo)
    ├── SPRINT-1-SUMMARY.md      # Sprint 1 complete: auth, wallet, mint, event listener, admin
    ├── SPRINT-2-SUMMARY.md      # Sprint 2 complete: 20Hz combat, WASD, sword, dodge, CPU AI, WebSocket
    ├── SPRINT-2.5-SUMMARY.md    # Sprint 2.5 complete: Admin UI — bundles, templates, validate/publish/export, bundle loader
    ├── SPRINT-3-SUMMARY.md      # Sprint 3 complete: Canvas arena, sprites, input, WebSocket, MatchHUD, match page
    ├── SPRINT-3.5-SUMMARY.md    # Sprint 3.5 complete: shared physics, client prediction, mouse attacks, match creation, verification
    ├── SPRINT-4-SUMMARY.md      # Sprint 4 complete: shared combat, 4 weapons, projectiles, WeaponSelector, client projectile rendering
    ├── SPRINT-5-SUMMARY.md      # Sprint 5 complete: progression (XP/level/skills), loot boxes, equipment/crafting/salvage, match history, gold
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
        ├── sprint-3.5.md                      # Sprint 3.5: remaining items (client prediction, mouse attacks, match creation, verification)
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
| **What’s been built (Sprints 1–5)** | [docs/SPRINT-1-SUMMARY.md](docs/SPRINT-1-SUMMARY.md), [docs/SPRINT-2-SUMMARY.md](docs/SPRINT-2-SUMMARY.md), [docs/SPRINT-2.5-SUMMARY.md](docs/SPRINT-2.5-SUMMARY.md), [docs/SPRINT-3-SUMMARY.md](docs/SPRINT-3-SUMMARY.md), [docs/SPRINT-3.5-SUMMARY.md](docs/SPRINT-3.5-SUMMARY.md), [docs/SPRINT-4-SUMMARY.md](docs/SPRINT-4-SUMMARY.md), [docs/SPRINT-5-SUMMARY.md](docs/SPRINT-5-SUMMARY.md) |
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

- **README.md** — Entry point: goal, vision, success criteria, status & sprint roadmap (0, 1, 2, 2.5, 3, 3.5, 4 complete; next 5–7), tech stack, game data & equipment summary, out of scope, project structure, quick start, documentation table, post-demo roadmap.
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
- **SPRINT-3-SUMMARY.md** — Sprint 3 complete: sprite loading, Canvas renderer, interpolation, useGameInput (WASD, mouse, Space/Shift), useSocket, useRealTimeMatch, MatchHUD, match page; verification checklist.
- **SPRINT-3.5-SUMMARY.md** — Sprint 3.5 complete: shared physics package, useClientPrediction, mouse main/off-hand attacks, useCreateMatch, arena page (match creation), Fight Again flow, Sprint 3 verification.
- **SPRINT-4-SUMMARY.md** — Sprint 4 complete: shared combat library (stats, damage, weapons, projectiles), 4 weapon types (Sword, Spear, Bow, Dagger), server projectiles, WeaponSelector UI, client projectile rendering.
- **SPRINT-5-SUMMARY.md** — Sprint 5 complete: progression (XP, level cap 20, skill trees, unlock skills), loot boxes (starter gear pool, open API), equipment (inventory, equip/unequip, craft 3→1, salvage for gold), match persistence (stats, rewards), match history UI, UserGold, shared loot/skills/crafting packages.

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
- **sprint-3.5.md** — Sprint 3.5 (remaining items): client prediction, main/off-hand mouse attacks, match creation flow, verification checklist.
- **05-sprint-4-weapons-projectiles.md** — Sprint 4: weapon system (Sword, Spear, Bow, Dagger), attack patterns, server projectiles, client rendering, weapon switching; alignment with EquipmentTemplate/ActionTemplate and data-glossary §8.
- **06-sprint-5-progression-loot.md** — Sprint 5: XP and leveling (8 stats), skill tree, Equipment instances (templateId, rolledMods), GladiatorEquippedItem (slot-based), loot flow, inventory/equipment UI; references equipment.md and data-glossary.
- **07-sprint-6-multiplayer.md** — Sprint 6: matchmaking queue, friend system, challenges, dual-player WebSocket PvP, match history, leaderboard; effective build at match start (data-glossary §9).
- **08-sprint-7-deployment.md** — Sprint 7: bug fixes, tests, performance, Vercel + Railway deployment, env and secrets, mainnet guide, demo video; game data bundle publish step.

---

*Last updated from scan of all markdown files (excl. .claude, .github, agents, node_modules).*
