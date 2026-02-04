# Vercel Deployment Guide

This project deploys **only the Next.js web app** (`apps/web`) to Vercel. The game server, contracts, and other packages run elsewhere (e.g. Railway, Render, or your own infra).

## Project settings (Vercel dashboard)

| Setting | Value |
|--------|--------|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js (auto-detected from `vercel.json`) |
| **Build Command** | *(leave default: `pnpm run build` or `next build`)* |
| **Output Directory** | *(leave default)* |
| **Install Command** | *(leave default; Vercel runs install from repo root for pnpm workspaces)* |

Linking the repo with Root Directory set to `apps/web` ensures the install step runs from the repository root so workspace dependencies (`@gladiator/database`, etc.) are available. Turbo runs `@gladiator/database`’s build (Prisma generate) before the web build, so the Prisma client is generated and the Next.js build can resolve `@prisma/client`.

## Environment variables

Configure these in **Vercel → Project → Settings → Environment Variables**. Assign each to **Production** and optionally **Preview** (use different values for preview if you want isolated test data).

### Public (safe in browser — use `NEXT_PUBLIC_`)

| Variable | Description | Example |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | From Supabase → API |

Do **not** put secrets (database URL, service role key, OAuth secrets, `NEXTAUTH_SECRET`) in `NEXT_PUBLIC_*` — they would be exposed to the client.

**Required for the app to run in production:** You must set `NEXTAUTH_SECRET` and `NEXTAUTH_URL`. Without them, NextAuth will throw `NO_SECRET` and refuse to start. Set `NEXTAUTH_URL` to your Vercel app URL (e.g. `https://your-project.vercel.app`).

### Server-only (never use `NEXT_PUBLIC_`)

| Variable | Description | Production | Preview |
|----------|-------------|------------|--------|
| `NEXTAUTH_URL` | Full URL of the app | `https://your-app.vercel.app` | `https://your-preview-url.vercel.app` or same as prod |
| `NEXTAUTH_SECRET` | Random secret for session signing | Generate with `openssl rand -base64 32` | Same or separate |
| `DATABASE_URL` | PostgreSQL connection string (Prisma) | Production DB | Prefer a **separate** DB to avoid test data in prod |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | From Supabase → API | Same or separate project |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth | From Google Cloud Console | Same or separate |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | Twitter OAuth | From Twitter Developer | Same or separate |
| `GAME_SERVER_URL` | URL of the deployed game server | e.g. `https://your-game-server.railway.app` | Your preview game server or local tunnel |

For **Preview** deployments, use a different `NEXTAUTH_URL` (the preview URL) and ideally a separate `DATABASE_URL` so production data is not modified by preview builds.

## Checklist

- [ ] Root Directory = `apps/web`
- [ ] All server-only env vars set for Production (and Preview if needed)
- [ ] `NEXTAUTH_URL` set to the real deployment URL (not localhost) for Production
- [ ] No secrets in any `NEXT_PUBLIC_*` variable
- [ ] `GAME_SERVER_URL` points to the deployed game server in Production
- [ ] Prisma: run migrations against the production DB before or after first deploy (e.g. in CI or manually). The build runs `prisma generate` via the database package’s `build` script (Turbo `^build`); env vars such as `DATABASE_URL` must be listed in `turbo.json` `globalEnv` so they are available during the build.

## Optional: Ignored Build Step

To skip builds when only non-web packages change, you can use **Ignored Build Step** in Vercel with something like:

```bash
npx turbo-ignore @gladiator/web
```

(or the equivalent for your turbo pipeline). Requires `turbo-ignore` in the repo; otherwise leave the step empty so every push builds.

## Related

- [Development Setup](./development-setup.md) — local env and `.env.example`
- [Architecture](../architecture.md) — how the web app, game server, and DB fit together
