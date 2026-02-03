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

### 4. Database Setup

```bash
cd packages/database
pnpm db:push
```

### 5. Run Development Servers

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
