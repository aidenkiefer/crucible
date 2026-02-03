# CLAUDE.md

This file provides guidance to Claude when working with the **Crucible (Gladiator Coliseum)** codebase: a competitive 1v1 arena combat game with NFT Gladiators, server-authoritative combat, and web-first multiplayer.

---

## Project Overview

**Crucible — Gladiator Coliseum** is a competitive 1v1 arena combat game where players own Gladiators and equipment as on-chain assets and use them in skill-influenced battles.

**Goal:** Build a working demo proving (1) the combat loop is fun and engaging, (2) NFT asset ownership integrates cleanly, (3) multiplayer works smoothly without heavy server load.

**Timeline:** 4–6 weeks · **Team:** 2–3 developers.

**Current state:** Sprint 0 (Setup), Sprint 1 (Auth & NFT Minting), and Sprint 2 (Real-Time Combat) are complete. **Sprint 3 (Frontend Real-Time Combat UI) is next.** The codebase includes: monorepo (pnpm, Turborepo), Next.js 14 frontend (social auth, wallet connection, mint Gladiator NFT, admin dashboard), Express game server (Socket.io, **20Hz combat engine**, **CPU AI**, **match manager**, **WebSocket match handlers**, blockchain event listener), Gladiator NFT contract (Hardhat, **8 stats**, 5 used in combat), Supabase + Prisma.

---

## Status & Roadmap

| Sprint | Focus | Status |
|--------|--------|--------|
| **0** | Project setup & infrastructure | ✅ Complete |
| **1** | Authentication & NFT minting | ✅ Complete |
| **2** | Combat system — CPU battles (20Hz, WASD, sword, dodge, CPU AI) | ✅ Complete |
| **3** | Frontend — Real-time combat UI (Canvas, WASD + mouse, client prediction) | **Next** |
| **4** | Weapons & projectiles | Planned |
| **5** | Progression & loot | Planned |
| **6** | Multiplayer — Real-time PvP | Planned |
| **7** | Polish, testing & deployment | Planned |

When implementing, align with the current or target sprint. Use **docs/plans/00-MASTER-PLAN.md** and the sprint plans (e.g. **docs/plans/04-sprint-3-frontend-animations.md** for current sprint) for scope and deliverables. Do not add features from later sprints or from the "Out of Scope" list unless the task explicitly requests them.

---

## Repository Structure

```
crucible/
├── apps/
│   ├── web/              # Next.js 14 (App Router): auth, wallet, mint, admin
│   └── game-server/       # Express, Socket.io, 20Hz combat engine, CPU AI, match manager, WebSocket match handlers, blockchain event listener
├── packages/
│   ├── shared/            # Shared types and constants
│   └── database/          # Prisma schema and client (Supabase)
├── contracts/             # Gladiator NFT (Hardhat, Solidity)
├── docs/
│   ├── plans/             # 00-MASTER-PLAN + sprint plans (01–08)
│   ├── guides/            # Development setup, testing, deployment
│   ├── features/          # Combat, loot, etc.
│   ├── api/               # REST + WebSocket docs (as added)
│   ├── SPRINT-1-SUMMARY.md
│   └── SPRINT-2-SUMMARY.md
├── concept.md
├── README.md
└── CLAUDE.md
```

Implement only in directories and files that exist; do not assume other top-level apps or services exist unless the task creates them.

---

## Technology Stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 14 (App Router), TypeScript, React 18, TailwindCSS, wagmi + viem, NextAuth.js, Socket.io-client, Canvas API (2D) |
| **Backend** | Supabase (Postgres + Auth + Realtime), Node.js + TypeScript (game server), Socket.io, Express, Prisma |
| **Blockchain** | Solidity, Hardhat, OpenZeppelin, ethers.js, Polygon Mumbai testnet |
| **Infrastructure** | Vercel (frontend), Railway/Render (game server), Supabase Cloud, IPFS/Pinata (optional) |

**Key design decisions (from Master Plan):** Full TypeScript stack; **real-time 20Hz (50ms) server tick** for combat (WASD movement, client prediction, server-authoritative); social auth (Google/Twitter) + wallet linking for minting; Supabase for data; separate game server (not Next.js API routes); testnet only for demo; programmer art first.

---

## Architecture (Summary)

**Game server:** Node.js + Express + Socket.io. **MatchInstance** runs combat at **20Hz (50ms)**; **MatchManager** creates/starts/stops matches; **CombatEngine** handles WASD movement, sword attacks (90° arc, 80-unit range), dodge roll (200ms i-frames), stamina/HP with stat scaling (CON, STR, DEX, SPD, DEF); **CpuAI** uses 3 adaptive strategies (Aggressive/Defensive/Opportunistic). WebSocket events: `match:create`, `match:start`, `match:action`, `match:state` (20Hz), `match:events`, `match:completed`. Blockchain event listener syncs GladiatorMinted → DB.

**Frontend:** Next.js 14. Receives combat state via WebSocket (match:state at 20Hz). Sprint 3 adds Canvas 60 FPS, WASD + mouse aim, client prediction, interpolation. Auth via NextAuth; wallet via wagmi/viem.

**Blockchain:** Gladiator NFT (ERC-721) on Polygon Mumbai. **8 stats** at mint (constitution, strength, dexterity, speed, defense, magicResist, arcana, faith); 5 used in combat (CON, STR, DEX, SPD, DEF). On-chain: ownership, identity, minting, transfers. Off-chain: combat, progression, matchmaking, metadata. Event listener on game server indexes mints into Postgres.

**Combat (implemented):** Real-time 20Hz. Actions: **WASD movement**, **Sword attack** (stamina 15, cooldown 800ms), **Dodge roll** (200ms i-frames, stamina 20, cooldown 1000ms). Server validates cooldowns, stamina, hit resolution, damage. Client sends actions via `match:action`; server is source of truth.

---

## Core Game Concepts

**Gladiators:** Unique NFTs. Immutable at mint: ID, class (Duelist, Brute, Assassin), **8 base stats** (constitution, strength, dexterity, speed, defense, magicResist, arcana, faith). Mutable off-chain: level, XP, skillPointsAvailable, unlockedSkills (skill IDs), equipped gear (slot-based), loadout (prepared spells, equipped abilities). Synced to DB via game-server event listener when minted. Equipping is **slot-based** (GladiatorEquippedItem): MAIN_HAND, OFF_HAND, HELMET, CHEST, GAUNTLETS, GREAVES. Legacy equippedWeaponId/equippedArmorId kept for transition.

**Equipment:** **Template vs instance.** EquipmentTemplate (authoring layer) defines archetypes; authored in DB, **published to JSON/TS** for runtime. Equipment (instance) is player-owned; references template; has rolledMods (JSON), grantedPerkIds; type/rarity/name and stat bonuses (legacy). Runtime combat reads **published static data**, not DB. Types: WEAPON, ARMOR, CATALYST, TRINKET, AUGMENT. Additional weapons (Spear, Bow, Dagger) in Sprint 4.

**Actions:** ActionTemplate defines attacks/casts/mobility/utility; category, cooldown, stamina/mana, hitbox/projectile/damage/effect config (JSON). Equipment grants actions via EquipmentTemplateAction join. Demo: weapon-based kits; class abilities later.

**Derived combat stats:** At match start the server computes an effective build (Gladiator base + template baseStatMods + instance rolledMods + perks); that aggregate is immutable for the match and the sole input to combat. Do not query templates or instances mid-match. JSON shapes and conventions: **docs/data-glossary.md** §8–11.

**Combat actions (implemented):** WASD movement, Sword attack, Dodge roll (Sprint 2). Abilities and other weapons in later sprints.

---

## Out of Scope (Demo)

Do not implement unless the task explicitly requests:

- Marketplace UI for trading Gladiators/items
- Loot boxes or gacha mechanics
- Breeding or forging systems
- Token economics or crypto rewards
- Real-money guarantees or redemption
- Advanced ranking (Elo, seasons), tournament brackets, guilds
- Chat or social features beyond friend challenges

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
| **README.md** | Onboarding, quick start, success criteria, roadmap, tech stack, out of scope, doc index. |
| **concept.md** | Vision, combat model, multiplayer architecture, blockchain, rendering, wallets, security, design constraints, open questions (do not implement those yet). |
| **docs/plans/00-MASTER-PLAN.md** | Master plan, sprint breakdown, design decisions, data model, risks, post-demo roadmap. |
| **docs/architecture.md** | System architecture. |
| **docs/plans/01-sprint-0-setup.md** | Sprint 0 setup (reference). |
| **docs/plans/02-sprint-1-auth-nft.md** | Sprint 1 auth & NFT (reference). |
| **docs/plans/03-sprint-2-combat-cpu.md** | Sprint 2 plan (real-time combat CPU, complete). |
| **docs/plans/04-sprint-3-frontend-animations.md** | Sprint 3 plan (frontend real-time combat UI) — **current sprint plan**. |
| **docs/SPRINT-1-SUMMARY.md** | What was built in Sprint 1 (auth, wallet, mint, listener, admin). |
| **docs/SPRINT-2-SUMMARY.md** | What was built in Sprint 2 (combat). |
| **docs/guides/development-setup.md** | Environment, dependencies, running the stack. |
| **docs/features/equipment.md** | Equipment, loot, abilities — template/instance design, slots, authoring, demo scope. |
| **docs/data-glossary.md** | Database & game data glossary — schema, enums, templates, actions, JSON conventions. |

Prefer reading the specific files or docs relevant to the task rather than scanning the whole repo.

---

## Conventions and Practices

- **Scope:** Implement only what is in the demo scope and the current (or requested) sprint. Do not add features listed under "Out of Scope" in README or concept.md unless the task explicitly requests them.
- **Contracts:** Use OpenZeppelin templates; keep contracts minimal and auditable.
- **Server authority:** All match outcomes are server-authoritative; do not trust client-reported results.
- **Game data (docs/data-glossary.md §11):** No hardcoded equipment slots on Gladiator; no behavior hidden in conditional code paths; no runtime dependency on database templates; templates define behavior, instances define ownership; admin tooling drives content velocity.
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

- **What this is:** Crucible — Gladiator Coliseum: 1v1 arena combat demo with NFT Gladiators, server-authoritative real-time combat (20Hz), and web multiplayer. Sprint 0 + 1 + 2 complete (monorepo, Next.js auth/wallet/mint/admin, Express game server with 20Hz combat engine, CPU AI, match manager, WebSocket match handlers, event listener, Gladiator NFT contract with 8 stats, Supabase + Prisma). Sprint 3 (Frontend Real-Time Combat UI) is next.
- **Where to look:** README.md for overview and roadmap; concept.md for vision and constraints; docs/plans/00-MASTER-PLAN.md for full plan; docs/plans/04-sprint-3-frontend-animations.md for current sprint; docs/SPRINT-1-SUMMARY.md and docs/SPRINT-2-SUMMARY.md for what’s built; docs/architecture.md for architecture.
- **What to respect:** Demo scope and out-of-scope list, design constraints (no overbuild, modular, blockchain = ownership), server-authoritative outcomes, and the sprint roadmap (do not implement later-sprint or out-of-scope features unless requested).
