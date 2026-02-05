# Sprint 4: Weapons & Projectiles

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement additional weapon types (Spear, Bow, Dagger) and projectile system

**Duration:** Week 5-6
**Prerequisites:** Sprint 3 complete (real-time combat UI working with Sword)

**Architecture:** Weapon system with different attack patterns, server-side projectile simulation, client-side projectile rendering

**Tech Stack:**
- TypeScript (shared weapon definitions)
- Canvas API (projectile rendering)
- Socket.io (projectile events)

**Weapon Types from combat.md:**
- ✅ **Sword** (melee arc) - Already implemented in Sprint 2
- **Spear** (long thrust / narrow line)
- **Bow** (projectile)
- **Dagger** (fast, short range)

---

## Overview

Sprint 4 expands the combat system with three new weapon types, each with unique attack patterns:

1. **Spear**: Long-range thrust attack (line hitbox)
2. **Bow**: Projectile-based ranged attack (requires projectile simulation)
3. **Dagger**: Fast melee with short range and low cooldown

**Key Challenges:**
- Server-authoritative projectile simulation
- Client-side projectile interpolation
- Weapon switching system
- Different attack hitboxes per weapon

**From combat.md §5.2:**
> Weapons define: attack pattern (melee arc, thrust line, projectile), stamina cost, windup time (optional), cooldown time, scaling (STR/DEX)

**Game data alignment:** Weapon and action definitions should align with the template/instance model. Use or mirror the JSON shapes from **docs/data-glossary.md** §8: `ActionTemplate.hitboxConfig` (ARC, LINE, CIRCLE, etc.), `ActionTemplate.projectileConfig`, `ActionTemplate.damageConfig`, `EquipmentTemplate.scaling`. Prefer loading weapon/action data from a **published JSON/TS bundle** (exported from EquipmentTemplate + ActionTemplate) so admin-authored content drives runtime. See **docs/features/equipment.md** and **docs/data-glossary.md** for authoring → publish → runtime flow.

---

## Task 1: Weapon System Foundation

**Owner:** Dev 1
**Time:** 2.5 hours

**Files:**
- Create: `packages/shared/src/combat/weapons.ts`
- Update: `packages/shared/src/combat/types.ts`
- Update: `packages/shared/src/combat/damage-calculator.ts`

### Step 1: Define weapon types

**File:** `packages/shared/src/combat/weapons.ts`

```typescript
import { BaseAttributes } from './types'

export enum WeaponType {
  Sword = 'Sword',
  Spear = 'Spear',
  Bow = 'Bow',
  Dagger = 'Dagger',
}

export enum AttackPattern {
  MeleeArc = 'MeleeArc',        // Sword: short range, wide arc
  MeleeThrust = 'MeleeThrust',  // Spear: long range, narrow line
  Projectile = 'Projectile',    // Bow: fires projectile
  MeleeQuick = 'MeleeQuick',    // Dagger: very short range, fast
}

export interface WeaponDefinition {
  type: WeaponType
  attackPattern: AttackPattern

  // Range/hitbox
  range: number            // Max distance for melee, or projectile spawn distance
  arcAngle?: number        // For melee arc attacks (radians)
  lineWidth?: number       // For thrust attacks

  // Damage
  baseDamage: number
  scaling: {
    strength: number       // Damage multiplier from STR
    dexterity: number      // Damage multiplier from DEX
  }

  // Resources & timing
  staminaCost: number
  cooldown: number         // ms

  // Projectile-specific
  projectileSpeed?: number   // units/sec
  projectileLifetime?: number // ms
}

export const WEAPONS: Record<WeaponType, WeaponDefinition> = {
  [WeaponType.Sword]: {
    type: WeaponType.Sword,
    attackPattern: AttackPattern.MeleeArc,
    range: 2.0,
    arcAngle: Math.PI / 2,   // 90 degrees
    baseDamage: 15,
    scaling: {
      strength: 0.6,
      dexterity: 0.3,
    },
    staminaCost: 15,
    cooldown: 500,
  },

  [WeaponType.Spear]: {
    type: WeaponType.Spear,
    attackPattern: AttackPattern.MeleeThrust,
    range: 3.5,              // Longer range than sword
    lineWidth: 0.5,          // Narrow hitbox
    baseDamage: 18,
    scaling: {
      strength: 0.8,
      dexterity: 0.2,
    },
    staminaCost: 18,
    cooldown: 600,
  },

  [WeaponType.Bow]: {
    type: WeaponType.Bow,
    attackPattern: AttackPattern.Projectile,
    range: 1.0,              // Spawn distance
    baseDamage: 12,
    scaling: {
      strength: 0.2,
      dexterity: 0.8,
    },
    staminaCost: 12,
    cooldown: 700,
    projectileSpeed: 15,     // units/sec
    projectileLifetime: 2000, // 2 seconds
  },

  [WeaponType.Dagger]: {
    type: WeaponType.Dagger,
    attackPattern: AttackPattern.MeleeQuick,
    range: 1.5,              // Shorter than sword
    arcAngle: Math.PI / 3,   // 60 degrees (narrower)
    baseDamage: 10,
    scaling: {
      strength: 0.3,
      dexterity: 0.7,
    },
    staminaCost: 10,
    cooldown: 300,           // Much faster
  },
}

export function getWeaponDamage(
  weapon: WeaponDefinition,
  attacker: BaseAttributes
): number {
  const strDamage = attacker.strength * weapon.scaling.strength
  const dexDamage = attacker.dexterity * weapon.scaling.dexterity
  return weapon.baseDamage + strDamage + dexDamage
}
```

### Step 2: Add weapon to unit state

**File:** `packages/shared/src/combat/types.ts` (update)

```typescript
// Add to UnitState interface
export interface UnitState {
  // ... existing fields ...

  // Weapon
  weapon: WeaponType  // Currently equipped weapon
}

// Add projectile state
export interface ProjectileState {
  id: string
  ownerUnitId: string
  pos: Vec2
  vel: Vec2
  radius: number
  damage: number
  damageType: 'physical' | 'magic'
  lifetime: number       // ms remaining
  createdAt: number      // timestamp
}

// Add to CombatState
export interface CombatState {
  // ... existing fields ...
  projectiles: Map<string, ProjectileState>
}
```

### Step 3: Update damage calculator for weapons

**File:** `packages/shared/src/combat/damage-calculator.ts` (update)

```typescript
import { UnitState } from './types'
import { WEAPONS, getWeaponDamage } from './weapons'

export class DamageCalculator {
  /**
   * Calculate damage for attack (weapon-dependent)
   */
  static calculateWeaponDamage(attacker: UnitState, defender: UnitState): number {
    const weapon = WEAPONS[attacker.weapon]
    const baseDamage = getWeaponDamage(weapon, attacker.attributes)

    // Apply defender's defense (damage reduction)
    const damageReduction = defender.attributes.defense * 0.002
    const finalDamage = Math.max(0, Math.floor(baseDamage * (1 - damageReduction)))

    return finalDamage
  }

  /**
   * Get stamina cost for attack (weapon-dependent)
   */
  static getAttackStaminaCost(weaponType: string): number {
    const weapon = WEAPONS[weaponType as WeaponType]
    return weapon?.staminaCost ?? 15
  }

  /**
   * Get cooldown for attack (weapon-dependent)
   */
  static getAttackCooldown(weaponType: string): number {
    const weapon = WEAPONS[weaponType as WeaponType]
    return weapon?.cooldown ?? 500
  }

  // Keep dodge costs/cooldowns
  static getStaminaCost(action: string): number {
    if (action === 'Dodge') return 20
    // For attacks, use getAttackStaminaCost
    return 0
  }

  static getCooldown(action: string): number {
    if (action === 'Dodge') return 1000
    // For attacks, use getAttackCooldown
    return 0
  }
}
```

---

## Task 2: Projectile System (Server)

**Owner:** Dev 2
**Time:** 3 hours

**Files:**
- Create: `packages/shared/src/combat/projectile-system.ts`
- Update: `packages/shared/src/combat/engine.ts`

### Step 1: Create projectile system

**File:** `packages/shared/src/combat/projectile-system.ts`

```typescript
import { ProjectileState, Vec2, UnitState } from './types'
import { Physics } from './physics'
import { v4 as uuidv4 } from 'uuid'
import { WEAPONS, WeaponType } from './weapons'

export class ProjectileSystem {
  /**
   * Spawn a projectile from unit
   */
  static spawn(
    owner: UnitState,
    damage: number,
    currentTime: number
  ): ProjectileState {
    const weapon = WEAPONS[owner.weapon]

    if (!weapon.projectileSpeed || !weapon.projectileLifetime) {
      throw new Error(`Weapon ${owner.weapon} does not support projectiles`)
    }

    // Spawn projectile in front of unit
    const spawnDist = weapon.range
    const spawnX = owner.pos.x + Math.cos(owner.facing) * spawnDist
    const spawnY = owner.pos.y + Math.sin(owner.facing) * spawnDist

    // Velocity in facing direction
    const velX = Math.cos(owner.facing) * weapon.projectileSpeed
    const velY = Math.sin(owner.facing) * weapon.projectileSpeed

    return {
      id: uuidv4(),
      ownerUnitId: owner.id,
      pos: { x: spawnX, y: spawnY },
      vel: { x: velX, y: velY },
      radius: 0.3,
      damage,
      damageType: 'physical',
      lifetime: weapon.projectileLifetime,
      createdAt: currentTime,
    }
  }

  /**
   * Update all projectiles (movement, lifetime)
   */
  static update(
    projectiles: Map<string, ProjectileState>,
    dt: number,
    arenaWidth: number,
    arenaHeight: number,
    currentTime: number
  ): Set<string> {
    const toRemove = new Set<string>()

    for (const [id, proj] of projectiles.entries()) {
      // Update position
      proj.pos.x += proj.vel.x * dt
      proj.pos.y += proj.vel.y * dt

      // Check lifetime
      const age = currentTime - proj.createdAt
      if (age >= proj.lifetime) {
        toRemove.add(id)
        continue
      }

      // Check arena bounds
      if (
        proj.pos.x < 0 ||
        proj.pos.x > arenaWidth ||
        proj.pos.y < 0 ||
        proj.pos.y > arenaHeight
      ) {
        toRemove.add(id)
      }
    }

    return toRemove
  }

  /**
   * Check projectile collision with unit
   */
  static checkCollision(
    projectile: ProjectileState,
    unit: UnitState
  ): boolean {
    const dist = Physics.distance(projectile.pos, unit.pos)
    return dist <= projectile.radius + 0.5 // 0.5 = unit collision radius
  }
}
```

### Step 2: Update combat engine for weapons and projectiles

**File:** `packages/shared/src/combat/engine.ts` (update processAttack method)

```typescript
// In CombatEngine class

import { ProjectileSystem } from './projectile-system'
import { WEAPONS, AttackPattern, WeaponType } from './weapons'

constructor(...) {
  // ... existing code ...

  this.state = {
    // ... existing fields ...
    projectiles: new Map(),
  }
}

private processAttack(attacker: UnitState) {
  const target = Array.from(this.state.units.values()).find((u) => u.id !== attacker.id)
  if (!target) return

  const weapon = WEAPONS[attacker.weapon]

  // Check stamina and cooldown
  const staminaCost = weapon.staminaCost
  if (attacker.stamina < staminaCost) return
  if ((attacker.cooldowns['Attack'] ?? 0) > 0) return

  // Deduct stamina
  attacker.stamina -= staminaCost

  // Set cooldown
  attacker.cooldowns['Attack'] = weapon.cooldown

  // Log ability used
  this.addEvent({
    tick: this.state.tick,
    type: CombatEventType.ABILITY_USED,
    actorId: attacker.id,
    data: { ability: 'Attack', weapon: weapon.type },
  })

  // Handle different attack patterns
  switch (weapon.attackPattern) {
    case AttackPattern.MeleeArc:
      this.processMeleeArcAttack(attacker, target, weapon)
      break
    case AttackPattern.MeleeThrust:
      this.processMeleeThrustAttack(attacker, target, weapon)
      break
    case AttackPattern.MeleeQuick:
      this.processMeleeQuickAttack(attacker, target, weapon)
      break
    case AttackPattern.Projectile:
      this.processProjectileAttack(attacker, weapon)
      break
  }
}

private processMeleeArcAttack(attacker: UnitState, target: UnitState, weapon: any) {
  // Original sword logic
  const inRange = Physics.isInMeleeRange(attacker, target, weapon.range)
  const inArc = Physics.isInAttackArc(attacker, target, weapon.arcAngle!)

  if (!inRange || !inArc) return
  if (target.isInvulnerable) {
    this.addEvent({
      tick: this.state.tick,
      type: CombatEventType.DODGE,
      actorId: target.id,
      targetId: attacker.id,
    })
    return
  }

  const damage = DamageCalculator.calculateWeaponDamage(attacker, target)
  target.hp = Math.max(0, target.hp - damage)

  this.addEvent({
    tick: this.state.tick,
    type: CombatEventType.HIT,
    actorId: attacker.id,
    targetId: target.id,
    data: { damage, weapon: weapon.type },
  })
}

private processMeleeThrustAttack(attacker: UnitState, target: UnitState, weapon: any) {
  // Spear: check if target is within long line in front of attacker
  const inRange = Physics.isInMeleeRange(attacker, target, weapon.range)
  const inLine = Physics.isInAttackArc(attacker, target, weapon.lineWidth!)

  if (!inRange || !inLine) return
  if (target.isInvulnerable) {
    this.addEvent({
      tick: this.state.tick,
      type: CombatEventType.DODGE,
      actorId: target.id,
      targetId: attacker.id,
    })
    return
  }

  const damage = DamageCalculator.calculateWeaponDamage(attacker, target)
  target.hp = Math.max(0, target.hp - damage)

  this.addEvent({
    tick: this.state.tick,
    type: CombatEventType.HIT,
    actorId: attacker.id,
    targetId: target.id,
    data: { damage, weapon: weapon.type },
  })
}

private processMeleeQuickAttack(attacker: UnitState, target: UnitState, weapon: any) {
  // Dagger: similar to sword but shorter range
  const inRange = Physics.isInMeleeRange(attacker, target, weapon.range)
  const inArc = Physics.isInAttackArc(attacker, target, weapon.arcAngle!)

  if (!inRange || !inArc) return
  if (target.isInvulnerable) {
    this.addEvent({
      tick: this.state.tick,
      type: CombatEventType.DODGE,
      actorId: target.id,
      targetId: attacker.id,
    })
    return
  }

  const damage = DamageCalculator.calculateWeaponDamage(attacker, target)
  target.hp = Math.max(0, target.hp - damage)

  this.addEvent({
    tick: this.state.tick,
    type: CombatEventType.HIT,
    actorId: attacker.id,
    targetId: target.id,
    data: { damage, weapon: weapon.type },
  })
}

private processProjectileAttack(attacker: UnitState, weapon: any) {
  // Bow: spawn projectile
  const damage = DamageCalculator.calculateWeaponDamage(attacker, { attributes: { defense: 0 } } as any)

  const projectile = ProjectileSystem.spawn(attacker, damage, this.state.timeMs)
  this.state.projectiles.set(projectile.id, projectile)

  this.addEvent({
    tick: this.state.tick,
    type: CombatEventType.PROJECTILE_SPAWNED,
    actorId: attacker.id,
    data: { projectileId: projectile.id },
  })
}

// Add to processTick method (after updating units)
processTick(inputs: Map<string, InputFrame>, dt: number): CombatState {
  // ... existing tick logic ...

  // Update projectiles
  const expiredProjectiles = ProjectileSystem.update(
    this.state.projectiles,
    dt,
    this.state.arena.width,
    this.state.arena.height,
    this.state.timeMs
  )

  // Remove expired projectiles
  for (const id of expiredProjectiles) {
    this.state.projectiles.delete(id)
  }

  // Check projectile collisions
  for (const [projId, proj] of this.state.projectiles.entries()) {
    for (const unit of this.state.units.values()) {
      // Don't hit owner
      if (unit.id === proj.ownerUnitId) continue

      // Don't hit invulnerable
      if (unit.isInvulnerable) continue

      if (ProjectileSystem.checkCollision(proj, unit)) {
        // Apply damage
        unit.hp = Math.max(0, unit.hp - proj.damage)

        // Log hit
        this.addEvent({
          tick: this.state.tick,
          type: CombatEventType.HIT,
          actorId: proj.ownerUnitId,
          targetId: unit.id,
          data: { damage: proj.damage, projectile: true },
        })

        // Remove projectile
        this.state.projectiles.delete(projId)
        break
      }
    }
  }

  // ... rest of tick logic ...
}

// Add new event type to types.ts
export enum CombatEventType {
  HIT = 'HIT',
  DODGE = 'DODGE',
  DEATH = 'DEATH',
  ABILITY_USED = 'ABILITY_USED',
  PROJECTILE_SPAWNED = 'PROJECTILE_SPAWNED',  // NEW
}
```

---

## Task 3: Weapon Selection & Switching

**Owner:** Dev 3
**Time:** 2 hours

**Files:**
- Create: `apps/web/components/arena/WeaponSelector.tsx`
- Update: `apps/web/app/match/[matchId]/page.tsx`

### Step 1: Create weapon selector UI

**File:** `apps/web/components/arena/WeaponSelector.tsx`

```typescript
'use client'

import { WeaponType, WEAPONS } from '@gladiator/shared/src/combat/weapons'

interface WeaponSelectorProps {
  currentWeapon: WeaponType
  onWeaponChange: (weapon: WeaponType) => void
}

export function WeaponSelector({ currentWeapon, onWeaponChange }: WeaponSelectorProps) {
  const weapons = Object.values(WeaponType)

  return (
    <div className="bg-gray-900/90 p-3 rounded-lg border border-gray-700">
      <div className="text-xs text-gray-400 mb-2">Weapon [1-4]</div>
      <div className="grid grid-cols-4 gap-2">
        {weapons.map((weapon, index) => {
          const def = WEAPONS[weapon]
          const isSelected = weapon === currentWeapon

          return (
            <button
              key={weapon}
              onClick={() => onWeaponChange(weapon)}
              className={`
                p-2 rounded text-xs transition-all
                ${isSelected
                  ? 'bg-green-600 text-white border-2 border-green-400'
                  : 'bg-gray-800 text-gray-300 border-2 border-gray-700 hover:border-gray-500'}
              `}
            >
              <div className="font-bold">{weapon}</div>
              <div className="text-[10px] text-gray-400 mt-1">
                {index + 1}
              </div>
              <div className="text-[10px] mt-1">
                CD: {def.cooldown}ms
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

### Step 2: Add weapon switching to input handler

**File:** `apps/web/hooks/useGameInput.ts` (update)

```typescript
// Add weapon switching
const handleKeyDown = (e: KeyboardEvent) => {
  keysPressed.current.add(e.key.toLowerCase())

  // Weapon switching (1-4)
  if (e.key >= '1' && e.key <= '4') {
    const weapons = [WeaponType.Sword, WeaponType.Spear, WeaponType.Bow, WeaponType.Dagger]
    const index = parseInt(e.key) - 1
    // Emit weapon change event (handle in match component)
    onWeaponChange?.(weapons[index])
  }

  // ... rest of input handling ...
}
```

---

## Task 4: Client-Side Projectile Rendering

**Owner:** Dev 3
**Time:** 2 hours

**Files:**
- Update: `apps/web/components/arena/renderer.ts`
- Update: `apps/web/components/arena/ArenaCanvas.tsx`

### Step 1: Add projectile rendering

**File:** `apps/web/components/arena/renderer.ts` (add method)

```typescript
// In Renderer class

drawProjectile(projectile: ProjectileState) {
  const x = projectile.pos.x * this.scale
  const y = projectile.pos.y * this.scale
  const radius = projectile.radius * this.scale

  // Draw projectile
  this.ctx.fillStyle = '#fbbf24' // Yellow/orange
  this.ctx.beginPath()
  this.ctx.arc(x, y, radius, 0, Math.PI * 2)
  this.ctx.fill()

  // Draw trail
  this.ctx.strokeStyle = '#fbbf24'
  this.ctx.lineWidth = 1
  this.ctx.globalAlpha = 0.5
  this.ctx.beginPath()
  const trailLength = 10
  this.ctx.moveTo(x, y)
  this.ctx.lineTo(
    x - (projectile.vel.x / Math.abs(projectile.vel.x + projectile.vel.y)) * trailLength,
    y - (projectile.vel.y / Math.abs(projectile.vel.x + projectile.vel.y)) * trailLength
  )
  this.ctx.stroke()
  this.ctx.globalAlpha = 1
}
```

### Step 2: Render projectiles in ArenaCanvas

**File:** `apps/web/components/arena/ArenaCanvas.tsx` (update render loop)

```typescript
// In renderFrame function, after rendering units:

// Render projectiles
if (combatState.projectiles) {
  for (const projectile of combatState.projectiles.values()) {
    renderer.drawProjectile(projectile)
  }
}
```

---

## Verification Checklist

**Weapon System:**
- [ ] Can switch weapons with 1-4 keys
- [ ] Weapon selector UI shows current weapon
- [ ] Each weapon has correct range and cooldown
- [ ] Sword works (melee arc) - already from Sprint 2
- [ ] Spear works (long thrust)
- [ ] Dagger works (fast melee)
- [ ] Bow works (fires projectiles)

**Projectile System:**
- [ ] Bow fires projectiles in facing direction
- [ ] Projectiles move smoothly at correct speed
- [ ] Projectiles hit opponents and deal damage
- [ ] Projectiles expire after lifetime
- [ ] Projectiles removed when hitting arena bounds
- [ ] Projectiles don't hit owner
- [ ] Projectiles don't hit invulnerable targets

**Combat Balance:**
- [ ] Each weapon feels distinct
- [ ] Stamina costs are appropriate
- [ ] Cooldowns prevent spam
- [ ] Damage values are balanced

---

## Next Sprint

**Sprint 5: Progression & Loot**

Focus:
- XP and leveling system
- Skill tree (class-based abilities)
- Equipment drops and rarity
- Inventory UI

See: `docs/plans/06-sprint-5-progression-loot.md`
