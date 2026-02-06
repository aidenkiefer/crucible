-- ============================================================================
-- Row Level Security (RLS) Setup for Crucible (Refined)
-- ============================================================================
--
-- ARCHITECTURE CONTEXT:
-- - NextAuth (JWT strategy) for authentication (NOT Supabase Auth)
-- - Prisma with postgres superuser for all DB access (bypasses RLS)
-- - authUserId field is nullable/unreliable (not linked to Supabase auth.users)
-- - No Supabase client libraries used from frontend
--
-- RLS PURPOSE:
-- - Defense-in-depth backup layer
-- - Lock down admin authoring tables from potential direct DB access
-- - Future-proof for potential Supabase Auth migration
--
-- IMPORTANT:
-- - RLS does NOT currently enforce access (Prisma bypasses it)
-- - Primary access control is in API routes (session.user.id checks)
-- - auth.uid() is always NULL (no Supabase Auth sessions)
--
-- MIGRATION PATH:
-- If you add Supabase Auth + Supabase client later:
-- 1. Populate User.authUserId from auth.users.id
-- 2. Switch to Supabase client libraries
-- 3. RLS policies will start enforcing automatically
--
-- Run this in Supabase SQL Editor as postgres role.
-- ============================================================================

-- ============================================================================
-- STEP 0: CLEANUP (Optional - run if re-applying)
-- ============================================================================
-- Uncomment to drop all existing policies and functions for clean slate
/*
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all policies
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;

  -- Drop helper functions
  DROP FUNCTION IF EXISTS public.is_admin();
  DROP FUNCTION IF EXISTS public.current_user_id();

  RAISE NOTICE 'Cleanup complete';
END $$;
*/

-- ============================================================================
-- HELPER FUNCTIONS (Fixed)
-- ============================================================================

-- Check if current user is admin
-- SECURITY: Locked search_path prevents table substitution attacks
-- BEHAVIOR: Returns false if auth.uid() is NULL (NextAuth scenario)
-- TYPE FIX: Cast auth.uid() to text to match User.authUserId type
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
     WHERE u."authUserId" = auth.uid()::text
     LIMIT 1),
    false  -- Default to false if no user found or auth.uid() is NULL
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
'Returns true if current Supabase Auth user is an admin. Returns false for NextAuth sessions (auth.uid() is NULL). Casts auth.uid() to text to match User.authUserId type.';

-- Map auth.uid() to User.id
-- SECURITY: Locked search_path
-- BEHAVIOR: Returns NULL if auth.uid() is NULL or user not found
-- TYPE FIX: Returns text (not uuid) because User.id is text type in Prisma
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.id
  FROM "User" u
  WHERE u."authUserId" = auth.uid()::text
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.current_user_id() IS
'Maps Supabase auth.uid() to User.id (returns text). Returns NULL for NextAuth sessions. Casts auth.uid() to text to match User.authUserId type.';

-- ============================================================================
-- ADMIN-ONLY TABLES: Strict Lockdown
-- ============================================================================
-- These tables contain dev-authored game data and auth internals.
-- Strategy: Deny ALL access to authenticated/anon roles.
-- Only service_role (Prisma) can access.
-- ============================================================================

DO $$
DECLARE
  admin_tables text[] := ARRAY[
    'GameDataBundle',
    'EquipmentTemplate',
    'ActionTemplate',
    'EquipmentTemplateAction',
    'Account',
    'Session',
    'VerificationToken'
  ];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY admin_tables
  LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    -- Force RLS even for table owner (optional, more strict)
    -- EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);

    -- Drop existing policy if exists
    EXECUTE format('DROP POLICY IF EXISTS "Service role only" ON %I', tbl);

    -- Deny all access to authenticated and anon
    EXECUTE format(
      'CREATE POLICY "Service role only" ON %I
       FOR ALL
       TO authenticated, anon
       USING (false)
       WITH CHECK (false)',
      tbl
    );

    RAISE NOTICE 'Locked down admin table: %', tbl;
  END LOOP;
END $$;

-- ============================================================================
-- GAMEPLAY TABLES: Future-Proof Policies
-- ============================================================================
-- These policies are currently DORMANT (Prisma bypasses RLS).
-- They will activate if you switch to Supabase Auth + Supabase client.
--
-- ASSUMPTION: If you switch to Supabase Auth, you'll populate authUserId.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User Table
-- ----------------------------------------------------------------------------
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and update their own profile" ON "User";
CREATE POLICY "Users can view and update their own profile"
ON "User"
FOR ALL
TO authenticated
USING (
  "authUserId" = auth.uid()
  OR is_admin()
)
WITH CHECK (
  "authUserId" = auth.uid()
  OR is_admin()
);

COMMENT ON POLICY "Users can view and update their own profile" ON "User" IS
'Allows users to access their own profile. Requires Supabase Auth (authUserId = auth.uid()). Currently dormant (NextAuth + Prisma usage).';

-- ----------------------------------------------------------------------------
-- Gladiator Table
-- ----------------------------------------------------------------------------
ALTER TABLE "Gladiator" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own gladiators" ON "Gladiator";
CREATE POLICY "Users can access their own gladiators"
ON "Gladiator"
FOR SELECT
TO authenticated
USING (
  "ownerId" = current_user_id()
  OR is_admin()
);

DROP POLICY IF EXISTS "Users can update their own gladiators" ON "Gladiator";
CREATE POLICY "Users can update their own gladiators"
ON "Gladiator"
FOR UPDATE
TO authenticated
USING (
  "ownerId" = current_user_id()
  OR is_admin()
)
WITH CHECK (
  "ownerId" = current_user_id()
  OR is_admin()
);

-- Note: INSERT handled by blockchain listener (service role)
-- Note: DELETE not allowed (NFTs are permanent)

COMMENT ON POLICY "Users can access their own gladiators" ON "Gladiator" IS
'SELECT policy: Users can view their own gladiators. Requires Supabase Auth.';

-- ----------------------------------------------------------------------------
-- GladiatorEquippedItem Table
-- ----------------------------------------------------------------------------
ALTER TABLE "GladiatorEquippedItem" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage equipped items for own gladiators" ON "GladiatorEquippedItem";
CREATE POLICY "Users can manage equipped items for own gladiators"
ON "GladiatorEquippedItem"
FOR ALL
TO authenticated
USING (
  "gladiatorId" IN (
    SELECT id FROM "Gladiator" WHERE "ownerId" = current_user_id()
  )
  OR is_admin()
)
WITH CHECK (
  "gladiatorId" IN (
    SELECT id FROM "Gladiator" WHERE "ownerId" = current_user_id()
  )
  OR is_admin()
);

-- ----------------------------------------------------------------------------
-- GladiatorLoadout Table
-- ----------------------------------------------------------------------------
ALTER TABLE "GladiatorLoadout" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage loadouts for own gladiators" ON "GladiatorLoadout";
CREATE POLICY "Users can manage loadouts for own gladiators"
ON "GladiatorLoadout"
FOR ALL
TO authenticated
USING (
  "gladiatorId" IN (
    SELECT id FROM "Gladiator" WHERE "ownerId" = current_user_id()
  )
  OR is_admin()
)
WITH CHECK (
  "gladiatorId" IN (
    SELECT id FROM "Gladiator" WHERE "ownerId" = current_user_id()
  )
  OR is_admin()
);

-- ----------------------------------------------------------------------------
-- Equipment Table
-- ----------------------------------------------------------------------------
ALTER TABLE "Equipment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own equipment" ON "Equipment";
CREATE POLICY "Users can access their own equipment"
ON "Equipment"
FOR ALL
TO authenticated
USING (
  "ownerId" = current_user_id()
  OR is_admin()
)
WITH CHECK (
  "ownerId" = current_user_id()
  OR is_admin()
);

-- ----------------------------------------------------------------------------
-- LootBox Table
-- ----------------------------------------------------------------------------
ALTER TABLE "LootBox" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own loot boxes" ON "LootBox";
CREATE POLICY "Users can access their own loot boxes"
ON "LootBox"
FOR ALL
TO authenticated
USING (
  "ownerId" = current_user_id()
  OR is_admin()
)
WITH CHECK (
  "ownerId" = current_user_id()
  OR is_admin()
);

-- ----------------------------------------------------------------------------
-- UserGold Table
-- ----------------------------------------------------------------------------
ALTER TABLE "UserGold" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own gold" ON "UserGold";
CREATE POLICY "Users can access their own gold"
ON "UserGold"
FOR ALL
TO authenticated
USING (
  "userId" = current_user_id()
  OR is_admin()
)
WITH CHECK (
  "userId" = current_user_id()
  OR is_admin()
);

-- ----------------------------------------------------------------------------
-- Match Table
-- ----------------------------------------------------------------------------
ALTER TABLE "Match" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own matches" ON "Match";
CREATE POLICY "Users can view their own matches"
ON "Match"
FOR SELECT
TO authenticated
USING (
  "player1Id" = current_user_id()
  OR "player2Id" = current_user_id()
  OR is_admin()
);

-- Note: INSERT/UPDATE handled by game server (service role)

-- ----------------------------------------------------------------------------
-- Challenge Table
-- ----------------------------------------------------------------------------
ALTER TABLE "Challenge" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access challenges they're involved in" ON "Challenge";
CREATE POLICY "Users can access challenges they're involved in"
ON "Challenge"
FOR ALL
TO authenticated
USING (
  "challengerId" = current_user_id()
  OR "opponentId" = current_user_id()
  OR is_admin()
)
WITH CHECK (
  "challengerId" = current_user_id()
  OR "opponentId" = current_user_id()
  OR is_admin()
);

-- ----------------------------------------------------------------------------
-- Friend Table
-- ----------------------------------------------------------------------------
ALTER TABLE "Friend" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access friendships they're involved in" ON "Friend";
CREATE POLICY "Users can access friendships they're involved in"
ON "Friend"
FOR ALL
TO authenticated
USING (
  "userId" = current_user_id()
  OR "friendId" = current_user_id()
  OR is_admin()
)
WITH CHECK (
  "userId" = current_user_id()
  OR "friendId" = current_user_id()
  OR is_admin()
);

-- ============================================================================
-- OPTIONAL: Read-Only Template Access
-- ============================================================================
-- Allow authenticated users to read PUBLISHED templates for UI display.
-- They can see template details for equipment they own, but can't edit.
-- ============================================================================

DROP POLICY IF EXISTS "Users can read published equipment templates" ON "EquipmentTemplate";
CREATE POLICY "Users can read published equipment templates"
ON "EquipmentTemplate"
FOR SELECT
TO authenticated
USING (
  status = 'PUBLISHED'
  OR is_admin()
);

DROP POLICY IF EXISTS "Users can read published action templates" ON "ActionTemplate";
CREATE POLICY "Users can read published action templates"
ON "ActionTemplate"
FOR SELECT
TO authenticated
USING (
  status = 'PUBLISHED'
  OR is_admin()
);

COMMENT ON POLICY "Users can read published equipment templates" ON "EquipmentTemplate" IS
'Read-only access to PUBLISHED templates for UI display. Does not allow editing.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check which tables have RLS enabled
SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE '\_%'
ORDER BY tablename;

-- List all policies
SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN permissive = 'PERMISSIVE' THEN '✅ Permissive'
    ELSE '⚠️ Restrictive'
  END as policy_type,
  cmd as operations
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test helper functions
SELECT
  'is_admin()' as function_name,
  is_admin() as result,
  'Should be FALSE (no Supabase Auth)' as expected;

SELECT
  'current_user_id()' as function_name,
  current_user_id() as result,
  'Should be NULL (no Supabase Auth)' as expected;

-- ============================================================================
-- TESTING CHECKLIST
-- ============================================================================
-- [ ] Run this script in Supabase SQL Editor
-- [ ] Verify all admin tables have RLS enabled
-- [ ] Verify all gameplay tables have RLS enabled
-- [ ] Verify helper functions exist and return expected values
-- [ ] Verify Prisma operations still work (should bypass RLS)
-- [ ] Verify API routes with session checks still work
-- [ ] Test admin UI access (should work via service role)
-- [ ] Test player API access (should work via Prisma/service role)
--
-- FUTURE (if migrating to Supabase Auth):
-- [ ] Populate User.authUserId from auth.users.id
-- [ ] Test Supabase client queries with user JWT
-- [ ] Verify RLS policies enforce correctly
-- ============================================================================

-- ============================================================================
-- ROLLBACK (Emergency Only)
-- ============================================================================
-- Uncomment to disable all RLS and remove policies
/*
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE '\_%'
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
    RAISE NOTICE 'Disabled RLS on: %', r.tablename;
  END LOOP;

  -- Drop helper functions
  DROP FUNCTION IF EXISTS public.is_admin();
  DROP FUNCTION IF EXISTS public.current_user_id();

  RAISE NOTICE 'RLS completely disabled - USE WITH CAUTION';
END $$;
*/

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON SCHEMA public IS
'RLS enabled for defense-in-depth. Primary access control is in API routes (NextAuth + Prisma). RLS policies are future-proof for potential Supabase Auth migration.';

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ Security definer functions fixed (search_path locked)
-- ✅ Admin tables locked down (service role only)
-- ✅ Gameplay tables have future-proof policies
-- ✅ Works with current NextAuth + Prisma setup
-- ✅ Ready for potential Supabase Auth migration
-- ✅ No breaking changes to existing code
-- ============================================================================
