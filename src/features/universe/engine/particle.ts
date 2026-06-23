// features/universe/engine/particle.ts
// Particle v2.1 — color-tier physics, mass decay, fusion cooldown

import type { ParticleData } from '../types/universe.types'
import { hueToTier, type ColorTier } from './forceMap'

let _idCounter = 0

export interface ParticleOptions {
  x: number
  y: number
  z?: number
  vx?: number
  vy?: number
  vz?: number
  mass?: number
  hue?: number
  energy?: number
  name?: string
  fragmentId?: string
  aiOwnerId?: string
}

export function createParticle(opts: ParticleOptions): ParticleData {
  const hue = opts.hue ?? Math.random() * 360
  const tier = hueToTier(hue)
  return {
    id: `p_${++_idCounter}_${Date.now()}`,
    x: opts.x,
    y: opts.y,
    z: opts.z ?? (Math.random() - 0.5) * 100,
    vx: opts.vx ?? 0,
    vy: opts.vy ?? 0,
    vz: opts.vz ?? 0,
    mass: opts.mass ?? 1 + Math.random() * 3,
    hue,
    colorTier: tier,
    energy: opts.energy ?? 1.0,
    fusionThreshold: 5,
    fusionCooldownUntil: 0,
    name: opts.name,
    fragmentId: opts.fragmentId,
    aiOwnerId: opts.aiOwnerId,
    createdAt: Date.now(),
  }
}

/**
 * Decay a particle's energy over time.
 * Also apply mass decay for large particles (Hawking radiation).
 */
export function decayParticle(
  p: ParticleData,
  dt: number,
  neighborCount: number,
): ParticleData {
  const baseDecay = 0.0002
  const isoFactor = neighborCount === 0 ? 3 : 1
  let energy = Math.max(0, p.energy - baseDecay * dt * isoFactor)

  // Mass decay for large particles (m > 15)
  let mass = p.mass
  if (mass > 15) {
    mass -= mass * 0.001 * dt  // -0.1% per second
    mass = Math.max(0.1, mass)
  }

  return { ...p, energy, mass }
}

/**
 * Check if a particle is dead.
 */
export function isDead(p: ParticleData): boolean {
  return p.energy <= 0 || p.mass <= 0.05
}

/**
 * Fuse two particles. Returns the new fused particle.
 * Fusion costs more energy than v2.0.
 */
export function fuseParticles(a: ParticleData, b: ParticleData): ParticleData {
  const totalMass = a.mass + b.mass
  const wa = a.mass / totalMass
  const wb = b.mass / totalMass

  const fusedHue = (a.hue * wa + b.hue * wb)

  return {
    id: `p_fusion_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    x: a.x * wa + b.x * wb,
    y: a.y * wa + b.y * wb,
    z: a.z * wa + b.z * wb,
    vx: (a.vx * a.mass + b.vx * b.mass) / totalMass * 0.7,
    vy: (a.vy * a.mass + b.vy * b.mass) / totalMass * 0.7,
    vz: (a.vz * a.mass + b.vz * b.mass) / totalMass * 0.7,
    mass: totalMass,
    hue: fusedHue,
    colorTier: hueToTier(fusedHue),
    energy: Math.min(1, (a.energy + b.energy) * 0.5),
    fusionThreshold: Math.min(20, Math.max(a.fusionThreshold, b.fusionThreshold) * 1.15),
    fusionCooldownUntil: Date.now() + 2000, // 2s cooldown
    name: `${a.name || '?'} ⊕ ${b.name || '?'}`,
    createdAt: Date.now(),
  }
}

/**
 * Check if a particle is still in fusion cooldown.
 */
export function isInCooldown(p: ParticleData): boolean {
  return Date.now() < (p.fusionCooldownUntil ?? 0)
}

/**
 * Create a pool of seed particles with distributed color tiers.
 */
export function createSeedParticles(
  count: number,
  width: number,
  height: number,
): ParticleData[] {
  const particles: ParticleData[] = []
  const tierHues: Record<ColorTier, number> = {
    red: 0, orange: 30, yellow: 60, green: 120,
    blue: 195, indigo: 255, violet: 290,
  }
  const tierKeys = Object.keys(tierHues) as ColorTier[]

  for (let i = 0; i < count; i++) {
    const tier = tierKeys[i % tierKeys.length]
    const baseHue = tierHues[tier]
    const hue = baseHue + (Math.random() - 0.5) * 25

    particles.push(
      createParticle({
        x: width * 0.15 + Math.random() * width * 0.7,
        y: height * 0.15 + Math.random() * height * 0.7,
        z: (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        vz: (Math.random() - 0.5) * 10,
        mass: 1 + Math.random() * 4,
        hue,
        name: `seed_${tier}_${i}`,
      }),
    )
  }
  return particles
}
