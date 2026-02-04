# Testing the Admin UI Locally

Quick steps to run and test the Admin UI (Sprint 2.5) on your machine.

---

## Prerequisites

- [Development setup](development-setup.md) done: `.env` and `packages/database/.env` filled, `pnpm install` and `pnpm db:push` already run at least once.
- You can sign in with Google or Twitter (OAuth configured).

---

## 1. Seed demo game data (optional but recommended)

Creates a demo bundle `demo-v0.1` with sample action and equipment templates.

```bash
cd packages/database
pnpm seed:admin
cd ../..
```

---

## 2. Grant yourself admin access

The Admin UI only allows users with `isAdmin = true`. After your first sign-in, set it in the database.

**Option A — Supabase Dashboard**

1. Supabase Dashboard → your project → **Table Editor** → **User**.
2. Find your user row (by email).
3. Set **isAdmin** to `true` (toggle or edit cell).
4. Save.

**Option B — SQL in Supabase**

1. Supabase Dashboard → **SQL Editor**.
2. Run (replace with your email):

```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'your-email@gmail.com';
```

**Option C — Prisma Studio**

```bash
cd packages/database
pnpm db:studio
```

Open the **User** table, find your user, set **isAdmin** to `true`.

---

## 3. Create the Storage bucket (for Publish/Export)

To test **Publish** and **Activate** (and game server bundle loading):

1. Supabase Dashboard → **Storage**.
2. **New bucket** → Name: `gamedata`.
3. Create (defaults are fine; game server uses service role key).

Ensure `.env` has:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 4. Start the dev servers

**Terminal 1 — Frontend**

```bash
pnpm dev
```

(or from repo root; turbo runs both if configured, or run `cd apps/web && pnpm dev`)

**Terminal 2 — Game server** (optional for bundle loading; needed if you test with the game server later)

```bash
cd apps/game-server
pnpm dev
```

---

## 5. Sign in and open Admin

1. Open **http://localhost:3000**.
2. Sign in (e.g. **Sign in with Google**).
3. Go to **http://localhost:3000/admin**.

- If you see the **Admin dashboard** (stats, active bundle, nav): you have access.
- If you are redirected to **/admin/unauthorized**: your user does not have `isAdmin = true`; repeat step 2.

---

## 6. What to test

| Area | What to do |
|------|------------|
| **Dashboard** | View stats (users, gladiators, matches, bundles, templates). See active bundle if one is set. |
| **Bundles** (`/admin/bundles`) | List bundles. **Create new bundle** (clone from active). Open a bundle → **Validate** → fix any errors → **Publish** (requires Storage bucket). **Activate** a published bundle. |
| **Action templates** (`/admin/action-templates`) | List, **New**, edit key/name/category, timing/costs, JSON configs (use skeleton buttons). Save. |
| **Equipment templates** (`/admin/equipment-templates`) | List, **New**, set type/slot/subtype, link **granted actions**, edit baseStatMods/scaling (JSON). Save. |
| **Publish flow** | In a bundle with templates: **Validate** (must pass), then **Publish**. Check Supabase Storage → `gamedata` → `bundles/<label>/` for `equipment.templates.json`, `actions.templates.json`, `manifest.json`. |
| **Unauthorized** | Sign out, go to `/admin` → should redirect to sign-in or `/admin/unauthorized`. |

---

## 7. Troubleshooting

- **Redirect to /admin/unauthorized**  
  Session has `isAdmin: false`. Set `isAdmin = true` in DB and sign out/sign in again (or wait for session refresh).

- **Publish fails (Storage)**  
  Check `gamedata` bucket exists and `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`.

- **Validation errors on Publish**  
  Fix reported errors in the bundle (missing keys, invalid JSON, broken action references). Re-validate until clean.

- **Game server “bundle not loaded”**  
  Ensure an active bundle is set (Activate a published bundle) and game server has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; restart the game server after activating a bundle.
