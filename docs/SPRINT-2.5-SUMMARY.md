# Sprint 2.5 Summary: Admin UI for Game Data Management

**Status:** ✅ Complete
**Duration:** Sprint 2.5
**Goal:** Build admin UI for authoring, validating, and publishing game data bundles

---

## Overview

Sprint 2.5 implemented a comprehensive admin UI system for managing game data templates (equipment and actions) through a bundle-based workflow. The system enables content authors to create, validate, publish, and activate bundles that get exported to Supabase Storage and loaded by the game server at runtime. This separates content authoring from deployment and enables version-controlled game data releases.

---

## What Was Built

### 1. Database Schema & Auth Extensions ✅

**Files Modified:**
- `packages/database/prisma/schema.prisma` - Added `isAdmin` field to User model

**Changes:**
- Added `isAdmin Boolean @default(false)` to User model for admin access control
- Schema pushed to database via `pnpm db:push`

**Auth Integration:**
- `apps/web/types/next-auth.d.ts` - Extended NextAuth Session/User interfaces with `isAdmin`
- `apps/web/lib/auth.ts` - Updated session callback to fetch and include `isAdmin` from database
- `apps/web/middleware.ts` - Created middleware to protect `/admin/*` routes, redirects non-admins to `/admin/unauthorized`
- `apps/web/app/admin/unauthorized/page.tsx` - Unauthorized access page

---

### 2. Admin Layout & Navigation ✅

**Files Created:**
- `apps/web/app/admin/components/AdminNav.tsx` - Navigation bar with Dashboard, Bundles, Equipment Templates, Action Templates tabs
- `apps/web/app/admin/layout.tsx` - Admin layout wrapper with server-side auth check and AdminNav component

**Files Modified:**
- `apps/web/app/admin/page.tsx` - Redesigned dashboard with stats cards (users, gladiators, matches, bundles, templates), active bundle display, recent gladiators table

**Design System:**
- Stone/Amber color palette (battle-console aesthetic)
- Uppercase headings with tracking-wide
- Dark theme (bg-stone-900/800, border-stone-700)
- Consistent button styles with hover states

---

### 3. Bundle Management System ✅

**API Routes Created:**
- `apps/web/app/api/admin/bundles/route.ts`
  - **GET:** List all bundles with template counts (`_count.equipmentTemplates`, `_count.actionTemplates`)
  - **POST:** Create new bundle by cloning from active bundle
    - Clones action templates first (no dependencies)
    - Then clones equipment templates with remapped action references via `actionTemplateMap`
    - Preserves all template data and relationships

- `apps/web/app/api/admin/bundles/[id]/validate/route.ts`
  - **POST:** Validate bundle using validation engine

- `apps/web/app/api/admin/bundles/[id]/publish/route.ts`
  - **POST:** Validate → Mark templates PUBLISHED → Export to Supabase Storage → Update bundle with `exportTarget`

- `apps/web/app/api/admin/bundles/[id]/activate/route.ts`
  - **POST:** Deactivate all other bundles → Activate target bundle (requires PUBLISHED status)

**UI Pages Created:**
- `apps/web/app/admin/bundles/page.tsx` - Bundles list with create form, shows label, status, active flag, template counts
- `apps/web/app/admin/bundles/[id]/page.tsx` - Bundle detail page with:
  - Bundle info display (status, active, counts, export target)
  - Validate/Publish/Activate action buttons
  - Validation results UI showing errors/warnings with severity classification

---

### 4. Action Templates CRUD ✅

**API Routes Created:**
- `apps/web/app/api/admin/action-templates/route.ts`
  - **GET:** List action templates with optional `bundleId` filter
  - **POST:** Create action template with key uniqueness check within bundle

- `apps/web/app/api/admin/action-templates/[id]/route.ts`
  - **GET:** Fetch single action template
  - **PUT:** Update action template
  - **DELETE:** Delete action template

**UI Pages Created:**
- `apps/web/app/admin/action-templates/page.tsx` - List page with search by key/name, shows category, cooldown, costs, status badges
- `apps/web/app/admin/action-templates/new/page.tsx` - Create page with form sections:
  - Identity: key (snake_case), name, description, category
  - Timing & Costs: cooldown, cast time, stamina/mana costs
  - JSON Configs: hitbox, projectile, damage, effect (using JsonEditor component)
- `apps/web/app/admin/action-templates/[id]/page.tsx` - Edit page with delete button, key is read-only, status dropdown

**Components Created:**
- `apps/web/app/admin/components/JsonEditor.tsx` - Reusable JSON editor with:
  - Skeleton insertion buttons for common configs
  - Real-time validation with error display
  - Textarea with monospace font and syntax error feedback

---

### 5. Equipment Templates CRUD ✅

**API Routes Created:**
- `apps/web/app/api/admin/equipment-templates/route.ts`
  - **GET:** List equipment templates with action template includes
  - **POST:** Create equipment with action associations via `EquipmentTemplateAction` junction table

- `apps/web/app/api/admin/equipment-templates/[id]/route.ts`
  - **GET:** Fetch single equipment template with actions
  - **PUT:** Update equipment, deletes existing action connections before recreating
  - **DELETE:** Delete equipment template

**UI Pages Created:**
- `apps/web/app/admin/equipment-templates/page.tsx` - List page with search, shows type, slot, subtype, associated action keys
- `apps/web/app/admin/equipment-templates/new/page.tsx` - Create page with:
  - Type/Slot/Subtype dropdowns (WEAPON/ARMOR/CATALYST/TRINKET/AUGMENT)
  - Tags array input
  - Checkbox list for granted actions
  - JsonEditor for baseStatMods, scaling, rarityRules, ui configs
- `apps/web/app/admin/equipment-templates/[id]/page.tsx` - Edit page with action checkboxes, fetches action templates on mount

---

### 6. Validation Engine ✅

**Files Created:**
- `apps/web/lib/admin/validator.ts` - Comprehensive validation engine

**Validation Rules:**
- **Duplicate key checks** across equipment and action templates within bundle
- **Required field validation** (key, name, type, slot for equipment; key, name, category for actions)
- **Numeric range checks** (negative cooldowns, costs, cast times)
- **JSON validity** for all config fields (hitboxConfig, damageConfig, baseStatMods, scaling, etc.)
- **Slot/Type coherence** (WEAPON must use weapon slots, ARMOR must use armor slots)
- **Action reference validation** (granted actions must exist in bundle)
- **Severity classification** (error vs warning)

**Validation Result Interface:**
```typescript
interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

interface ValidationError {
  entityType: string  // 'equipment' | 'action'
  key: string         // Template key
  field?: string      // Specific field with error
  message: string     // Human-readable error
  severity: string    // 'error' | 'warning'
}
```

---

### 7. Export & Publishing Workflow ✅

**Files Created:**
- `apps/web/lib/admin/exporter.ts` - Export utility for Supabase Storage

**Export Process:**
1. Fetch bundle with all templates and relationships
2. Transform equipment templates to runtime format:
   - Include all template fields (key, name, type, slot, subtype, tags, baseStatMods, scaling, rarityRules, ui)
   - Map `grantedActions` from action IDs → action keys
3. Transform action templates to runtime format (key, name, category, cooldown, costs, configs)
4. Sort by key for determinism
5. Upload to Supabase Storage `gamedata` bucket:
   - `bundles/{label}/equipment.templates.json`
   - `bundles/{label}/actions.templates.json`
   - `bundles/{label}/manifest.json`
6. Return `basePath` (e.g., `bundles/demo-v0.1`)

**Manifest Structure:**
```typescript
interface ExportManifest {
  bundleLabel: string
  publishedAt: string
  equipmentCount: number
  actionCount: number
  files: string[]
}
```

**Publish Workflow (apps/web/app/api/admin/bundles/[id]/publish/route.ts):**
1. Validate bundle (must pass validation)
2. Mark all equipment templates as PUBLISHED
3. Mark all action templates as PUBLISHED
4. Mark bundle as PUBLISHED
5. Export to Supabase Storage
6. Update bundle with `exportTarget` path

---

### 8. Runtime Bundle Loader (Game Server) ✅

**Files Created:**
- `apps/game-server/src/services/bundle-loader.ts` - Singleton class for loading published bundles

**Features:**
- Fetches active bundle from database on startup
- Downloads JSON files from Supabase Storage using `exportTarget` path
- Caches templates in memory using Map for O(1) lookups
- Provides getter methods:
  - `getEquipmentTemplate(key): EquipmentTemplate | undefined`
  - `getActionTemplate(key): ActionTemplate | undefined`
  - `getAllEquipmentTemplates(): EquipmentTemplate[]`
  - `getAllActionTemplates(): ActionTemplate[]`
- Throws errors if not initialized (must call `load()` first)

**Template Interfaces:**
```typescript
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
  grantedActions: string[]  // Action keys
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
```

**Usage Pattern:**
```typescript
import { bundleLoader } from './services/bundle-loader'

// On server startup
await bundleLoader.load()

// In combat system
const swordTemplate = bundleLoader.getEquipmentTemplate('iron_longsword')
const slashAction = bundleLoader.getActionTemplate('atk_sword_slash')
```

---

### 9. Seed Data for Demo Bundle ✅

**Files Created:**
- `packages/database/prisma/seed-admin.ts` - Seed script for demo bundle

**Files Modified:**
- `packages/database/package.json` - Added `seed:admin` script

**Seed Data Created:**
- **Bundle:** `demo-v0.1` (DRAFT, not active)
- **Action Templates:**
  - `atk_sword_slash` - Sword Slash (WEAPON_ATTACK, 800ms cooldown, 15 stamina, ARC hitbox 80 radius/90°, physical damage with STR/DEX scaling)
  - `mob_dodge_roll` - Dodge Roll (MOBILITY, 1000ms cooldown, 20 stamina, 200ms i-frames, 100 distance)
- **Equipment Templates:**
  - `iron_longsword` - Iron Longsword (WEAPON/MAIN_HAND/SWORD, +5 STR +2 DEX, grants Sword Slash)
  - `leather_chest` - Leather Armor (ARMOR/CHEST/LIGHT, +3 DEF)

**Run Seed:**
```bash
cd packages/database
pnpm seed:admin
cd ../..
```

---

## Architecture Changes

### Data Flow: Authoring → Runtime

**Before Sprint 2.5:**
- Game data hardcoded in game server
- No versioning or content management

**After Sprint 2.5:**
1. **Authoring (Admin UI):**
   - Admins create/edit templates in database via web UI
   - Templates grouped into bundles (DRAFT status)
   - Validation ensures data integrity

2. **Publishing (Export):**
   - Validate bundle
   - Mark templates as PUBLISHED
   - Export to Supabase Storage as JSON files
   - Update bundle with `exportTarget` path

3. **Activation:**
   - Admin activates published bundle (deactivates others)
   - Only one bundle can be active at a time

4. **Runtime (Game Server):**
   - BundleLoader fetches active bundle on startup
   - Downloads JSON from Supabase Storage
   - Caches in memory for fast lookups
   - Combat system reads templates via BundleLoader

### Database Schema Additions

**Bundles:**
- Track game data versions
- Status: DRAFT → PUBLISHED
- `isActive` flag (only one active at a time)
- `exportTarget` stores Supabase Storage path

**Templates (Equipment & Action):**
- Belong to bundles via `bundleId`
- Status: DRAFT → PUBLISHED → DEPRECATED
- JSON config fields for behavior (hitbox, damage, etc.)

**Template-Action Relationship:**
- `EquipmentTemplateAction` junction table
- Equipment grants actions (e.g., sword grants sword slash)

---

## Deployment Considerations

### Environment Variables Required

**Web App (`apps/web`):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations (export)

**Game Server (`apps/game-server`):**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for downloading bundles

### Supabase Storage Setup

1. Create `gamedata` bucket in Supabase Storage
2. Configure bucket policies:
   - Service role has full access (read/write)
   - Public read access not required (game server uses service key)

### Admin Access Setup

1. Manually set `isAdmin = true` in database for authorized users:
```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@example.com';
```

2. Admin users can then access `/admin` routes

### Game Server Integration

**On Startup:**
```typescript
import { bundleLoader } from './services/bundle-loader'

async function startServer() {
  await bundleLoader.load()
  console.log('Bundle loaded, starting server...')
  // ... rest of server initialization
}
```

**In Combat System:**
- Replace hardcoded equipment/action data with `bundleLoader.getEquipmentTemplate(key)`
- Use template data for damage calculations, cooldowns, hitboxes, etc.

---

## File Summary

### Created (29 files)

**Auth & Layout:**
- `apps/web/types/next-auth.d.ts`
- `apps/web/middleware.ts`
- `apps/web/app/admin/unauthorized/page.tsx`
- `apps/web/app/admin/components/AdminNav.tsx`
- `apps/web/app/admin/layout.tsx`

**Bundles:**
- `apps/web/app/api/admin/bundles/route.ts`
- `apps/web/app/api/admin/bundles/[id]/validate/route.ts`
- `apps/web/app/api/admin/bundles/[id]/publish/route.ts`
- `apps/web/app/api/admin/bundles/[id]/activate/route.ts`
- `apps/web/app/admin/bundles/page.tsx`
- `apps/web/app/admin/bundles/[id]/page.tsx`

**Action Templates:**
- `apps/web/app/api/admin/action-templates/route.ts`
- `apps/web/app/api/admin/action-templates/[id]/route.ts`
- `apps/web/app/admin/action-templates/page.tsx`
- `apps/web/app/admin/action-templates/new/page.tsx`
- `apps/web/app/admin/action-templates/[id]/page.tsx`

**Equipment Templates:**
- `apps/web/app/api/admin/equipment-templates/route.ts`
- `apps/web/app/api/admin/equipment-templates/[id]/route.ts`
- `apps/web/app/admin/equipment-templates/page.tsx`
- `apps/web/app/admin/equipment-templates/new/page.tsx`
- `apps/web/app/admin/equipment-templates/[id]/page.tsx`

**Components:**
- `apps/web/app/admin/components/JsonEditor.tsx`

**Libraries:**
- `apps/web/lib/admin/validator.ts`
- `apps/web/lib/admin/exporter.ts`

**Game Server:**
- `apps/game-server/src/services/bundle-loader.ts`

**Seed Data:**
- `packages/database/prisma/seed-admin.ts`

### Modified (3 files)

- `packages/database/prisma/schema.prisma` - Added `isAdmin` to User
- `apps/web/lib/auth.ts` - Updated session callback
- `apps/web/app/admin/page.tsx` - Redesigned dashboard
- `packages/database/package.json` - Added `seed:admin` script

---

## Testing Notes

### Manual Testing Workflow

1. **Setup:**
   ```bash
   # Push schema changes
   cd packages/database && pnpm db:push && cd ../..

   # Seed demo bundle
   cd packages/database && pnpm seed:admin && cd ../..

   # Set admin user in database
   # UPDATE "User" SET "isAdmin" = true WHERE email = 'your@email.com';
   ```

2. **Admin Access:**
   - Navigate to `/admin` (redirects to unauthorized if not admin)
   - Verify dashboard shows correct stats

3. **Bundle Management:**
   - View bundles list (should show `demo-v0.1`)
   - Create new bundle (clones from active)
   - View bundle detail page

4. **Template Authoring:**
   - Create/edit action templates
   - Create/edit equipment templates
   - Associate actions with equipment

5. **Validation:**
   - Click "Validate" on bundle detail page
   - Verify errors/warnings display correctly
   - Fix errors and re-validate

6. **Publishing:**
   - Click "Publish" on valid bundle
   - Verify bundle status changes to PUBLISHED
   - Check Supabase Storage for exported JSON files

7. **Activation:**
   - Click "Activate" on published bundle
   - Verify only one bundle is active
   - Previous active bundle should deactivate

8. **Game Server:**
   - Start game server
   - Verify bundle loads on startup
   - Check console logs for loaded template counts

### Known Limitations

- No template preview/visualization in UI
- No diff view when cloning bundles
- No rollback mechanism for activations
- No audit log for bundle changes
- Validation is synchronous (could block on large bundles)

---

## Next Steps (Sprint 3)

Sprint 2.5 provides the foundation for data-driven gameplay. Future sprints will:

1. **Sprint 3:** Frontend real-time combat UI with Canvas rendering
2. **Sprint 4:** Additional weapons and projectiles (use ActionTemplate system)
3. **Sprint 5:** Loot and progression (spawn Equipment instances from templates)
4. **Sprint 6:** Multiplayer PvP (load templates in matchmaking)

The template/instance separation enables:
- **Design iteration** without blockchain transactions
- **Versioned releases** via bundles
- **A/B testing** by activating different bundles
- **Rollback capability** by re-activating previous bundles
- **Content velocity** via admin UI instead of code changes

---

## References

- **Plan:** `docs/plans/09-sprint-2.5-admin-ui.md`
- **Data Glossary:** `docs/data-glossary.md` (template vs instance model)
- **Equipment Design:** `docs/features/equipment.md`
- **Database Schema:** `packages/database/prisma/schema.prisma`
