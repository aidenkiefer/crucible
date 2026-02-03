# Architecture & Scaffold Guide — Crucible (Gladiator Coliseum)

This guide is for **Claude** (or any agent) to **plan the structure/architecture** of the Crucible project and **scaffold the necessary folders and files**. It assumes you have read **concept.md** and **CLAUDE.md** and will respect the design constraints (no overbuild, stubs over full implementations, modular boundaries, blockchain = ownership only).

---

## 1. Purpose of This Guide

- **Plan:** Derive a concrete repo layout and component boundaries from concept.md.
- **Scaffold:** Create the minimal folder structure and stub files so the project is ready for incremental implementation.
- **Do not:** Implement full logic, connect real infra, or add features outside the demo scope.

---

## 2. Architecture Planning (Before Creating Anything)

### 2.1 Layers (from concept)

| Layer | Responsibility | Talks to |
|-------|----------------|----------|
| **Frontend** | Web client, wallet connection, mint UI, equip UI, matchmaking UI, arena view, WebSocket for match state | Backend (REST + WebSocket), chain (read via indexer/backend; write via wallet) |
| **Backend** | Match simulation (authoritative), WebSocket server, matchmaking, Gladiator/equip queries (from DB) | Postgres, Redis (optional), Frontend |
| **Indexer** | Listen to chain events (mint, transfer), persist to DB, expose no direct client API (backend reads DB) | Chain (RPC/events), Postgres |
| **Contracts** | Gladiator NFT (ERC-721), mint/transfer/ownership only | Chain only |

Equipment for demo can be **stubbed** (static data or pseudo-NFTs); no separate contract required for MVP.

### 2.2 Data Flow (High-Level)

1. **Mint:** User signs in wallet → frontend calls contract mint → indexer sees Mint event → writes Gladiator to DB → backend/frontend read from API/DB.
2. **Equip:** Frontend sends equip choice to backend; backend updates DB (or stub). No on-chain equip for demo if stubbed.
3. **Match:** Frontend requests match → backend creates match, runs tick-based simulation, broadcasts state over WebSocket → frontend renders and interpolates.

### 2.3 Boundaries to Respect

- **On-chain:** Gladiator identity and ownership only (ERC-721). No combat, no equipment logic on-chain.
- **Off-chain:** Combat, progression, matchmaking, metadata, indexing. Backend is authoritative for match state.
- **Client:** Never trusted for match outcome; only sends intended actions. Server validates and resolves.

---

## 3. Target Repository Structure

Scaffold a **monorepo** with clear separation. Do not create `agents/` or other non-Crucible top-level dirs; only what’s below.

```
crucible/
├── README.md
├── concept.md
├── CLAUDE.md
├── SCAFFOLD-GUIDE.md          # this file
│
├── apps/
│   └── web/                   # Next.js frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js     # or .ts
│       ├── src/
│       │   ├── app/           # App Router (or pages/ if preferred)
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   └── ...
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── lib/           # wallet, api, websocket clients
│       │   └── types/
│       └── public/
│
├── services/
│   ├── api/                   # Backend: REST + WebSocket, match engine
│   │   ├── package.json       # if Node
│   │   # OR pyproject.toml    # if Python/FastAPI
│   │   ├── src/               # or app/ for Python
│   │   │   ├── main entry (index.ts or main.py)
│   │   │   ├── routes/        # REST
│   │   │   ├── match/         # match simulation, WebSocket handler
│   │   │   ├── db/            # schema, queries (stubs ok)
│   │   │   └── config/
│   │   └── (config files)
│   │
│   └── indexer/               # Chain events → DB
│       ├── package.json       # if Node
│       # OR pyproject.toml    # if Python
│       ├── src/
│       │   ├── main entry
│       │   ├── listeners/    # mint, transfer handlers
│       │   └── db/           # write models (stubs ok)
│       └── (config files)
│
├── contracts/                 # Solidity
│   ├── package.json           # or no package if using Foundry
│   ├── hardhat.config.js      # or foundry.toml
│   ├── scripts/               # deploy, mint helpers
│   ├── src/
│   │   └── Gladiator.sol      # ERC-721, minimal
│   └── test/
│       └── Gladiator.test.js  # or .sol in Foundry
│
├── packages/                  # optional: shared types/schemas
│   └── shared/
│       ├── package.json
│       └── src/
│           ├── index.ts
│           └── types/        # Gladiator, Match, Action, etc.
│
├── docs/                      # optional for now
│   └── architecture.md      # one-pager pointing at concept + this layout
│
├── docker-compose.yml        # Postgres (and optionally Redis) only; no app images yet
├── .env.example              # DB URL, chain RPC, contract address placeholders
└── .gitignore
```

**Notes:**

- **apps/web:** Single frontend app. Use Next.js App Router unless you have a reason to use `pages/`.
- **services/api:** Choose **one** of Node or Python (FastAPI). Scaffold for one; the guide below uses **Node** for the API and **Node** for the indexer for consistency. If you prefer Python for API, use `pyproject.toml`, `app/`, and `main.py` instead.
- **services/indexer:** Can be Node or Python; same as API is simplest.
- **packages/shared:** Optional for MVP. Add only if you want shared TypeScript types between `apps/web` and `services/api`; otherwise each app can define its own types and we keep boundaries with explicit contracts (e.g. REST/WebSocket payloads).
- **docs/architecture.md:** Short doc that states: “Architecture follows concept.md; repo layout is described in SCAFFOLD-GUIDE.md.”

---

## 4. Scaffold Order

Do the steps in this order so that dependencies exist when referenced:

1. **Root:** `.gitignore`, `.env.example`, `docker-compose.yml` (Postgres, optional Redis).
2. **contracts:** Gladiator ERC-721 stub + config + one deploy script and one test file.
3. **services/indexer:** Entrypoint, stub for “listen to Mint/Transfer and write to DB,” DB connection placeholder.
4. **services/api:** Entrypoint, health route, stub WebSocket endpoint, stub match module, DB connection placeholder.
5. **packages/shared** (optional): Minimal `package.json` + `src/index.ts` exporting empty or a single type.
6. **apps/web:** Next.js app with `layout.tsx`, `page.tsx`, placeholder folders (`components/`, `hooks/`, `lib/`, `types/`), and stub files for wallet and API client.
7. **docs:** `docs/architecture.md` one-pager.

---

## 5. What to Create in Each Area (Stubs Only)

### 5.1 Root

- **.gitignore:** Node `node_modules`, `.env`, build outputs, IDE, OS files; Python `__pycache__`, `.venv`; Solidity `cache`, `artifacts`; logs.
- **.env.example:** `DATABASE_URL`, `REDIS_URL` (optional), `CHAIN_RPC_URL`, `GLADIATOR_CONTRACT_ADDRESS`, `PORT` (for API).
- **docker-compose.yml:** One Postgres service, one Redis service (optional). No application services.

### 5.2 contracts/

- **Gladiator.sol:** ERC-721 (OpenZeppelin), constructor, `mint(to, tokenId)` (or similar minimal mint). No gameplay logic. Use OpenZeppelin’s `ERC721URIStorage` or base ERC721 + metadata URI; keep it minimal.
- **hardhat.config.js** (or **foundry.toml**): Local chain, compiler version, path to `src/`.
- **scripts/deploy.js:** Deploy Gladiator, log address (stub is fine).
- **test/Gladiator.test.js** (or Foundry test): One test that deploys and mints one token (stub is fine).

### 5.3 services/indexer/

- **package.json:** name `@crucible/indexer`, main entry, dependencies (e.g. ethers/viem, pg, dotenv). No need for FastAPI if using Node.
- **src/index.ts:** Connect to chain (read from env), connect to DB (stub or minimal schema), subscribe to Mint/Transfer from Gladiator contract, and log or write one row (stub table is ok). One file is enough for scaffold.
- **DB:** If you add a schema, one table e.g. `gladiators (id, token_id, owner_address, minted_at, ...)` with a minimal migration or SQL file. Stub is acceptable.

### 5.4 services/api/

- **package.json:** name `@crucible/api`, main entry, dependencies (e.g. express or fastify, ws, pg, redis optional, dotenv).
- **src/index.ts:** Start HTTP server, mount health route (`GET /health` → 200), mount WebSocket route (e.g. `/ws` that accepts connection and sends one placeholder message). Stub “match” module: e.g. `src/match/engine.ts` with an empty `tick()` or `resolveTurn()` that returns a placeholder state.
- **src/db/** (optional): One file that exports a function to get “gladiators by owner” (can return empty array). No migrations required for scaffold.

### 5.5 packages/shared (optional)

- **package.json:** name `@crucible/shared`, main `src/index.ts`, exports types.
- **src/types/gladiator.ts:** Interface `Gladiator` (id, tokenId, owner, classArchetype, baseStats, ...) and maybe `MatchState`, `ClientAction`. Re-export from `src/index.ts`.

### 5.6 apps/web/

- **Next.js:** Create via `create-next-app` with TypeScript, App Router, no extra bloat, or create `package.json`, `tsconfig.json`, `next.config.js`, and minimal `src/app/layout.tsx`, `src/app/page.tsx` by hand.
- **src/app/layout.tsx:** Root layout with `<html>`, `<body>` and a simple title.
- **src/app/page.tsx:** Single page with short text e.g. “Crucible — Gladiator Coliseum” and a “Connect wallet” placeholder (button that does nothing or logs).
- **src/lib/wallet.ts:** Export a stub: e.g. `getWalletClient()` or `useWallet()` that returns null or mock (so wagmi/viem can be added later without changing structure).
- **src/lib/api.ts:** Export `getGladiators(owner: string)` and `connectMatchWebSocket(url)` as stubs (fetch to API base URL, ws to API WS URL; no real impl required).
- **src/types/** (if not using packages/shared): Copy or re-export minimal types for Gladiator and match so the app compiles.

### 5.7 docs/

- **architecture.md:** 1–2 paragraphs: architecture follows concept.md (server-authoritative combat, WebSockets, on-chain ownership only). Repo layout and scaffold are in SCAFFOLD-GUIDE.md. Link to concept.md and README.md.

---

## 6. Checklist for Claude

Use this to confirm scaffolding is complete without implementing real logic:

- [ ] Root: `.gitignore`, `.env.example`, `docker-compose.yml` (Postgres + optional Redis).
- [ ] **contracts:** Gladiator.sol (ERC-721, mint only), config, deploy script, one test.
- [ ] **services/indexer:** Entrypoint, chain + DB placeholders, stub Mint/Transfer handling.
- [ ] **services/api:** HTTP server, `GET /health`, WebSocket stub at `/ws`, stub match module.
- [ ] **packages/shared** (optional): Package with one or two types exported.
- [ ] **apps/web:** Next.js app, layout, home page, stub wallet and API libs, placeholder dirs.
- [ ] **docs:** `architecture.md` one-pager.

Do **not** add: marketplace, loot boxes, breeding, token economics, auth beyond wallet, or any feature listed under “Explicitly Excluded” or “Open Questions” in concept.md.

---

## 7. Definition of Done for This Guide

Scaffolding is **done** when:

1. The repo layout matches Section 3 (within the chosen variants: Node vs Python, optional shared package).
2. All items in Section 6 checklist are present and are stubs or minimal placeholders.
3. A human can run `docker-compose up`, start the API and indexer (with env set), open the web app, and see the home page and a placeholder “Connect wallet” without errors.
4. No full implementations are required: no real match simulation, no real indexer writes, no real wallet connection—only structure and stubs.

After this, implementation can proceed incrementally (e.g. real mint flow, real WebSocket state, real match tick loop) following concept.md and CLAUDE.md.
