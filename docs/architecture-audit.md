# Crucible Architecture Review and Viability Assessment

## Overview

This document evaluates the technical viability of Crucible’s current architecture for supporting a real-time, web-based competitive multiplayer game. The primary goal is to determine whether the current implementation can scale to ~1,000 concurrent players while maintaining a responsive, secure, and deterministic gameplay experience.

The architecture has been reviewed across five major criteria:

* Architectural Design & Separation of Concerns
* Combat Simulation Model
* Real-time Communication & Network Model
* Server Scalability & Deployment Path
* Risks, Tradeoffs & Recommendations

## Architecture Summary

Crucible uses a clean three-tier design:

* **Frontend (Next.js):**

  * Browser-based WebSocket client
  * 60 FPS Canvas renderer
  * Wallet integration via Wagmi + viem

* **Game Server (Node.js):**

  * Socket.io for WebSocket connections
  * Runs 20 Hz deterministic combat tick loop
  * Match state held in-memory
  * Physics and combat calculations via shared package
  * CPU AI and action dispatch

* **Shared Logic Package:**

  * Deterministic combat and physics engine
  * Weapon and stat definitions
  * Collision detection, stamina, and projectiles

* **Database (Supabase/PostgreSQL):**

  * Template data authored via admin UI
  * Bundles exported to Supabase Storage as JSON
  * Match writebacks (XP/loot) done post-match

* **Blockchain (Polygon):**

  * Gladiator NFT minting with class-based stats
  * Gladiator ownership tracked on-chain

## Strengths

* ✅ Server-authoritative combat prevents client-side cheating
* ✅ Shared combat logic reduces duplication and desync bugs
* ✅ Match state is kept in-memory for low-latency responsiveness
* ✅ Static template loading avoids DB queries during matches
* ✅ Architecture supports clean separation between authoring and runtime
* ✅ MVP-focused approach with escape hatches for later scaling

## Key Risks and Gaps

### Performance and Scale

* ⚠ **Node.js is single-threaded.** Running many 20 Hz match loops in one process can bottleneck on CPU.
* ⚠ **WebSocket scaling requires sticky sessions or a shared pub/sub layer.** Current architecture assumes a single-instance model.

### Real-Time Responsiveness

* ⚠ **20 Hz server tick rate** risks input lag or jitter; needs client-side prediction and interpolation to feel smooth.
* ⚠ **No interpolation layer** means visible rubberbanding under network jitter.
* ⚠ **No input buffering or prediction yet** for fast local feedback.

### Determinism and Integrity

* ⚠ **Floating point math may desync across platforms.** Consider fixed timestep simulation and integer/fixed-point math.
* ⚠ **Clients could still submit malformed or overclocked inputs**; server must validate everything.

### Operational Considerations

* ⚠ **Match state is volatile**. Crashes during ETH-wagered games could cause disputes.
* ⚠ **No logging or input replay system** for dispute resolution or debugging.

## Recommendations

### Scaling Path

* Use **sticky sessions + load balancer** to horizontally scale WebSocket servers.
* Introduce **Redis pub/sub** or similar to sync events across game servers.
* Launch one Node.js process per core or container, ideally running one match loop per thread.

### Combat Engine Improvements

* Increase **server simulation tick to 60 Hz** for better hit detection.
* **Throttle broadcast rate to 20 Hz** with interpolation for opponents.
* Implement **client-side prediction** for local player input.
* Add **interpolation** for remote combatants and projectiles.

### Data and Logic

* Continue using bundle-based template data.
* Ensure **template version syncing** across frontend and backend.
* Add **runtime checksums or bundle hashes** to avoid client/server mismatch.

### Reliability and Recovery

* Log input streams for matches with wagers.
* Optionally run a **headless validator** process to replay and verify integrity.
* Persist match results only after verified conclusion.

### Security

* Validate every input on the server: stamina, cooldown, range, collision.
* Limit input frequency per client to prevent overclocking.
* Consider TLS for WebSocket connections.

## Conclusion

Crucible’s current architecture is a solid foundation for a scalable, deterministic multiplayer web game. While MVP development can proceed as-is, future PvP and ETH wagering will require:

* better smoothing and prediction,
* scalable socket infrastructure,
* deterministic input validation,
* and some fault tolerance.

No major re-architecture is needed today, but tight implementation and gradual ops upgrades will be essential as concurrency and stakes increase.

---

*Last reviewed: 2026-02-04*
