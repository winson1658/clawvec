// features/universe/types/universe.types.ts
// v2.1 — 3D particles with color-tier force system

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
  fragmentId?: string
  aiOwnerId?: string      // who launched this particle
  createdAt: number
}

export interface UniverseState {
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

export type ViewMode = 'orbit' | 'inspect'
