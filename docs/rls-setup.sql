-- ============================================================================
-- Row Level Security (RLS) Setup for Crucible (Gladiator Coliseum)
-- ============================================================================
--
-- This script implements RLS policies for Supabase Postgres database.
-- It follows a 2-phase approach:
--   1. Admin-only blanket policy on all tables (lockdown)
--   2. Per-user permissive policies for gameplay tables
--
-- Reference: docs/database-table-access.md
-- Run this in Supabase SQL Editor as the postgres role.
--
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if current authenticated user is an admin
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

-- Optional: Map auth.uid() to User.id for cleaner policy expressions
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

-- ============================================================================
-- PHASE 1: ADMIN-ONLY BLANKET POLICY
-- ============================================================================
-- Apply admin-only policy to ALL tables to lock down the database.
-- Only admins and service role can access any table.
-- ============================================================================

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
    -- Enable RLS
    execute format('alter table public.%I enable row level security;', r.tablename);

    -- Drop existing admin-only policy if exists
    execute format('drop policy if exists %L on public.%I;', 'Admin-only access', r.tablename);

    -- Create admin-only policy
    execute format($policy$
      create policy %L
      on public.%I
      as permissive
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
    $policy$, 'Admin-only access', r.tablename);

    raise notice 'Applied admin-only policy to: %', r.tablename;
  end loop;
end $$;

-- ============================================================================
-- PHASE 2: PLAYER-ACCESSIBLE POLICIES
-- ============================================================================
-- Add permissive policies for players to access their own data.
-- These policies are additive (OR logic) with admin-only policy.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User Table
-- ----------------------------------------------------------------------------

create policy "Users can view and update their own profile"
on public."User"
as permissive
for all
to authenticated
using ("authUserId" = auth.uid())
with check ("authUserId" = auth.uid());

-- ----------------------------------------------------------------------------
-- Gladiator Table
-- ----------------------------------------------------------------------------

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

-- Note: INSERT is handled by blockchain listener (service role)
-- Note: DELETE is not allowed (NFTs are permanent)

-- ----------------------------------------------------------------------------
-- GladiatorEquippedItem Table
-- ----------------------------------------------------------------------------

create policy "Users can access equipped items for their own gladiators"
on public."GladiatorEquippedItem"
as permissive
for all
to authenticated
using (
  gladiatorId IN (
    SELECT id FROM public."Gladiator" WHERE ownerId IN (
      SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
    )
  )
)
with check (
  gladiatorId IN (
    SELECT id FROM public."Gladiator" WHERE ownerId IN (
      SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
    )
  )
);

-- ----------------------------------------------------------------------------
-- GladiatorLoadout Table
-- ----------------------------------------------------------------------------

create policy "Users can access loadouts for their own gladiators"
on public."GladiatorLoadout"
as permissive
for all
to authenticated
using (
  gladiatorId IN (
    SELECT id FROM public."Gladiator" WHERE ownerId IN (
      SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
    )
  )
)
with check (
  gladiatorId IN (
    SELECT id FROM public."Gladiator" WHERE ownerId IN (
      SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
    )
  )
);

-- ----------------------------------------------------------------------------
-- Equipment Table
-- ----------------------------------------------------------------------------

create policy "Users can access their own equipment"
on public."Equipment"
as permissive
for all
to authenticated
using (
  ownerId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
)
with check (
  ownerId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- LootBox Table
-- ----------------------------------------------------------------------------

create policy "Users can access their own loot boxes"
on public."LootBox"
as permissive
for all
to authenticated
using (
  ownerId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
)
with check (
  ownerId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- UserGold Table
-- ----------------------------------------------------------------------------

create policy "Users can access their own gold balance"
on public."UserGold"
as permissive
for all
to authenticated
using (
  userId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
)
with check (
  userId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- Match Table
-- ----------------------------------------------------------------------------

create policy "Users can view matches they participated in"
on public."Match"
as permissive
for select
to authenticated
using (
  player1Id IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
  OR player2Id IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
);

-- Note: INSERT/UPDATE handled by game server (service role)
-- Note: DELETE not allowed (historical records)

-- ----------------------------------------------------------------------------
-- Challenge Table
-- ----------------------------------------------------------------------------

create policy "Users can view and manage challenges they're involved in"
on public."Challenge"
as permissive
for all
to authenticated
using (
  challengerId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
  OR opponentId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
)
with check (
  challengerId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
  OR opponentId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- Friend Table
-- ----------------------------------------------------------------------------

create policy "Users can view and manage friendships they're involved in"
on public."Friend"
as permissive
for all
to authenticated
using (
  userId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
  OR friendId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
)
with check (
  userId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
  OR friendId IN (
    SELECT id FROM public."User" WHERE "authUserId" = auth.uid()
  )
);

-- ============================================================================
-- OPTIONAL: READ-ONLY TEMPLATE POLICIES
-- ============================================================================
-- Allow players to read PUBLISHED templates for UI display.
-- This is optional but recommended for better UX.
-- ============================================================================

create policy "Players can read published equipment templates"
on public."EquipmentTemplate"
as permissive
for select
to authenticated
using (status = 'PUBLISHED');

create policy "Players can read published action templates"
on public."ActionTemplate"
as permissive
for select
to authenticated
using (status = 'PUBLISHED');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify RLS is working correctly.
-- ============================================================================

-- Check which tables have RLS enabled
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- List all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- Check if is_admin() function exists
-- SELECT proname, prosrc
-- FROM pg_proc
-- WHERE proname = 'is_admin';

-- ============================================================================
-- ROLLBACK (IF NEEDED)
-- ============================================================================
-- To remove all RLS policies and disable RLS:
-- WARNING: This will remove all security. Only use for development reset.
-- ============================================================================

-- do $$
-- declare
--   r record;
-- begin
--   for r in
--     select tablename
--     from pg_tables
--     where schemaname = 'public'
--       and tablename not in ('_prisma_migrations')
--   loop
--     -- Drop all policies
--     execute format('drop policy if exists "Admin-only access" on public.%I;', r.tablename);
--     execute format('drop policy if exists "Users can view and update their own profile" on public.%I;', r.tablename);
--     execute format('drop policy if exists "Users can access their own gladiators" on public.%I;', r.tablename);
--     -- Add more drop statements for each policy...
--
--     -- Disable RLS
--     execute format('alter table public.%I disable row level security;', r.tablename);
--
--     raise notice 'Disabled RLS on: %', r.tablename;
--   end loop;
-- end $$;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. Service Role Bypass:
--    - Game server uses service role key (not user JWT)
--    - Service role bypasses RLS completely
--    - This is correct for server-side operations (match creation, loot drops, etc.)
--
-- 2. NextAuth Tables:
--    - Account, Session, VerificationToken are managed by NextAuth adapter
--    - NextAuth uses service role, so RLS doesn't affect it
--    - Admin-only policies applied for consistency
--
-- 3. Testing:
--    - Sign in as non-admin player → should only see own data
--    - Sign in as admin → should see all data
--    - Test via Prisma/API routes (uses user JWT, RLS applies)
--    - Game server (service role) should work without restrictions
--
-- 4. Security:
--    - Never expose service role key to frontend
--    - User.authUserId must be set correctly on account creation
--    - Admin users (isAdmin = true) bypass all restrictions
--
-- ============================================================================
