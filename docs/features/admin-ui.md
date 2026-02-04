# Admin UI Plan — Game Data Authoring & Publishing (v0.1)

This document defines how we will implement an internal Admin UI that allows developers (Aiden/Ben) to author, validate, and publish game data such as:

**Implementation context:** The Admin UI is implemented on the **Next.js website** (`apps/web`). All admin routes live under the Next.js app (e.g. `/admin`, `/admin/bundles`, `/admin/equipment-templates`, `/admin/action-templates`). The same design system and auth stack (NextAuth, session) apply; admin-only access is enforced via middleware and role checks.

**Implementation status:** ✅ Implemented in Sprint 2.5. See [SPRINT-2.5-SUMMARY.md](../SPRINT-2.5-SUMMARY.md) for what was built (bundles, templates CRUD, validation, publish/export, BundleLoader on game server, seed data).

- Equipment templates (weapons/armor/catalysts)
- Action templates (attacks, casts, mobility, utility)
- Spell templates (later)
- Future: perks, affixes, loot tables, classes

Core goals:
1) Make it easy and safe to create/modify game data
2) Guarantee published data is valid and consistent
3) Export a deterministic runtime bundle (JSON/TS) used by the game server
4) Support fast iteration with rollback via immutable versions

Non-goals (MVP):
- Full designer-grade tooling (WYSIWYG editors)
- Live hotpatching runtime logic from DB
- Complex economy balancing tools

---

## 1) Architecture Summary

### 1.1 Source of Truth
Runtime behavior uses exported JSON/TS bundles (static files). The database is an authoring mirror.

- Database: stores templates as rows for editing + validation + publishing workflow
- Export: produces a canonical bundle in Supabase Storage
- Runtime: game server loads the active bundle at startup (and caches)

### 1.2 Immutable Publishing
Publishing creates an immutable bundle version (recommended).

Examples:
- demo-v0.1
- demo-v0.2
- demo-v0.3

Only one bundle is marked `isActive = true` at a time.
Rollback is switching `isActive` back to a previous bundle.

---

## 2) Key Features (MVP)

### 2.1 Auth + Access Control
Admin UI must not be publicly accessible.

Requirements:
- Admin routes gated by authentication
- Admin-only authorization check
- All create/update/publish/export endpoints server-side and admin-guarded

Recommended approach:
- Maintain a `profiles` table or role claim that marks a user as ADMIN
- Enforce checks in:
  - Next.js middleware for /admin routes
  - server-side handlers for publish/export operations

### 2.2 CRUD for Templates
Admin UI supports create/read/update/delete for:
- GameDataBundle
- EquipmentTemplate
- ActionTemplate
- (Optional next) SpellTemplate

### 2.3 Validation
Validation is required at two levels:
- Record-level validation (on save)
- Bundle-level validation (before publish)

Validation must catch:
- missing required fields
- invalid numeric ranges (negative cooldowns, etc.)
- invalid JSON payload shapes
- broken references (template->actions)
- duplicate keys
- incompatible slot/type/subtype combinations (as rules emerge)

### 2.4 Publishing + Export
On publish:
1) Validate all relevant templates in bundle
2) Freeze bundle version (immutable)
3) Export JSON artifacts to Supabase Storage
4) Mark the new bundle as active
5) Keep older bundles available for rollback

---

## 3) Design Specifications (Admin UI)

The Admin UI follows [Design Guidelines](../design-guidelines.md) so it feels consistent with the rest of the Crucible web app: battle-console, Roman/coliseum, worn and deliberate. Apply the following to all admin pages and components.

### 3.1 Visual direction
- **Aesthetic:** Roman / Gladiator / Coliseum — battle-hardened, iron, stone, dark. Gritty but stylish; confident and serious.
- **Surfaces:** Dark stone / iron backgrounds; subtle noise or grain; high-contrast elements on top.
- **Style:** Retro 16-bit inspiration (sharp edges, pixel-adjacent spacing, chunky UI blocks). UI should feel retro even if rendered crisply; not literal pixel art everywhere.

### 3.2 Typography
- **Primary UI font:** Pixel-adjacent or retro-inspired sans-serif (e.g. VT323, Press Start 2P for headings, Inter/IBM Plex Sans for body). Favor legibility over flair.
- **Hierarchy:** Headings — bold, condensed, uppercase. Labels — small caps or spaced uppercase. Body — clean, readable at small sizes.
- **Feel:** UI text should feel “engraved” or “stamped”; use weight and spacing, not color alone.

### 3.3 Color
- **Base:** Dark, moody; neutral stone/iron for structure.
- **Semantic usage:** Red — danger, errors, destructive actions. Gold — rarity, publish/success, active bundle. Green — success, validate OK, confirm. Blue/Cyan — info, links. Purple — rare/deprecated states.
- **Accessibility:** WCAG AA contrast; never rely on color alone for state; use icons + labels for critical info.

### 3.4 Spacing and layout
- **Layout:** Grid-based; chunky margins; clear separation between sections (dashboard vs list vs editor).
- **Density:** Slightly compact, tactical; avoid airy SaaS spacing; UI should feel “weighty.”
- **Responsiveness:** Desktop-first for demo; mobile-friendly later.

### 3.5 Components and UI patterns
- **Buttons:** Squared or slightly beveled edges; solid fills; strong contrast. Hover: brightness + subtle glow. Active: slight “pressed in” illusion. Use semantic colors for primary actions (e.g. Publish = gold, Validate = green, Delete = red).
- **Cards / Panels:** Dark backgrounds; hard borders or inner shadows; list/detail panels feel like plaques or nameplates.
- **Inputs:** Minimal rounding; clear focus states; avoid floating labels. JSON textareas: monospace, clear validation state (border/background for error/success).
- **Navigation:** Icon + text for admin sidebar or tabs; clear active state; no hidden gestures.

### 3.6 Motion and animation
- **UI motion:** Fast, restrained (120–200ms); slide or fade, not bounce. Use for panel transitions, modals, validation feedback.
- **Performance:** Avoid heavy effects in admin; keep interactions snappy.

### 3.7 Accessibility
- Full keyboard navigation for lists, forms, and actions.
- Clear focus outlines on all interactive elements.
- High contrast friendly; respect reduced motion preferences.
- Error messages and validation feedback must be readable and not color-only.

### 3.8 Tone and copy
- **Voice:** In-world, confident, blunt, martial. Short phrases over lore dumps.
- **Examples for admin:** “Publish bundle”, “Validate”, “Rollback”, “Draft” / “Published”.
- **Errors:** Clear and direct; slightly thematic but never confusing (e.g. “Validation failed” with field path, not “The gods deny you”).

### 3.9 Palette recommendation
For the Admin UI, **Palette A (Blood & Bronze)** or **Palette B (Obsidian & Gold)** from the design guidelines are suitable: A for consistency with the main coliseum feel; B for a “tool/console” prestige feel. Use one consistently across all admin routes.

---

## 4) Admin UI Information Architecture (Pages)

### 4.1 /admin (Dashboard)
Show:
- Active bundle (label, publishedAt, version)
- Draft bundle selector / creation
- “Validate bundle” button
- “Publish bundle” button
- Publish history list
- Warnings (validation errors, missing templates)

### 4.2 /admin/bundles
- List bundles with status + active flag
- Create new bundle from:
  - blank
  - clone from existing active bundle (recommended for iteration)
- Activate/rollback: switch active bundle to any published version

### 4.3 /admin/equipment-templates
List view:
- Search: key/name
- Filters: type, slot, subtype, status, bundle
- Quick actions: duplicate template, set status

Detail editor:
- Identity: key, name, description
- Classification: type, slot, subtype, tags
- Base modifiers: baseStatMods (JSON)
- Scaling: scaling (JSON)
- Rarity/roll rules: rarityRules (JSON) (optional in demo)
- UI metadata: ui (JSON)
- Granted actions: multi-select picker (many-to-many)
- Version/status controls: DRAFT/PUBLISHED/DEPRECATED

### 4.4 /admin/action-templates
List view:
- Search: key/name
- Filters: category, status, bundle

Detail editor:
- Identity: key, name, description
- Category: WEAPON_ATTACK / CAST / MOBILITY / UTILITY
- Timing: cooldownMs, castTimeMs
- Costs: staminaCost, manaCost
- JSON configs:
  - hitboxConfig
  - projectileConfig
  - damageConfig
  - effectConfig
- Version/status controls

### 4.5 /admin/spell-templates (next)
Same shape as ActionTemplates with spell-specific fields:
- school (ARCANA/FAITH)
- effectConfig
- scaling
- costs/timing

---

## 5) Editing Experience Guidelines

### 5.1 JSON Fields (MVP)
We will start with:
- a JSON textarea editor
- validation on save
- helper buttons to insert common JSON skeletons

Required helper inserts:
- Insert ARC hitbox skeleton
- Insert CIRCLE AoE skeleton
- Insert projectile skeleton
- Insert damage config skeleton
- Insert dodge roll effect skeleton

### 5.2 Safe Defaults
- Provide sensible defaults for numeric fields
- Never allow publishing with invalid/malformed JSON

### 5.3 Deterministic Keys
Keys are canonical IDs used by runtime.
Rules:
- lowercase snake_case recommended
- stable keys (do not rename lightly)
- UI can generate key from name but user can edit

---

## 6) Bundle Publishing Workflow (Detailed)

### 6.1 Drafting
- Templates are edited under a specific bundle (bundleId field).
- DRAFT templates can be edited freely.

### 6.2 Validate Bundle
Validation produces an error list with:
- entity type (equipment/action)
- template key
- field path (e.g. damageConfig.base)
- error message
- severity (error vs warning)

Validation rules (MVP):
- keys unique
- required fields present
- JSON configs parse and match schemas
- Equipment templates reference only existing action templates
- No missing actionTemplates for weapons (at least 1 action)
- Slot/type coherence checks:
  - ARMOR must be HELMET/CHEST/GAUNTLETS/GREAVES
  - WEAPON typically MAIN_HAND/OFF_HAND
  - CATALYST typically MAIN_HAND/OFF_HAND

### 6.3 Publish Bundle
Publishing is a server-side transaction-ish workflow:
1) Run validation; abort if errors
2) Create a new bundle version (immutable label or generated semver)
3) Copy templates/actions into that version context OR mark those rows as published versioned records
4) Export JSON bundle to Supabase Storage
5) Flip active bundle pointer:
   - new bundle isActive = true
   - previous active bundle isActive = false

Rollback:
- set an older published bundle isActive = true

---

## 7) Export & Storage

### 7.1 Storage Location
Use Supabase Storage for MVP.

Proposed structure:
- bucket: gamedata
- path:
  - bundles/{bundleLabel}/equipment.templates.json
  - bundles/{bundleLabel}/actions.templates.json
  - bundles/{bundleLabel}/spells.templates.json (later)
  - bundles/{bundleLabel}/manifest.json

manifest.json should include:
- bundleLabel
- publishedAt
- file list + hashes (optional)
- counts (equipment/actions/spells)

### 7.2 Export Format Requirements
Exports must be:
- deterministic: sorted by key
- stable schema: only publish fields runtime expects
- normalized references: use keys for references, not internal DB ids

Example:
- EquipmentTemplate exports action keys, not join table IDs.

---

## 8) Runtime Loading Requirements

Game server must:
- fetch active bundle label from DB
- download JSON from Storage once on boot
- validate bundle (defensive)
- cache in memory for runtime lookups:
  - getEquipmentTemplate(key)
  - getActionTemplate(key)
  - getSpellTemplate(key) (later)

No runtime DB dependency for templates during combat.

---

## 9) Implementation Milestones (Suggested Order)

### Sprint A: Admin scaffolding + security
- /admin routes + navigation
- middleware auth guard
- admin role check

### Sprint B: ActionTemplate CRUD
- list + detail editor
- validation on save
- helper inserts for JSON

### Sprint C: EquipmentTemplate CRUD
- list + detail editor
- action multi-select (EquipmentTemplateAction join)
- validation on save

### Sprint D: Bundle workflow
- bundle create/clone
- validate bundle endpoint + UI error display
- publish endpoint + immutable versioning + rollback

### Sprint E: Exporter
- export scripts/functions
- write to Supabase Storage
- generate manifest

### Sprint F: Runtime loader
- active bundle fetch
- storage download + caching

### Sprint G: SpellTemplate (next)
- CRUD + export + runtime loading

---

## 10) Demo Scope Note

For demo:
- Weapon-based kits only: weapons grant actions.
- No class-granted abilities yet.
- Spells may be optional; catalysts/spells can be added after core weapon loop works.

We will document class abilities as a future extension:
- class ability templates
- loadout equippedAbilityIds
- unlockedSkills integration

---

## 11) Quality Checklist (Rules)

We do not publish unless:
- validation passes with zero errors
- all referenced keys exist
- JSON payloads conform to schemas
- output bundle is deterministic and reproducible

We prefer:
- simple editors first
- schema validation everywhere
- immutable versions to avoid debugging chaos

---

## References

Documents that provide context, backend schema, and design standards for the Admin UI:

| Document | Relevance |
|----------|-----------|
| [docs/data-glossary.md](../data-glossary.md) | **Backend & functionality.** Canonical reference for schema and game data: enums (GameDataStatus, EquipmentType, EquipmentSlot, ActionCategory), User, Gladiator, Equipment, Match, GameDataBundle, EquipmentTemplate, ActionTemplate, EquipmentTemplateAction; suggested JSON shapes (§8: baseStatMods, scaling, hitboxConfig, projectileConfig, damageConfig, effectConfig); derived combat stats (§9); guiding principles (§11). Use for CRUD fields, validation rules, and export shapes. |
| [docs/design-guidelines.md](../design-guidelines.md) | **Design specifications.** Visual direction, typography, color, spacing, components, motion, accessibility, tone, and palette options. Section 3 above applies these to the Admin UI. |
| [docs/features/equipment.md](equipment.md) | **Equipment & template context.** Template vs instance model, slot-based equipping, EquipmentTemplate responsibilities, action templates, authoring workflow, demo scope. Informs equipment-template and action-template editors. |
| [docs/architecture.md](../architecture.md) | **System context.** Where the Admin UI fits (frontend Next.js app), how game data flows from DB → export → game server, and key models (GameDataBundle, EquipmentTemplate, ActionTemplate). |
| [docs/features/combat.md](combat.md) | **Combat & actions.** Real-time model, actions, weapons, hitboxes, projectiles. Informs action-template categories (WEAPON_ATTACK, MOBILITY, etc.) and JSON config semantics (hitboxConfig, damageConfig). |
| [README.md](../../README.md) | **Project overview.** Goal, status, roadmap, tech stack, game data summary. |
| [docs/plans/00-MASTER-PLAN.md](../plans/00-MASTER-PLAN.md) | **Master plan.** Success criteria, sprint breakdown, design decisions, data model overview. |

---

## Skills to Use

When planning or implementing the Admin UI sprint, use the skills below. For full descriptions and the full skill registry, see [SKILLS_GUIDE.md](../../SKILLS_GUIDE.md).

### Planning the sprint
- **brainstorming** — Explore requirements, edge cases, and UX for admin routes and editors before implementation.
- **writing-plans** — Create a structured implementation plan (e.g. align with §9 milestones: scaffolding → ActionTemplate CRUD → EquipmentTemplate CRUD → bundle workflow → exporter → runtime loader).
- **executing-plans** — Execute the plan with clear checkpoints and review steps.
- **using-git-worktrees** — Optionally work in an isolated branch for the admin UI feature set.

### Implementing the Admin UI
- **frontend-design** — Apply Section 3 design specs; build distinctive, on-brand admin pages (Next.js routes, forms, lists).
- **nextjs-best-practices** — Structure `/admin` routes, middleware, API routes, and server vs client components.
- **react-patterns** / **react-ui-patterns** — Admin list/detail patterns, forms, validation feedback, and shared components.
- **tailwind-patterns** — Styling admin UI to match design guidelines (palette, spacing, components).
- **backend-dev-guidelines** / **api-patterns** — Admin-guarded endpoints for CRUD, validate-bundle, publish, and export.
- **database-design** / **prisma-expert** — Schema usage for GameDataBundle, EquipmentTemplate, ActionTemplate; queries and validation.
- **supabase** — Database and Storage usage for bundle export (bucket, paths, manifest).
- **test-driven-development** — Add tests for validation logic, export shape, and critical admin flows where applicable.
- **systematic-debugging** — Use when fixing validation bugs, export errors, or auth/access issues.

### Before calling the sprint done
- **verification-before-completion** — Run verification steps and confirm behavior before claiming the sprint complete.
- **requesting-code-review** — Request a code review before merging admin UI work.
- **receiving-code-review** — Apply review feedback (see receiving-code-review skill).
