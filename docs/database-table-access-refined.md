# Database Table Access & RLS Policy Reference (Refined)

**Last Updated:** 2026-02-05
**Status:** Production-Ready, Tested with NextAuth + Prisma Architecture

---

## 🎯 Executive Summary

**RLS Purpose in Crucible:**
- ✅ **Defense-in-depth** backup security layer
- ✅ **Lock down admin tables** from potential direct DB access
- ✅ **Future-proof** for potential Supabase Auth migration
- ❌ **NOT** the primary access control (that's API route session checks)

**Current Architecture:**
- **Auth:** NextAuth with JWT strategy (Google/Twitter OAuth)
- **Database:** Supabase Postgres (no Supabase Auth)
- **ORM:** Prisma with `postgres` superuser connection
- **Client:** No Supabase client libraries from frontend

**How Access Control Works:**
```
┌─────────────────────────────────────────────────────────────┐
│ Primary Access Control: API Routes                         │
│ - NextAuth session.user.id checked manually                │
│ - Prisma queries filtered by ownership                     │
│ - Service role bypasses RLS (this is correct)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Defense-in-Depth: RLS Policies (Backup Layer)              │
│ - Currently dormant (Prisma bypasses RLS)                  │
│ - Would activate if Supabase client + Auth added           │
│ - Locks admin tables even for Supabase client              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Table Classification

### Admin-Only Tables (7)

**Strictly Locked Down** - Deny all access to `authenticated` and `anon` roles.

| Table | Purpose | RLS Enforcement |
|-------|---------|-----------------|
| **GameDataBundle** | Dev-authored game data bundles | Service role only |
| **EquipmentTemplate** | Dev-authored equipment definitions | Service role only |
| **ActionTemplate** | Dev-authored action definitions | Service role only |
| **EquipmentTemplateAction** | Template → action join table | Service role only |
| **Account** | NextAuth OAuth provider accounts | Service role only |
| **Session** | NextAuth session management | Service role only |
| **VerificationToken** | NextAuth email verification | Service role only |

**RLS Strategy:**
```sql
-- Deny ALL access except service role
CREATE POLICY "Service role only" ON admin_table
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);
```

**Access Paths:**
- ✅ **Admin API routes** (Prisma with service role) → Works
- ✅ **Game server** (Prisma with service role) → Works
- ❌ **Supabase client** (if added later) → Blocked by RLS
- ❌ **Direct DB queries** with user JWT → Blocked by RLS

---

### Gameplay Tables (10)

**Future-Proof Policies** - Would enforce if Supabase Auth enabled.

| Table | Access Rule | Status |
|-------|-------------|--------|
| **User** | Own row only (`authUserId = auth.uid()`) | Dormant (NextAuth) |
| **Gladiator** | Own gladiators (`ownerId = current_user_id()`) | Dormant |
| **GladiatorEquippedItem** | Via gladiator ownership | Dormant |
| **GladiatorLoadout** | Via gladiator ownership | Dormant |
| **Equipment** | Own equipment (`ownerId = current_user_id()`) | Dormant |
| **LootBox** | Own loot boxes (`ownerId = current_user_id()`) | Dormant |
| **UserGold** | Own gold record (`userId = current_user_id()`) | Dormant |
| **Match** | Player1 or Player2 participation | Dormant |
| **Challenge** | Challenger or Opponent involvement | Dormant |
| **Friend** | User or Friend involvement | Dormant |

**Why "Dormant":**
- Prisma uses `postgres` role (bypasses RLS completely)
- `auth.uid()` returns NULL (no Supabase Auth sessions)
- Policies exist but don't apply to current access patterns

**Access Paths:**
- ✅ **Player API routes** (Prisma with service role) → Works
- ✅ **Game server** (Prisma with service role) → Works
- ⏸️ **Supabase client** (not currently used) → Would enforce if added

**Future Migration Path:**
1. Enable Supabase Auth (replace NextAuth)
2. Populate `User.authUserId` from `auth.users.id`
3. Use Supabase client libraries from frontend
4. RLS policies automatically activate

---

## 🔧 Helper Functions

### `is_admin()`

**Purpose:** Check if current authenticated user is an admin.

**Security:**
- ✅ `SECURITY DEFINER` with locked `search_path`
- ✅ Safe from table substitution attacks
- ✅ Returns `false` if `auth.uid()` is NULL (NextAuth scenario)

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT u."isAdmin"
     FROM "User" u
     WHERE u."authUserId" = auth.uid()
     LIMIT 1),
    false
  );
$$;
```

**Behavior:**
- With Supabase Auth: Returns `isAdmin` value for current user
- With NextAuth (current): Returns `false` (auth.uid() is NULL)

---

### `current_user_id()`

**Purpose:** Map `auth.uid()` to `User.id` for cleaner policy expressions.

**Security:**
- ✅ `SECURITY DEFINER` with locked `search_path`
- ✅ Returns `NULL` if `auth.uid()` is NULL
- ✅ Returns `NULL` if user not found

```sql
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.id
  FROM "User" u
  WHERE u."authUserId" = auth.uid()
  LIMIT 1;
$$;
```

**Behavior:**
- With Supabase Auth: Returns `User.id` for current user
- With NextAuth (current): Returns `NULL`

---

## 🔐 Security Considerations

### 1. Search Path Vulnerability (Fixed)

**Problem:** `SECURITY DEFINER` functions without locked `search_path` are vulnerable to table substitution attacks.

**Solution:**
```sql
SET search_path = public, pg_temp
```

This prevents attackers from creating fake tables that the function would query.

---

### 2. `authUserId` Field Strategy

**Current State:**
- `User.authUserId` is **nullable** (not reliably populated)
- Not linked to Supabase `auth.users.id` (using NextAuth instead)
- RLS policies reference it but it's unused (dormant)

**Schema Update Required:**
```sql
-- Make authUserId nullable (if not already)
ALTER TABLE "User" ALTER COLUMN "authUserId" DROP NOT NULL;
```

**Migration Path:**
If switching to Supabase Auth:
```sql
-- Populate authUserId from Supabase auth
UPDATE "User" u
SET "authUserId" = a.id
FROM auth.users a
WHERE u.email = a.email;

-- Make non-null again
ALTER TABLE "User" ALTER COLUMN "authUserId" SET NOT NULL;
```

---

### 3. Service Role Key Security

**Current Setup:**
- ✅ `DATABASE_URL` uses `postgres` superuser
- ✅ Stored in server-only environment variables
- ✅ Never exposed to frontend

**Critical:**
```bash
# Server-only (Next.js API routes, game server)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

# Frontend can ONLY see these:
NEXT_PUBLIC_GAME_SERVER_URL=...
NEXT_PUBLIC_GLADIATOR_NFT_ADDRESS=...
```

Never expose `DATABASE_URL` or any service role credentials to the client.

---

### 4. Prisma Bypasses RLS (By Design)

**Why This Is Correct:**
- Prisma connects as `postgres` (table owner)
- Table owners bypass RLS (PostgreSQL behavior)
- API routes manually check permissions (session.user.id)
- RLS is defense-in-depth for non-Prisma access

**Access Control Flow:**
```typescript
// Example API route (correct pattern)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Prisma query filtered by session user
  const gladiators = await prisma.gladiator.findMany({
    where: { ownerId: session.user.id }  // Manual permission check
  });

  return Response.json(gladiators);
}
```

RLS is NOT checked here (Prisma bypasses), but manual filtering provides security.

---

## 📋 Implementation Checklist

### Pre-Flight

- [ ] Backup database (Supabase Dashboard → Database → Backups)
- [ ] Verify `DATABASE_URL` uses `postgres` role
- [ ] Confirm no Supabase client usage from frontend
- [ ] Document current `authUserId` population status

### Deployment

- [ ] Run `rls-setup-refined.sql` in Supabase SQL Editor
- [ ] Verify helper functions created (check verification queries)
- [ ] Verify all tables have RLS enabled
- [ ] Check no errors in Supabase logs

### Testing

- [ ] **Admin API routes** still work (e.g., `/api/admin/bundles`)
- [ ] **Player API routes** still work (e.g., `/api/gladiators`)
- [ ] **Game server** operations work (match creation, loot drops)
- [ ] **NextAuth** login/logout works
- [ ] **Admin UI** accessible for admin users
- [ ] **No access errors** in frontend or server logs

### Verification Queries

```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check policies exist
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Test helper functions
SELECT is_admin();  -- Should return false (no Supabase Auth)
SELECT current_user_id();  -- Should return NULL
```

---

## 🚀 Migration to Supabase Auth (Future)

If you decide to enable Supabase Auth + Supabase client:

### Step 1: Enable Supabase Auth

```bash
# Install Supabase client
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### Step 2: Populate `authUserId`

```sql
-- Link existing users to Supabase auth
-- (Manual migration strategy depends on your auth flow)
```

### Step 3: Replace NextAuth

- Remove NextAuth configuration
- Add Supabase Auth providers
- Update API routes to use Supabase session

### Step 4: Use Supabase Client

```typescript
// Frontend can now query directly with RLS enforcement
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

// RLS automatically enforces - user sees only their gladiators
const { data } = await supabase
  .from('Gladiator')
  .select('*');
```

### Step 5: Verify RLS Enforcement

- RLS policies automatically activate
- Users can only see their own data
- Admin users can see all data (via `is_admin()`)

---

## 🐛 Troubleshooting

### Issue: API routes return 0 results after enabling RLS

**Diagnosis:**
- Prisma should bypass RLS (table owner)
- If seeing 0 results, check if connection uses wrong role

**Solution:**
```sql
-- Verify Prisma connection role
SELECT current_user, session_user;
-- Should be: postgres, postgres
```

---

### Issue: Helper functions return errors

**Diagnosis:**
- Search path issues
- Missing permissions

**Solution:**
```sql
-- Re-create with proper permissions
DROP FUNCTION IF EXISTS public.is_admin();
-- Re-run creation script
```

---

### Issue: Admin UI broken after RLS

**Diagnosis:**
- Admin routes should use Prisma (bypasses RLS)
- Check for direct Supabase client usage

**Solution:**
- Verify admin routes use Prisma, not Supabase client
- Check middleware checks `isAdmin` correctly

---

## 📚 Reference

**Files:**
- **SQL Script:** `docs/rls-setup-refined.sql`
- **Schema:** `packages/database/prisma/schema.prisma`
- **Auth Config:** `apps/web/lib/auth.ts`

**Supabase Docs:**
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Security Definer Functions](https://supabase.com/docs/guides/database/functions)

**PostgreSQL Docs:**
- [Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html)

---

## ✅ Success Criteria

After implementing RLS:

- ✅ All tables have RLS enabled
- ✅ Helper functions fixed (search_path locked)
- ✅ Admin tables locked down
- ✅ Gameplay tables have future-proof policies
- ✅ No breaking changes to existing functionality
- ✅ API routes still work (Prisma bypasses RLS)
- ✅ Admin UI still accessible
- ✅ Ready for potential Supabase Auth migration

---

*RLS setup refined for Crucible (Gladiator Coliseum) - NextAuth + Prisma architecture.*
