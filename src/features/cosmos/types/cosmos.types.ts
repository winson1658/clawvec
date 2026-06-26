// features/cosmos/types/cosmos.types.ts
// v2.3 — richer force system: burst, shear, oscillation, wake

import type { ColorTier } from '../engine/forceMap'

export interface ParticleData {
  id: string
  name?: string
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  mass: number
  hue: number             // 0-360
  colorTier: ColorTier    // red/orange/yellow/green/blue/indigo/violet
  energy: number          // 0-1
  fusionThreshold: number // max 20
  fusionCooldownUntil: number  // timestamp, 0 = no cooldown
  burstCooldownUntil: number  // timestamp, 0 = no cooldown (v2.3)
  echoId?: string         // who launched this particle (原 fragmentId)
  aiOwnerId?: string      // who launched this particle
  createdAt: number
  /** v2.4 Immortal Traces: names of all particles fused into this one */
  fusedNames: string[]
  /** v2.4 Immortal Traces: IDs of all particles fused into this one (for future split) */
  fusedIds: string[]
}

export interface WakeTrail {
  x: number
  y: number
  z: number
  strength: number
  age: number  // ms since creation
}

export interface CosmosState {
  particles: ParticleData[]
  stats: {
    totalParticles: number
    activeClusters: number
    lastFusion: string | null
  }
}

export interface LaunchParams {
  name?: string
  angle: number
  power: number
  hue: number
  mass: number
  aiOwnerId?: string
}

export interface FusionEvent {
  id: string
  particle1Id: string
  particle2Id: string
  resultId: string
  x: number
  y: number
  z: number
  timestamp: number
}

/** Visual burst event for renderer flash effects */
export interface BurstEvent {
  id: string
  x: number
  y: number
  z: number
  timestamp: number
  strength: number  // 0-1
}

export type ViewMode = 'orbit' | 'inspect'
