// features/cosmos/engine/particle.ts
// Particle v2.1 — color-tier physics, mass decay, fusion cooldown

import type { ParticleData } from '../types/cosmos.types'
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
  echoId?: string
  aiOwnerId?: string
}

export function createParticle(opts: ParticleOptions): ParticleData {
  const hue = opts.hue ?? Math.random() * 360
  const tier = hueToTier(hue)
  return {
    id: `p_${++_idCounter}_${Date.now()}`,
    x: opts.x,
    y: opts.y,
    z: opts.z ?? (Math.random() - 0.5) * 400,
    vx: opts.vx ?? 0,
    vy: opts.vy ?? 0,
    vz: opts.vz ?? 0,
    mass: opts.mass ?? 1 + Math.random() * 3,
    hue,
    colorTier: tier,
    energy: opts.energy ?? 1.0,
    fusionThreshold: 25,           // increased — fusion must be rare
    fusionCooldownUntil: 0,
    burstCooldownUntil: 0,
    name: opts.name,
    echoId: opts.echoId,
    aiOwnerId: opts.aiOwnerId,
    createdAt: Date.now(),
    fusedNames: [],  // v2.4: starts empty, fills on fusion
    fusedIds: [],    // v2.4: starts empty, fills on fusion
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
  // Energy no longer decays over time — only lost through fusion or degrade effects
  // This prevents particles from dying due to passive energy loss
  let energy = p.energy

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
  return p.energy <= 0.001 || p.mass <= 0.05  // energy floor at 0.05 ensures degrade/burst never kills
}

/**
 * v2.4 Immortal Traces: fuseParticles is now a convenience helper.
 * The primary fusion logic is in nbody.ts Phase 7 (in-place merge).
 * This function still works for programmatic fusion outside the sim loop.
 */
export function fuseParticles(a: ParticleData, b: ParticleData): ParticleData {
  const totalMass = a.mass + b.mass
  const wa = a.mass / totalMass
  const wb = b.mass / totalMass

  // v2.9.9: 多數決顏色（非 Hue 平均），保留色階身份以利持續融合
  const allNames = [...new Set([
    ...(a.fusedNames.length > 0 ? a.fusedNames : [a.name || '?']),
    ...(b.fusedNames.length > 0 ? b.fusedNames : [b.name || '?']),
  ])]
  const allIds = [...new Set([
    ...(a.fusedIds.length > 0 ? a.fusedIds : [a.id]),
    ...(b.fusedIds.length > 0 ? b.fusedIds : [b.id]),
  ])]

  // 多數決：計算每個顏色出現次數，取最多票
  const colorVotes: Record<string, number> = {}
  for (const name of allNames) {
    colorVotes[name] = (colorVotes[name] || 0) + 1
  }
  const dominantColor = Object.entries(colorVotes)
    .sort((a, b) => b[1] - a[1])[0][0]

  // 顏色名稱 → hue 映射
  const nameToHue: Record<string, number> = {
    'Red': 0, 'Orange': 30, 'Yellow': 60, 'Green': 120,
    'Blue': 195, 'Indigo': 255, 'Violet': 290,
  }
  const fusedHue = nameToHue[dominantColor] ?? Math.random() * 360

  return {
    id: `p_fusion_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    x: a.x * wa + b.x * wb,
    y: a.y * wa + b.y * wb,
    z: a.z * wa + b.z * wb,
    vx: (a.vx * a.mass + b.vx * b.mass) / totalMass,
    vy: (a.vy * a.mass + b.vy * b.mass) / totalMass,
    vz: (a.vz * a.mass + b.vz * b.mass) / totalMass,
    mass: totalMass,
    hue: fusedHue,
    colorTier: hueToTier(fusedHue),
    energy: Math.min(1, (a.energy + b.energy) * 0.7 + 0.2),
    fusionThreshold: Math.min(25, Math.max(a.fusionThreshold, b.fusionThreshold) * 1.05),
    fusionCooldownUntil: Date.now() + 30000,
    burstCooldownUntil: 0,
    name: allNames.join(' ⊕ '),
    createdAt: Date.now(),
    fusedNames: allNames,
    fusedIds: allIds,
  }
}

/**
 * v2.6 Fission: split a heavily-fused particle back into individual particles.
 * Each original name spawns as a new particle at a random position near the parent,
 * with an outward supernova burst velocity.
 */
export function fissionParticle(p: ParticleData): ParticleData[] {
  const names = p.fusedNames.length > 0 ? p.fusedNames : [p.name || '?']
  const baseSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz) || 30

  return names.map((name) => {
    const angle = Math.random() * Math.PI * 2
    const spreadR = 30 + Math.random() * 60  // 30-90px spread
    return createParticle({
      x: p.x + Math.cos(angle) * spreadR,
      y: p.y + Math.sin(angle) * spreadR,
      z: p.z + (Math.random() - 0.5) * 150,
      vx: Math.cos(angle) * baseSpeed * (0.5 + Math.random() * 1.5),
      vy: Math.sin(angle) * baseSpeed * (0.5 + Math.random() * 1.5),
      vz: (Math.random() - 0.5) * baseSpeed * 2,
      mass: 1 + Math.random() * 3,
      hue: Math.random() * 360,
      name,
    })
  })
}

/**
 * Check if a particle is still in fusion cooldown.
 */
export function isInCooldown(p: ParticleData): boolean {
  return Date.now() < (p.fusionCooldownUntil ?? 0)
}

/**
 * Check if a particle is still in burst cooldown.
 */
export function isInBurstCooldown(p: ParticleData): boolean {
  return Date.now() < (p.burstCooldownUntil ?? 0)
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
        z: (Math.random() - 0.5) * 400,
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
