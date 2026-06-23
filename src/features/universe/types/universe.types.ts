// features/universe/types/universe.types.ts

export interface ParticleData {
  id: string
  name?: string
  x: number
  y: number
  vx: number
  vy: number
  mass: number
  hue: number        // 0-360
  energy: number     // 0-1, decays over time
  affinityMatrix: Record<number, number>  // hue -> affinity (-1 to 1)
  fusionThreshold: number
  fragmentId?: string
  createdAt: number   // timestamp
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
  angle: number       // radians, 0 = right
  power: number       // initial velocity magnitude
  hue: number
  mass: number
}

export interface FusionEvent {
  id: string
  particle1Id: string
  particle2Id: string
  resultId: string
  x: number
  y: number
  timestamp: number
}
