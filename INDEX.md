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
│   │       │   ├── match-instance.ts     # Per-match state, 60Hz tick loop; Sprint 5: persistence, rewards, XP; Sprint 6: PvP, hasUser()
│   │       │   ├── match-manager.ts      # Create/join matches, CPU or PvP; getActiveMatchesForUser() (Sprint 6)
│   │       │   ├── matchmaking-service.ts # Sprint 6: FIFO queue, pair players, emit match:found
│   │       │   ├── input-validator.ts     # Sprint 6: validate actions (stamina, cooldowns, move magnitude)
│   │       │   ├── rate-limiter.ts        # Sprint 6: input flood prevention (120/sec sliding window)
│   │       │   ├── disconnect-handler.ts  # Sprint 6: state snapshots, 30s reconnection window
│   │       │   ├── progression.ts        # Sprint 5: XP, leveling, getXPForLevel, awardXP, skill points
│   │       │   └── bundle-loader.ts      # Load active game data bundle from Supabase Storage (Sprint 2.5)
│   │       └── sockets/
│   │           ├── index.ts     # Socket.IO setup, auth, namespaces; Sprint 6: matchmaking integration
│   │           ├── match-handlers.ts     # Join match, input (validated/rate-limited), disconnect/reconnect (Sprint 6)
│   │           └── matchmaking-handlers.ts # Sprint 6: matchmaking:join/leave, match:found
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
│       │       ├── admin/   # Admin API (Sprint 2.5): bundles, action-templates, equipment-templates, users (Manage Users, test-gladiator)
│       │       ├── skill-trees/route.ts         # GET all 6 skill trees (definitions from shared)
│       │       ├── gladiators/test/route.ts     # POST create test gladiator for current user (Camp)
│       │       ├── matches/history/route.ts     # Sprint 5: match history
│       │       ├── loot-boxes/route.ts, open/route.ts  # Sprint 5: loot box inventory, open
│       │       ├── gladiators/route.ts          # List current user's gladiators (Camp)
│       │       ├── gladiators/[gladiatorId]/progression/route.ts, skills/unlock/route.ts, equip/route.ts, stats/route.ts  # Sprint 5 progression, skills, equip, stat allocation
│       │       ├── equipment/route.ts, craft/route.ts, salvage/route.ts  # Sprint 5: inventory, craft 3→1, salvage
│       │       ├── gold/balance/route.ts        # Sprint 5: gold balance
│       │       ├── friends/add/route.ts, friends/accept/route.ts  # Sprint 6: add friend, accept request
│       │       └── challenges/create/route.ts, challenges/accept/route.ts  # Sprint 6: create challenge, accept → PvP match
│       ├── components/
│       │   ├── auth/SignInForm.tsx, SignInButton.tsx
│       │   ├── arena/          # Sprint 3–4: interpolation, renderer, ArenaCanvas, MatchHUD, WeaponSelector
│       │   ├── equipment/      # Sprint 5: CraftingWorkshop.tsx, EquipmentInventory.tsx
│       │   ├── gladiators/     # Sprint 5: GladiatorProgression.tsx
│       │   ├── loot/           # Sprint 5: LootBoxInventory.tsx
│       │   ├── mint/MintGladiator.tsx
│       │   ├── camp/          # Camp: CreateTestGladiatorModal, ActiveSkillsGrid, TestGladiatorSetup
│       │   ├── providers/SessionProvider.tsx, WagmiProvider.tsx
│       │   ├── skills/         # Sprint 5: SkillTree.tsx (6 trees, tier prerequisites, tooltips)
│       │   ├── ui/AnimatedTorch.tsx
│       │   └── wallet/ConnectWallet.tsx
│       ├── hooks/
│       │   ├── useMintGladiator.ts
│       │   ├── useSocket.ts           # Sprint 3: singleton Socket.io to game server
│       │   ├── useRealTimeMatch.ts    # Sprint 3: match:join/state/input/complete; projectile Map (Sprint 4)
│       │   ├── useGameInput.ts        # Sprint 3–3.5: WASD, mouse aim, Space/Shift, L/R click main/off-hand; 1–4 weapon (Sprint 4)
│       │   ├── useClientPrediction.ts # Sprint 3.5: local player prediction, reconciliation
│       │   └── useCreateMatch.ts      # Sprint 3.5: match:create, match:start, navigate to match
│       ├── contexts/      # SkillTreeContext (single fetch /api/skill-trees on mount, useSkillTrees())
│       ├── lib/
│       │   ├── auth.ts         # NextAuth config, session
│       │   ├── arena.ts        # Arena status (open/closed messages, NEXT_PUBLIC_ARENA_OPEN)
│       │   ├── class-stat-display.tsx  # Shared 8-stat bars (CON..FTH) for class selection (mint, admin modal)
│       │   ├── contracts.ts    # Contract addresses, ABIs
│       │   ├── wagmi.ts        # Wagmi config, chains
│       │   ├── sprites/        # Sprint 3: types.ts, SpriteLoader.ts, AnimationPlayer.ts
│       │   └── admin/         # Admin (Sprint 2.5): validator.ts, exporter.ts
│       │
│       └── public/
│           └── assets/
│               ├── backgrounds/   # Menu, camp, arena (main-menu-background.png, camp-background.png, campfire.gif)
│               ├── chests/        # Shop chest images (wooden, bronze, stone, platinum)
│               ├── items/         # Item icons for inventory UI (EquipmentInventory uses iconUrl from /api/equipment, resolved from template.ui)
│               │   ├── commons/     # Common-tier (balanced-armor, iron-sword, spear, steel-dagger, etc.)
│               │   ├── uncommons/   # Uncommon-tier
│               │   ├── rares/      # Rare-tier
│               │   ├── epics/      # Epic-tier
│               │   └── legendaries/ # Legendary-tier
│               ├── sprites/     # Character sprites (duelist_base, female_base), animations, manifests
│               └── ui/          # Buttons, icons, menu-box, pop-up, slots (inventory-slots.png)
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
    │   ├── package.json        # Prisma client, build = prisma generate; backfill-ui script for equipment UI metadata
    │   ├── prisma/
    │   │   ├── schema.prisma   # User, Gladiator, Equipment, Match (persistence, rewards), LootBox, UserGold (Sprint 5), GameDataBundle, etc.
    │   │   └── migrations/    # add_8_stats_to_gladiator; Sprint 5: Match/LootBox/UserGold as needed
    │   ├── scripts/
    │   │   └── backfill-equipment-ui.ts  # One-off: populate EquipmentTemplate.ui (displayName, icon) for existing templates
    │   └── src/
    │       ├── client.ts       # Prisma client singleton
    │       ├── index.ts        # Re-exports client, equipment-ui-types
    │       └── equipment-ui-types.ts  # EquipmentUIMetadata type, validateEquipmentUIMetadata(); used by Admin UI and API
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

## Non-documentation summaries

### Root

- **.env.example** — Template for env vars (e.g. DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET).
- **.gitignore** — Ignore node_modules, .env, build outputs, etc.
- **package.json** — Root package: turbo dev/build/lint/test/clean; packageManager pnpm.
- **pnpm-workspace.yaml** — Workspaces: apps/*, packages/*, contracts.
- **turbo.json** — Pipeline: build (outputs .next, dist), dev (persistent), lint, test.

### apps/game-server

- **index.ts** — Entry: load env, create HTTP+WS server, start gladiator sync (blockchain listener).
- **server.ts** — Express server, Socket.IO mount with Redis adapter (Sprint 6), CORS; no route logic (match logic in services/sockets).
- **combat/engine.ts** — 20Hz tick; multi-weapon (Sword, Spear, Bow, Dagger); melee + projectile attacks; updateProjectiles(); CombatEvent.
- **combat/physics.ts** — Uses shared physics package; position/velocity, hitboxes, dodge roll, collision.
- **combat/damage-calculator.ts** — Thin wrapper over shared combat (damage, stats); HP/stamina, apply damage.
- **combat/types.ts** — Combatant (weapon), CombatState (projectiles map), CombatEvent, WeaponType, ProjectileState.
- **ai/cpu-ai.ts** — CPU decision: pick target, choose action (attack/dodge/block), optional difficulty tuning.
- **services/match-manager.ts** — Create match (CPU or PvP), assign match instance, track active matches.
- **services/match-instance.ts** — Single match: combat state, 60Hz tick loop (Sprint 6), input application, game-over; Sprint 5: match persistence, stats, loot drop, XP award; Sprint 6: PvP (dual-player), hasUser() for disconnect handling.
- **services/match-manager.ts** — Create match (CPU or PvP), assign match instance, track active matches; getActiveMatchesForUser() (Sprint 6).
- **services/matchmaking-service.ts** — Sprint 6: FIFO queue, pair two players, create PvP match, emit match:found.
- **services/input-validator.ts** — Sprint 6: validate match:action (stamina, cooldowns, move magnitude).
- **services/rate-limiter.ts** — Sprint 6: sliding-window rate limit (120 inputs/sec) on match:action.
- **services/disconnect-handler.ts** — Sprint 6: save state snapshot on disconnect, 30s reconnection window; match:player-disconnected, match:reconnect, match:player-reconnected.
- **services/progression.ts** — Sprint 5: getXPForLevel, awardXP, level cap 20, skill points on level up.
- **services/blockchain-listener.ts** — Subscribe to GladiatorNFT Mint/Transfer; on event, sync gladiator to DB.
- **services/gladiator-sync.ts** — Start blockchain listener; ensure DB has gladiator records for minted tokens.
- **services/bundle-loader.ts** — Load active game data bundle from Supabase Storage at startup; getEquipmentTemplate(key), getActionTemplate(key) (Sprint 2.5).
- **services/abi.ts** — Gladiator NFT ABI used by listener.
- **sockets/index.ts** — Socket.IO server setup, auth middleware, match namespace; Sprint 6: matchmaking integration.
- **sockets/match-handlers.ts** — Join match, receive client input (validated, rate-limited), disconnect/reconnect handling (Sprint 6).
- **sockets/matchmaking-handlers.ts** — Sprint 6: matchmaking:join, matchmaking:leave, match:found.

### apps/web

- **app/layout.tsx** — Root layout; SessionProvider, WagmiProvider.
- **app/page.tsx** — Home page.
- **app/globals.css** — Global CSS (Tailwind base/components/utilities).
- **app/admin/page.tsx** — Admin dashboard; full Admin UI (Sprint 2.5): bundles, equipment/action template CRUD, validate, publish, export (see app/admin/, app/api/admin/, lib/admin/).
- **app/auth/signin/page.tsx** — Sign-in page.
- **app/mint/page.tsx** — Mint Gladiator NFT page (class selection, wallet).
- **app/arena/page.tsx** — Sprint 3.5: arena entry; create CPU match via useCreateMatch, navigate to /match/[matchId].
- **app/quick-match/page.tsx** — Sprint 6: Quick Match UI; join/leave matchmaking queue, listen for match:found, navigate to /match/[matchId].
- **app/friends/page.tsx** — Sprint 6: Friends & Challenges UI; add/accept friends, create/accept challenges (API routes; GET friends/challenges deferred).
- **app/matches/page.tsx** — Sprint 5: match history UI; filters, victory/defeat styling, rewards display.
- **app/match/[matchId]/page.tsx** — Sprints 3–4: real-time match (ArenaCanvas, MatchHUD, WeaponSelector, useRealTimeMatch, useGameInput, useClientPrediction; Fight Again creates new match).
- **app/api/auth/[...nextauth]/route.ts** — NextAuth API route (Google/Twitter, session).
- **app/api/user/link-wallet/route.ts** — Link wallet address to authenticated user.
- **app/api/matches/history/route.ts** — Sprint 5: match history with filters.
- **app/api/loot-boxes/route.ts**, **loot-boxes/open/route.ts** — Sprint 5: loot box inventory, open box.
- **app/api/gladiators/[gladiatorId]/progression/route.ts**, **skills/unlock/route.ts**, **equip/route.ts** — Sprint 5: XP/level, unlock skill, equip/unequip.
- **app/api/equipment/route.ts**, **equipment/craft/route.ts**, **equipment/salvage/route.ts** — Sprint 5: equipment inventory, craft 3→1, salvage for gold.
- **app/api/gold/balance/route.ts** — Sprint 5: gold balance.
- **app/api/friends/add/route.ts**, **friends/accept/route.ts** — Sprint 6: add friend by username, accept friend request.
- **app/api/challenges/create/route.ts**, **challenges/accept/route.ts** — Sprint 6: create challenge, accept challenge (creates PvP match).
- **app/api/skill-trees/route.ts** — GET all 6 skill trees (from shared); consumed by SkillTreeContext.
- **app/api/gladiators/test/route.ts** — POST create test gladiator for current user (Camp); **app/api/admin/users/[userId]/test-gladiator/route.ts** — POST create test gladiator for target user (admin only).
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
- **public/assets/** — Static assets: **backgrounds/** (menu, camp, arena), **chests/** (shop), **items/** (inventory UI icons by rarity: commons/, uncommons/, rares/, epics/, legendaries/ — use template.ui.inventoryImage e.g. `/assets/items/commons/balanced-armor.png`), **sprites/** (character art), **ui/** (buttons, icons, menu-box, slots).
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
- **src/equipment-ui-types.ts** — EquipmentUIMetadata type, validateEquipmentUIMetadata(); used by Admin UI and API for template UI metadata.
- **src/index.ts** — Re-exports client and equipment-ui-types.
- **scripts/backfill-equipment-ui.ts** — One-off script to populate EquipmentTemplate.ui (displayName, icon) for existing templates; run via `pnpm --filter @gladiator/database backfill-ui`.

### packages/shared

- **src/index.ts** — Re-exports from constants and types.
- **src/constants/index.ts** — Combat (tick interval, health/stamina, ACTION_CONFIG), progression (XP_*), loot (LOOT_DROP_RATES).
- **src/types/index.ts** — GladiatorClass, User, Gladiator, Equipment, Match, etc.
- **src/loot/starter-gear.ts** — Sprint 5: starter gear definitions (4 armor sets, 7 weapons) for loot box pool.
- **src/skills/skill-trees.ts** — Sprint 5: skill tree definitions (6 cross-class trees, 108 skills, SkillNode, tier prerequisites, getSkillTree, findSkillById, canUnlockSkill).
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
    │
    ├── asset-docs/              # Art/asset guidelines and specs
    │   ├── equipment-v0.md       # Equipment asset guidelines (v0)
    │   ├── gladiator-v0.md      # Gladiator asset guidelines (v0)
    │   ├── guidelines-v0.md     # Asset guidelines v0
    │   └── guidelines-v1.md     # Asset guidelines v1
    │
    ├── audits/
    │   └── architecture-audit.md # Architecture review/audit notes
    │
    ├── bugs/
    │   └── auth-callback-bug.md # Auth callback bug investigation / notes
    │
    ├── design/                  # UI/UX and visual design
    │   ├── design-guidelines.md # Design principles: Blood & Bronze palette, typography, color, motion, accessibility, tone
    │   └── ui-rpg-design.md     # RPG UI design notes
    │
    ├── features/                # Feature specs and plans
    │   ├── admin-ui.md          # Admin UI plan: game data authoring, CRUD templates, validation, publish/export, Manage Users (create test Gladiator)
    │   ├── combat.md            # Combat feature spec: real-time model, actions, weapons, hitboxes, projectiles
    │   ├── equipment.md         # Equipment/loot/abilities design: template vs instance, slots, authoring, demo scope
    │   ├── skill-trees-cross-class.md  # Cross-class skill trees: player-facing (6 trees, builds, prerequisites)
    │   ├── skill-trees-system.md      # Skill tree system: how it works, storage, fetching, performance (technical)
    │   ├── mainnet-migration.md # Mainnet migration (post-demo)
    │   ├── perks-and-abilities.md # Perks and abilities design
    │   └── planned-features.md  # Backlog: immediate/critical, abstract systems, post-launch, brainstorming
    │
    ├── guides/                  # How-to and setup
    │   ├── development-setup.md # Prerequisites, clone, install, env, database setup, run dev servers, troubleshooting (incl. Supabase DB)
    │   ├── testing-admin-ui.md  # How to test Admin UI locally: seed, isAdmin, Storage, dev servers, what to test
    │   └── vercel-deployment.md # Vercel: Root Directory apps/web, env vars (NEXT_PUBLIC_ vs server-only), checklist, optional turbo-ignore
    │
    └── plans/
        ├── implementation/      # Date-stamped implementation plans
        │   ├── 2026-02-04-sprint-3-implementation.md  # Sprint 3 implementation details
        │   ├── 2026-02-05-rpg-ui-implementation-plan.md # RPG UI implementation plan
        │   └── 2026-02-09-template.md  # Option 1: DB/bundles as source of truth for equipment UI metadata (see specs + tickets)
        │
        ├── specs/               # Read-only context for implementation (rules, constraints)
        │   └── equipment-ui-metadata-db-bundles-spec.md  # Equipment UI metadata: DB + bundle as source of truth, no repo writes
        │
        ├── tickets/             # Bounded implementation tasks (one ticket at a time per claude-workflow-opt.md)
        │   ├── 01-equipment-ui-review-plan-vs-codebase.md   # Review Option 1 plan against codebase (no code changes)
        │   ├── 02-equipment-ui-remove-manifest-writes.md    # Remove filesystem side-effects from equipment template create
        │   ├── 03-equipment-ui-formalize-ui-metadata-schema.md
        │   ├── 04-equipment-ui-admin-ui-metadata-editor.md
        │   ├── 05-equipment-ui-backfill-ui-metadata.md
        │   ├── 06-equipment-ui-bundle-export-include-ui.md
        │   ├── 07-equipment-ui-api-enrich-equipment-response.md
        │   ├── 08-equipment-ui-inventory-render-icons.md
        │   └── 09-equipment-ui-validation-ui-metadata.md
        │
        ├── sprints/             # Sprint plan docs (what to build)
        │   ├── 00-MASTER-PLAN.md    # Master plan: goal, success criteria, tech stack, sprints, design decisions, data model, risks
        │   ├── 01-sprint-0-setup.md # Sprint 0: monorepo, Supabase, contracts scaffold, Next.js, game server, CI, docs
        │   ├── 02-sprint-1-auth-nft.md   # Sprint 1: social auth, wallet, mint UI, event listener, admin
        │   ├── 03-sprint-2-combat-cpu.md # Sprint 2: 20Hz combat engine, WASD, sword, dodge, CPU AI, WebSocket
        │   ├── 04-sprint-3-frontend-animations.md # Sprint 3: Canvas 60 FPS, WASD + mouse, client prediction, interpolation
        │   ├── 05-sprint-4-weapons-projectiles.md # Sprint 4: Sword, Spear, Bow, Dagger; projectiles; weapon UI
        │   ├── 06-sprint-5-progression-loot.md    # Sprint 5: XP, leveling, skill tree, equipment, loot, crafting, inventory
        │   ├── 07-sprint-6-multiplayer.md         # Sprint 6: matchmaking, friends, challenges, real-time PvP, leaderboard
        │   ├── 08-sprint-7-deployment.md          # Sprint 7: polish, tests, Vercel + Railway, mainnet guide, demo video
        │   ├── 09-sprint-2.5-admin-ui.md          # Sprint 2.5: Admin UI — game data authoring, bundles, templates, publish/export
        │   ├── 10-sprint-8-post-demo.md           # Sprint 8: post-demo roadmap
        │   └── sprint-3.5.md                      # Sprint 3.5: client prediction, mouse attacks, match creation, verification
        │
        └── summaries/           # What was built (sprint completion summaries + feature implementations)
            ├── EQUIPMENT-UI-METADATA-IMPLEMENTATION.md  # Equipment UI metadata: DB/bundles source of truth, Admin UI structured form, /api/equipment enrichment, inventory icons
            ├── SPRINT-1-SUMMARY.md    # Sprint 1 complete: auth, wallet, mint, event listener, admin
            ├── SPRINT-2-SUMMARY.md    # Sprint 2 complete: 20Hz combat, WASD, sword, dodge, CPU AI, WebSocket
            ├── SPRINT-2.5-SUMMARY.md  # Sprint 2.5 complete: Admin UI — bundles, templates, validate/publish/export, bundle loader
            ├── SPRINT-3-SUMMARY.md    # Sprint 3 complete: Canvas arena, sprites, input, WebSocket, MatchHUD, match page
            ├── SPRINT-3.5-SUMMARY.md  # Sprint 3.5 complete: shared physics, client prediction, mouse attacks, match creation
            ├── SPRINT-4-SUMMARY.md    # Sprint 4 complete: shared combat, 4 weapons, projectiles, WeaponSelector, client projectile rendering
            ├── SPRINT-5-SUMMARY.md   # Sprint 5 complete: progression, loot boxes, equipment/crafting/salvage, match history, gold
            └── SPRINT-6-SUMMARY.md   # Sprint 6 complete: PvP, matchmaking, friends/challenges, Redis, 60Hz sim, input validation, disconnect handling
```

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

### docs/ (root)

- **architecture.md** — Three-tier architecture (frontend, backend, blockchain); component breakdown (frontend, game server with MatchManager, MatchInstance, CombatEngine, CpuAI, etc., database with schema overview and key models including GameDataBundle, EquipmentTemplate, ActionTemplate, derived combat stats), blockchain layer, data flow (minting, combat CPU, PvP), security, performance, scalability, deployment, technology rationale, future enhancements.
- **data-glossary.md** — Canonical reference for schema and game data: enums (GameDataStatus, EquipmentType, EquipmentSlot, ActionCategory), User/Friend, Gladiator/GladiatorLoadout, Equipment/GladiatorEquippedItem, Match/Challenge, GameDataBundle, EquipmentTemplate (§4.5 Equipment UI Metadata), ActionTemplate, EquipmentTemplateAction; action & attack vocabulary; suggested JSON shapes (§8); derived combat stats (§9); demo scope note (§10); guiding principles (§11).
- **plans/summaries/EQUIPMENT-UI-METADATA-IMPLEMENTATION.md** — Equipment UI metadata implementation: DB/bundles as source of truth, Admin UI structured form (no filesystem writes), /api/equipment enrichment (displayName, iconUrl), inventory icon rendering, validation (warn on save, block publish), backfill script.
- **features/skill-trees-cross-class.md** — Player-facing overview: 6 cross-class trees (Valor, Instinct, Discipline, Intellect, Zeal, Ferocity), 20 skill points, flexible tier prerequisites, example builds, tips.
- **features/skill-trees-system.md** — Technical reference: how skill trees work (rules, unlock flow), storage (definitions in shared, Gladiator.unlockedSkills/skillPointsSpent), fetching (GET /api/skill-trees, SkillTreeContext single fetch), performance (caching, memoization, debounced tooltips).
