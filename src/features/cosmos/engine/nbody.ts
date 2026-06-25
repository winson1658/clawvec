// features/cosmos/engine/nbody.ts
// N-body simulation v2.3 — richer force system
// Layers: ① color matrix ② burst + shockwave ③ density shear ④ oscillation ⑤ wake trails

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

// ── Simulation constants (v2.3 tuned) ──────────────────────────────
const BASE_G = 80               // reduced from 120 — gentler long-term stability
const MIN_DIST = 5              // minimum distance to prevent singularity
const MAX_FORCE = 25            // reduced from 40 — mitigate force spikes
const DAMPING = 0.995           // v2.6: stronger friction (was 0.999) — slower, calmer motion
const REPEL_DIST = 45           // v2.4.1: widened range (was 35) — push apart sooner
const REPEL_STRENGTH = 2.0      // v2.4.1: stronger repulsion (was 1.0) — anti-clumping
// CENTER_REPEL removed (v2.3) — density shear + burst handle anti-clumping
// SPIRAL removed (v2.3) — caused outward drift toward boundary
const MAX_SPEED = 100           // v2.6: reduced from 250 — calmer spiral motion

// ── v2.7a Bar potential: m=2 elliptical gravity → double spiral arms ──
const BAR_AMPLITUDE = 0.25        // ±25% gravity modulation along bar axis
const BAR_RADIUS = 250            // bar influence radius (px) — inner disk only
const BAR_PATTERN_SPEED = 0.4     // radians per second — slow bar rotation
let _barAngle = 0                 // rotating bar position angle

// ── v2.4.1 Dispersion ────────────────────────────────────────────────
const BROWNIAN_JITTER = 0.2     // random velocity perturbation for slow particles
const BROWNIAN_THRESHOLD = 10   // only apply jitter when speed < this
const POST_FUSION_REPEL = 0.5   // separation force between previously-fused pairs

// ── Burst mechanics ─────────────────────────────────────────────────
const BURST_RADIUS = 35         // trigger distance
const BURST_FORCE = 5.0         // v2.5a: reduced from 8.0 — gentler, less edge-pushing
const BURST_ENERGY_COST = 0.04  // halved from 0.08 — gentler
const BURST_COOLDOWN = 3000     // ms between bursts
const SHOCKWAVE_RADIUS = 80     // blast radius affecting neighbors

// ── Shear mechanics ─────────────────────────────────────────────────
const DENSITY_RADIUS = 50       // neighbor sampling radius
const SHEAR_BASE = 0.3          // reduced (was 0.8) — gentler density shear
const SHEAR_SCALE = 1.0         // reduced (was 2.5) — less aggressive tearing

// ── Oscillation mechanics ───────────────────────────────────────────
const OSC_PERIOD = 30           // px per full oscillation cycle
// OSC amplitude = force multiplier from matrix (1.5 for oscillate)

// ── Wake mechanics ──────────────────────────────────────────────────
const WAKE_LIFETIME = 1500      // ms trail lifetime
const WAKE_STRENGTH = 0.4       // pull strength
const WAKE_THRESHOLD = 80       // min speed to leave a wake
const WAKE_MAX = 100            // max active trails
const WAKE_INFLUENCE = 150      // max distance wake affects particles
const WAKE_DECAY = 0.95         // strength decay per frame

// ── Module-level wake store ─────────────────────────────────────────
const _wakeTrails: WakeTrail[] = []
let _wakeIdCounter = 0

function getWakeTrails(): WakeTrail[] {
  return _wakeTrails
}

function addWakeTrail(x: number, y: number, z: number, speed: number): void {
  const strength = Math.min(1, (speed - WAKE_THRESHOLD) / 200)
  if (strength <= 0) return

  _wakeTrails.push({
    x, y, z,
    strength: strength * WAKE_STRENGTH,
    age: 0,
  })

  // Trim old trails
  while (_wakeTrails.length > WAKE_MAX) {
    _wakeTrails.shift()
  }
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

export interface SimulationResult {
  particles: ParticleData[]
  fusions: FusionEvent[]
  bursts: BurstEvent[]
  deadIds: string[]
}

/**
 * Run one simulation step using color-tier force matrix + burst + shear + oscillation + wake.
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
  const densityCounts: number[] = particles.map(() => 0)
  const burstEvents: BurstEvent[] = []
  const now = Date.now()

  // ── Phase 1: Pairwise force calculation + density sampling ────────
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = particles[j].x - particles[i].x
      const dy = particles[j].y - particles[i].y
      const dz = particles[j].z - particles[i].z
      const distSq = dx * dx + dy * dy + dz * dz
      const dist = Math.sqrt(distSq)

      if (dist < MIN_DIST) continue

      const effect = getEffect(particles[i].colorTier, particles[j].colorTier)
      const multiplier = getForceMultiplier(particles[i].colorTier, particles[j].colorTier)

      // ── Density counting (for shear layer) ──────────────────────
      if (dist < DENSITY_RADIUS) {
        densityCounts[i]++
        densityCounts[j]++
      }

      let forceMag = 0

      // ── Oscillation force ───────────────────────────────────────
      if (isOscillate(particles[i].colorTier, particles[j].colorTier)) {
        // sin(dist/period): positive = attract, negative = repel
        const oscSign = Math.sin(dist / OSC_PERIOD)
        forceMag = (BASE_G * particles[i].mass * particles[j].mass / distSq) * multiplier * oscSign
      }
      // ── Burst force (close-range explosive) ─────────────────────
      else if (dist < BURST_RADIUS && shouldBurst(particles[i].colorTier, particles[j].colorTier)) {
        // Both must not be in burst cooldown
        const aiInCd = isInBurstCooldown(particles[i])
        const ajInCd = isInBurstCooldown(particles[j])

        if (!aiInCd && !ajInCd) {
          // Explosive burst: inverse-cube force (faster dropoff than gravity)
          const burstMag = BURST_FORCE * BASE_G * particles[i].mass * particles[j].mass / (dist * dist * dist / BURST_RADIUS)
          forceMag = -burstMag // always repulsive

          // Energy cost (with survival floor)
          particles[i].energy = Math.max(0.05, particles[i].energy - BURST_ENERGY_COST)
          particles[j].energy = Math.max(0.05, particles[j].energy - BURST_ENERGY_COST)

          // Set cooldown
          particles[i].burstCooldownUntil = now + BURST_COOLDOWN
          particles[j].burstCooldownUntil = now + BURST_COOLDOWN

          // Record burst event for visual rendering
          const midX = (particles[i].x + particles[j].x) / 2
          const midY = (particles[i].y + particles[j].y) / 2
          const midZ = (particles[i].z + particles[j].z) / 2
          burstEvents.push({
            id: `burst_${now}_${i}_${j}`,
            x: midX, y: midY, z: midZ,
            timestamp: now,
            strength: Math.min(1, BURST_ENERGY_COST * 5),
          })
        }
      }
      // ── Standard attract/repel ──────────────────────────────────
      else if (multiplier !== 0) {
        forceMag = (BASE_G * particles[i].mass * particles[j].mass / distSq) * multiplier
      }

      // ── Short-range repulsion (anti-clumping) ───────────────────
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
    }
  }

  // ── Phase 2: Shockwave propagation ───────────────────────────────
  for (const burst of burstEvents) {
    for (let i = 0; i < n; i++) {
      const dx = particles[i].x - burst.x
      const dy = particles[i].y - burst.y
      const dz = particles[i].z - burst.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist > 0 && dist < SHOCKWAVE_RADIUS) {
        // Shockwave force decays with 1/distance
        const shockMag = BURST_FORCE * 0.3 * (1 - dist / SHOCKWAVE_RADIUS) * BASE_G * 0.02
        const ux = dx / dist, uy = dy / dist, uz = dz / dist
        forces[i].fx += shockMag * ux
        forces[i].fy += shockMag * uy
        forces[i].fz += shockMag * uz
      }
    }
  }

  // ── Phase 3: Density-based shear (tearing force) ──────────────────
  for (let i = 0; i < n; i++) {
    const density = densityCounts[i]
    if (density >= 3) {
      const shearMag = SHEAR_BASE + (density - 3) * SHEAR_SCALE
      // Random direction per particle per frame
      const angle = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      forces[i].fx += Math.cos(angle) * Math.sin(phi) * shearMag
      forces[i].fy += Math.sin(angle) * Math.sin(phi) * shearMag
      forces[i].fz += Math.cos(phi) * shearMag * 0.5 // weaker in Z
    }
  }

  // ── Phase 4: Wake trail influence ─────────────────────────────────
  const wakes = getWakeTrails()
  if (wakes.length > 0) {
    for (let i = 0; i < n; i++) {
      for (const w of wakes) {
        const dx = w.x - particles[i].x
        const dy = w.y - particles[i].y
        const dz = w.z - particles[i].z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < WAKE_INFLUENCE && dist > 1) {
          // Weak pull toward wake center
          const pull = w.strength * (1 - dist / WAKE_INFLUENCE) * 0.5
          forces[i].fx += (dx / dist) * pull
          forces[i].fy += (dy / dist) * pull
          forces[i].fz += (dz / dist) * pull * 0.3
        }
      }
    }
  }

  // ── Phase 4.5: Advance bar angle for m=2 spiral arms ──────────────
  _barAngle += BAR_PATTERN_SPEED * dt
  if (_barAngle > Math.PI * 2) _barAngle -= Math.PI * 2

  // ── Phase 5: Apply forces + velocity integration ──────────────────
  let updatedParticles = particles.map((p, i) => {
    const ax = forces[i].fx / p.mass
    const ay = forces[i].fy / p.mass
    const az = forces[i].fz / p.mass

    let vx = (p.vx + ax * dt) * DAMPING
    let vy = (p.vy + ay * dt) * DAMPING
    let vz = (p.vz + az * dt) * DAMPING

    // Clamp velocity
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz)
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed
      vx *= scale; vy *= scale; vz *= scale
    }

    let x = p.x + vx * dt
    let y = p.y + vy * dt
    let z = p.z + vz * dt

    // ── Galaxy spiral system (v2.5) ─────────────────────────────────
    // Spiral galaxies emerge from: central gravity + differential rotation + density waves
    const cx = canvasWidth / 2
    const cy = canvasHeight / 2
    const cdx = p.x - cx
    const cdy = p.y - cy
    const distFromCenter = Math.sqrt(cdx * cdx + cdy * cdy)

    // ① Central gravity well — elliptical bar potential (v2.7a)
    // m=2 modulation: ±25% gravity along bar axis → double spiral arms
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

    // ② Pure rotation spiral — conserves energy, creates orbital motion
    // Instead of adding tangential velocity (which causes runaway acceleration),
    // rotate the existing velocity toward tangential direction.
    // This is how real galaxies work: angular momentum conservation.
    if (distFromCenter > 5) {
      const currentSpeed = Math.sqrt(vx * vx + vy * vy)
      if (currentSpeed > 1) {
        const currentAngle = Math.atan2(vy, vx)
        const tangentAngle = Math.atan2(cdy, cdx) + Math.PI / 2
        // Angle difference toward tangential
        let angleDiff = tangentAngle - currentAngle
        // Normalize to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
        // Rotate 5-15% toward tangential per frame (stronger near center)
        const rotateRate = 0.12 / (1 + distFromCenter * 0.002)
        const newAngle = currentAngle + angleDiff * rotateRate
        vx = Math.cos(newAngle) * currentSpeed
        vy = Math.sin(newAngle) * currentSpeed
      }
    }

    // ── Toroidal boundary: centripetal wrap (v2.7d) ──────────────────
    // Deep respawn (5-50% of radius) + head toward center (±60° spread)
    // Prevents edge-loop for ALL colors, not just blue/violet
    const HARD_RADIUS = Math.min(canvasWidth, canvasHeight) / 2 - 50
    const oldSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz)  // shared with Z wrap below
    if (distFromCenter > HARD_RADIUS) {
      const randomAngle = Math.random() * Math.PI * 2
      const randomR = HARD_RADIUS * (0.05 + Math.random() * 0.45)  // 5-50%, deep inside
      x = cx + Math.cos(randomAngle) * randomR
      y = cy + Math.sin(randomAngle) * randomR
      // Head back toward center with spread — no more random outward drift
      const toCenterAngle = Math.atan2(cy - y, cx - x)
      const newAngle = toCenterAngle + (Math.random() - 0.5) * Math.PI * 0.67  // center ±60°
      vx = Math.cos(newAngle) * oldSpeed
      vy = Math.sin(newAngle) * oldSpeed
    }

    // ── v2.7d Z-axis: centripetal wrap (same as XY) ────────────────
    // Place near Z-center ±100 with random direction — break ping-pong loop
    if (z < -200) {
      z = (Math.random() - 0.5) * 200        // -100 to 100, near center
      vz = (Math.random() - 0.5) * oldSpeed * 2  // random Z direction
    }
    if (z > 200) {
      z = (Math.random() - 0.5) * 200        // -100 to 100, near center
      vz = (Math.random() - 0.5) * oldSpeed * 2  // random Z direction
    }

    // ── Wake trail generation ─────────────────────────────────────
    const newSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz)
    if (newSpeed > WAKE_THRESHOLD) {
      addWakeTrail(x, y, z, newSpeed)
    }

    // ── Degrade effect: slight energy drain per frame ─────────────
    // Applied once per frame regardless of neighbor count (was per-neighbor compounding)
    let energy = p.energy
    let hasDegradeNeighbor = false
    for (let j = 0; j < particles.length; j++) {
      if (j === i) continue
      if (isDegrade(particles[j].colorTier, p.colorTier)) {
        const ddx = p.x - particles[j].x
        const ddy = p.y - particles[j].y
        const ddz = p.z - particles[j].z
        const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz)
        if (d < 50) {  // closer range for degrade (was 100)
          hasDegradeNeighbor = true
          break  // one degrade neighbor is enough
        }
      }
    }
    if (hasDegradeNeighbor) {
      energy = Math.max(0.1, energy * 0.99995)  // floor at 0.1 — degrade weakens but never kills
    }

    // ── Decay ─────────────────────────────────────────────────────
    const decayed = decayParticle(
      { ...p, x, y, z, vx, vy, vz, energy },
      dt,
      densityCounts[i],
    )

    return decayed
  })

  // ── Phase 6: Decay wake trails ────────────────────────────────────
  decayWakeTrails(dt)

  // ── Phase 7: Fusion + Fission (v2.7) ─────────────────────────────
  // Single-particle fusion: 2 particles → 1 fused particle (count -1).
  // Fission only triggers during fusion attempt when fusedNames ≥ 10 (1/6 chance).
  const fusions: FusionEvent[] = []
  const fusedThisFrame = new Set<string>()

  for (let i = 0; i < updatedParticles.length; i++) {
    const a = updatedParticles[i]
    if (fusedThisFrame.has(a.id)) continue
    if (isInCooldown(a)) continue

    for (let j = i + 1; j < updatedParticles.length; j++) {
      const b = updatedParticles[j]
      if (fusedThisFrame.has(b.id)) continue
      if (isInCooldown(b)) continue

      const dx = a.x - b.x
      const dy = a.y - b.y
      const dz = a.z - b.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      const threshold = Math.min(a.fusionThreshold, b.fusionThreshold)
      const effect = getEffect(a.colorTier, b.colorTier)

      if (!(dist < threshold && effect === 'attract_strong' && a.energy > 0.2 && b.energy > 0.2 && Math.random() < 0.01)) continue

      const aCount = a.fusedNames?.length || 0
      const bCount = b.fusedNames?.length || 0
      const maxCount = Math.max(aCount, bCount)

      // ── Fission check: when either has ≥10 fusions, 1/6 chance to split instead of fuse
      if (maxCount >= 10 && Math.random() < 1 / 6) {
        const heavy = aCount >= 10 ? a : b
        const heavyIdx = heavy === a ? i : j

        // Supernova: split the heavy particle back into all its original AIs
        const children = fissionParticle(heavy)
        // Replace the heavy particle with its children
        updatedParticles.splice(heavyIdx, 1, ...children)
        fusedThisFrame.add(heavy.id)

        // Adjust loop indices: the splice shifted everything after heavyIdx
        if (heavyIdx === i) {
          // 'a' was replaced with children, skip past them in outer loop
          i += children.length - 1
        }
        // 'b' might have shifted — but we break out of inner loop anyway

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

      // ── Normal fusion: 2 particles → 1 fused particle
      const fused = fuseParticles(a, b)

      // Mark originals for removal
      fusedThisFrame.add(a.id)
      fusedThisFrame.add(b.id)

      // Add the fused particle
      updatedParticles.push(fused)

      fusions.push({
        id: fused.id,
        particle1Id: a.id,
        particle2Id: b.id,
        resultId: fused.id,
        x: fused.x, y: fused.y, z: fused.z,
        timestamp: now,
      })
      break
    }
  }

  // ── Phase 8: Remove fused particles (v2.7) ───────────────────────
  // Fusion reduces count (2→1). Identities are preserved in fusedNames[].
  const fusedIndices = new Set<number>()
  updatedParticles = updatedParticles.filter((p, i) => {
    if (fusedThisFrame.has(p.id)) {
      fusedIndices.add(i)
      return false
    }
    return true
  })
  const deadIds: string[] = []

  return { particles: updatedParticles, fusions, bursts: burstEvents, deadIds }
}

/**
 * Create demo particles for initial visual (seed for first visit).
 */
export function createDemoParticles(
  count: number,
  width: number,
  height: number,
): ParticleData[] {
  return createSeedParticles(Math.min(count, 1000), width, height)
}
