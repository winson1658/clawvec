// features/universe/engine/nbody.ts
// N-body simulation v2.1 — color-tier force system

import type { ParticleData, FusionEvent } from '../types/universe.types'
import { getForceMultiplier, isDegrade } from './forceMap'
import { decayParticle, fuseParticles, isDead, isInCooldown, createSeedParticles } from './particle'

// Simulation constants
const BASE_G = 200         // base gravitational constant (reduced from 800)
const MIN_DIST = 5         // minimum distance to prevent singularity
const MAX_FORCE = 40       // clamp maximum force per axis
const DAMPING = 0.999      // slight velocity damping per frame
const BOUNDARY = 30        // soft boundary padding
const REPEL_DIST = 25      // distance under which repulsion kicks in
const REPEL_STRENGTH = 0.5 // repulsion strength factor

export interface SimulationResult {
  particles: ParticleData[]
  fusions: FusionEvent[]
  deadIds: string[]
}

/**
 * Run one simulation step using color-tier force matrix.
 */
export function simulateStep(
  particles: ParticleData[],
  dt: number,
  canvasWidth: number,
  canvasHeight: number,
): SimulationResult {
  const n = particles.length
  const forces: { fx: number; fy: number; fz: number }[] =
    particles.map(() => ({ fx: 0, fy: 0, fz: 0 }))
  const neighborCounts = particles.map(() => 0)

  // O(n²) pairwise force calculation with color-tier matrix
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = particles[j].x - particles[i].x
      const dy = particles[j].y - particles[i].y
      const dz = particles[j].z - particles[i].z
      const distSq = dx * dx + dy * dy + dz * dz
      const dist = Math.sqrt(distSq)

      if (dist < MIN_DIST) continue

      // --- Force direction: attraction or repulsion ---
      const multiplier = getForceMultiplier(
        particles[i].colorTier,
        particles[j].colorTier,
      )

      let forceMag = 0

      if (multiplier > 0) {
        // Attraction: F = G * m1 * m2 / r² * multiplier
        forceMag = (BASE_G * particles[i].mass * particles[j].mass / distSq) * multiplier
      } else if (multiplier < 0) {
        // Repulsion: stronger at close range
        forceMag = (BASE_G * particles[i].mass * particles[j].mass / distSq) * multiplier
      }
      // multiplier === 0: neutral — no force

      // Additional short-range repulsion to prevent clumping
      if (dist < REPEL_DIST) {
        const repelForce = (REPEL_DIST - dist) / REPEL_DIST * REPEL_STRENGTH * BASE_G * 0.01
        forceMag -= repelForce * particles[i].mass * particles[j].mass / dist
      }

      const clampedForce = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, forceMag))

      const ux = dx / dist
      const uy = dy / dist
      const uz = dz / dist

      forces[i].fx += clampedForce * ux
      forces[i].fy += clampedForce * uy
      forces[i].fz += clampedForce * uz
      forces[j].fx -= clampedForce * ux
      forces[j].fy -= clampedForce * uy
      forces[j].fz -= clampedForce * uz

      // Count neighbors for energy decay
      if (dist < 150) {
        neighborCounts[i]++
        neighborCounts[j]++
      }
    }
  }

  // Apply forces + degrade effects
  let updatedParticles = particles.map((p, i) => {
    const ax = forces[i].fx / p.mass
    const ay = forces[i].fy / p.mass
    const az = forces[i].fz / p.mass

    let vx = (p.vx + ax * dt) * DAMPING
    let vy = (p.vy + ay * dt) * DAMPING
    let vz = (p.vz + az * dt) * DAMPING

    // Clamp velocity
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz)
    const maxSpeed = 350
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed
      vx *= scale; vy *= scale; vz *= scale
    }

    let x = p.x + vx * dt
    let y = p.y + vy * dt
    let z = p.z + vz * dt

    // Soft boundary
    const m = BOUNDARY
    if (x < m) vx += (m - x) * 0.01
    if (x > canvasWidth - m) vx -= (x - canvasWidth + m) * 0.01
    if (y < m) vy += (m - y) * 0.01
    if (y > canvasHeight - m) vy -= (y - canvasHeight + m) * 0.01
    z = Math.max(-200, Math.min(200, z))

    // Apply degrade effects from other particles
    let energy = p.energy
    for (let j = 0; j < particles.length; j++) {
      if (j === i) continue
      if (isDegrade(particles[j].colorTier, p.colorTier)) {
        const ddx = p.x - particles[j].x
        const ddy = p.y - particles[j].y
        const ddz = p.z - particles[j].z
        const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz)
        if (d < 100) {
          energy *= 0.9995 // small degrade per frame per neighbor
        }
      }
    }

    // Decay energy + mass
    const decayed = decayParticle(
      { ...p, x, y, z, vx, vy, vz, energy },
      dt,
      neighborCounts[i],
    )

    return decayed
  })

  // Detect fusions
  const fusions: FusionEvent[] = []
  const fusedIndices = new Set<number>()

  for (let i = 0; i < updatedParticles.length; i++) {
    if (fusedIndices.has(i)) continue
    const a = updatedParticles[i]
    if (isInCooldown(a)) continue

    for (let j = i + 1; j < updatedParticles.length; j++) {
      if (fusedIndices.has(j)) continue
      const b = updatedParticles[j]
      if (isInCooldown(b)) continue

      const dx = a.x - b.x
      const dy = a.y - b.y
      const dz = a.z - b.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      const threshold = Math.min(a.fusionThreshold, b.fusionThreshold)
      const multiplier = getForceMultiplier(a.colorTier, b.colorTier)

      // Fuse if close AND attracted (multiplier > 0.3)
      if (dist < threshold && multiplier > 0.3) {
        const fused = fuseParticles(a, b)
        fusions.push({
          id: fused.id,
          particle1Id: a.id,
          particle2Id: b.id,
          resultId: fused.id,
          x: fused.x,
          y: fused.y,
          z: fused.z,
          timestamp: Date.now(),
        })

        fusedIndices.add(i)
        fusedIndices.add(j)
        updatedParticles.push(fused)
        break
      }
    }
  }

  // Remove fused and dead particles
  const deadIds: string[] = []
  updatedParticles = updatedParticles.filter((p, i) => {
    if (fusedIndices.has(i)) {
      deadIds.push(p.id)
      return false
    }
    if (isDead(p)) {
      deadIds.push(p.id)
      return false
    }
    return true
  })

  return { particles: updatedParticles, fusions, deadIds }
}

/**
 * Create demo particles for initial visual (seed for first visit).
 */
export function createDemoParticles(
  count: number,
  width: number,
  height: number,
): ParticleData[] {
  return createSeedParticles(Math.min(count, 50), width, height)
}
