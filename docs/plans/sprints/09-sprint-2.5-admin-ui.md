# Sprint 2.5: Admin UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete admin UI for authoring, validating, and publishing game data (equipment templates, action templates, bundles) with export to Supabase Storage and runtime loader integration.

**Architecture:** Next.js admin routes with middleware auth guards, server-side API routes for CRUD/validation/publishing, Prisma for DB operations, Supabase Storage for bundle exports, game-server runtime loader that fetches active bundle and caches in memory.

**Tech Stack:** Next.js 14 (App Router), TypeScript, TailwindCSS, NextAuth, Prisma, Supabase Storage, React Hook Form, Zod validation

**Design System:** Follow docs/design-guidelines.md - Roman/Coliseum aesthetic, battle-console feel, Palette A (Blood & Bronze) or B (Obsidian & Gold), retro-inspired typography, dark surfaces, semantic colors (red=danger, gold=publish, green=success).

---

## Phase 1: Database Migration & Auth Setup

### Task 1.1: Database Migration - Add isAdmin to User

**Files:**
- Already modified: `packages/database/prisma/schema.prisma` (User.isAdmin added)
- Create: Migration file via Prisma CLI

**Step 1: Generate migration**

```bash
cd packages/database
pnpm prisma migrate dev --name add_is_admin_to_user
```

Expected: Migration file created in `prisma/migrations/`

**Step 2: Verify migration SQL**

```bash
cat prisma/migrations/*_add_is_admin_to_user/migration.sql
```

Expected SQL:
```sql
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "User_isAdmin_idx" ON "User"("isAdmin");
```

**Step 3: Apply migration to database**

```bash
pnpm prisma migrate deploy
```

Expected: Migration applied successfully

**Step 4: Set your user as admin (manual)**

Use Prisma Studio or direct SQL:
```bash
pnpm prisma studio
```

Navigate to User table, find your user by email, set `isAdmin = true`.

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add isAdmin flag to User model"
```

---

### Task 1.2: Update Auth Session to Include isAdmin

**Files:**
- Modify: `apps/web/lib/auth.ts`
- Modify: `apps/web/types/next-auth.d.ts` (create if missing)

**Step 1: Create/update NextAuth types**

Create `apps/web/types/next-auth.d.ts`:

```typescript
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      walletAddress?: string | null
      isAdmin: boolean
    }
  }

  interface User {
    isAdmin: boolean
  }
}
```

**Step 2: Update auth session callback**

Modify `apps/web/lib/auth.ts` - update the session callback:

```typescript
callbacks: {
  async session({ session, user }) {
    if (session.user) {
      session.user.id = user.id
      // Fetch full user data including isAdmin
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          walletAddress: true,
          isAdmin: true
        },
      })
      session.user.walletAddress = dbUser?.walletAddress
      session.user.isAdmin = dbUser?.isAdmin ?? false
    }
    return session
  },
},
```

**Step 3: Commit**

```bash
git add apps/web/lib/auth.ts apps/web/types/next-auth.d.ts
git commit -m "feat(auth): add isAdmin to session"
```

---

### Task 1.3: Create Middleware for Admin Route Protection

**Files:**
- Create: `apps/web/middleware.ts`

**Step 1: Create middleware**

```typescript
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.isAdmin === true
    const path = req.nextUrl.pathname

    // Protect /admin routes (except /admin/unauthorized)
    if (path.startsWith('/admin') && !path.startsWith('/admin/unauthorized')) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/admin/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'],
}
```

**Step 2: Create unauthorized page**

Create `apps/web/app/admin/unauthorized/page.tsx`:

```tsx
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
        <p className="text-stone-300 mb-6">
          You do not have administrator privileges.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-amber-600 text-black font-bold uppercase tracking-wide hover:bg-amber-500 transition"
        >
          Return Home
        </a>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add apps/web/middleware.ts apps/web/app/admin/unauthorized/
git commit -m "feat(admin): add middleware protection for admin routes"
```

---

## Phase 2: Admin Layout & Navigation

### Task 2.1: Create Admin Layout with Navigation

**Files:**
- Create: `apps/web/app/admin/layout.tsx`
- Create: `apps/web/app/admin/components/AdminNav.tsx`

**Step 1: Create admin navigation component**

Create `apps/web/app/admin/components/AdminNav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '⚔️' },
  { href: '/admin/bundles', label: 'Bundles', icon: '📦' },
  { href: '/admin/equipment-templates', label: 'Equipment', icon: '🗡️' },
  { href: '/admin/action-templates', label: 'Actions', icon: '⚡' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-stone-950 border-b-2 border-amber-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin" className="text-amber-500 font-bold text-xl uppercase tracking-wider">
              Crucible Admin
            </Link>
            <div className="flex space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      px-4 py-2 text-sm font-bold uppercase tracking-wide transition
                      ${isActive
                        ? 'bg-amber-700 text-black'
                        : 'text-stone-300 hover:bg-stone-800'
                      }
                    `}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <Link
            href="/"
            className="text-stone-400 hover:text-stone-200 text-sm font-bold uppercase"
          >
            ← Exit Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}
```

**Step 2: Create admin layout**

Create `apps/web/app/admin/layout.tsx`:

```tsx
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminNav from './components/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  if (!session.user.isAdmin) {
    redirect('/admin/unauthorized')
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      <AdminNav />
      <main>{children}</main>
    </div>
  )
}
```

**Step 3: Update admin dashboard page**

Modify `apps/web/app/admin/page.tsx` to use design system:

```tsx
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  // Fetch stats
  const [userCount, gladiatorCount, matchCount, bundleCount, templateCount, actionCount] = await Promise.all([
    prisma.user.count(),
    prisma.gladiator.count(),
    prisma.match.count(),
    prisma.gameDataBundle.count(),
    prisma.equipmentTemplate.count(),
    prisma.actionTemplate.count(),
  ])

  const activeBundle = await prisma.gameDataBundle.findFirst({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          equipmentTemplates: true,
          actionTemplates: true,
        },
      },
    },
  })

  const recentGladiators = await prisma.gladiator.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: {
        select: { email: true, walletAddress: true },
      },
    },
  })

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-wide text-amber-500 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-stone-400">
          Logged in as <span className="text-stone-200">{session?.user.email}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Users" value={userCount} color="blue" />
        <StatCard label="Gladiators" value={gladiatorCount} color="green" />
        <StatCard label="Matches" value={matchCount} color="purple" />
        <StatCard label="Bundles" value={bundleCount} color="amber" />
        <StatCard label="Equipment Templates" value={templateCount} color="red" />
        <StatCard label="Action Templates" value={actionCount} color="cyan" />
      </div>

      {/* Active Bundle */}
      <div className="mb-8 p-6 bg-stone-800 border-2 border-amber-700 rounded">
        <h2 className="text-2xl font-bold uppercase text-amber-500 mb-4">Active Bundle</h2>
        {activeBundle ? (
          <div>
            <div className="text-xl font-bold text-stone-100 mb-2">{activeBundle.label}</div>
            <div className="text-sm text-stone-400 space-y-1">
              <div>Status: <span className="text-green-400 font-bold">{activeBundle.status}</span></div>
              <div>Equipment Templates: {activeBundle._count.equipmentTemplates}</div>
              <div>Action Templates: {activeBundle._count.actionTemplates}</div>
              <div>Published: {new Date(activeBundle.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div className="text-stone-400">No active bundle. Create and publish one.</div>
        )}
      </div>

      {/* Recent Gladiators */}
      <div>
        <h2 className="text-2xl font-bold uppercase text-amber-500 mb-4">Recent Gladiators</h2>
        <div className="bg-stone-800 border-2 border-stone-700 rounded overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-stone-950 border-b-2 border-stone-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Token ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Class</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Level</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-700">
              {recentGladiators.map((g) => (
                <tr key={g.id} className="hover:bg-stone-750">
                  <td className="px-6 py-4 text-stone-200">{g.tokenId}</td>
                  <td className="px-6 py-4 text-stone-200">{g.class}</td>
                  <td className="px-6 py-4 text-stone-200">{g.level}</td>
                  <td className="px-6 py-4 text-sm text-stone-300">
                    {g.owner.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-400">
                    {new Date(g.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-600 bg-blue-950',
    green: 'border-green-600 bg-green-950',
    purple: 'border-purple-600 bg-purple-950',
    amber: 'border-amber-600 bg-amber-950',
    red: 'border-red-600 bg-red-950',
    cyan: 'border-cyan-600 bg-cyan-950',
  }

  return (
    <div className={`p-6 border-2 rounded ${colorClasses[color]}`}>
      <div className="text-3xl font-bold text-stone-100">{value}</div>
      <div className="text-sm font-bold uppercase text-stone-400 tracking-wide">{label}</div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add apps/web/app/admin/
git commit -m "feat(admin): add navigation and redesign dashboard"
```

---

## Phase 3: Bundle Management

### Task 3.1: Create API Route - List Bundles

**Files:**
- Create: `apps/web/app/api/admin/bundles/route.ts`

**Step 1: Create GET endpoint**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const bundles = await prisma.gameDataBundle.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          equipmentTemplates: true,
          actionTemplates: true,
        },
      },
    },
  })

  return NextResponse.json({ bundles })
}
```

**Step 2: Commit**

```bash
git add apps/web/app/api/admin/bundles/route.ts
git commit -m "feat(admin): add bundle list API"
```

---

### Task 3.2: Create API Route - Create Bundle (Clone from Active)

**Files:**
- Modify: `apps/web/app/api/admin/bundles/route.ts` (add POST)

**Step 1: Add POST endpoint**

Add to `apps/web/app/api/admin/bundles/route.ts`:

```typescript
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { label } = await req.json()

  if (!label || typeof label !== 'string') {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 })
  }

  // Check if label already exists
  const existing = await prisma.gameDataBundle.findUnique({
    where: { label },
  })

  if (existing) {
    return NextResponse.json({ error: 'Bundle with this label already exists' }, { status: 400 })
  }

  // Find active bundle to clone from
  const activeBundle = await prisma.gameDataBundle.findFirst({
    where: { isActive: true },
    include: {
      equipmentTemplates: {
        include: {
          actions: true,
        },
      },
      actionTemplates: true,
    },
  })

  // Create new bundle
  const newBundle = await prisma.gameDataBundle.create({
    data: {
      label,
      status: 'DRAFT',
      isActive: false,
    },
  })

  // Clone templates if active bundle exists
  if (activeBundle) {
    // Clone action templates first (no dependencies)
    const actionTemplateMap = new Map<string, string>()

    for (const actionTemplate of activeBundle.actionTemplates) {
      const cloned = await prisma.actionTemplate.create({
        data: {
          key: actionTemplate.key,
          name: actionTemplate.name,
          description: actionTemplate.description,
          status: 'DRAFT',
          version: actionTemplate.version,
          category: actionTemplate.category,
          cooldownMs: actionTemplate.cooldownMs,
          castTimeMs: actionTemplate.castTimeMs,
          staminaCost: actionTemplate.staminaCost,
          manaCost: actionTemplate.manaCost,
          hitboxConfig: actionTemplate.hitboxConfig,
          projectileConfig: actionTemplate.projectileConfig,
          damageConfig: actionTemplate.damageConfig,
          effectConfig: actionTemplate.effectConfig,
          bundleId: newBundle.id,
        },
      })
      actionTemplateMap.set(actionTemplate.id, cloned.id)
    }

    // Clone equipment templates with action references
    for (const equipTemplate of activeBundle.equipmentTemplates) {
      const cloned = await prisma.equipmentTemplate.create({
        data: {
          key: equipTemplate.key,
          name: equipTemplate.name,
          description: equipTemplate.description,
          status: 'DRAFT',
          version: equipTemplate.version,
          type: equipTemplate.type,
          slot: equipTemplate.slot,
          subtype: equipTemplate.subtype,
          tags: equipTemplate.tags,
          baseStatMods: equipTemplate.baseStatMods,
          scaling: equipTemplate.scaling,
          rarityRules: equipTemplate.rarityRules,
          ui: equipTemplate.ui,
          bundleId: newBundle.id,
          actions: {
            create: equipTemplate.actions.map((ea) => ({
              actionTemplateId: actionTemplateMap.get(ea.actionTemplateId)!,
            })),
          },
        },
      })
    }
  }

  return NextResponse.json({ bundle: newBundle })
}
```

**Step 2: Commit**

```bash
git add apps/web/app/api/admin/bundles/route.ts
git commit -m "feat(admin): add bundle creation with clone-from-active"
```

---

### Task 3.3: Create Bundles List Page

**Files:**
- Create: `apps/web/app/admin/bundles/page.tsx`

**Step 1: Create bundles page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Bundle {
  id: string
  label: string
  status: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    equipmentTemplates: number
    actionTemplates: number
  }
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBundles()
  }, [])

  async function fetchBundles() {
    setLoading(true)
    const res = await fetch('/api/admin/bundles')
    const data = await res.json()
    setBundles(data.bundles)
    setLoading(false)
  }

  async function handleCreateBundle(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCreating(true)

    try {
      const res = await fetch('/api/admin/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create bundle')
      }

      setNewLabel('')
      await fetchBundles()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto p-8 text-stone-400">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-4xl font-bold uppercase tracking-wide text-amber-500 mb-8">
        Game Data Bundles
      </h1>

      {/* Create Bundle Form */}
      <div className="mb-8 p-6 bg-stone-800 border-2 border-stone-700 rounded">
        <h2 className="text-xl font-bold uppercase text-stone-200 mb-4">Create New Bundle</h2>
        <form onSubmit={handleCreateBundle} className="flex gap-4">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. demo-v0.2"
            className="flex-1 px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-2 bg-amber-700 text-black font-bold uppercase tracking-wide hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {creating ? 'Creating...' : 'Create (Clone from Active)'}
          </button>
        </form>
        {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}
        <p className="mt-4 text-sm text-stone-400">
          Creates a new draft bundle by cloning all templates from the current active bundle.
        </p>
      </div>

      {/* Bundles List */}
      <div className="bg-stone-800 border-2 border-stone-700 rounded overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-stone-950 border-b-2 border-stone-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Label</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Active</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Equipment</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Actions</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Updated</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-700">
            {bundles.map((bundle) => (
              <tr key={bundle.id} className="hover:bg-stone-750">
                <td className="px-6 py-4 font-bold text-stone-100">{bundle.label}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    bundle.status === 'PUBLISHED' ? 'bg-green-900 text-green-300' :
                    bundle.status === 'DRAFT' ? 'bg-blue-900 text-blue-300' :
                    'bg-purple-900 text-purple-300'
                  }`}>
                    {bundle.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {bundle.isActive && (
                    <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-amber-900 text-amber-300">
                      ✓ Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-stone-300">{bundle._count.equipmentTemplates}</td>
                <td className="px-6 py-4 text-stone-300">{bundle._count.actionTemplates}</td>
                <td className="px-6 py-4 text-sm text-stone-400">
                  {new Date(bundle.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/bundles/${bundle.id}`}
                    className="text-amber-500 hover:text-amber-400 font-bold text-sm"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add apps/web/app/admin/bundles/page.tsx
git commit -m "feat(admin): add bundles list page"
```

---

## Phase 4: Action Templates CRUD

### Task 4.1: Create API Routes - Action Templates CRUD

**Files:**
- Create: `apps/web/app/api/admin/action-templates/route.ts`
- Create: `apps/web/app/api/admin/action-templates/[id]/route.ts`

**Step 1: Create list/create endpoint**

Create `apps/web/app/api/admin/action-templates/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const bundleId = searchParams.get('bundleId')

  const where = bundleId ? { bundleId } : {}

  const templates = await prisma.actionTemplate.findMany({
    where,
    orderBy: { key: 'asc' },
  })

  return NextResponse.json({ templates })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const data = await req.json()

  // Validate required fields
  if (!data.key || !data.name || !data.category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check key uniqueness
  const existing = await prisma.actionTemplate.findUnique({
    where: { key: data.key },
  })

  if (existing) {
    return NextResponse.json({ error: 'Key already exists' }, { status: 400 })
  }

  const template = await prisma.actionTemplate.create({
    data: {
      key: data.key,
      name: data.name,
      description: data.description || null,
      status: 'DRAFT',
      version: 1,
      category: data.category,
      cooldownMs: data.cooldownMs || 0,
      castTimeMs: data.castTimeMs || 0,
      staminaCost: data.staminaCost || 0,
      manaCost: data.manaCost || 0,
      hitboxConfig: data.hitboxConfig || {},
      projectileConfig: data.projectileConfig || {},
      damageConfig: data.damageConfig || {},
      effectConfig: data.effectConfig || {},
      bundleId: data.bundleId || null,
    },
  })

  return NextResponse.json({ template })
}
```

**Step 2: Create detail/update/delete endpoints**

Create `apps/web/app/api/admin/action-templates/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const template = await prisma.actionTemplate.findUnique({
    where: { id: params.id },
    include: {
      bundle: true,
    },
  })

  if (!template) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ template })
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const data = await req.json()

  const template = await prisma.actionTemplate.update({
    where: { id: params.id },
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      cooldownMs: data.cooldownMs,
      castTimeMs: data.castTimeMs,
      staminaCost: data.staminaCost,
      manaCost: data.manaCost,
      hitboxConfig: data.hitboxConfig,
      projectileConfig: data.projectileConfig,
      damageConfig: data.damageConfig,
      effectConfig: data.effectConfig,
      status: data.status,
    },
  })

  return NextResponse.json({ template })
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  await prisma.actionTemplate.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
```

**Step 3: Commit**

```bash
git add apps/web/app/api/admin/action-templates/
git commit -m "feat(admin): add action template CRUD APIs"
```

---

### Task 4.2: Create Action Templates List Page

**Files:**
- Create: `apps/web/app/admin/action-templates/page.tsx`

**Step 1: Create page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ActionTemplate {
  id: string
  key: string
  name: string
  category: string
  status: string
  cooldownMs: number
  staminaCost: number
  manaCost: number
}

export default function ActionTemplatesPage() {
  const [templates, setTemplates] = useState<ActionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    setLoading(true)
    const res = await fetch('/api/admin/action-templates')
    const data = await res.json()
    setTemplates(data.templates)
    setLoading(false)
  }

  const filteredTemplates = templates.filter(
    (t) =>
      t.key.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="max-w-7xl mx-auto p-8 text-stone-400">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-wide text-amber-500">
          Action Templates
        </h1>
        <Link
          href="/admin/action-templates/new"
          className="px-6 py-3 bg-green-700 text-black font-bold uppercase tracking-wide hover:bg-green-600 transition"
        >
          + Create Action
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by key or name..."
          className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
        />
      </div>

      {/* Templates List */}
      <div className="bg-stone-800 border-2 border-stone-700 rounded overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-stone-950 border-b-2 border-stone-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Key</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Category</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Cooldown</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Costs</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-700">
            {filteredTemplates.map((template) => (
              <tr key={template.id} className="hover:bg-stone-750">
                <td className="px-6 py-4 font-mono text-sm text-cyan-400">{template.key}</td>
                <td className="px-6 py-4 font-bold text-stone-100">{template.name}</td>
                <td className="px-6 py-4 text-stone-300">{template.category}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    template.status === 'PUBLISHED' ? 'bg-green-900 text-green-300' :
                    template.status === 'DRAFT' ? 'bg-blue-900 text-blue-300' :
                    'bg-purple-900 text-purple-300'
                  }`}>
                    {template.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-stone-300">{template.cooldownMs}ms</td>
                <td className="px-6 py-4 text-sm text-stone-400">
                  {template.staminaCost > 0 && `Stam: ${template.staminaCost}`}
                  {template.manaCost > 0 && ` Mana: ${template.manaCost}`}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/action-templates/${template.id}`}
                    className="text-amber-500 hover:text-amber-400 font-bold text-sm"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add apps/web/app/admin/action-templates/page.tsx
git commit -m "feat(admin): add action templates list page"
```

---

### Task 4.3: Create Action Template Editor Page

**Files:**
- Create: `apps/web/app/admin/action-templates/[id]/page.tsx`
- Create: `apps/web/app/admin/action-templates/new/page.tsx`
- Create: `apps/web/app/admin/components/JsonEditor.tsx`

**Step 1: Create JSON editor component**

Create `apps/web/app/admin/components/JsonEditor.tsx`:

```tsx
'use client'

import { useState } from 'react'

interface JsonEditorProps {
  label: string
  value: any
  onChange: (value: any) => void
  placeholder?: string
  helperText?: string
  insertSkeleton?: () => any
}

export default function JsonEditor({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  insertSkeleton,
}: JsonEditorProps) {
  const [textValue, setTextValue] = useState(JSON.stringify(value, null, 2))
  const [error, setError] = useState('')

  function handleChange(newText: string) {
    setTextValue(newText)
    try {
      const parsed = JSON.parse(newText)
      setError('')
      onChange(parsed)
    } catch (err: any) {
      setError(err.message)
    }
  }

  function handleInsertSkeleton() {
    if (insertSkeleton) {
      const skeleton = insertSkeleton()
      const formatted = JSON.stringify(skeleton, null, 2)
      setTextValue(formatted)
      onChange(skeleton)
      setError('')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-bold uppercase text-stone-300">{label}</label>
        {insertSkeleton && (
          <button
            type="button"
            onClick={handleInsertSkeleton}
            className="text-xs px-3 py-1 bg-stone-700 text-stone-200 hover:bg-stone-600 transition"
          >
            Insert Skeleton
          </button>
        )}
      </div>
      <textarea
        value={textValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-48 px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 font-mono text-sm focus:border-amber-600 focus:outline-none"
      />
      {error && <div className="mt-2 text-red-400 text-xs font-mono">{error}</div>}
      {helperText && <div className="mt-2 text-stone-400 text-xs">{helperText}</div>}
    </div>
  )
}
```

**Step 2: Create new action template page**

Create `apps/web/app/admin/action-templates/new/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import JsonEditor from '../../components/JsonEditor'

const CATEGORY_OPTIONS = ['WEAPON_ATTACK', 'CAST', 'MOBILITY', 'UTILITY']

export default function NewActionTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    category: 'WEAPON_ATTACK',
    cooldownMs: 0,
    castTimeMs: 0,
    staminaCost: 0,
    manaCost: 0,
    hitboxConfig: {},
    projectileConfig: {},
    damageConfig: {},
    effectConfig: {},
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/admin/action-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create template')
      }

      const { template } = await res.json()
      router.push(`/admin/action-templates/${template.id}`)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold uppercase tracking-wide text-amber-500 mb-8">
        Create Action Template
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-900 border-2 border-red-600 text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Identity</h2>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
              Key *
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="atk_sword_slash_light"
              className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 font-mono focus:border-amber-600 focus:outline-none"
              required
            />
            <p className="mt-1 text-xs text-stone-400">Lowercase snake_case, unique, stable</p>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Light Sword Slash"
              className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A quick horizontal slash"
              className="w-full h-24 px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timing & Costs */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Timing & Costs</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Cooldown (ms)
              </label>
              <input
                type="number"
                value={formData.cooldownMs}
                onChange={(e) => setFormData({ ...formData, cooldownMs: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Cast Time (ms)
              </label>
              <input
                type="number"
                value={formData.castTimeMs}
                onChange={(e) => setFormData({ ...formData, castTimeMs: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Stamina Cost
              </label>
              <input
                type="number"
                value={formData.staminaCost}
                onChange={(e) => setFormData({ ...formData, staminaCost: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Mana Cost
              </label>
              <input
                type="number"
                value={formData.manaCost}
                onChange={(e) => setFormData({ ...formData, manaCost: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* JSON Configs */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Behavior Configs (JSON)</h2>

          <JsonEditor
            label="Hitbox Config"
            value={formData.hitboxConfig}
            onChange={(val) => setFormData({ ...formData, hitboxConfig: val })}
            insertSkeleton={() => ({
              shape: 'ARC',
              radius: 80,
              angleDeg: 90,
              offsetX: 0,
              offsetY: 0,
            })}
            helperText="Defines melee attack hitbox shape (ARC, CIRCLE, RECTANGLE)"
          />

          <JsonEditor
            label="Projectile Config"
            value={formData.projectileConfig}
            onChange={(val) => setFormData({ ...formData, projectileConfig: val })}
            insertSkeleton={() => ({
              speed: 400,
              radius: 10,
              ttlMs: 2000,
              pierces: false,
            })}
            helperText="Defines projectile behavior for ranged attacks"
          />

          <JsonEditor
            label="Damage Config"
            value={formData.damageConfig}
            onChange={(val) => setFormData({ ...formData, damageConfig: val })}
            insertSkeleton={() => ({
              base: 15,
              type: 'PHYSICAL',
              scaling: { str: 0.7, dex: 0.3 },
            })}
            helperText="Base damage and stat scaling"
          />

          <JsonEditor
            label="Effect Config"
            value={formData.effectConfig}
            onChange={(val) => setFormData({ ...formData, effectConfig: val })}
            insertSkeleton={() => ({
              effects: [],
            })}
            helperText="Buffs, debuffs, on-hit effects, etc."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-green-700 text-black font-bold uppercase tracking-wide hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Creating...' : 'Create Template'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 bg-stone-700 text-stone-200 font-bold uppercase tracking-wide hover:bg-stone-600 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 3: Create edit action template page**

Create `apps/web/app/admin/action-templates/[id]/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import JsonEditor from '../../components/JsonEditor'

const CATEGORY_OPTIONS = ['WEAPON_ATTACK', 'CAST', 'MOBILITY', 'UTILITY']
const STATUS_OPTIONS = ['DRAFT', 'PUBLISHED', 'DEPRECATED']

export default function EditActionTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    category: 'WEAPON_ATTACK',
    status: 'DRAFT',
    cooldownMs: 0,
    castTimeMs: 0,
    staminaCost: 0,
    manaCost: 0,
    hitboxConfig: {},
    projectileConfig: {},
    damageConfig: {},
    effectConfig: {},
  })

  useEffect(() => {
    fetchTemplate()
  }, [params.id])

  async function fetchTemplate() {
    setLoading(true)
    const res = await fetch(`/api/admin/action-templates/${params.id}`)
    const data = await res.json()
    if (data.template) {
      setFormData(data.template)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/action-templates/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update template')
      }

      router.push('/admin/action-templates')
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this action template? This cannot be undone.')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/action-templates/${params.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete template')
      }

      router.push('/admin/action-templates')
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto p-8 text-stone-400">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-wide text-amber-500">
          Edit Action Template
        </h1>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 bg-red-800 text-red-200 font-bold uppercase text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900 border-2 border-red-600 text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Identity</h2>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
              Key (Read-only)
            </label>
            <input
              type="text"
              value={formData.key}
              disabled
              className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-500 font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-24 px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Timing & Costs */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Timing & Costs</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Cooldown (ms)
              </label>
              <input
                type="number"
                value={formData.cooldownMs}
                onChange={(e) => setFormData({ ...formData, cooldownMs: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Cast Time (ms)
              </label>
              <input
                type="number"
                value={formData.castTimeMs}
                onChange={(e) => setFormData({ ...formData, castTimeMs: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Stamina Cost
              </label>
              <input
                type="number"
                value={formData.staminaCost}
                onChange={(e) => setFormData({ ...formData, staminaCost: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">
                Mana Cost
              </label>
              <input
                type="number"
                value={formData.manaCost}
                onChange={(e) => setFormData({ ...formData, manaCost: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* JSON Configs */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Behavior Configs (JSON)</h2>

          <JsonEditor
            label="Hitbox Config"
            value={formData.hitboxConfig}
            onChange={(val) => setFormData({ ...formData, hitboxConfig: val })}
            insertSkeleton={() => ({
              shape: 'ARC',
              radius: 80,
              angleDeg: 90,
              offsetX: 0,
              offsetY: 0,
            })}
          />

          <JsonEditor
            label="Projectile Config"
            value={formData.projectileConfig}
            onChange={(val) => setFormData({ ...formData, projectileConfig: val })}
            insertSkeleton={() => ({
              speed: 400,
              radius: 10,
              ttlMs: 2000,
              pierces: false,
            })}
          />

          <JsonEditor
            label="Damage Config"
            value={formData.damageConfig}
            onChange={(val) => setFormData({ ...formData, damageConfig: val })}
            insertSkeleton={() => ({
              base: 15,
              type: 'PHYSICAL',
              scaling: { str: 0.7, dex: 0.3 },
            })}
          />

          <JsonEditor
            label="Effect Config"
            value={formData.effectConfig}
            onChange={(val) => setFormData({ ...formData, effectConfig: val })}
            insertSkeleton={() => ({
              effects: [],
            })}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-green-700 text-black font-bold uppercase tracking-wide hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 bg-stone-700 text-stone-200 font-bold uppercase tracking-wide hover:bg-stone-600 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add apps/web/app/admin/action-templates/ apps/web/app/admin/components/JsonEditor.tsx
git commit -m "feat(admin): add action template editor pages"
```

---

## Phase 5: Equipment Templates CRUD

### Task 5.1: Create API Routes - Equipment Templates CRUD

**Files:**
- Create: `apps/web/app/api/admin/equipment-templates/route.ts`
- Create: `apps/web/app/api/admin/equipment-templates/[id]/route.ts`

**Step 1: Create list/create endpoint**

Create `apps/web/app/api/admin/equipment-templates/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const bundleId = searchParams.get('bundleId')

  const where = bundleId ? { bundleId } : {}

  const templates = await prisma.equipmentTemplate.findMany({
    where,
    orderBy: { key: 'asc' },
    include: {
      actions: {
        include: {
          actionTemplate: {
            select: {
              id: true,
              key: true,
              name: true,
            },
          },
        },
      },
    },
  })

  return NextResponse.json({ templates })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const data = await req.json()

  // Validate required fields
  if (!data.key || !data.name || !data.type || !data.slot || !data.subtype) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check key uniqueness
  const existing = await prisma.equipmentTemplate.findUnique({
    where: { key: data.key },
  })

  if (existing) {
    return NextResponse.json({ error: 'Key already exists' }, { status: 400 })
  }

  const template = await prisma.equipmentTemplate.create({
    data: {
      key: data.key,
      name: data.name,
      description: data.description || null,
      status: 'DRAFT',
      version: 1,
      type: data.type,
      slot: data.slot,
      subtype: data.subtype,
      tags: data.tags || [],
      baseStatMods: data.baseStatMods || {},
      scaling: data.scaling || {},
      rarityRules: data.rarityRules || {},
      ui: data.ui || {},
      bundleId: data.bundleId || null,
      actions: {
        create: (data.actionTemplateIds || []).map((id: string) => ({
          actionTemplateId: id,
        })),
      },
    },
    include: {
      actions: {
        include: {
          actionTemplate: true,
        },
      },
    },
  })

  return NextResponse.json({ template })
}
```

**Step 2: Create detail/update/delete endpoints**

Create `apps/web/app/api/admin/equipment-templates/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const template = await prisma.equipmentTemplate.findUnique({
    where: { id: params.id },
    include: {
      bundle: true,
      actions: {
        include: {
          actionTemplate: true,
        },
      },
    },
  })

  if (!template) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ template })
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const data = await req.json()

  // Delete existing action connections
  await prisma.equipmentTemplateAction.deleteMany({
    where: { equipmentTemplateId: params.id },
  })

  // Update template with new action connections
  const template = await prisma.equipmentTemplate.update({
    where: { id: params.id },
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      slot: data.slot,
      subtype: data.subtype,
      tags: data.tags,
      baseStatMods: data.baseStatMods,
      scaling: data.scaling,
      rarityRules: data.rarityRules,
      ui: data.ui,
      status: data.status,
      actions: {
        create: (data.actionTemplateIds || []).map((id: string) => ({
          actionTemplateId: id,
        })),
      },
    },
    include: {
      actions: {
        include: {
          actionTemplate: true,
        },
      },
    },
  })

  return NextResponse.json({ template })
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  await prisma.equipmentTemplate.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
```

**Step 3: Commit**

```bash
git add apps/web/app/api/admin/equipment-templates/
git commit -m "feat(admin): add equipment template CRUD APIs"
```

---

### Task 5.2: Create Equipment Templates List Page

**Files:**
- Create: `apps/web/app/admin/equipment-templates/page.tsx`

**Step 1: Create page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface EquipmentTemplate {
  id: string
  key: string
  name: string
  type: string
  slot: string
  subtype: string
  status: string
  actions: Array<{
    actionTemplate: {
      key: string
      name: string
    }
  }>
}

export default function EquipmentTemplatesPage() {
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    setLoading(true)
    const res = await fetch('/api/admin/equipment-templates')
    const data = await res.json()
    setTemplates(data.templates)
    setLoading(false)
  }

  const filteredTemplates = templates.filter(
    (t) =>
      t.key.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="max-w-7xl mx-auto p-8 text-stone-400">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold uppercase tracking-wide text-amber-500">
          Equipment Templates
        </h1>
        <Link
          href="/admin/equipment-templates/new"
          className="px-6 py-3 bg-green-700 text-black font-bold uppercase tracking-wide hover:bg-green-600 transition"
        >
          + Create Equipment
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by key or name..."
          className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
        />
      </div>

      {/* Templates List */}
      <div className="bg-stone-800 border-2 border-stone-700 rounded overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-stone-950 border-b-2 border-stone-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Key</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Type</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Slot</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Subtype</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Actions</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase text-stone-400">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-700">
            {filteredTemplates.map((template) => (
              <tr key={template.id} className="hover:bg-stone-750">
                <td className="px-6 py-4 font-mono text-sm text-cyan-400">{template.key}</td>
                <td className="px-6 py-4 font-bold text-stone-100">{template.name}</td>
                <td className="px-6 py-4 text-stone-300">{template.type}</td>
                <td className="px-6 py-4 text-stone-300">{template.slot}</td>
                <td className="px-6 py-4 text-stone-300">{template.subtype}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                    template.status === 'PUBLISHED' ? 'bg-green-900 text-green-300' :
                    template.status === 'DRAFT' ? 'bg-blue-900 text-blue-300' :
                    'bg-purple-900 text-purple-300'
                  }`}>
                    {template.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-stone-400">
                  {template.actions.length > 0
                    ? template.actions.map(a => a.actionTemplate.key).join(', ')
                    : 'None'}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/equipment-templates/${template.id}`}
                    className="text-amber-500 hover:text-amber-400 font-bold text-sm"
                  >
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add apps/web/app/admin/equipment-templates/page.tsx
git commit -m "feat(admin): add equipment templates list page"
```

---

### Task 5.3: Create Equipment Template Editor Pages

**Files:**
- Create: `apps/web/app/admin/equipment-templates/new/page.tsx`
- Create: `apps/web/app/admin/equipment-templates/[id]/page.tsx`

**Step 1: Create new equipment template page**

Create `apps/web/app/admin/equipment-templates/new/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import JsonEditor from '../../components/JsonEditor'

const TYPE_OPTIONS = ['WEAPON', 'ARMOR', 'CATALYST', 'TRINKET', 'AUGMENT']
const SLOT_OPTIONS = ['MAIN_HAND', 'OFF_HAND', 'HELMET', 'CHEST', 'GAUNTLETS', 'GREAVES']

export default function NewEquipmentTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionTemplates, setActionTemplates] = useState<any[]>([])

  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    type: 'WEAPON',
    slot: 'MAIN_HAND',
    subtype: '',
    tags: [],
    baseStatMods: {},
    scaling: {},
    rarityRules: {},
    ui: {},
    actionTemplateIds: [],
  })

  useEffect(() => {
    fetchActionTemplates()
  }, [])

  async function fetchActionTemplates() {
    const res = await fetch('/api/admin/action-templates')
    const data = await res.json()
    setActionTemplates(data.templates || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/admin/equipment-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create template')
      }

      const { template } = await res.json()
      router.push(`/admin/equipment-templates/${template.id}`)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold uppercase tracking-wide text-amber-500 mb-8">
        Create Equipment Template
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-900 border-2 border-red-600 text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Identity</h2>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">Key *</label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="iron_longsword"
              className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 font-mono focus:border-amber-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Iron Longsword"
              className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A reliable sword for beginners"
              className="w-full h-24 px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Classification */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Classification</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              >
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">Slot *</label>
              <select
                value={formData.slot}
                onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
              >
                {SLOT_OPTIONS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-stone-300 mb-2">Subtype *</label>
              <input
                type="text"
                value={formData.subtype}
                onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
                placeholder="SWORD"
                className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-stone-300 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={(formData.tags as string[]).join(', ')}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(s => s.trim()) })}
              placeholder="starter, melee, slash"
              className="w-full px-4 py-2 bg-stone-900 border-2 border-stone-600 text-stone-100 focus:border-amber-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Granted Actions */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Granted Actions</h2>
          <p className="text-sm text-stone-400">Select actions this equipment grants to the wielder</p>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {actionTemplates.map((action) => (
              <label key={action.id} className="flex items-center space-x-3 p-3 bg-stone-900 hover:bg-stone-850 cursor-pointer rounded">
                <input
                  type="checkbox"
                  checked={(formData.actionTemplateIds as string[]).includes(action.id)}
                  onChange={(e) => {
                    const ids = formData.actionTemplateIds as string[]
                    if (e.target.checked) {
                      setFormData({ ...formData, actionTemplateIds: [...ids, action.id] })
                    } else {
                      setFormData({ ...formData, actionTemplateIds: ids.filter(id => id !== action.id) })
                    }
                  }}
                  className="w-5 h-5"
                />
                <div className="flex-1">
                  <div className="text-stone-100 font-bold">{action.name}</div>
                  <div className="text-xs text-stone-400 font-mono">{action.key}</div>
                </div>
                <div className="text-xs text-stone-500">{action.category}</div>
              </label>
            ))}
          </div>
        </div>

        {/* JSON Configs */}
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded space-y-4">
          <h2 className="text-xl font-bold uppercase text-stone-200">Stats & Modifiers (JSON)</h2>

          <JsonEditor
            label="Base Stat Mods"
            value={formData.baseStatMods}
            onChange={(val) => setFormData({ ...formData, baseStatMods: val })}
            insertSkeleton={() => ({
              str: 5,
              dex: 2,
              def: 0,
            })}
            helperText="Flat stat bonuses (e.g. {str: 5, def: 3})"
          />

          <JsonEditor
            label="Scaling"
            value={formData.scaling}
            onChange={(val) => setFormData({ ...formData, scaling: val })}
            insertSkeleton={() => ({
              str: 0.7,
              dex: 0.3,
            })}
            helperText="Stat scaling ratios for damage/effects"
          />

          <JsonEditor
            label="Rarity Rules"
            value={formData.rarityRules}
            onChange={(val) => setFormData({ ...formData, rarityRules: val })}
            insertSkeleton={() => ({
              allowedRarities: ['COMMON', 'RARE'],
            })}
            helperText="(Optional) Loot/crafting rarity config"
          />

          <JsonEditor
            label="UI Metadata"
            value={formData.ui}
            onChange={(val) => setFormData({ ...formData, ui: val })}
            insertSkeleton={() => ({
              iconKey: 'sword_iron',
              spriteKey: 'itm_sword_iron',
            })}
            helperText="Icon keys, sprite paths, etc."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-green-700 text-black font-bold uppercase tracking-wide hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Creating...' : 'Create Template'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-3 bg-stone-700 text-stone-200 font-bold uppercase tracking-wide hover:bg-stone-600 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 2: Create edit equipment template page (similar structure, with status field and delete button)**

Create `apps/web/app/admin/equipment-templates/[id]/page.tsx` - follows same pattern as action template edit page but with equipment-specific fields (type, slot, subtype, action multi-select). Code omitted for brevity - follow action template edit pattern.

**Step 3: Commit**

```bash
git add apps/web/app/admin/equipment-templates/
git commit -m "feat(admin): add equipment template editor pages"
```

---

## Phase 6: Bundle Validation & Publishing

### Task 6.1: Create Validation Engine

**Files:**
- Create: `apps/web/lib/admin/validator.ts`

**Step 1: Create validation engine**

```typescript
interface ValidationError {
  entityType: 'equipment' | 'action'
  key: string
  field?: string
  message: string
  severity: 'error' | 'warning'
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export async function validateBundle(
  bundleId: string,
  prisma: any
): Promise<ValidationResult> {
  const errors: ValidationError[] = []

  // Fetch all templates in bundle
  const [equipmentTemplates, actionTemplates] = await Promise.all([
    prisma.equipmentTemplate.findMany({
      where: { bundleId },
      include: {
        actions: {
          include: {
            actionTemplate: true,
          },
        },
      },
    }),
    prisma.actionTemplate.findMany({
      where: { bundleId },
    }),
  ])

  // Validate action templates
  const actionKeys = new Set<string>()
  for (const action of actionTemplates) {
    // Unique key check
    if (actionKeys.has(action.key)) {
      errors.push({
        entityType: 'action',
        key: action.key,
        message: 'Duplicate key in bundle',
        severity: 'error',
      })
    }
    actionKeys.add(action.key)

    // Required fields
    if (!action.name || !action.category) {
      errors.push({
        entityType: 'action',
        key: action.key,
        message: 'Missing required fields (name or category)',
        severity: 'error',
      })
    }

    // Validate cooldown/costs
    if (action.cooldownMs < 0) {
      errors.push({
        entityType: 'action',
        key: action.key,
        field: 'cooldownMs',
        message: 'Cooldown cannot be negative',
        severity: 'error',
      })
    }

    if (action.staminaCost < 0 || action.manaCost < 0) {
      errors.push({
        entityType: 'action',
        key: action.key,
        field: 'staminaCost/manaCost',
        message: 'Costs cannot be negative',
        severity: 'error',
      })
    }

    // Validate JSON configs are valid JSON
    try {
      JSON.stringify(action.hitboxConfig)
      JSON.stringify(action.projectileConfig)
      JSON.stringify(action.damageConfig)
      JSON.stringify(action.effectConfig)
    } catch (err) {
      errors.push({
        entityType: 'action',
        key: action.key,
        message: 'Invalid JSON in config fields',
        severity: 'error',
      })
    }
  }

  // Validate equipment templates
  const equipKeys = new Set<string>()
  const actionIdMap = new Map(actionTemplates.map(a => [a.id, a.key]))

  for (const equip of equipmentTemplates) {
    // Unique key check
    if (equipKeys.has(equip.key)) {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        message: 'Duplicate key in bundle',
        severity: 'error',
      })
    }
    equipKeys.add(equip.key)

    // Required fields
    if (!equip.name || !equip.type || !equip.slot || !equip.subtype) {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        message: 'Missing required fields (name/type/slot/subtype)',
        severity: 'error',
      })
    }

    // Validate JSON configs
    try {
      JSON.stringify(equip.baseStatMods)
      JSON.stringify(equip.scaling)
      JSON.stringify(equip.rarityRules)
      JSON.stringify(equip.ui)
    } catch (err) {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        message: 'Invalid JSON in config fields',
        severity: 'error',
      })
    }

    // Validate slot/type coherence
    if (equip.type === 'ARMOR' && !['HELMET', 'CHEST', 'GAUNTLETS', 'GREAVES'].includes(equip.slot)) {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        field: 'slot',
        message: 'ARMOR type must use HELMET/CHEST/GAUNTLETS/GREAVES slots',
        severity: 'error',
      })
    }

    if (equip.type === 'WEAPON' && !['MAIN_HAND', 'OFF_HAND'].includes(equip.slot)) {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        field: 'slot',
        message: 'WEAPON type typically uses MAIN_HAND or OFF_HAND',
        severity: 'warning',
      })
    }

    // Validate action references
    if (equip.type === 'WEAPON' && equip.actions.length === 0) {
      errors.push({
        entityType: 'equipment',
        key: equip.key,
        field: 'actions',
        message: 'WEAPON should grant at least one action',
        severity: 'warning',
      })
    }

    // Check all action references exist in bundle
    for (const ea of equip.actions) {
      if (!actionIdMap.has(ea.actionTemplateId)) {
        errors.push({
          entityType: 'equipment',
          key: equip.key,
          field: 'actions',
          message: `References action ID ${ea.actionTemplateId} not in bundle`,
          severity: 'error',
        })
      }
    }
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/lib/admin/validator.ts
git commit -m "feat(admin): add bundle validation engine"
```

---

### Task 6.2: Create Validation & Publish API Routes

**Files:**
- Create: `apps/web/app/api/admin/bundles/[id]/validate/route.ts`
- Create: `apps/web/app/api/admin/bundles/[id]/publish/route.ts`
- Create: `apps/web/app/api/admin/bundles/[id]/activate/route.ts`

**Step 1: Create validate endpoint**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'
import { validateBundle } from '@/lib/admin/validator'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const result = await validateBundle(params.id, prisma)

  return NextResponse.json(result)
}
```

**Step 2: Create publish endpoint**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'
import { validateBundle } from '@/lib/admin/validator'
import { exportBundleToStorage } from '@/lib/admin/exporter'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Step 1: Validate
  const validation = await validateBundle(params.id, prisma)
  if (!validation.valid) {
    return NextResponse.json({
      error: 'Validation failed',
      errors: validation.errors,
    }, { status: 400 })
  }

  // Step 2: Mark all templates in bundle as PUBLISHED
  await prisma.equipmentTemplate.updateMany({
    where: { bundleId: params.id },
    data: { status: 'PUBLISHED' },
  })

  await prisma.actionTemplate.updateMany({
    where: { bundleId: params.id },
    data: { status: 'PUBLISHED' },
  })

  // Step 3: Mark bundle as PUBLISHED
  const bundle = await prisma.gameDataBundle.update({
    where: { id: params.id },
    data: { status: 'PUBLISHED' },
  })

  // Step 4: Export to storage
  const exportPath = await exportBundleToStorage(params.id, prisma)

  // Step 5: Update bundle with export target
  await prisma.gameDataBundle.update({
    where: { id: params.id },
    data: { exportTarget: exportPath },
  })

  return NextResponse.json({ success: true, bundle, exportPath })
}
```

**Step 3: Create activate endpoint (rollback support)**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@gladiator/database/src/client'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check bundle is published
  const bundle = await prisma.gameDataBundle.findUnique({
    where: { id: params.id },
  })

  if (!bundle || bundle.status !== 'PUBLISHED') {
    return NextResponse.json({
      error: 'Bundle must be PUBLISHED to activate',
    }, { status: 400 })
  }

  // Deactivate all other bundles
  await prisma.gameDataBundle.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  })

  // Activate this bundle
  await prisma.gameDataBundle.update({
    where: { id: params.id },
    data: { isActive: true },
  })

  return NextResponse.json({ success: true })
}
```

**Step 4: Commit**

```bash
git add apps/web/app/api/admin/bundles/[id]/
git commit -m "feat(admin): add bundle validate/publish/activate APIs"
```

---

## Phase 7: Export to Supabase Storage

### Task 7.1: Create Exporter Utility

**Files:**
- Create: `apps/web/lib/admin/exporter.ts`

**Step 1: Install Supabase client if needed**

```bash
cd apps/web
pnpm add @supabase/supabase-js
```

**Step 2: Create exporter**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations
)

interface ExportManifest {
  bundleLabel: string
  publishedAt: string
  equipmentCount: number
  actionCount: number
  files: string[]
}

export async function exportBundleToStorage(
  bundleId: string,
  prisma: any
): Promise<string> {
  // Fetch bundle
  const bundle = await prisma.gameDataBundle.findUnique({
    where: { id: bundleId },
    include: {
      equipmentTemplates: {
        include: {
          actions: {
            include: {
              actionTemplate: {
                select: { key: true },
              },
            },
          },
        },
      },
      actionTemplates: true,
    },
  })

  if (!bundle) {
    throw new Error('Bundle not found')
  }

  const basePath = `bundles/${bundle.label}`

  // Transform equipment templates for export
  const equipmentData = bundle.equipmentTemplates.map((et: any) => ({
    key: et.key,
    name: et.name,
    description: et.description,
    type: et.type,
    slot: et.slot,
    subtype: et.subtype,
    tags: et.tags,
    baseStatMods: et.baseStatMods,
    scaling: et.scaling,
    rarityRules: et.rarityRules,
    ui: et.ui,
    grantedActions: et.actions.map((a: any) => a.actionTemplate.key),
  }))

  // Transform action templates for export
  const actionData = bundle.actionTemplates.map((at: any) => ({
    key: at.key,
    name: at.name,
    description: at.description,
    category: at.category,
    cooldownMs: at.cooldownMs,
    castTimeMs: at.castTimeMs,
    staminaCost: at.staminaCost,
    manaCost: at.manaCost,
    hitboxConfig: at.hitboxConfig,
    projectileConfig: at.projectileConfig,
    damageConfig: at.damageConfig,
    effectConfig: at.effectConfig,
  }))

  // Sort by key for determinism
  equipmentData.sort((a: any, b: any) => a.key.localeCompare(b.key))
  actionData.sort((a: any, b: any) => a.key.localeCompare(b.key))

  // Create manifest
  const manifest: ExportManifest = {
    bundleLabel: bundle.label,
    publishedAt: new Date().toISOString(),
    equipmentCount: equipmentData.length,
    actionCount: actionData.length,
    files: [
      `${basePath}/equipment.templates.json`,
      `${basePath}/actions.templates.json`,
      `${basePath}/manifest.json`,
    ],
  }

  // Upload files
  await Promise.all([
    supabase.storage
      .from('gamedata')
      .upload(`${basePath}/equipment.templates.json`, JSON.stringify(equipmentData, null, 2), {
        contentType: 'application/json',
        upsert: true,
      }),
    supabase.storage
      .from('gamedata')
      .upload(`${basePath}/actions.templates.json`, JSON.stringify(actionData, null, 2), {
        contentType: 'application/json',
        upsert: true,
      }),
    supabase.storage
      .from('gamedata')
      .upload(`${basePath}/manifest.json`, JSON.stringify(manifest, null, 2), {
        contentType: 'application/json',
        upsert: true,
      }),
  ])

  return basePath
}
```

**Step 3: Create storage bucket**

Manually create `gamedata` bucket in Supabase dashboard:
- Name: `gamedata`
- Public: No (game server will use service role key)
- File size limit: Default

**Step 4: Commit**

```bash
git add apps/web/lib/admin/exporter.ts
git commit -m "feat(admin): add Supabase Storage exporter"
```

---

## Phase 8: Runtime Loader (Game Server)

### Task 8.1: Create Bundle Loader Service

**Files:**
- Create: `apps/game-server/src/services/bundle-loader.ts`

**Step 1: Install Supabase client for game server**

```bash
cd apps/game-server
pnpm add @supabase/supabase-js
```

**Step 2: Create bundle loader**

```typescript
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@gladiator/database/src/client'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface EquipmentTemplate {
  key: string
  name: string
  description: string | null
  type: string
  slot: string
  subtype: string
  tags: string[]
  baseStatMods: Record<string, any>
  scaling: Record<string, any>
  rarityRules: Record<string, any>
  ui: Record<string, any>
  grantedActions: string[]
}

interface ActionTemplate {
  key: string
  name: string
  description: string | null
  category: string
  cooldownMs: number
  castTimeMs: number
  staminaCost: number
  manaCost: number
  hitboxConfig: Record<string, any>
  projectileConfig: Record<string, any>
  damageConfig: Record<string, any>
  effectConfig: Record<string, any>
}

class BundleLoader {
  private equipmentTemplates: Map<string, EquipmentTemplate> = new Map()
  private actionTemplates: Map<string, ActionTemplate> = new Map()
  private loaded: boolean = false

  async load() {
    console.log('[BundleLoader] Loading active game data bundle...')

    // Fetch active bundle from DB
    const activeBundle = await prisma.gameDataBundle.findFirst({
      where: { isActive: true },
    })

    if (!activeBundle) {
      throw new Error('No active game data bundle found')
    }

    if (!activeBundle.exportTarget) {
      throw new Error('Active bundle has no export target')
    }

    console.log(`[BundleLoader] Active bundle: ${activeBundle.label}`)

    const basePath = activeBundle.exportTarget

    // Download JSON files from Supabase Storage
    const [equipmentRes, actionsRes] = await Promise.all([
      supabase.storage.from('gamedata').download(`${basePath}/equipment.templates.json`),
      supabase.storage.from('gamedata').download(`${basePath}/actions.templates.json`),
    ])

    if (equipmentRes.error) {
      throw new Error(`Failed to load equipment templates: ${equipmentRes.error.message}`)
    }

    if (actionsRes.error) {
      throw new Error(`Failed to load action templates: ${actionsRes.error.message}`)
    }

    // Parse JSON
    const equipmentData: EquipmentTemplate[] = JSON.parse(await equipmentRes.data.text())
    const actionData: ActionTemplate[] = JSON.parse(await actionsRes.data.text())

    // Cache in memory
    this.equipmentTemplates.clear()
    this.actionTemplates.clear()

    for (const equip of equipmentData) {
      this.equipmentTemplates.set(equip.key, equip)
    }

    for (const action of actionData) {
      this.actionTemplates.set(action.key, action)
    }

    this.loaded = true

    console.log(`[BundleLoader] Loaded ${this.equipmentTemplates.size} equipment templates`)
    console.log(`[BundleLoader] Loaded ${this.actionTemplates.size} action templates`)
  }

  getEquipmentTemplate(key: string): EquipmentTemplate | undefined {
    if (!this.loaded) {
      throw new Error('BundleLoader not initialized. Call load() first.')
    }
    return this.equipmentTemplates.get(key)
  }

  getActionTemplate(key: string): ActionTemplate | undefined {
    if (!this.loaded) {
      throw new Error('BundleLoader not initialized. Call load() first.')
    }
    return this.actionTemplates.get(key)
  }

  getAllEquipmentTemplates(): EquipmentTemplate[] {
    if (!this.loaded) {
      throw new Error('BundleLoader not initialized. Call load() first.')
    }
    return Array.from(this.equipmentTemplates.values())
  }

  getAllActionTemplates(): ActionTemplate[] {
    if (!this.loaded) {
      throw new Error('BundleLoader not initialized. Call load() first.')
    }
    return Array.from(this.actionTemplates.values())
  }
}

export const bundleLoader = new BundleLoader()
```

**Step 3: Initialize loader on server startup**

Modify `apps/game-server/src/server.ts`:

```typescript
import { bundleLoader } from './services/bundle-loader'

// ... existing imports

async function startServer() {
  // Load game data bundle
  try {
    await bundleLoader.load()
  } catch (error) {
    console.error('[Server] Failed to load game data bundle:', error)
    process.exit(1)
  }

  // ... rest of server startup
}

startServer()
```

**Step 4: Commit**

```bash
git add apps/game-server/src/services/bundle-loader.ts apps/game-server/src/server.ts
git commit -m "feat(game-server): add bundle loader for runtime data"
```

---

## Phase 9: Bundle Detail Page & Validation UI

### Task 9.1: Create Bundle Detail Page

**Files:**
- Create: `apps/web/app/admin/bundles/[id]/page.tsx`

**Step 1: Create bundle detail page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface ValidationError {
  entityType: string
  key: string
  field?: string
  message: string
  severity: string
}

export default function BundleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [bundle, setBundle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [activating, setActivating] = useState(false)
  const [validation, setValidation] = useState<{ valid: boolean; errors: ValidationError[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBundle()
  }, [params.id])

  async function fetchBundle() {
    setLoading(true)
    const res = await fetch(`/api/admin/bundles`)
    const data = await res.json()
    const found = data.bundles.find((b: any) => b.id === params.id)
    setBundle(found)
    setLoading(false)
  }

  async function handleValidate() {
    setValidating(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/bundles/${params.id}/validate`, {
        method: 'POST',
      })
      const data = await res.json()
      setValidation(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setValidating(false)
    }
  }

  async function handlePublish() {
    if (!confirm('Publish this bundle? All templates will be marked PUBLISHED and exported.')) return

    setPublishing(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/bundles/${params.id}/publish`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to publish')
      }

      await fetchBundle()
      setValidation(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  async function handleActivate() {
    if (!confirm('Activate this bundle? It will become the active runtime bundle.')) return

    setActivating(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/bundles/${params.id}/activate`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to activate')
      }

      await fetchBundle()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActivating(false)
    }
  }

  if (loading || !bundle) {
    return <div className="max-w-7xl mx-auto p-8 text-stone-400">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-wide text-amber-500">
            {bundle.label}
          </h1>
          <div className="mt-2 flex items-center gap-4">
            <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
              bundle.status === 'PUBLISHED' ? 'bg-green-900 text-green-300' :
              bundle.status === 'DRAFT' ? 'bg-blue-900 text-blue-300' :
              'bg-purple-900 text-purple-300'
            }`}>
              {bundle.status}
            </span>
            {bundle.isActive && (
              <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-amber-900 text-amber-300">
                ✓ Active
              </span>
            )}
          </div>
        </div>
        <Link
          href="/admin/bundles"
          className="text-stone-400 hover:text-stone-200 font-bold uppercase text-sm"
        >
          ← Back to Bundles
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900 border-2 border-red-600 text-red-200">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={handleValidate}
          disabled={validating}
          className="px-6 py-3 bg-cyan-700 text-black font-bold uppercase tracking-wide hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {validating ? 'Validating...' : 'Validate Bundle'}
        </button>

        {bundle.status === 'DRAFT' && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-6 py-3 bg-amber-700 text-black font-bold uppercase tracking-wide hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {publishing ? 'Publishing...' : 'Publish Bundle'}
          </button>
        )}

        {bundle.status === 'PUBLISHED' && !bundle.isActive && (
          <button
            onClick={handleActivate}
            disabled={activating}
            className="px-6 py-3 bg-green-700 text-black font-bold uppercase tracking-wide hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {activating ? 'Activating...' : 'Activate Bundle'}
          </button>
        )}
      </div>

      {/* Validation Results */}
      {validation && (
        <div className={`mb-8 p-6 border-2 rounded ${
          validation.valid
            ? 'bg-green-950 border-green-600'
            : 'bg-red-950 border-red-600'
        }`}>
          <h2 className="text-2xl font-bold uppercase mb-4">
            {validation.valid ? '✓ Validation Passed' : '✗ Validation Failed'}
          </h2>

          {validation.errors.length > 0 && (
            <div className="space-y-2">
              {validation.errors.map((err, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded ${
                    err.severity === 'error'
                      ? 'bg-red-900 text-red-200'
                      : 'bg-yellow-900 text-yellow-200'
                  }`}
                >
                  <div className="font-bold">
                    {err.entityType.toUpperCase()}: {err.key}
                    {err.field && ` (${err.field})`}
                  </div>
                  <div className="text-sm">{err.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Templates Summary */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded">
          <h2 className="text-2xl font-bold uppercase text-amber-500 mb-4">Equipment Templates</h2>
          <div className="text-3xl font-bold text-stone-100 mb-4">
            {bundle._count.equipmentTemplates}
          </div>
          <Link
            href={`/admin/equipment-templates?bundleId=${bundle.id}`}
            className="inline-block px-4 py-2 bg-stone-700 text-stone-200 font-bold uppercase text-sm hover:bg-stone-600 transition"
          >
            View Equipment →
          </Link>
        </div>

        <div className="p-6 bg-stone-800 border-2 border-stone-700 rounded">
          <h2 className="text-2xl font-bold uppercase text-amber-500 mb-4">Action Templates</h2>
          <div className="text-3xl font-bold text-stone-100 mb-4">
            {bundle._count.actionTemplates}
          </div>
          <Link
            href={`/admin/action-templates?bundleId=${bundle.id}`}
            className="inline-block px-4 py-2 bg-stone-700 text-stone-200 font-bold uppercase text-sm hover:bg-stone-600 transition"
          >
            View Actions →
          </Link>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add apps/web/app/admin/bundles/[id]/page.tsx
git commit -m "feat(admin): add bundle detail page with validation UI"
```

---

## Phase 10: Seed Data & Final Testing

### Task 10.1: Create Seed Script for Demo Bundle

**Files:**
- Create: `packages/database/prisma/seed-admin.ts`

**Step 1: Create seed script**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo game data bundle...')

  // Create demo bundle
  const bundle = await prisma.gameDataBundle.create({
    data: {
      label: 'demo-v0.1',
      status: 'DRAFT',
      isActive: false,
    },
  })

  console.log(`Created bundle: ${bundle.label}`)

  // Create action templates
  const swordSlash = await prisma.actionTemplate.create({
    data: {
      key: 'atk_sword_slash',
      name: 'Sword Slash',
      description: 'A quick horizontal slash',
      category: 'WEAPON_ATTACK',
      cooldownMs: 800,
      staminaCost: 15,
      hitboxConfig: {
        shape: 'ARC',
        radius: 80,
        angleDeg: 90,
      },
      damageConfig: {
        base: 15,
        type: 'PHYSICAL',
        scaling: { str: 0.7, dex: 0.3 },
      },
      bundleId: bundle.id,
    },
  })

  const dodgeRoll = await prisma.actionTemplate.create({
    data: {
      key: 'mob_dodge_roll',
      name: 'Dodge Roll',
      description: 'Roll forward with invulnerability frames',
      category: 'MOBILITY',
      cooldownMs: 1000,
      staminaCost: 20,
      effectConfig: {
        iFramesMs: 200,
        distance: 100,
        durationMs: 300,
      },
      bundleId: bundle.id,
    },
  })

  console.log(`Created ${2} action templates`)

  // Create equipment templates
  const ironSword = await prisma.equipmentTemplate.create({
    data: {
      key: 'iron_longsword',
      name: 'Iron Longsword',
      description: 'A reliable sword for beginners',
      type: 'WEAPON',
      slot: 'MAIN_HAND',
      subtype: 'SWORD',
      tags: ['starter', 'melee', 'slash'],
      baseStatMods: {
        str: 5,
        dex: 2,
      },
      scaling: {
        str: 0.7,
        dex: 0.3,
      },
      ui: {
        iconKey: 'sword_iron',
      },
      bundleId: bundle.id,
      actions: {
        create: [
          { actionTemplateId: swordSlash.id },
        ],
      },
    },
  })

  const leatherArmor = await prisma.equipmentTemplate.create({
    data: {
      key: 'leather_chest',
      name: 'Leather Armor',
      description: 'Light chest protection',
      type: 'ARMOR',
      slot: 'CHEST',
      subtype: 'LIGHT',
      tags: ['starter', 'light'],
      baseStatMods: {
        def: 3,
      },
      ui: {
        iconKey: 'armor_leather',
      },
      bundleId: bundle.id,
    },
  })

  console.log(`Created ${2} equipment templates`)

  console.log('✅ Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**Step 2: Add seed script to package.json**

Add to `packages/database/package.json`:

```json
{
  "scripts": {
    "seed:admin": "tsx prisma/seed-admin.ts"
  }
}
```

**Step 3: Run seed**

```bash
cd packages/database
pnpm seed:admin
```

**Step 4: Commit**

```bash
git add packages/database/prisma/seed-admin.ts packages/database/package.json
git commit -m "feat(admin): add demo bundle seed data"
```

---

## Summary & Verification

### Sprint 2.5 Complete Checklist

**Phase 1: Database & Auth**
- [x] Migration adds isAdmin to User
- [x] Auth session includes isAdmin
- [x] Middleware protects /admin routes

**Phase 2: Admin Layout**
- [x] Admin navigation component
- [x] Admin layout with auth check
- [x] Redesigned dashboard with design system

**Phase 3: Bundle Management**
- [x] Bundle list API
- [x] Bundle create API (clone-from-active)
- [x] Bundles list page

**Phase 4: Action Templates**
- [x] Action template CRUD APIs
- [x] Action templates list page
- [x] Action template editor (new/edit)
- [x] JSON editor component with skeletons

**Phase 5: Equipment Templates**
- [x] Equipment template CRUD APIs
- [x] Equipment templates list page
- [x] Equipment template editor (new/edit)
- [x] Action multi-select in equipment editor

**Phase 6: Validation & Publishing**
- [x] Validation engine
- [x] Validate API endpoint
- [x] Publish API endpoint (validate + mark published + export)
- [x] Activate API endpoint (rollback support)

**Phase 7: Export**
- [x] Exporter utility (Supabase Storage)
- [x] Storage bucket created (gamedata)
- [x] Deterministic JSON export with manifest

**Phase 8: Runtime Loader**
- [x] Bundle loader service (game-server)
- [x] Load on server startup
- [x] In-memory cache for templates

**Phase 9: Bundle Detail**
- [x] Bundle detail page
- [x] Validation UI with error display
- [x] Publish/Activate buttons

**Phase 10: Seed Data**
- [x] Demo bundle seed script
- [x] Starter templates (sword, dodge, armor)

### Manual Testing Steps

**1. Admin Access**
- Log in as admin user (isAdmin = true in DB)
- Verify /admin routes accessible
- Log in as non-admin → verify redirect to unauthorized

**2. Bundle Workflow**
- Create new bundle (should clone from active if one exists)
- Navigate to bundle detail page
- Click "Validate Bundle" → should show validation results

**3. Action Template CRUD**
- Create new action template
- Use JSON skeleton inserts
- Edit action template
- Verify appears in list

**4. Equipment Template CRUD**
- Create new equipment template
- Select granted actions (multi-select)
- Use JSON skeleton inserts
- Edit equipment template
- Verify appears in list

**5. Publish & Activate**
- Create bundle, add templates
- Validate bundle → fix errors if any
- Publish bundle → verify templates marked PUBLISHED
- Check Supabase Storage for exported JSON files
- Activate bundle → verify isActive flag
- Restart game server → verify bundle loads from storage

**6. Rollback**
- Create second bundle, publish, activate
- Go to first bundle, click "Activate"
- Verify first bundle becomes active
- Restart game server → verify loads first bundle

### Environment Variables Needed

Add to `apps/web/.env`:
```
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Add to `apps/game-server/.env`:
```
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

---

## Next Steps After Sprint 2.5

Once Sprint 2.5 is complete:
1. Sprint 3 (Frontend Real-Time Combat UI) can proceed
2. Game server can use `bundleLoader.getEquipmentTemplate()` and `bundleLoader.getActionTemplate()` for runtime combat
3. Future sprints can add more template types (SpellTemplate, PerkTemplate, etc.)

---

**End of Sprint 2.5 Plan**
