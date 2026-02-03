# CLAUDE.md

This file provides guidance to Claude when working with the **Crucible (Gladiator Coliseum)** codebase: a competitive 1v1 arena combat game with NFT Gladiators, server-authoritative combat, and web-first multiplayer.

---

## Project Overview

**Crucible — Gladiator Coliseum** is a competitive 1v1 arena combat game where players own Gladiators and equipment as on-chain assets and use them in skill-influenced battles.

Core pillars:
- **Game-first** — Fun before financialization
- **Player-owned assets** — NFT-backed Gladiators and gear
- **Entry-based competitive matches** — Not gambling
- **Web-first, low-friction** — No heavy client
- **Deterministic, server-authoritative** — Fair, cheat-resistant combat

The demo proves: (1) the combat loop is fun, (2) asset ownership integrates cleanly, and (3) multiplayer runs smoothly without heavy server load.

**Current state:** Early stage. Concept and README are defined; repository structure and services will emerge as we scaffold. No codebase yet beyond docs.

---

## Repository Structure

Currently:
- `concept.md` — Full vision, scope, combat model, multiplayer architecture, blockchain, design constraints
- `README.md` — High-level summary, MVP scope, tech stack, success criteria

Structure (apps, services, contracts, etc.) will be added as the project is scaffolded. Do not assume directories exist until they are created by a task.

---

## Technology Stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | TypeScript, React/Next.js, WebSockets, wagmi/viem |
| Backend   | Node.js or Python (e.g. FastAPI), WebSocket server, Postgres, Redis (optional) |
| Blockchain| Solidity, OpenZeppelin, EVM L2 (e.g. Polygon/Base), Hardhat or Foundry |

---

## Architecture (Summary)

**Server:** Authoritative match simulation; validates all actions; emits state snapshots or deltas; runs multiple matches concurrently.

**Client:** Web-based; receives state updates; renders animations (e.g. 60 FPS); uses interpolation for smoothness.

**Networking:** WebSockets; stateless messages where possible; minimal payloads (actions + timestamps).

**Combat:** Tick-based or turn-based (not twitch real-time). Discrete actions every fixed interval (e.g. 500ms–2000ms). Server validates cooldowns, stamina, hit resolution, damage. Client sends intended actions and interpolates state.

**Blockchain:** On-chain = Gladiator NFT (ERC-721), ownership, identity, minting, transfers. Off-chain = combat logic, progression, matchmaking, metadata, indexing. Treat blockchain as ownership, not gameplay logic.

---

## Core Game Concepts

**Gladiators:** Unique NFTs. Immutable at mint: ID, class archetype (e.g. Duelist, Brute, Assassin), base stats (Strength, Agility, Endurance, Technique), innate ability, visual seed. Mutable off-chain: level, win/loss record, titles, cosmetics.

**Equipment:** Weapon, Armor. Stats and rarity; swappable; layered sprites. For demo, equipment may be static or pseudo-NFTs; full on-chain minting can be stubbed.

**Combat actions (example):** Attack (light/heavy), Defend, Dodge, Ability use.

---

## Design Constraints for AI Scaffolding

When implementing or scaffolding:

- **Do not overbuild.** Prefer stubs and interfaces over full implementations.
- **Keep systems modular.** Clean boundaries, simple flows, replaceable components.
- **Avoid premature optimization.**
- **Blockchain = ownership only.** No gameplay logic on-chain.

Focus on clean boundaries, simple flows, and replaceable components.

---

## Key Documentation

| Document     | Use when |
|-------------|----------|
| **README.md** | Onboarding, quick start, MVP scope, tech stack, success criteria. |
| **concept.md** | Full spec: vision, combat model, multiplayer architecture, blockchain, rendering, wallets, security, design constraints, open questions (do not implement those yet). |

Additional docs (architecture, API contracts, runbooks, etc.) may be added as the project grows.

---

## Conventions and Practices

- **Scope:** Implement only what is in the demo scope. Do not add marketplace, loot boxes, breeding/forging, token economics, or features listed under "Explicitly Excluded" or "Open Questions" in concept.md unless the task explicitly requests them.
- **Contracts:** Use OpenZeppelin templates; keep contracts minimal and auditable.
- **Server authority:** All match outcomes are server-authoritative; do not trust client-reported results.
- **Verification:** When the codebase exists, prefer reading the specific files or docs that are relevant rather than scanning the whole repo.

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

- **What this is:** Crucible — Gladiator Coliseum: a 1v1 arena combat demo with NFT Gladiators, server-authoritative combat, and web multiplayer. Early stage; concept and README defined; structure TBD as we scaffold.
- **Where to look:** `concept.md` for full spec and design constraints; `README.md` for overview and success criteria.
- **What to respect:** Demo scope (in/out), design constraints (no overbuild, stubs, modular, blockchain = ownership), and server-authoritative outcomes.
