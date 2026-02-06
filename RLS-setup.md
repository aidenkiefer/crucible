# RLS Setup: Instruction Doc for Claude
## Claude – RLS Review & Refinement Task (Crucible)

You are reviewing and refining the **Row Level Security (RLS)** configuration for the Crucible project (Supabase + Postgres).

---

### Current State (Important Context)

- RLS is now technically working and re-enabled.
- We use a **`User` table** that includes:
  - `authUserId` (UUID, linked to `auth.users.id`)
  - `isAdmin` (boolean, manually set by project owners)
- Authentication is handled via **NextAuth (Google/Twitter)**.
- The app has:
  - **Admin-only authoring tables** (GameDataBundle, templates, etc.)
  - **Gameplay tables** (User, Gladiator, Match, Friend, Challenge, etc.)
- Admins should be able to **view/edit database-backed content** via the admin UI.
- Regular players should only be able to:
  - Read/update **their own data**
  - Never access admin authoring data
- Prisma is used for schema management, but **Supabase RLS is the source of truth for access control**.

---

### Current RLS Strategy (High-Level)

- **Phase 1:** Lock down tables with admin-only access.
- **Phase 2:** Add permissive policies allowing users to access **only rows they own or participate in**.
- Helper functions like `is_admin()` and `current_user_id()` are used to keep policies consistent.

---

### What I Need You To Do

Please do the following:

#### 1. Review the existing RLS approach and SQL
- Validate that it correctly enforces:
  - Admin-only access to authoring tables
  - Per-user access to gameplay tables
- Identify any places where RLS may be:
  - Too permissive
  - Too restrictive
  - Fragile (e.g. breaks auth, Prisma, or future changes)

#### 2. Explicitly confirm or challenge these assumptions
- That `auth.uid()` is reliably available for all access paths we use
- That NextAuth + Prisma will not silently bypass RLS
- That admin access is properly gated only by `isAdmin = true`

#### 3. Propose a final, clean RLS structure
- Which tables should be:
  - Admin-only
  - User-owned
  - Public read / restricted write
- Which tables should *not* have RLS enabled (if any)
- Whether blanket policies should be avoided in favor of targeted ones

#### 4. Refine helper functions
- Ensure `security definer` functions (`is_admin`, `current_user_id`) are safe
- Lock `search_path`
- Avoid future foot-guns

#### 5. Update the SQL accordingly
- Provide a revised, copy-paste-ready SQL setup:
  - Helper functions
  - Policies per table category
  - Clear comments explaining intent
- Avoid patterns that block Prisma migrations unnecessarily  
  (e.g. policies that depend on columns likely to change)

#### 6. Ask questions if needed
If anything is ambiguous, ask *specific, actionable* questions before locking in the final version.

---

### Non-Goals / Constraints

- Do NOT over-optimize or over-abstract.
- Do NOT assume infinite infra or enterprise DB patterns.
- Favor clarity, correctness, and maintainability.
- The goal is **robust indie-scale security**, not theoretical perfection.

---

### Success Criteria

At the end of this task, we should have:
- High confidence that RLS matches our mental model
- A documented, understandable policy structure
- No accidental admin leaks
- No broken auth flows
- A setup that can evolve as gameplay tables grow
