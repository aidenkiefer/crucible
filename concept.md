# Gladiator Coliseum — Concept & Technical Overview

## Purpose of This Document

This document defines the **core vision, scope, and technical assumptions** for the Gladiator Coliseum demo project.

It is intended to:
- Provide shared context for human collaborators
- Act as a guiding spec for AI-assisted scaffolding (Cursor, Claude Code)
- Clearly define MVP constraints to avoid overengineering
- Separate *design intent* from *future exploration*

This is **not** a final design doc — it is a foundation.

---

## High-Level Vision

Gladiator Coliseum is a **competitive 1v1 arena combat game** where players **own Gladiators and equipment as on-chain assets**, and use them in skill-influenced battles.

Core pillars:
- Game-first design (fun before financialization)
- Player-owned assets (NFT-backed Gladiators and gear)
- Entry-based competitive matches (not gambling)
- Web-first, low-friction access
- Deterministic, server-authoritative gameplay

The demo focuses on proving:
1. The combat loop is fun
2. Asset ownership integrates cleanly
3. Multiplayer works smoothly without heavy server load

---

## Demo Scope (MVP)

### Included in Demo
- Web-based client
- Wallet connection
- Minting a Gladiator NFT
- Equipping a Gladiator with basic gear
- Entering a 1v1 arena match
- Server-authoritative combat resolution
- Visualized combat with smooth animations
- Match result + persistent Gladiator history

### Explicitly Excluded from Demo
- Full marketplace UI
- Loot boxes
- Breeding / forging
- Token economics
- Real-money guarantees or redemption
- Large-scale live ops
- Advanced ranking ladders

---

## Core Game Concepts

### Gladiators (Primary Assets)

Gladiators are **unique NFTs** representing playable combatants.

Each Gladiator has:

#### Immutable Traits (set at mint)
- Gladiator ID
- Class Archetype (e.g., Duelist, Brute, Assassin)
- Base Stat Ranges:
  - Strength
  - Agility
  - Endurance
  - Technique
- Innate Ability
- Visual seed (used to derive sprite variants)

#### Mutable State (off-chain, mirrored via metadata)
- Level
- Win / Loss record
- Titles / achievements
- Cosmetic markers (scars, banners, etc.)

Ownership and identity are on-chain. Gameplay state lives off-chain.

---

### Equipment

Equipment enhances Gladiators but does not override skill.

Demo equipment types:
- Weapon
- Armor

Each equipment item:
- Has stats and rarity
- Is swappable
- Is represented visually as a layered sprite

For demo purposes:
- Equipment may be static or pseudo-NFTs
- Full on-chain item minting can be stubbed

---

## Combat Model

### Core Combat Philosophy
- Skill-influenced
- Deterministic resolution
- Low RNG, bounded randomness
- Server-authoritative outcomes

### Combat Style (Demo)
- Tick-based or turn-based (NOT twitch real-time)
- Discrete actions every fixed interval (e.g. 500ms–2000ms)
- Clients animate continuously between state updates

This allows:
- Easy synchronization
- Anti-cheat validation
- Smooth visuals at low network cost

---

### Example Actions
- Attack (light / heavy)
- Defend
- Dodge
- Ability use

The server validates:
- Cooldowns
- Stamina
- Hit resolution
- Damage calculation

The client:
- Sends intended actions
- Renders animations
- Interpolates state changes

---

## Multiplayer Architecture

### Server
- Authoritative match simulation
- Validates all actions
- Emits state snapshots or deltas
- Runs multiple matches concurrently

### Client
- Web-based
- Receives state updates
- Renders animations at 60 FPS
- Uses interpolation for smoothness

### Networking
- WebSockets
- Stateless messages where possible
- Minimal payloads (actions + timestamps)

---

## Rendering & Visuals

### Art Style
- 2D pixel-art
- Modular layered sprites
- Lightweight effects

### Tools
- Aseprite: sprite creation + animation
- PixelLab: UI mockups, marketing visuals

### Runtime Rendering
- Sprite sheets with JSON metadata
- Layered rendering for equipment
- Animation state machine per Gladiator

No 3D rendering in the demo.

---

## Blockchain Architecture

### Chain Strategy
- EVM-compatible L2 (e.g. Polygon / Base)
- Low fees
- Fast confirmation

### On-Chain Responsibilities
- Gladiator NFT contract (ERC-721)
- Ownership
- Transfers
- Minting rules
- Optional royalty configuration

### Off-Chain Responsibilities
- Combat logic
- Progression
- Matchmaking
- Metadata updates
- Indexing

### Smart Contract Philosophy
- Use OpenZeppelin templates
- Keep contracts minimal and auditable
- Avoid storing gameplay logic on-chain

---

## Wallets & UX

### Demo Assumptions
- Crypto-native users acceptable
- Wallet-based login (MetaMask, WalletConnect)
- No account abstraction required for demo

Wallets are used for:
- Identity
- Ownership
- Minting Gladiators

---

## Data & Indexing

### Indexing Layer
- Listen to on-chain events (mint, transfer)
- Store indexed data in a database
- Serve fast queries to the client

This avoids direct RPC-heavy reads from the frontend.

---

## Tech Stack (Preferred)

### Frontend
- TypeScript
- React / Next.js
- WebSockets
- wagmi / viem for wallet + contract interaction

### Backend
- Node.js or Python (FastAPI acceptable)
- WebSocket server
- Match simulation engine
- Postgres (or equivalent)
- Redis (optional, for matches)

### Blockchain
- Solidity
- OpenZeppelin contracts
- Hardhat or Foundry for testing/deployment

---

## Security & Anti-Abuse (Demo-Level)

- Server-authoritative outcomes
- No trust in client-reported results
- Replay logging for matches
- Minimal on-chain attack surface

No real-money guarantees or redemption.

---

## Design Constraints for AI Scaffolding

IMPORTANT FOR AGENTS:

- Do not overbuild
- Prefer stubs and interfaces over full implementations
- Keep systems modular
- Avoid premature optimization
- Treat blockchain as ownership, not gameplay logic

Focus on:
- Clean boundaries
- Simple flows
- Replaceable components

---

## Open Questions (Post-Demo)

These are intentionally undecided:
- Real-time vs faster tick combat
- Permadeath vs retirement
- Long-term economy design
- Loot acquisition systems
- Tournament structures
- Non-crypto onboarding

Do NOT implement these yet.

---

## Definition of Success for Demo

The demo is successful if:
- A user can mint a Gladiator
- Enter a match
- See smooth combat animations
- Receive a deterministic outcome
- Retain ownership + history

Everything else is secondary.

---

## Final Note

This project prioritizes **learning, iteration, and fun**.

Complexity should be earned, not assumed.
