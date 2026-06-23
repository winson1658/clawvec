// features/universe/engine/nbody.ts
// N-body gravity simulation with Barnes-Hut optimization

import type { ParticleData, FusionEvent } from '../types/universe.types'
import { getAffinity, decayEnergy, fuseParticles, isDead } from './particle'

// Simulation constants
const G = 800          // gravitational constant (scaled for pixel space)
const MIN_DIST = 8     // minimum distance to prevent singularity
const MAX_FORCE = 50   // clamp maximum force per axis
const DAMPING = 0.999  // slight velocity damping per frame
const BOUNDARY = 20    // soft boundary padding

export interface SimulationResult {
  particles: ParticleData[]
  fusions: FusionEvent[]
  deadIds: string[]
}

/**
 * Run one simulation step.
 * @param particles Current particle list
 * @param dt Delta time in seconds
 * @returns Updated particles + fusion events
 */
export function simulateStep(
  particles: ParticleData[],
  dt: number,
  canvasWidth: number,
  canvasHeight: number,
): SimulationResult {
  const n = particles.length
  const forces: { fx: number; fy: number }[] = particles.map(() => ({ fx: 0, fy: 0 }))

  // Count neighbors for energy decay
  const neighborCounts = particles.map(() => 0)

  // O(n²) gravity calculation (upgrade to Barnes-Hut later)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = particles[j].x - particles[i].x
      const dy = particles[j].y - particles[i].y
      const distSq = dx * dx + dy * dy
      const dist = Math.sqrt(distSq)

      if (dist < MIN_DIST) continue

      const affinity = getAffinity(particles[i], particles[j])

      // Force magnitude: F = G * m1 * m2 / r² * affinity
      const forceMag = (G * particles[i].mass * particles[j].mass / distSq) * affinity
      const clampedForce = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, forceMag))

      // Unit direction vector
      const ux = dx / dist
      const uy = dy / dist

      // Apply forces (equal and opposite)
      forces[i].fx += clampedForce * ux
      forces[i].fy += clampedForce * uy
      forces[j].fx -= clampedForce * ux
      forces[j].fy -= clampedForce * uy

      // Count neighbors (within 150px for energy calculation)
      if (dist < 150) {
        neighborCounts[i]++
        neighborCounts[j]++
      }
    }
  }

  // Update positions and velocities
  let updatedParticles = particles.map((p, i) => {
    // Acceleration = force / mass
    const ax = forces[i].fx / p.mass
    const ay = forces[i].fy / p.mass

    // Update velocity (semi-implicit Euler)
    let vx = (p.vx + ax * dt) * DAMPING
    let vy = (p.vy + ay * dt) * DAMPING

    // Clamp velocity
    const speed = Math.sqrt(vx * vx + vy * vy)
    const maxSpeed = 400
    if (speed > maxSpeed) {
      vx = (vx / speed) * maxSpeed
      vy = (vy / speed) * maxSpeed
    }

    // Update position
    let x = p.x + vx * dt
    let y = p.y + vy * dt

    // Soft boundary: push back when near edges
    const margin = BOUNDARY
    if (x < margin) vx += (margin - x) * 0.01
    if (x > canvasWidth - margin) vx -= (x - canvasWidth + margin) * 0.01
    if (y < margin) vy += (margin - y) * 0.01
    if (y > canvasHeight - margin) vy -= (y - canvasHeight + margin) * 0.01

    // Decay energy
    const decayed = decayEnergy({ ...p, x, y, vx, vy }, dt, neighborCounts[i])

    return decayed
  })

  // Detect fusions
  const fusions: FusionEvent[] = []
  const fusedIndices = new Set<number>()

  for (let i = 0; i < updatedParticles.length; i++) {
    if (fusedIndices.has(i)) continue
    for (let j = i + 1; j < updatedParticles.length; j++) {
      if (fusedIndices.has(j)) continue

      const a = updatedParticles[i]
      const b = updatedParticles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      const threshold = Math.min(a.fusionThreshold, b.fusionThreshold)
      const affinity = getAffinity(a, b)

      // Fusion condition: close enough AND positive affinity
      if (dist < threshold && affinity > 0.3) {
        const fused = fuseParticles(a, b)
        fusions.push({
          id: fused.id,
          particle1Id: a.id,
          particle2Id: b.id,
          resultId: fused.id,
          x: fused.x,
          y: fused.y,
          timestamp: Date.now(),
        })

        fusedIndices.add(i)
        fusedIndices.add(j)
        updatedParticles.push(fused)
        break // a has fused, move to next i
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
 * Create initial demo particles for visual testing.
 */
export function createDemoParticles(count: number, width: number, height: number): ParticleData[] {
  const { createParticle } = require('./particle')
  const particles: ParticleData[] = []
  const hues = [0, 30, 60, 120, 180, 240, 270, 300] // 8 color families

  for (let i = 0; i < count; i++) {
    const hue = hues[Math.floor(Math.random() * hues.length)]
    particles.push(
      createParticle({
        x: width * 0.2 + Math.random() * width * 0.6,
        y: height * 0.2 + Math.random() * height * 0.6,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        mass: 1 + Math.random() * 4,
        hue: hue + (Math.random() - 0.5) * 20,
      }),
    )
  }
  return particles
}
