# Planned Features & Ideas

A living doc for prioritised work, game-system thinking, long-term ideas, and raw brainstorming. Sourced from **concept.md** (abstract vision, excluded scope, open questions), **README.md** (current progress), and **docs/plans/00-MASTER-PLAN.md** (demo sprints, post-demo roadmap). Not a commitment list—use it to capture and organise what might come next.

---

## Immediate / Critical

Features and fixes that are high priority for the current milestone or release (demo completion).

- **Complete Sprints 3–7 per master plan:** Frontend real-time combat UI (Sprint 3), weapons & projectiles (Sprint 4), progression & loot (Sprint 5), multiplayer PvP (Sprint 6), polish & deployment (Sprint 7). See [00-MASTER-PLAN.md](../plans/00-MASTER-PLAN.md).
- **Demo success criteria:** Mint Gladiator → equip gear → fight CPU with smooth animations → Quick Match / friend challenges → deterministic outcomes → level up / skill trees → loot with rarity + crafting. See README and master plan.
- **Critical path:** Game data bundle published (templates → JSON/TS); runtime loads from bundle; no live DB template queries in combat. See data-glossary and equipment.md.
- (Add ad-hoc critical bugs or blockers here as they arise.)

---

## Abstract Game Systems

Broader system design ideas: mechanics, loops, economy, progression, or feel. Good for discussion and design docs before implementation. Many of these are from **concept.md** “Open Questions” or implied by the concept but not committed in the demo.

- **Combat pacing:** Demo chose real-time 20Hz. Revisit “real-time vs faster tick” for feel (e.g. 40Hz) or accessibility (slower tick) in future. *Concept § Open Questions.*
- **Permadeath vs retirement:** When a Gladiator is defeated or retired—permadeath, retirement with rewards, or respawn? Intentionally undecided; do not implement in demo. *Concept § Open Questions.*
- **Long-term economy design:** How equipment, loot, and progression tie into a sustainable economy; token or non-token. Not in demo. *Concept § Open Questions.*
- **Loot acquisition systems:** Beyond demo “loot drops with rarity + crafting”: how players earn or acquire gear (drops only, quests, marketplace, events). *Concept § Open Questions.*
- **Tournament structures:** Bracket design, seeding, rewards, scheduling. Design only for now; implementation is post-demo. *Concept § Open Questions; Master Plan Phase 2.*
- **Non-crypto onboarding:** Concept assumes “crypto-native users acceptable” for demo; “non-crypto onboarding” is an open question for later (e.g. custodial wallets, email/social-only play). *Concept § Open Questions, Wallets & UX.*
- **Visual identity & cosmetics:** Concept: Gladiator “visual seed” for sprite variants; “titles / achievements”; “cosmetic markers (scars, banners).” Abstract system for identity and progression flavour; not required for demo. *Concept § Gladiators (Mutable State).*
- **Class innate abilities:** Concept: “Innate Ability” on Gladiators. Demo: weapon-based kits only; class abilities deferred. Design space for 1–2 signature abilities per class. *Concept § Gladiators; equipment.md § Weapon-Based Kits (Future).*
- **Equipment-on-chain vs pseudo-NFT:** Concept: “Equipment may be static or pseudo-NFTs; full on-chain item minting can be stubbed.” Abstract choice: when/how to move equipment to chain (e.g. ERC-1155). *Concept § Equipment.*
- **2D art pipeline:** Concept: 2D pixel-art; Aseprite (sprites + animation); PixelLab (UI/marketing); sprite sheets + JSON metadata; layered rendering for equipment; animation state machine per Gladiator. Design the pipeline; demo uses programmer art. *Concept § Rendering & Visuals.*
- **Indexing layer pattern:** Concept: listen to on-chain events (mint, transfer), store in DB, serve fast queries to client; avoid RPC-heavy reads from frontend. Demo already has event listener; extend pattern for transfers, metadata, history. *Concept § Data & Indexing.*
- **Fair randomness (post-demo):** Demo uses `block.prevrandao` (pseudo-random); production may want Chainlink VRF or similar for mint/stats. *Sprint 1 summary / security.*

---

## Way Down the Line (Post-Launch)

Ideas for after launch and once there’s a player base: new modes, content, social features, live ops. Includes **concept “Explicitly Excluded”**, **master plan Out of Scope**, and **Post-Demo Roadmap (Phase 2 & 3)**.

- **Marketplace UI** for trading Gladiators/items. *Concept § Excluded; Master Plan Phase 2.*
- **Loot boxes or gacha mechanics.** *Concept § Excluded; Master Plan Out of Scope.*
- **Breeding or forging systems.** *Concept § Excluded; Master Plan Out of Scope.*
- **Token economics** or cryptocurrency rewards; **real-money guarantees or redemption.** *Concept § Excluded; Master Plan Out of Scope.*
- **Advanced ranking:** Elo, seasons, ladder resets. *Concept § Excluded; Master Plan Out of Scope; Phase 2 “Elo ranking”.*
- **Tournament brackets** and structured competitions. *Concept § Open Questions; Master Plan Out of Scope; Phase 2 “tournament system”.*
- **Guild/clan systems.** *Master Plan Out of Scope.*
- **Chat or social features** beyond friend challenges. *Master Plan Out of Scope.*
- **Large-scale live ops.** *Concept § Excluded.*
- **Mainnet deployment** (Polygon or Base); mainnet migration guide. *Master Plan Phase 2.*
- **Custom pixel art** (replace programmer art); Aseprite/sprite pipeline. *Master Plan Phase 2; Concept § Rendering.*
- **New Gladiator classes;** more equipment types (shields, accessories). *Master Plan Phase 3.*
- **PvE campaign mode.** *Master Plan Phase 3.*
- **Mobile responsive design;** sound effects and music. *Master Plan Phase 3.*
- **Skins / cosmetics** (e.g. thematic skins: Goku, Luffy, Tekken-style). *User-added.*

---

## Other / Brainstorming

Random ideas, “what if” notes, and rough thoughts. No need to categorise—dump here and refine later.

- **Design constraints (agents/implementers):** Do not overbuild; prefer stubs and interfaces; keep systems modular; avoid premature optimisation; treat blockchain as ownership, not gameplay logic; clean boundaries, simple flows, replaceable components. *Concept § Design Constraints for AI Scaffolding.*
- **IPFS/Pinata** for NFT metadata (optional for demo; production metadata). *Concept § Blockchain; Master Plan § Infrastructure.*
- **Account abstraction** for smoother wallet UX (not required for demo). *Concept § Wallets & UX.*
- **Spectator mode** for PvP matches (optional in Sprint 6). *Master Plan Sprint 6.*
- **Durability** on equipment (explicitly deferred in data-glossary demo scope). *docs/data-glossary.md §10.*
- **Affix combinatorics** and deep loot roll systems (deferred). *docs/features/equipment.md; data-glossary §10.*
- **Class signature abilities** (1–2 per class) and passives; weapons remain primary source of attacks. *docs/features/equipment.md § Weapon-Based Kits (Future).*
- (Add other rough ideas here.)
