# Sprint 8+: Post-Demo Roadmap

**Status:** Planning
**Dependencies:** Sprint 7 (Polish & Deployment) complete

---

## Overview

This document outlines the post-demo development roadmap for Crucible: Gladiator Coliseum. After completing Sprints 1-7 (demo scope), the project transitions from prototype validation to production-ready game development.

**Demo Achievements (Sprints 1-7):**
- ✅ Authentication (social + wallet)
- ✅ NFT minting (Gladiators with 8 stats)
- ✅ Real-time combat (20Hz server-authoritative)
- ✅ CPU AI battles
- ✅ Frontend combat UI (Canvas, client prediction)
- ✅ Weapons & projectiles
- ✅ Progression & loot (XP, leveling, skill trees, loot boxes, crafting)
- ✅ Real-time PvP multiplayer
- ✅ Polish & deployment

**Post-Demo Goals:**
1. Deepen systems (perks, abilities, advanced combat)
2. Expand content (more classes, weapons, maps, game modes)
3. Improve economy (marketplace, tournaments, seasons)
4. Scale infrastructure (matchmaking, leaderboards, anti-cheat)
5. Community features (guilds, chat, replays)

---

## Sprint 8: Perks & Abilities System

**Duration:** 2-3 weeks
**Focus:** Add passive perks and active abilities for build variety

### 8.1 Perk System Integration

**Objectives:**
- Implement 15-20 foundational perks across all categories
- Integrate perks into CombatEngine stat calculations
- Add perks to Epic/Legendary equipment drops
- Higher skill tree tiers grant perks

**Perk Categories:**
1. **Damage Modifiers:** Conditional damage boosts, armor penetration, crit chance
2. **Survivability:** Damage reduction, life steal, shields
3. **Utility:** Movement speed, cooldown reduction, stamina regen
4. **Synergy:** Class-specific bonuses, weapon synergies

**Example Perks:**
- Berserker's Fury: +20% damage when HP < 50%
- Armor Piercing: Ignore 20% of target defense
- Life Steal: Heal for 10% of damage dealt
- Riposte: 15% chance to counterattack when hit
- Mana Shield: Convert 10% mana to damage absorption

**Implementation:**
1. Create PerkTemplate model in database
2. Export perks to static game data (JSON/TS)
3. CombatEngine applies perk effects during derived stat calculation
4. Equipment `grantedPerkIds` populates active perks
5. UI tooltips for perk effects

---

### 8.2 Ability System

**Objectives:**
- Define 3-5 abilities per class (12-20 total)
- Add ability slots to Gladiator loadout (Primary, Secondary, Ultimate)
- Implement ability action processing in CombatEngine
- UI for ability assignment and keybindings (Q, E, R)

**Ability Categories:**
1. **Mobility:** Dashes, teleports, charges (6-10s cooldown)
2. **Offensive:** Burst damage skills (10-15s cooldown)
3. **Defensive:** Shields, heals, immunities (15-25s cooldown)
4. **Ultimate:** Game-changers (30-60s cooldown)

**Example Abilities:**

| Class | Ability | Type | Cooldown | Effect |
|-------|---------|------|----------|--------|
| Brute | Shield Charge | Mobility | 12s | Dash forward, stun 1s |
| Brute | Berserk Mode | Ultimate | 30s | +50% damage, -30% def, 8s |
| Assassin | Shadow Step | Mobility | 8s | Teleport behind target |
| Assassin | Blade Flurry | Offensive | 15s | 3 rapid attacks in 1s |
| Duelist | Riposte Stance | Defensive | 18s | Next hit triggers counter |
| Mage | Fireball | Offensive | 6s | Ranged AoE projectile |
| Mage | Divine Heal | Defensive | 20s | Restore 30% HP |

**Implementation:**
1. Abilities are ActionTemplates with `isAbility` flag
2. Gladiator `loadout` JSON stores equipped ability IDs
3. Frontend sends ability actions via `match:action`
4. CombatEngine validates cooldowns and processes effects
5. UI shows ability cooldowns and keybindings

---

### 8.3 Build Variety & Balance

**Objectives:**
- Ensure multiple viable builds per class
- Playtest perk/ability combinations
- Balance passes for damage, survivability, utility

**Validation:**
- CPU AI can use abilities effectively
- PvP matches feel balanced across builds
- No "must-have" perks or abilities
- Each class has 3+ distinct archetypes

---

## Sprint 9: Advanced Combat & Content

**Duration:** 3-4 weeks
**Focus:** Expand combat depth and content variety

### 9.1 Advanced Combat Mechanics

**Objectives:**
- Status effects (stun, slow, bleed, burn)
- Combo system (attack chains with timing windows)
- Parry/block mechanics (active defense)
- Environmental hazards (arena obstacles, traps)

**Status Effects:**

| Effect | Duration | Impact |
|--------|----------|--------|
| Stun | 0.5-2s | Cannot move or act |
| Slow | 3-5s | -50% movement speed |
| Bleed | 5-10s | Lose 2% HP/sec |
| Burn | 3-6s | Lose 3% HP/sec |
| Root | 2-4s | Cannot move |
| Silence | 2-5s | Cannot cast abilities |

---

### 9.2 Additional Classes

**New Classes:**
- **Paladin:** Hybrid tank/healer (CON, FAITH, DEF focus)
- **Ranger:** Ranged specialist (DEX, SPD, projectiles)
- **Warlock:** DoT/debuff mage (ARC, status effects)

**Implementation:**
- New skill trees (4-5 branches each)
- Class-specific abilities
- Starter gear variants

---

### 9.3 Arena Variety

**New Maps:**
- Colosseum (classic, open)
- Dungeon Arena (tight corridors, choke points)
- Floating Platforms (environmental hazards)
- Lava Pit (fire damage zones)

**Implementation:**
- Map selection UI
- Environment-specific obstacles
- Map-specific spawn points

---

### 9.4 Weapon Expansion

**New Weapon Types:**
- Dual Wield (fast combo attacks)
- Two-Handed Sword (slow, high damage)
- Crossbow (ranged, reload mechanic)
- Whip (mid-range, crowd control)
- Shield (defensive, block stance)

---

## Sprint 10: Economy & Marketplace

**Duration:** 3-4 weeks
**Focus:** Player-to-player trading and ETH integration

### 10.1 Marketplace

**Objectives:**
- List Gladiators and equipment for sale
- Buy/sell with ETH or Gold
- Royalty system for creators
- Search/filter by stats, rarity, class

**Implementation:**
1. Marketplace contract (escrow, royalties)
2. Listing UI (set price, duration)
3. Search/filter UI
4. Transaction history

---

### 10.2 Gold → ETH Conversion

**Objectives:**
- Players can purchase Gold with ETH
- Gold pricing based on market rates
- Secure payment processing (Stripe, on-chain)

**Implementation:**
1. Payment gateway integration
2. Gold packages (100, 500, 1000, 5000)
3. Transaction receipts and history

---

### 10.3 Crafting Economy

**Objectives:**
- Crafting costs Gold (in addition to items)
- Rare materials required for higher rarities
- Crafting success rates (chance to fail)

**Implementation:**
1. Crafting recipe system
2. Material drops from matches
3. Success rate UI and animations

---

## Sprint 11: Competitive Features

**Duration:** 3-4 weeks
**Focus:** Ranked play, tournaments, seasons

### 11.1 Ranked Matchmaking

**Objectives:**
- Elo-based ranking system
- Division tiers (Bronze, Silver, Gold, Platinum, Diamond)
- Seasonal resets
- Rank decay for inactivity

**Implementation:**
1. Elo calculation (win/loss adjustments)
2. Matchmaking algorithm (skill-based)
3. Rank UI and progression
4. Seasonal rewards (loot boxes, cosmetics)

---

### 11.2 Tournaments

**Objectives:**
- Bracket-style tournaments (8, 16, 32 players)
- Entry fees and prize pools
- Tournament history and replays

**Implementation:**
1. Tournament creation UI
2. Bracket visualization
3. Match scheduling
4. Prize distribution (ETH or Gold)

---

### 11.3 Leaderboards

**Objectives:**
- Global leaderboards (wins, ranking, KDA)
- Class-specific leaderboards
- Weekly/monthly/all-time tabs

**Implementation:**
1. Leaderboard API (cached, paginated)
2. Leaderboard UI with filters
3. Player profile links

---

## Sprint 12: Social & Community

**Duration:** 2-3 weeks
**Focus:** Guilds, chat, replays

### 12.1 Guilds

**Objectives:**
- Create/join guilds
- Guild leaderboards
- Guild vs Guild tournaments

**Implementation:**
1. Guild model (name, tag, members)
2. Guild management UI
3. Guild chat

---

### 12.2 Match Replays

**Objectives:**
- Save full match state (events, actions)
- Replay viewer with timeline scrubbing
- Share replay links

**Implementation:**
1. Store full event log (compressed)
2. Replay player UI (play/pause/scrub)
3. Replay share links

---

### 12.3 Chat & Messaging

**Objectives:**
- In-game chat (global, guild, whisper)
- Friend messages
- Match pre-game chat

**Implementation:**
1. Chat server (Socket.io or dedicated)
2. Chat UI (tabbed, notifications)
3. Moderation tools (mute, report)

---

## Sprint 13: Anti-Cheat & Security

**Duration:** 2-3 weeks
**Focus:** Server validation, bot detection, exploit prevention

### 13.1 Anti-Cheat Measures

**Objectives:**
- Server-side action validation (cooldowns, stamina, position)
- Bot detection (timing patterns, input analysis)
- Replay review for suspected cheaters

**Implementation:**
1. Action validation service (rate limits, physics checks)
2. Anomaly detection (ML-based or heuristic)
3. Ban system (temporary, permanent)

---

### 13.2 Exploit Prevention

**Objectives:**
- Rate limiting on APIs
- Input sanitization
- Blockchain transaction validation

**Implementation:**
1. API rate limiting (per user, per IP)
2. Input validation middleware
3. Transaction replay prevention

---

## Sprint 14: Polish & Scale

**Duration:** Ongoing
**Focus:** Performance, UX, content updates

### 14.1 Performance Optimization

**Objectives:**
- Reduce server latency (<50ms avg)
- Optimize frontend rendering (60 FPS)
- Database query optimization

**Implementation:**
1. Redis caching (leaderboards, user data)
2. CDN for static assets
3. Database indexing and query tuning

---

### 14.2 UX Improvements

**Objectives:**
- Onboarding tutorial
- Better tooltips and help text
- Accessibility (keyboard nav, screen readers)

**Implementation:**
1. Tutorial system (step-by-step, skippable)
2. Contextual help tooltips
3. WCAG compliance audit

---

### 14.3 Content Updates

**Objectives:**
- New weapons, armor sets, perks
- Seasonal events (limited-time modes)
- Cosmetic items (skins, emotes)

**Implementation:**
1. Content pipeline (design → admin UI → publish)
2. Event system (start/end dates, rewards)
3. Cosmetics shop (purchase with Gold)

---

## Long-Term Vision (Beyond Sprint 14)

**Year 1+:**
- Mobile app (iOS, Android)
- Cross-platform play
- Esports integration (streaming, spectator mode)
- NFT breeding (combine Gladiators → new NFT)
- Land/territory system (guild-owned arenas)
- PvE campaigns (story mode, boss fights)

**Blockchain Evolution:**
- Mainnet deployment (Polygon, Arbitrum, or custom L2)
- Token economy (governance token, staking)
- On-chain tournaments (smart contract prize pools)

---

## Success Metrics

**Demo Success Criteria (Sprints 1-7):**
- 100+ registered users
- 500+ matches played
- 50+ Gladiators minted
- Combat feels responsive (<100ms perceived latency)
- Positive player feedback (fun, engaging)

**Post-Demo Success Criteria (Sprints 8-14):**
- 1000+ registered users
- 10,000+ matches played
- 500+ Gladiators minted
- Active marketplace (20+ transactions/day)
- Ranked play adoption (30%+ of matches)
- Player retention (30% return after 7 days)

---

## References

- `docs/plans/00-MASTER-PLAN.md` — Overall project roadmap
- `docs/features/perks-and-abilities.md` — Perks & abilities design
- `docs/features/equipment.md` — Equipment and loot system
- `README.md` — Project overview and out-of-scope features
