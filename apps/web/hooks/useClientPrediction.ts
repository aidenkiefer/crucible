/**
 * Client-Side Prediction Hook
 * Applies movement locally for snappier feel, reconciles with server state
 */

import { useRef, useEffect } from 'react'
import { Movement, Vector, PHYSICS_CONSTANTS } from '@gladiator/shared/src/physics'
import type { Vec2 } from '@gladiator/shared/src/physics'

interface InputState {
  moveX: number
  moveY: number
  facing: number
}

interface PredictedState {
  position: Vec2
  facing: number
  lastServerUpdate: number
}

interface ServerState {
  position: Vec2
  facing: number
  moveSpeed: number
}

const RECONCILIATION_THRESHOLD = 2 // units
const LERP_SPEED = 0.2 // smooth correction speed

/**
 * Client prediction hook for local player movement
 *
 * @param serverState - Latest state from server
 * @param localInput - Current input from player
 * @param isLocalPlayer - Whether this is the local player (only predict local player)
 * @returns Predicted state for rendering
 */
export function useClientPrediction(
  serverState: ServerState | null,
  localInput: InputState | null,
  isLocalPlayer: boolean
): { position: Vec2; facing: number } | null {
  const predictedStateRef = useRef<PredictedState | null>(null)
  const lastUpdateTimeRef = useRef<number>(Date.now())

  // Initialize predicted state from first server update
  useEffect(() => {
    if (!isLocalPlayer || !serverState) return

    // Initialize if we don't have predicted state yet
    if (!predictedStateRef.current) {
      predictedStateRef.current = {
        position: { ...serverState.position },
        facing: serverState.facing,
        lastServerUpdate: Date.now(),
      }
      return
    }

    // Reconcile with server state
    const predicted = predictedStateRef.current
    const serverPos = serverState.position
    const distance = Vector.distance(predicted.position, serverPos)

    // If difference is large, snap to server position
    if (distance > RECONCILIATION_THRESHOLD) {
      predicted.position = { ...serverPos }
      predicted.facing = serverState.facing
    } else if (distance > 0.1) {
      // Small difference: smooth lerp toward server position
      predicted.position = Vector.lerp(predicted.position, serverPos, LERP_SPEED)
    }

    predicted.lastServerUpdate = Date.now()
  }, [serverState, isLocalPlayer])

  // Apply local prediction every frame
  useEffect(() => {
    if (!isLocalPlayer || !predictedStateRef.current || !localInput) return

    const intervalId = setInterval(() => {
      if (!predictedStateRef.current || !localInput || !serverState) return

      const now = Date.now()
      const dt = now - lastUpdateTimeRef.current
      lastUpdateTimeRef.current = now

      // Skip if delta time is too large (tab was inactive)
      if (dt > 100) return

      const predicted = predictedStateRef.current

      // Apply input immediately for snappy feel
      if (localInput.moveX !== 0 || localInput.moveY !== 0) {
        const direction = { x: localInput.moveX, y: localInput.moveY }
        const velocity = Movement.calculateVelocity(
          direction,
          serverState.moveSpeed
        )

        // Update position with physics
        predicted.position = Movement.updatePosition(
          predicted.position,
          velocity,
          dt
        )
      }

      // Update facing from input
      predicted.facing = localInput.facing
    }, PHYSICS_CONSTANTS.TICK_INTERVAL) // Update at same rate as server

    return () => clearInterval(intervalId)
  }, [isLocalPlayer, localInput, serverState])

  // Return predicted state for local player, null for others
  if (!isLocalPlayer || !predictedStateRef.current) {
    return null
  }

  return {
    position: predictedStateRef.current.position,
    facing: predictedStateRef.current.facing,
  }
}
