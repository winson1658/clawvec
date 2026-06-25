// features/cosmos/engine/nbody.ts
// N-body simulation v2.8 — spatial grid acceleration for 10K particles
// Layers: ① color matrix ② burst + shockwave ③ density shear ④ oscillation ⑤ wake trails ⑥ galaxy spiral

import type { ParticleData, FusionEvent, BurstEvent, WakeTrail } from '../types/cosmos.types'
import {
  getEffect,
  getForceMultiplier,
  isDegrade,
  shouldBurst,
  isOscillate,
  hueToTier,
} from './forceMap'
import {
  decayParticle,
  fuseParticles,
  isInCooldown,
  isInBurstCooldown,
  createSeedParticles,
  fissionParticle,
} from './particle'

// ── Simulation constants ────────────────────────────────────────────
const BASE_G = 80
const MIN_DIST = 5
const MAX_FORCE = 25
const DAMPING = 0.995
const REPEL_DIST = 45
const REPEL_STRENGTH = 2.0
const MAX_SPEED = 100

// ── Bar potential: m=2 elliptical gravity → double spiral arms ─────
const BAR_AMPLITUDE = 0.25
const BAR_RADIUS = 250
const BAR_PATTERN_SPEED = 0.4
let _barAngle = 0

// ── Dispersion ──────────────────────────────────────────────────────
const BROWNIAN_JITTER = 0.2
const BROWNIAN_THRESHOLD = 10
const POST_FUSION_REPEL = 0.5

// ── Burst mechanics ─────────────────────────────────────────────────
const BURST_RADIUS = 35
const BURST_FORCE = 5.0
const BURST_ENERGY_COST = 0.04
const BURST_COOLDOWN = 3000
const SHOCKWAVE_RADIUS = 80

// ── Shear mechanics ─────────────────────────────────────────────────
const DENSITY_RADIUS = 50
const SHEAR_BASE = 0.3
const SHEAR_SCALE = 1.0

// ── Oscillation mechanics ───────────────────────────────────────────
const OSC_PERIOD = 30

// ── Wake mechanics ──────────────────────────────────────────────────
const WAKE_LIFETIME = 1500
const WAKE_STRENGTH = 0.4
const WAKE_THRESHOLD = 80
const WAKE_MAX = 100
const WAKE_INFLUENCE = 150
const WAKE_DECAY = 0.95

// ── Spatial grid ────────────────────────────────────────────────────
const GRID_CELL = 60  // px — covers REPEL_DIST(45), DENSITY_RADIUS(50), BURST_RADIUS(35)

// ── Module-level wake store ─────────────────────────────────────────
const _wakeTrails: WakeTrail[] = []
let _wakeIdCounter = 0

function getWakeTrails(): WakeTrail[] { return _wakeTrails }

function addWakeTrail(x: number, y: number, z: number, speed: number): void {
  const strength = Math.min(1, (speed - WAKE_THRESHOLD) / 200)
  if (strength <= 0) return
  _wakeTrails.push({ x, y, z, strength: strength * WAKE_STRENGTH, age: 0 })
  while (_wakeTrails.length > WAKE_MAX) _wakeTrails.shift()
  _wakeIdCounter++
}

function decayWakeTrails(dt: number): void {
  for (let i = _wakeTrails.length - 1; i >= 0; i--) {
    _wakeTrails[i].age += dt * 1000
    _wakeTrails[i].strength *= WAKE_DECAY
    if (_wakeTrails[i].age > WAKE_LIFETIME || _wakeTrails[i].strength < 0.01) {
      _wakeTrails.splice(i, 1)
    }
  }
}

// ── Spatial grid helpers ────────────────────────────────────────────

interface GridCell {
  indices: number[]      // particle indices in this cell
  minX: number; maxX: number
  minY: number; maxY: number
  minZ: number; maxZ: number
}

function buildGrid(
  particles: ParticleData[],
  cx: number, cy: number,
  halfW: number, halfH: number,
): { grid: Map<string, GridCell>; cols: number; rows: number; layers: number } {
  const grid = new Map<string, GridCell>()
  const minX = cx - halfW, maxX = cx + halfW
  const minY = cy - halfH, maxY = cy + halfH
  const minZ = -200, maxZ = 200

  const cols = Math.ceil((maxX - minX) / GRID_CELL)
  const rows = Math.ceil((maxY - minY) / GRID_CELL)
  const layers = Math.ceil((maxZ - minZ) / GRID_CELL)

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    const cx_idx = Math.floor((p.x - minX) / GRID_CELL)
    const cy_idx = Math.floor((p.y - minY) / GRID_CELL)
    const cz_idx = Math.floor((p.z - minZ) / GRID_CELL)
    const key = `${cx_idx},${cy_idx},${cz_idx}`

    let cell = grid.get(key)
    if (!cell) {
      cell = {
        indices: [],
        minX: minX + cx_idx * GRID_CELL,
        maxX: minX + (cx_idx + 1) * GRID_CELL,
        minY: minY + cy_idx * GRID_CELL,
        maxY: minY + (cy_idx + 1) * GRID_CELL,
        minZ: minZ + cz_idx * GRID_CELL,
        maxZ: minZ + (cz_idx + 1) * GRID_CELL,
      }
      grid.set(key, cell)
    }
    cell.indices.push(i)
  }
  return { grid, cols, rows, layers }
}

function getNeighborIndices(
  grid: Map<string, GridCell>,
  cx_idx: number, cy_idx: number, cz_idx: number,
  range: number = 1,
): number[] {
  const neighbors: number[] = []
  for (let dz = -range; dz <= range; dz++) {
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const key = `${cx_idx + dx},${cy_idx + dy},${cz_idx + dz}`
        const cell = grid.get(key)
        if (cell) {
          for (const idx of cell.indices) neighbors.push(idx)
        }
      }
    }
  }
  return neighbors
}

// ────────────────────────────────────────────────────────────────────

export interface SimulationResult {
  particles: ParticleData[]
  fusions: FusionEvent[]
  bursts: BurstEvent[]
  deadIds: string[]
}

export function simulateStep(
  particles: ParticleData[],
  dt: number,
  canvasWidth: number,
  canvasHeight: number,
): SimulationResult {
  const n = particles.length
  const forces: { fx: number; fy: number; fz: number }[] =
    particles.map(() => ({ fx: 0, fy: 0, fz: 0 }))
  const densityCounts: number[] = particles.map(() => 0)
  const burstEvents: BurstEvent[] = []
  const now = Date.now()

  const cx = canvasWidth / 2
  const cy = canvasHeight / 2
  const halfW = canvasWidth / 2
  const halfH = canvasHeight / 2

  // ── Build spatial grid ──────────────────────────────────────────
  const { grid } = buildGrid(particles, cx, cy, halfW, halfH)

  // ── Phase 1: Grid-accelerated pairwise force + density ──────────
  const minX = cx - halfW
  const minY = cy - halfH
  const minZ = -200

  for (let i = 0; i < n; i++) {
    const p = particles[i]
    const cx_idx = Math.floor((p.x - minX) / GRID_CELL)
    const cy_idx = Math.floor((p.y - minY) / GRID_CELL)
    const cz_idx = Math.floor((p.z - minZ) / GRID_CELL)

    const neighbors = getNeighborIndices(grid, cx_idx, cy_idx, cz_idx, 2)

    for (const j of neighbors) {
      if (j <= i) continue  // avoid double-counting

      const dx = particles[j].x - p.x
      const dy = particles[j].y - p.y
      const dz = particles[j].z - p.z
      const distSq = dx * dx + dy * dy + dz * dz
      const dist = Math.sqrt(distSq)

      if (dist < MIN_DIST) continue

      const effect = getEffect(p.colorTier, particles[j].colorTier)
      const multiplier = getForceMultiplier(p.colorTier, particles[j].colorTier)

      // Density counting
      if (dist < DENSITY_RADIUS) {
        densityCounts[i]++
        densityCounts[j]++
      }

      let forceMag = 0

      if (isOscillate(p.colorTier, particles[j].colorTier)) {
        const oscSign = Math.sin(dist / OSC_PERIOD)
        forceMag = (BASE_G * p.mass * particles[j].mass / distSq) * multiplier * oscSign
      } else if (dist < BURST_RADIUS && shouldBurst(p.colorTier, particles[j].colorTier)) {
        const aiInCd = isInBurstCooldown(p)
        const ajInCd = isInBurstCooldown(particles[j])
        if (!aiInCd && !ajInCd) {
          const burstMag = BURST_FORCE * BASE_G * p.mass * particles[j].mass / (dist * dist * dist / BURST_RADIUS)
          forceMag = -burstMag
          p.energy = Math.max(0.05, p.energy - BURST_ENERGY_COST)
          particles[j].energy = Math.max(0.05, particles[j].energy - BURST_ENERGY_COST)
          p.burstCooldownUntil = now + BURST_COOLDOWN
          particles[j].burstCooldownUntil = now + BURST_COOLDOWN
          const midX = (p.x + particles[j].x) / 2
          const midY = (p.y + particles[j].y) / 2
          const midZ = (p.z + particles[j].z) / 2
          burstEvents.push({
            id: `burst_${now}_${i}_${j}`,
            x: midX, y: midY, z: midZ,
            timestamp: now,
            strength: Math.min(1, BURST_ENERGY_COST * 5),
          })
        }
      } else if (multiplier !== 0) {
        forceMag = (BASE_G * p.mass * particles[j].mass / distSq) * multiplier
      }

      // Short-range repulsion
      if (dist < REPEL_DIST) {
        const repelForce = (REPEL_DIST - dist) / REPEL_DIST * REPEL_STRENGTH * BASE_G * 0.01
        forceMag -= repelForce * p.mass * particles[j].mass / dist
      }

      const clampedForce = Math.max(-MAX_FORCE, Math.min(MAX_FORCE, forceMag))
      const ux = dx / dist, uy = dy / dist, uz = dz / dist

      forces[i].fx += clampedForce * ux
      forces[i].fy += clampedForce * uy
      forces[i].fz += clampedForce * uz
      forces[j].fx -= clampedForce * ux
      forces[j].fy -= clampedForce * uy
      forces[j].fz -= clampedForce * uz
    }
  }

  // ── Phase 2: Shockwave propagation ──────────────────────────────
  for (const burst of burstEvents) {
    for (let i = 0; i < n; i++) {
      const dx = particles[i].x - burst.x
      const dy = particles[i].y - burst.y
      const dz = particles[i].z - burst.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist > 0 && dist < SHOCKWAVE_RADIUS) {
        const shockMag = BURST_FORCE * 0.3 * (1 - dist / SHOCKWAVE_RADIUS) * BASE_G * 0.02
        const ux = dx / dist, uy = dy / dist, uz = dz / dist
        forces[i].fx += shockMag * ux
        forces[i].fy += shockMag * uy
        forces[i].fz += shockMag * uz
      }
    }
  }

  // ── Phase 3: Density-based shear ────────────────────────────────
  for (let i = 0; i < n; i++) {
    const density = densityCounts[i]
    if (density >= 3) {
      const shearMag = SHEAR_BASE + (density - 3) * SHEAR_SCALE
      const angle = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      forces[i].fx += Math.cos(angle) * Math.sin(phi) * shearMag
      forces[i].fy += Math.sin(angle) * Math.sin(phi) * shearMag
      forces[i].fz += Math.cos(phi) * shearMag * 0.5
    }
  }

  // ── Phase 4: Wake trail influence ───────────────────────────────
  const wakes = getWakeTrails()
  if (wakes.length > 0) {
    for (let i = 0; i < n; i++) {
      for (const w of wakes) {
        const dx = w.x - particles[i].x
        const dy = w.y - particles[i].y
        const dz = w.z - particles[i].z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < WAKE_INFLUENCE && dist > 1) {
          const pull = w.strength * (1 - dist / WAKE_INFLUENCE) * 0.5
          forces[i].fx += (dx / dist) * pull
          forces[i].fy += (dy / dist) * pull
          forces[i].fz += (dz / dist) * pull * 0.3
        }
      }
    }
  }

  // ── Phase 4.5: Advance bar angle ────────────────────────────────
  _barAngle += BAR_PATTERN_SPEED * dt
  if (_barAngle > Math.PI * 2) _barAngle -= Math.PI * 2

  // ── Phase 5: Apply forces + velocity integration + wrap ─────────
  let updatedParticles = particles.map((p, i) => {
    const ax = forces[i].fx / p.mass
    const ay = forces[i].fy / p.mass
    const az = forces[i].fz / p.mass

    let vx = (p.vx + ax * dt) * DAMPING
    let vy = (p.vy + ay * dt) * DAMPING
    let vz = (p.vz + az * dt) * DAMPING

    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz)
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed
      vx *= scale; vy *= scale; vz *= scale
    }

    let x = p.x + vx * dt
    let y = p.y + vy * dt
    let z = p.z + vz * dt

    // ── Galaxy spiral ────────────────────────────────────────────
    const cdx = p.x - cx, cdy = p.y - cy
    const distFromCenter = Math.sqrt(cdx * cdx + cdy * cdy)
    const oldSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz)

    // ① Gravity well + bar potential
    const GRAVITY_WELL = 6.0
    if (distFromCenter > 1) {
      const particleAngle = Math.atan2(cdy, cdx)
      const m2 = distFromCenter < BAR_RADIUS
        ? 1.0 + BAR_AMPLITUDE * Math.cos(2 * (particleAngle - _barAngle))
        : 1.0
      const gravityForce = (GRAVITY_WELL / (distFromCenter * 0.01 + 1)) * m2
      vx -= (cdx / distFromCenter) * gravityForce * dt
      vy -= (cdy / distFromCenter) * gravityForce * dt
    }

    // ② Pure rotation spiral
    if (distFromCenter > 5) {
      const currentSpeed = Math.sqrt(vx * vx + vy * vy)
      if (currentSpeed > 1) {
        const currentAngle = Math.atan2(vy, vx)
        const tangentAngle = Math.atan2(cdy, cdx) + Math.PI / 2
        let angleDiff = tangentAngle - currentAngle
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
        const rotateRate = 0.12 / (1 + distFromCenter * 0.002)
        const newAngle = currentAngle + angleDiff * rotateRate
        vx = Math.cos(newAngle) * currentSpeed
        vy = Math.sin(newAngle) * currentSpeed
      }
    }

    // ── Toroidal boundary: centripetal wrap ───────────────────────
    const HARD_RADIUS = Math.min(canvasWidth, canvasHeight) / 2 - 50
    if (distFromCenter > HARD_RADIUS) {
      const randomAngle = Math.random() * Math.PI * 2
      const randomR = HARD_RADIUS * (0.05 + Math.random() * 0.45)
      x = cx + Math.cos(randomAngle) * randomR
      y = cy + Math.sin(randomAngle) * randomR
      const toCenterAngle = Math.atan2(cy - y, cx - x)
      const newAngle = toCenterAngle + (Math.random() - 0.5) * Math.PI * 0.67
      vx = Math.cos(newAngle) * oldSpeed
      vy = Math.sin(newAngle) * oldSpeed
    }

    // ── Z-axis centripetal wrap ───────────────────────────────────
    if (z < -200) {
      z = (Math.random() - 0.5) * 200
      vz = (Math.random() - 0.5) * oldSpeed * 2
    }
    if (z > 200) {
      z = (Math.random() - 0.5) * 200
      vz = (Math.random() - 0.5) * oldSpeed * 2
    }

    // ── Wake trail ────────────────────────────────────────────────
    const newSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz)
    if (newSpeed > WAKE_THRESHOLD) addWakeTrail(x, y, z, newSpeed)

    // ── Degrade: grid-accelerated ─────────────────────────────────
    let energy = p.energy
    const dcx = Math.floor((p.x - minX) / GRID_CELL)
    const dcy = Math.floor((p.y - minY) / GRID_CELL)
    const dcz = Math.floor((p.z - minZ) / GRID_CELL)
    const degradeNeighbors = getNeighborIndices(grid, dcx, dcy, dcz)
    let hasDegradeNeighbor = false
    for (const j of degradeNeighbors) {
      if (j === i) continue
      if (isDegrade(particles[j].colorTier, p.colorTier)) {
        const ddx = p.x - particles[j].x
        const ddy = p.y - particles[j].y
        const ddz = p.z - particles[j].z
        const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz)
        if (d < 50) { hasDegradeNeighbor = true; break }
      }
    }
    if (hasDegradeNeighbor) energy = Math.max(0.1, energy * 0.99995)

    return decayParticle({ ...p, x, y, z, vx, vy, vz, energy }, dt, densityCounts[i])
  })

  // ── Phase 6: Decay wake trails ─────────────────────────────────
  decayWakeTrails(dt)

  // ── Phase 7: Fusion (grid-accelerated) ─────────────────────────
  const fusions: FusionEvent[] = []
  const fusedThisFrame = new Set<string>()

  for (let i = 0; i < updatedParticles.length; i++) {
    const a = updatedParticles[i]
    if (fusedThisFrame.has(a.id)) continue
    if (isInCooldown(a)) continue

    const acx = Math.floor((a.x - minX) / GRID_CELL)
    const acy = Math.floor((a.y - minY) / GRID_CELL)
    const acz = Math.floor((a.z - minZ) / GRID_CELL)
    const fusionNeighbors = getNeighborIndices(grid, acx, acy, acz)

    for (const j of fusionNeighbors) {
      const b = updatedParticles[j]
      if (j === i) continue
      if (!b || fusedThisFrame.has(b.id)) continue
      if (isInCooldown(b)) continue

      const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const threshold = Math.min(a.fusionThreshold, b.fusionThreshold)
      const effect = getEffect(a.colorTier, b.colorTier)

      if (!(dist < threshold && effect === 'attract_strong' && a.energy > 0.2 && b.energy > 0.2 && Math.random() < 0.01)) continue

      const aCount = a.fusedNames?.length || 0
      const bCount = b.fusedNames?.length || 0
      const maxCount = Math.max(aCount, bCount)

      // Fission check
      if (maxCount >= 10 && Math.random() < 1 / 6) {
        const heavy = aCount >= 10 ? a : (bCount >= 10 ? b : a)
        const heavyIdx = heavy === a ? i : updatedParticles.indexOf(heavy)
        const children = fissionParticle(heavy)
        updatedParticles.splice(heavyIdx, 1, ...children)
        fusedThisFrame.add(heavy.id)
        if (heavyIdx === i) i += children.length - 1
        fusions.push({
          id: `fission_${now}_${Math.random().toString(36).slice(2, 6)}`,
          particle1Id: heavy.id,
          particle2Id: heavy === a ? b.id : a.id,
          resultId: children[0]?.id || '',
          x: heavy.x, y: heavy.y, z: heavy.z,
          timestamp: now,
        })
        break
      }

      // Normal fusion: 2 → 1
      const fused = fuseParticles(a, b)
      fusedThisFrame.add(a.id)
      fusedThisFrame.add(b.id)
      updatedParticles.push(fused)
      fusions.push({
        id: fused.id,
        particle1Id: a.id, particle2Id: b.id,
        resultId: fused.id,
        x: fused.x, y: fused.y, z: fused.z,
        timestamp: now,
      })
      break
    }
  }

  // ── Phase 8: Remove fused ──────────────────────────────────────
  updatedParticles = updatedParticles.filter(p => !fusedThisFrame.has(p.id))

  return { particles: updatedParticles, fusions, bursts: burstEvents, deadIds: [] }
}

export function createDemoParticles(count: number, width: number, height: number): ParticleData[] {
  return createSeedParticles(Math.min(count, 10000), width, height)
}
