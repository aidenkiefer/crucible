# CLAUDE.md

This file provides guidance to Claude when working with the **Crucible (Gladiator Coliseum)** codebase: a competitive 1v1 arena combat game with NFT Gladiators, server-authoritative combat, and web-first multiplayer.

---

## Project Overview

**Crucible — Gladiator Coliseum** is a competitive 1v1 arena combat game where players own Gladiators and equipment as on-chain assets and use them in skill-influenced battles.

**Goal:** Build a working demo proving (1) the combat loop is fun and engaging, (2) NFT asset ownership integrates cleanly, (3) multiplayer works smoothly without heavy server load.

**Timeline:** 4–6 weeks · **Team:** 2–3 developers.

**Current state:** Sprints 0 through 6 are complete. **Sprint 7 (Polish & deployment) is next.** The codebase includes: monorepo (pnpm, Turborepo), Next.js 14 frontend (social auth, wallet, mint Gladiator NFT; **admin UI** for game data; **arena** at `/arena` with match creation; **camp** at `/camp` for gladiators, inventory, crafting, stat/skill points; **match page** with Canvas, 4 weapons, projectiles, client prediction; **match history** at `/matches`; **progression** (XP, level, skill trees, stat allocation); **loot boxes** and **equipment** (inventory, equip, craft 3→1, salvage for gold); **quick match** at `/quick-match`; **friends & challenges** at `/friends`; Blood & Bronze UI), Express game server (real-time combat engine **60Hz sim / 20Hz broadcast**, multi-weapon, projectiles, CPU AI; **match persistence**, **rewards**, **XP/progression**, **loot drops**; **matchmaking** and **PvP via challenges**; **input validation & rate limiting**, **disconnect/reconnect handling**; Redis-backed Socket.io adapter; bundle loader, blockchain listener), **packages/shared** (physics, combat, loot, skills, crafting), Gladiator NFT (Hardhat, 8 stats), Supabase + Prisma (Match, LootBox, UserGold, Friend, Challenge).

---

## Status & Roadmap

| Sprint | Focus | Status |
|--------|--------|--------|
| **0** | Project setup & infrastructure | ✅ Complete |
| **1** | Authentication & NFT minting | ✅ Complete |
| **2** | Combat system — CPU battles (20Hz, WASD, sword, dodge, CPU AI) | ✅ Complete |
| **2.5** | Admin UI — game data authoring (bundles, templates, validate, publish, export, bundle loader) | ✅ Complete |
| **3** | Frontend — Real-time combat UI (Canvas, sprites, WASD + mouse, MatchHUD, match page) | ✅ Complete |
| **3.5** | Shared physics, client prediction, mouse main/off-hand, match creation flow | ✅ Complete |
| **4** | Weapons & projectiles (Sword, Spear, Bow, Dagger; shared combat; WeaponSelector) | ✅ Complete |
| **5** | Progression & loot (XP/level/skill trees, loot boxes, equipment, crafting/salvage, match history, gold) | ✅ Complete |
| **6** | Multiplayer — matchmaking queue, friends, challenges, PvP WebSocket, Redis scaling, 60Hz sim, input validation, disconnect handling | ✅ Complete |
| **7** | Polish, testing & deployment | Planned |

When implementing, align with the current or target sprint. Use **docs/plans/sprints/00-MASTER-PLAN.md** and the sprint plans (e.g. **docs/plans/sprints/08-sprint-7-deployment.md** for Sprint 7) for scope and deliverables. Do not add features from later sprints or from the "Out of Scope" list unless the task explicitly requests them.

---

## Repository Structure

Read @INDEX.md to understand the file structure and documentation system. 

Implement only in directories and files that exist; do not assume other top-level apps or services exist unless the task creates them.

---

## Technology Stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 14 (App Router), TypeScript, React 18, TailwindCSS, wagmi + viem, NextAuth.js, Socket.io-client, Canvas API (2D) |
| **Backend** | Supabase (Postgres + Auth + Realtime), Node.js + TypeScript (game server), Socket.io, Express, Prisma, Redis (Socket.io adapter for scaling) |
| **Blockchain** | Solidity, Hardhat, OpenZeppelin, ethers.js, Polygon Mumbai testnet |
| **Infrastructure** | Vercel (frontend), Railway/Render (game server), Supabase Cloud, IPFS/Pinata (metadata, optional) |

**Key design decisions (from Master Plan):** Full TypeScript stack; **real-time 20Hz (50ms) broadcast** for combat state (server may simulate at higher rate internally); WASD movement, client prediction, server-authoritative; social auth (Google/Twitter) + wallet linking for minting; Supabase for data; separate game server (not Next.js API routes); testnet only for demo; programmer art first. **packages/shared** holds physics, combat, loot, skills, and crafting used by both server and (where applicable) client.

---

## Architecture (Summary)

**Game server:** Node.js + Express + Socket.io (Redis adapter for horizontal scaling). **MatchInstance** runs combat (**60Hz sim, 20Hz broadcast**); **MatchManager** creates/starts/stops matches (CPU and PvP), getActiveMatchesForUser() for reconnect. **CombatEngine** uses **shared physics** and **shared combat** packages: WASD movement, **4 weapons** (Sword, Spear, Bow, Dagger) with melee arcs and projectiles, dodge roll, stamina/HP, stat scaling (CON, STR, DEX, SPD, DEF). **CpuAI** uses 3 adaptive strategies. **MatchmakingService** (FIFO queue) pairs players, emits **match:found**. **InputValidator** and **RateLimiter** validate and rate-limit **match:action**. **DisconnectHandler** saves state snapshot, 30s reconnection window (match:player-disconnected, match:reconnect, match:player-reconnected). **ProgressionService** awards XP and levels; **LootService** generates post-match loot. **BundleLoader** loads the active published game data bundle from Supabase Storage at startup; combat reads templates via getEquipmentTemplate(key), getActionTemplate(key). WebSocket events: `match:create`, `match:start`, `match:action`, `match:state` (20Hz), `match:events`, `match:completed`, `match:found` (matchmaking), `matchmaking:join`, `matchmaking:leave`. Blockchain event listener syncs GladiatorMinted → DB.

**Frontend:** Next.js 14. Key routes: `/` (landing + logged-in dashboard: Camp, Forge, Glory Battle, Enter Arena, Quick Match, Friends, admin); `/arena` (create CPU match → `/match/[matchId]`); `/camp` and `/camp/gladiators/[id]` (gladiators, inventory, progression, skills, stat points, equipment); `/quick-match` (matchmaking queue); `/friends` (friends and challenges); `/match/[matchId]` (real-time combat: Canvas, MatchHUD, WeaponSelector, 4 weapons, projectiles, client prediction). Auth via NextAuth; wallet via wagmi/viem.

**Blockchain:** Gladiator NFT (ERC-721) on Polygon Mumbai. **8 stats** at mint; 5 used in combat. On-chain: ownership, identity, minting, transfers. Off-chain: combat, progression, matchmaking, loot, metadata. Event listener indexes mints into Postgres.

**Combat (implemented):** Real-time, server-authoritative. **WASD movement**; **4 weapons** (Sword, Spear, Bow, Dagger) with melee and projectile attacks; **Dodge roll** (i-frames, stamina, cooldown). Server validates cooldowns, stamina, hit resolution, damage. Client sends input via `match:action`; server is source of truth.

---

## Core Game Concepts

**Gladiators:** Unique NFTs. Immutable at mint: ID, class (Duelist, Brute, Assassin), **8 base stats**. Mutable off-chain: **level**, **XP**, **skillPointsAvailable** (spent on skill tree unlocks), **stat points on level up** (e.g. 3 points per level to allocate), **unlockedSkills**, equipped gear (slot-based), loadout. Synced to DB via game-server event listener when minted. Equipping is **slot-based** (GladiatorEquippedItem): MAIN_HAND, OFF_HAND, HELMET, CHEST, GAUNTLETS, GREAVES.

**Equipment:** **Template vs instance.** EquipmentTemplate (authoring) defines archetypes; published to JSON/TS for runtime. Equipment (instance) is player-owned; references template; has rolledMods (JSON), rarity; can be **crafted** (3→1 with rarity rules) and **salvaged** for gold. Starter gear cannot be crafted or salvaged. Runtime combat reads **published static data**, not DB. Types: WEAPON, ARMOR, CATALYST, TRINKET, AUGMENT. **4 weapons implemented:** Sword, Spear, Bow, Dagger.

**Actions:** ActionTemplate defines attacks/casts/mobility/utility; category, cooldown, stamina/mana, hitbox/projectile/damage/effect config (JSON). Equipment grants actions via EquipmentTemplateAction. Demo: weapon-based kits; class abilities later.

**Progression & economy:** Matches award **XP** (and **loot**); level cap 20. **LootBox** drops from matches; open for equipment. **UserGold** tracks gold (salvage, future sinks). **Match** records completion, rewards, and stats.

**Derived combat stats:** At match start the server computes an effective build (Gladiator base + template baseStatMods + instance rolledMods + perks); that aggregate is immutable for the match. Do not query templates or instances mid-match. **docs/data-glossary.md** §8–11.

**Combat actions (implemented):** WASD movement; **4 weapons** (Sword, Spear, Bow, Dagger) with melee and projectile attacks; Dodge roll. Matchmaking and friends/challenges support PvP match creation.

---

## Out of Scope (Demo)

Do not implement unless the task explicitly requests:

- Marketplace UI for trading Gladiators/items
- Token economics or crypto rewards
- Real-money guarantees or redemption
- Advanced ranking (Elo, seasons), tournament brackets, guilds

See **README.md** and **docs/plans/00-MASTER-PLAN.md** for full list.

---

## Design Constraints for AI Scaffolding

When implementing or scaffolding:

- **Do not overbuild.** Prefer stubs and interfaces over full implementations when the plan says so.
- **Keep systems modular.** Clean boundaries, simple flows, replaceable components.
- **Avoid premature optimization.**
- **Blockchain = ownership only.** No gameplay logic on-chain.

Focus on clean boundaries, simple flows, and replaceable components.

---

## Key Documentation

| Document | Use when |
|----------|----------|
| **INDEX.md** | File and doc layout; locate config, entry points, modules, and all markdown docs (non-docs index + documentation index). |
| **README.md** | Onboarding, quick start, success criteria, roadmap, tech stack, out of scope, doc table. |
| **concept.md** | Vision, combat model, multiplayer architecture, blockchain, design constraints, open questions (do not implement those yet). |
| **docs/plans/sprints/00-MASTER-PLAN.md** | Master plan, sprint breakdown, design decisions, data model, risks, post-demo roadmap. |
| **docs/architecture.md** | System architecture (frontend, game server, shared libs, DB, data flow). |
| **docs/plans/sprints/01-sprint-0-setup.md** … **10-sprint-8-post-demo.md**, **sprint-3.5.md** | Sprint plans (what to build). **Current focus:** **docs/plans/sprints/08-sprint-7-deployment.md** (Sprint 7). |
| **docs/plans/summaries/SPRINT-1-SUMMARY.md** … **SPRINT-6-SUMMARY.md** | What was built in Sprints 1–6 (and 2.5, 3, 3.5, 4, 5 via summaries). |
| **docs/guides/development-setup.md** | Environment, dependencies, running the stack. |
| **docs/guides/vercel-deployment.md** | Vercel deployment (root dir, env, checklist). |
| **docs/features/equipment.md** | Equipment, loot, abilities — template/instance, slots, authoring, demo scope. |
| **docs/features/admin-ui.md** | Admin UI — game data authoring, CRUD, validation, publish/export. |
| **docs/data-glossary.md** | Database & game data glossary — schema, enums, templates, actions, JSON conventions (§8–11). |

Prefer reading the specific files or docs relevant to the task rather than scanning the whole repo.

---

## Conventions and Practices

- **Scope:** Implement only what is in the demo scope and the current (or requested) sprint. Do not add features listed under "Out of Scope" in README or concept.md unless the task explicitly requests them.
- **Contracts:** Use OpenZeppelin templates; keep contracts minimal and auditable.
- **Server authority:** All match outcomes are server-authoritative; do not trust client-reported results.
- **Game data (docs/data-glossary.md §11):** No hardcoded equipment slots on Gladiator; no behavior hidden in conditional code paths; no runtime dependency on database templates; templates define behavior, instances define ownership; admin tooling drives content velocity. Starter gear cannot be crafted or salvaged.
- **Progression:** Level-up grants stat points (e.g. 3) for the player to allocate; skill trees are unlocked with skill points. Match completion persists stats, rewards, and optional loot.
- **Verification:** Prefer reading the specific files or docs that are relevant rather than scanning the whole repo.

---

## Skills

When the task involves rules, workflows, or multi-step processes, use the skills under `agents/skills/skills/` (or the project’s skill path) if available. Start with the "using-superpowers" (or equivalent) skill to see how and when to invoke skills.

---

## Tool Use

Use the minimum number of tool calls needed to complete the task. Prefer reading the specific files or docs that are relevant rather than scanning the whole repo. Do not run destructive or production commands or commit secrets.

---

## No Review, Verification, or QA — Not Allowed

**Claude is NOT ALLOWED to review, verify, or perform QA on code.** That is the user’s job.

- Do **not** run build, dev, test, or run commands to “verify” or “confirm” changes.
- Do **not** offer to “run the tests,” “run a quick build to verify,” or “double-check the implementation.”
- Do **not** re-read the full file after editing to “verify” the change or perform a self-review.
- Do **not** claim that work is “verified” or “tested” on the basis of having run commands.

Review, verification, and quality assurance are **exclusively the user’s responsibility**. Assume your edits are correct and leave all verification to them. If you need to read a file to implement the next step, that is fine—but do not run the project or the test suite, and do not perform review or QA.

---

## No Build or Compile Commands

**Claude must NOT run commands that build or compile code.**

- Do **not** run build or compile steps (e.g. `npm run build`, `poetry build`) unless the user explicitly asks you to run a specific command.
- Do **not** run linters, formatters, or type checkers as a “verification” step unless the user explicitly asks.

Testing and QA are handled by the human. Running builds and tests burns tokens and is unnecessary; assume your edits are correct and leave verification to them.

---

## Summary

- **What this is:** Crucible — Gladiator Coliseum: 1v1 arena combat demo with NFT Gladiators, server-authoritative real-time combat (60Hz sim / 20Hz broadcast), and web multiplayer. **Sprints 0–6 complete:** monorepo; Next.js (auth, wallet, mint, admin UI, arena, camp, match page with 4 weapons/projectiles, match history, progression, loot boxes, equipment/crafting/salvage, quick match, friends/challenges); Express game server (60Hz sim / 20Hz broadcast, 4 weapons, projectiles, CPU AI, match persistence, rewards, XP/progression, loot drops, matchmaking, PvP via challenges, input validation & rate limiting, disconnect/reconnect handling, Redis Socket.io adapter, bundle loader, event listener); packages/shared (physics, combat, loot, skills, crafting); Gladiator NFT (8 stats); Supabase + Prisma. **Sprint 7** (polish & deployment) is next.
- **Where to look:** INDEX.md for file and doc layout; README.md for overview and roadmap; concept.md for vision and constraints; docs/plans/sprints/00-MASTER-PLAN.md for full plan; docs/plans/sprints/08-sprint-7-deployment.md for current sprint; docs/plans/summaries/ (SPRINT-1 through SPRINT-6) for what’s built; docs/architecture.md for architecture; docs/data-glossary.md for schema and game data.
- **What to respect:** Demo scope and out-of-scope list, design constraints (no overbuild, modular, blockchain = ownership), server-authoritative outcomes, starter gear non-craftable/non-salvageable, and the sprint roadmap (do not implement later-sprint or out-of-scope features unless requested).
