# Development Setup Guide

## Prerequisites

- Node.js 20+
- pnpm 8+
- Git
- Supabase account
- MetaMask or similar Web3 wallet

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd gladiator-coliseum
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Required environment variables:
- Supabase URL and keys (from Supabase dashboard)
- Database connection string
- OAuth credentials (Google, Twitter)
- Blockchain RPC URLs

For **Admin UI (Sprint 2.5)** — publish/export and game server bundle loading:
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (web app, for export to Storage)
- Game server: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (for BundleLoader to download published bundles)
- Create a **Supabase Storage** bucket named `gamedata` (Dashboard → Storage → New bucket).

### 3b. Demo/MVP: Required services and environment variables

To have **everything** connected and working for the demo (auth, combat, matchmaking, friends/challenges, mint, admin):

| Service / area | Required? | What to set up | Env variable(s) |
|----------------|-----------|----------------|-----------------|
| **Redis** | **Yes** (game server always uses it for Socket.io) | **Local:** Run Redis on port 6379 (`redis-server` or `docker run -p 6379:6379 redis`). **Production:** Redis Cloud, Upstash, etc. | `REDIS_URL` (optional locally; defaults to `redis://localhost:6379`) |
| **Supabase** | Yes | Project; Database + Storage bucket `gamedata` | `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; game server also needs `SUPABASE_URL` (= same as `NEXT_PUBLIC_SUPABASE_URL`) |
| **NextAuth** | Yes (for login) | Google OAuth app (and optionally Twitter) | `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Game server URL** | Yes (for arena, match, quick match, friends) | Where the game server runs | **Web:** `NEXT_PUBLIC_GAME_SERVER_URL` (e.g. `http://localhost:4000` locally). **Game server:** `FRONTEND_URL` for CORS (e.g. `http://localhost:3000`) |
| **Gladiator NFT / blockchain** | Yes (for mint + listener) | Deploy contract (e.g. Mumbai), get RPC URL | **Web:** `NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS`. **Game server:** same + `POLYGON_MUMBAI_RPC_URL` (and `PRIVATE_KEY` only if you deploy) |
| **WalletConnect** | Optional (for mint page wallet connect) | Project at [Reown Cloud](https://cloud.reown.com) | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` |

**Summary:** You **do** need Redis. For local demo, install and run Redis (e.g. `brew install redis && redis-server`, or Docker), then start the game server; no `REDIS_URL` needed if Redis is on `localhost:6379`. For production, set `REDIS_URL` to your hosted Redis URL. All other env vars are in `.env.example`; ensure **both** root `.env` and, if you run the game server from its own directory, that it can see `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `POLYGON_MUMBAI_RPC_URL`, and `NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS` (game server loads from root `.env` via `dotenv.config()` when run from repo root).

### 4. Database Setup

```bash
cd packages/database
pnpm db:push
```

### 5. (Optional) Seed demo game data (Sprint 2.5)

To create a demo bundle with sample equipment and action templates:

```bash
cd packages/database
pnpm seed:admin
cd ../..
```

### 6. Run Development Servers

Terminal 1 - Frontend:
```bash
cd apps/web
pnpm dev
```

Terminal 2 - Game Server:
```bash
cd apps/game-server
pnpm dev
```

Terminal 3 - Local Blockchain (optional):
```bash
cd contracts
npx hardhat node
```

## Verification

- Frontend: http://localhost:3000
- Game Server: http://localhost:4000/health
- Prisma Studio: `pnpm db:studio` (from packages/database)

## Troubleshooting

### Database connection (Supabase) — P1001 "Can't reach database server"

Prisma needs a working `DATABASE_URL` in `packages/database/.env` (or in root `.env` if the app loads it from there). Supabase has two connection types; **don’t mix them**.

| Connection type | Host | Port | When to use |
|-----------------|------|------|-------------|
| **Direct** | `db.[project-ref].supabase.co` | **5432** | Migrations, `db push`, long-lived servers |
| **Session pooler** | `aws-0-[region].pooler.supabase.com` | **5432** | Same as direct but via pooler (often better from WSL/home networks) |
| **Transaction pooler** | `aws-0-[region].pooler.supabase.com` | **6543** | Serverless; user is `postgres.[project-ref]` |

**Wrong (causes P1001):** `db.xxx.supabase.co:6543` — direct host with pooler port.

**Fix 1 — Use Direct with port 5432**

1. Supabase Dashboard → your project → **Project Settings** (gear) → **Database**.
2. Under **Connection string**, choose **URI** and **Direct connection** (not pooler).
3. Copy the URI. It must use port **5432** and host `db.[project-ref].supabase.co`.
4. If it shows `:6543`, change it to `:5432` and ensure the password is your **database password** (not the anon key).
5. Add SSL if needed: `?sslmode=require` at the end.
6. Put the final URL in `packages/database/.env` as `DATABASE_URL=...`.

Example (direct):

```bash
DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@db.akrgtcdnditmxhdfowhu.supabase.co:5432/postgres?sslmode=require"
```

**Fix 2 — Use IPv4 Session pooler (if direct still fails)**

Some networks or WSL block direct DB connections. Use the **pooler** instead:

1. Supabase Dashboard → **Project Settings** → **Database**.
2. Find **Connection pooling** (or **Session pooler** / **IPv4**).
3. Copy the **Session** pooler URI (host like `aws-0-us-east-1.pooler.supabase.com`, port **5432**).
4. User is usually `postgres.[project-ref]`, password is your database password.
5. Add `?sslmode=require` and use that as `DATABASE_URL` in `packages/database/.env`.

Example (session pooler):

```bash
DATABASE_URL="postgresql://postgres.akrgtcdnditmxhdfowhu:YOUR_DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

Then run:

```bash
cd packages/database && pnpm db:push
```

**Other checks:** Project not paused (Dashboard → project → Resume if needed). Database password correct (reset under Settings → Database if needed). No firewall blocking outbound 5432/6543.

### Port Already in Use

Change ports in respective configs:
- Frontend: `apps/web/package.json` (add `-p 3001` to dev script)
- Game Server: `apps/game-server/.env` (set `PORT=4001`)

### Database Connection Issues

1. Verify DATABASE_URL in .env
2. Check Supabase project is running
3. Ensure IP is whitelisted in Supabase (or disable IP restrictions)

### Contract Compilation Errors

```bash
cd contracts
pnpm clean
pnpm compile
```

### Admin UI access (Sprint 2.5)

Admin routes (`/admin`, `/admin/bundles`, `/admin/equipment-templates`, `/admin/action-templates`) require the user to have `isAdmin = true` in the database. After signing in, set it manually:

```sql
-- In Supabase SQL Editor or via Prisma Studio / psql
UPDATE "User" SET "isAdmin" = true WHERE email = 'your-email@example.com';
```

Then reload the app and navigate to `/admin`. Non-admin users are redirected to `/admin/unauthorized`.
