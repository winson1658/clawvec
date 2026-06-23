// features/universe/engine/particle.ts
// Particle class — represents a single entity in the gravity field

import type { ParticleData } from '../types/universe.types'

let _idCounter = 0

export function createParticle(overrides: Partial<ParticleData> = {}): ParticleData {
  const hue = overrides.hue ?? Math.random() * 360
  return {
    id: `p_${++_idCounter}_${Date.now()}`,
    x: overrides.x ?? Math.random() * 800,
    y: overrides.y ?? Math.random() * 600,
    vx: overrides.vx ?? 0,
    vy: overrides.vy ?? 0,
    mass: overrides.mass ?? 1 + Math.random() * 3,
    hue,
    energy: overrides.energy ?? 1.0,
    affinityMatrix: overrides.affinityMatrix ?? generateAffinityMatrix(hue),
    fusionThreshold: overrides.fusionThreshold ?? 5,
    name: overrides.name,
    fragmentId: overrides.fragmentId,
    createdAt: overrides.createdAt ?? Date.now(),
  }
}

/**
 * Generate a default affinity matrix for a particle.
 * Similar hues attract, complementary hues repel slightly.
 */
function generateAffinityMatrix(hue: number): Record<number, number> {
  const matrix: Record<number, number> = {}
  // Sample at 30° intervals
  for (let h = 0; h < 360; h += 30) {
    const diff = Math.abs(hue - h)
    const dist = Math.min(diff, 360 - diff)
    // Closer hues = stronger attraction
    // Far hues (opposite side of wheel) = slight repulsion
    matrix[h] = 1 - (dist / 180) * 1.5
  }
  return matrix
}

/**
 * Get affinity between two particles based on their hue.
 */
export function getAffinity(a: ParticleData, b: ParticleData): number {
  const diff = Math.abs(a.hue - b.hue)
  const dist = Math.min(diff, 360 - diff)
  // cos-based: similar = +1, opposite = -1
  return Math.cos((dist / 180) * Math.PI)
}

/**
 * Decay a particle's energy over time.
 * Isolated particles decay faster.
 */
export function decayEnergy(p: ParticleData, dt: number, neighborCount: number): ParticleData {
  const baseDecay = 0.0002 // base decay per second
  const isolationFactor = neighborCount === 0 ? 3 : 1
  const newEnergy = Math.max(0, p.energy - baseDecay * dt * isolationFactor)
  return { ...p, energy: newEnergy }
}

/**
 * Check if a particle is dead (energy depleted).
 */
export function isDead(p: ParticleData): boolean {
  return p.energy <= 0
}

/**
 * Calculate fusion result of two particles.
 */
export function fuseParticles(a: ParticleData, b: ParticleData): ParticleData {
  const totalMass = a.mass + b.mass
  // Weighted average for position, velocity, hue
  const wa = a.mass / totalMass
  const wb = b.mass / totalMass

  return {
    id: `p_fusion_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    x: a.x * wa + b.x * wb,
    y: a.y * wa + b.y * wb,
    vx: (a.vx * a.mass + b.vx * b.mass) / totalMass,
    vy: (a.vy * a.mass + b.vy * b.mass) / totalMass,
    mass: totalMass,
    hue: (a.hue * wa + b.hue * wb),
    energy: Math.min(1, (a.energy + b.energy) * 0.8), // fusion costs some energy
    affinityMatrix: a.affinityMatrix, // inherit from larger particle
    fusionThreshold: Math.max(a.fusionThreshold, b.fusionThreshold) * 1.2,
    name: `${a.name || '?'} ⊕ ${b.name || '?'}`,
    createdAt: Date.now(),
  }
}
