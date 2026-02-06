# Database Table Access & RLS Policy Reference

**Purpose:** This document classifies all database tables as either **admin-only** or **player-accessible** to guide Row Level Security (RLS) policy implementation in Supabase.

**RLS Strategy:**
1. Apply admin-only policies to dev-authored game data and auth internals
2. Apply per-user policies to gameplay tables where players access their own data
3. Service role bypasses RLS for backend operations (game server, event listener)

---

## Admin-Only Tables

These tables are exclusively for developers and admin users (User.isAdmin = true). Players have no direct access.

| Table | Reason |
|-------|--------|
| **GameDataBundle** | Dev-authored game data bundle management (DRAFT/PUBLISHED/DEPRECATED lifecycle) |
| **EquipmentTemplate** | Dev-authored equipment definitions (templates, not instances) |
| **ActionTemplate** | Dev-authored action/attack definitions (weapon attacks, spells, mobility) |
| **EquipmentTemplateAction** | Dev-authored join table linking equipment → actions |
| **Account** | NextAuth social auth internals (OAuth provider tokens) |
| **Session** | NextAuth session management (session tokens, expiry) |
| **VerificationToken** | NextAuth email verification tokens |

**RLS Policy:** `Admin-only access` — Allow SELECT/INSERT/UPDATE/DELETE only if `is_admin()` returns true.

---

## Player-Accessible Tables

These tables contain player gameplay data. Players can access **their own** rows or **pertinent** data (matches they participated in, friends, challenges).

### User Table

| Table | Access Rule |
|-------|-------------|
| **User** | Own user row only (`authUserId = auth.uid()`) |

**Permissions:**
- **SELECT:** Own user row (read profile, isAdmin flag, username)
- **UPDATE:** Own user row (update username, wallet address)
- **INSERT:** Handled by NextAuth adapter (service role)
- **DELETE:** Not allowed (account deletion via admin or cascade on auth.users deletion)

**RLS Policy:** `Users can view and update their own profile` — WHERE `authUserId = auth.uid()`

---

### Gladiator Ownership Tables

| Table | Access Rule |
|-------|-------------|
| **Gladiator** | Own gladiators only (`ownerId = current_user_id`) |
| **GladiatorEquippedItem** | Equipped items on own gladiators (via `gladiatorId → Gladiator.ownerId = current_user_id`) |
| **GladiatorLoadout** | Loadouts for own gladiators (via `gladiatorId → Gladiator.ownerId = current_user_id`) |

**Permissions:**
- **SELECT:** Own gladiators and their equipped items/loadouts
- **INSERT:** Gladiator created by blockchain listener (service role); equipped items and loadouts via API (own gladiators)
- **UPDATE:** Own gladiators (progression, stats, skills) and equipped items/loadouts
- **DELETE:** Equipped items/loadouts only (not gladiators — NFTs are permanent)

**RLS Policy (Gladiator):** `Users can access their own gladiators`
```sql
WHERE ownerId IN (
  SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
)
```

**RLS Policy (GladiatorEquippedItem & GladiatorLoadout):** `Users can access equipped items/loadouts for their own gladiators`
```sql
WHERE gladiatorId IN (
  SELECT id FROM public."Gladiator" WHERE ownerId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
)
```

---

### Equipment & Loot Tables

| Table | Access Rule |
|-------|-------------|
| **Equipment** | Own equipment only (`ownerId = current_user_id`) |
| **LootBox** | Own loot boxes only (`ownerId = current_user_id`) |
| **UserGold** | Own gold record only (`userId = current_user_id`) |

**Permissions:**
- **SELECT:** Own equipment instances, loot boxes, gold balance
- **INSERT:** Equipment and loot boxes created by API (loot drops, crafting); UserGold created on first use
- **UPDATE:** LootBox (mark as opened), UserGold (balance changes via salvage/spend), Equipment (not typically updated)
- **DELETE:** Equipment (salvage), LootBox (after opening, optional cleanup)

**RLS Policy (Equipment & LootBox):** `Users can access their own items and loot boxes`
```sql
WHERE ownerId IN (
  SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
)
```

**RLS Policy (UserGold):** `Users can access their own gold balance`
```sql
WHERE userId IN (
  SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
)
```

---

### Match & Challenge Tables

| Table | Access Rule |
|-------|-------------|
| **Match** | Matches where user is player1 or player2 (`player1Id = current_user_id OR player2Id = current_user_id`) |
| **Challenge** | Challenges where user is challenger or opponent (`challengerId = current_user_id OR opponentId = current_user_id`) |

**Permissions:**
- **SELECT:** Matches and challenges involving the current user
- **INSERT:** Matches created by game server (service role); challenges created by API (own challenges only)
- **UPDATE:** Matches updated by game server (completion, rewards); challenges updated by API (accept/decline)
- **DELETE:** Not typically allowed (historical records)

**RLS Policy (Match):** `Users can view matches they participated in`
```sql
WHERE player1Id IN (
  SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
)
OR player2Id IN (
  SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
)
```

**RLS Policy (Challenge):** `Users can view and manage challenges they're involved in`
```sql
WHERE challengerId IN (
  SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
)
OR opponentId IN (
  SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
)
```

---

### Social Tables

| Table | Access Rule |
|-------|-------------|
| **Friend** | Friendships involving user (`userId = current_user_id OR friendId = current_user_id`) |

**Permissions:**
- **SELECT:** Friendships where user is either userId or friendId
- **INSERT:** Friend requests created by API (user can send requests)
- **UPDATE:** Friend requests accepted by API (user can accept requests they received)
- **DELETE:** Friendships removed by API (user can unfriend)

**RLS Policy (Friend):** `Users can view and manage friendships they're involved in`
```sql
WHERE userId IN (
  SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
)
OR friendId IN (
  SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
)
```

---

## Helper Functions

These SQL functions are used in RLS policies to map Supabase auth.uid() to User.id and check admin status.

### `is_admin()`

Checks if the current authenticated user has admin privileges.

```sql
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public."User" u
    where u."authUserId" = auth.uid()
      and u."isAdmin" = true
  );
$$;
```

**Usage:** `WHERE is_admin()` in admin-only policies.

---

### `current_user_id()` (Optional Helper)

Maps Supabase auth.uid() to the User.id for cleaner policy expressions.

```sql
create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
as $$
  select id
  from public."User"
  where "authUserId" = auth.uid()
  limit 1;
$$;
```

**Usage:** `WHERE ownerId = current_user_id()` instead of subquery.

**Note:** This helper is optional. Subqueries like `WHERE ownerId IN (SELECT id FROM "User" WHERE "authUserId" = auth.uid())` work fine and are more explicit.

---

## Implementation Notes

### 1. Service Role Bypass

The game server and blockchain event listener use the **service role key** (not user JWTs), which **bypasses RLS**. This is correct behavior:
- Game server creates matches, awards loot, updates progression
- Blockchain listener syncs gladiators to DB on mint events
- Admin API routes use service role for CRUD operations (after checking `isAdmin` in Next.js middleware)

### 2. NextAuth Tables

`Account`, `Session`, and `VerificationToken` are managed by the NextAuth Prisma adapter. These should be **admin-only** for direct access, but NextAuth uses the service role, so RLS doesn't block it.

**Recommendation:** Apply admin-only policies for consistency, but these tables are not directly queried by players.

### 3. Template Tables

`EquipmentTemplate`, `ActionTemplate`, `EquipmentTemplateAction`, and `GameDataBundle` are admin-only for authoring. Players **never** query these directly. Instead:
- Admin UI uses service role to CRUD templates
- Game server reads **published JSON bundles** (exported to Supabase Storage), not live template tables
- Players indirectly benefit from templates via `Equipment.templateId` lookups (which they can read via their own equipment)

**Important:** Players can SELECT equipment templates via their owned equipment instances (e.g., to display template name/description in UI). Consider adding a **read-only policy** for templates:

```sql
-- Allow players to read PUBLISHED templates (for UI display of owned equipment)
create policy "Players can read published equipment templates"
on public."EquipmentTemplate"
as permissive
for select
to authenticated
using (status = 'PUBLISHED');
```

This allows players to see template details for equipment they own, but not edit or view DRAFT templates.

---

## Migration Strategy

### Phase 1: Admin-Only Blanket Policy

Apply admin-only policy to **all tables** first. This locks down the database.

```sql
-- Enable RLS on all tables
do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename not in ('_prisma_migrations')
  loop
    execute format('alter table public.%I enable row level security;', r.tablename);

    execute format('drop policy if exists %L on public.%I;', 'Admin-only access', r.tablename);

    execute format($policy$
      create policy %L
      on public.%I
      as permissive
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
    $policy$, 'Admin-only access', r.tablename);
  end loop;
end $$;
```

**Result:** Only admins and service role can access any table.

---

### Phase 2: Add Player Policies

For each player-accessible table, add **additional permissive policies** that allow players to access their own data.

**Example: User table**

```sql
create policy "Users can view and update their own profile"
on public."User"
as permissive
for all
to authenticated
using ("authUserId" = auth.uid())
with check ("authUserId" = auth.uid());
```

**Example: Gladiator table**

```sql
create policy "Users can access their own gladiators"
on public."Gladiator"
as permissive
for select, update
to authenticated
using (
  ownerId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
);
```

**Repeat for:** Equipment, LootBox, UserGold, Match, Challenge, Friend, GladiatorEquippedItem, GladiatorLoadout.

---

### Phase 3: Verify with Tests

Test each policy:
1. Sign in as a non-admin player
2. Query tables via Prisma/API routes (uses user JWT)
3. Verify:
   - Can read own gladiators, equipment, matches
   - Cannot read other players' data
   - Cannot read/write admin-only tables

Test admin access:
1. Sign in as admin user
2. Verify can access Admin UI (`/admin/*`)
3. Verify can CRUD game data templates

---

## Security Checklist

- [ ] `is_admin()` function created
- [ ] RLS enabled on all tables
- [ ] Admin-only policy applied to all tables (Phase 1)
- [ ] Player policies added for: User, Gladiator, Equipment, LootBox, UserGold, Match, Challenge, Friend, GladiatorEquippedItem, GladiatorLoadout
- [ ] Read-only policy added for EquipmentTemplate/ActionTemplate (optional, for UI display)
- [ ] Service role key secured (never exposed to frontend)
- [ ] Tested with non-admin user (can access own data only)
- [ ] Tested with admin user (can access all data)
- [ ] Verified game server operations work (service role bypass)

---

## Summary

**Admin-Only (7 tables):** GameDataBundle, EquipmentTemplate, ActionTemplate, EquipmentTemplateAction, Account, Session, VerificationToken

**Player-Accessible (10 tables):** User, Gladiator, Equipment, LootBox, UserGold, Match, Challenge, Friend, GladiatorEquippedItem, GladiatorLoadout

**Strategy:** Admin-only blanket policy first, then add permissive per-user policies for gameplay tables.

**Helper Functions:** `is_admin()` required; `current_user_id()` optional.

**Service Role:** Game server and blockchain listener use service role key (bypasses RLS).

---

*Reference created 2026-02-05 for Crucible (Gladiator Coliseum) RLS setup.*
