/**
 * Arena status copy for the homepage. When the arena is closed we show a
 * randomly chosen witty message; when open we show "Open for Battle!".
 * Toggle via NEXT_PUBLIC_ARENA_OPEN=true when the demo goes live.
 */

export const ARENA_STATUS_OPEN = 'Open for Battle!'

export const ARENA_STATUS_CLOSED: readonly string[] = [
  'Under construction…',
  'Gathering audience…',
  'The sand is still settling…',
  'Senators are still debating the program…',
  'Beasts not yet delivered…',
  'Awaiting the emperor\'s signal…',
  'Whetstones at the ready…',
  'Gladiators limbering up…',
  'Doors sealed until the auspices are favorable…',
  'Patience — the crowd demands a worthy spectacle…',
] as const

function randomInt(max: number): number {
  return Math.floor(Math.random() * max)
}

/**
 * Returns whether the arena is considered "open" (demo live).
 * Set NEXT_PUBLIC_ARENA_OPEN=true when beta opens.
 */
export function isArenaOpen(): boolean {
  return process.env.NEXT_PUBLIC_ARENA_OPEN === 'true'
}

/**
 * Returns the arena status line to display: either the open status or a
 * randomly chosen closed status.
 */
export function getArenaStatus(): string {
  if (isArenaOpen()) {
    return ARENA_STATUS_OPEN
  }
  const index = randomInt(ARENA_STATUS_CLOSED.length)
  return ARENA_STATUS_CLOSED[index]
}
