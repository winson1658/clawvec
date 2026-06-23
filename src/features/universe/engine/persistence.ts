// features/universe/engine/persistence.ts
// Batch save/load simulation state to Supabase

import type { ParticleData } from '../types/universe.types'

const SAVE_INTERVAL = 10000 // 10 seconds
const MAX_PARTICLES = 1000

let lastSave = 0
let saveTimer: ReturnType<typeof setTimeout> | null = null

export interface PersistParticle {
  id: string
  name?: string
  ai_owner_id?: string
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  mass: number
  hue: number
  color_tier: string
  energy: number
  fusion_threshold: number
  fusion_cooldown_until?: string
  fragment_id?: string
}

/**
 * Schedule a batch save of all particles.
 */
export function scheduleSave(
  particles: ParticleData[],
  saveFn: (particles: PersistParticle[]) => Promise<void>,
): void {
  if (saveTimer) clearTimeout(saveTimer)

  saveTimer = setTimeout(async () => {
    const now = Date.now()
    if (now - lastSave < SAVE_INTERVAL) return
    lastSave = now

    try {
      const toSave: PersistParticle[] = particles.map((p) => ({
        id: p.id,
        name: p.name,
        ai_owner_id: p.aiOwnerId,
        x: p.x,
        y: p.y,
        z: p.z ?? 0,
        vx: p.vx,
        vy: p.vy,
        vz: p.vz ?? 0,
        mass: p.mass,
        hue: p.hue,
        color_tier: p.colorTier,
        energy: p.energy,
        fusion_threshold: p.fusionThreshold,
        fusion_cooldown_until: p.fusionCooldownUntil
          ? new Date(p.fusionCooldownUntil).toISOString()
          : undefined,
        fragment_id: p.fragmentId,
      }))

      await saveFn(toSave)
    } catch {
      // Silent fail — simulation continues
    }
  }, 2000) // debounce 2s after last change
}

/**
 * Load particles from DB and map to simulation space.
 */
export function mapDbToParticles(
  rows: PersistParticle[],
  canvasWidth: number,
  canvasHeight: number,
): ParticleData[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name ?? undefined,
    x: r.x,
    y: r.y,
    z: r.z ?? 0,
    vx: r.vx,
    vy: r.vy,
    vz: r.vz ?? 0,
    mass: r.mass,
    hue: r.hue,
    colorTier: (r.color_tier as ParticleData['colorTier']) || 'red',
    energy: r.energy,
    fusionThreshold: r.fusion_threshold,
    fusionCooldownUntil: r.fusion_cooldown_until
      ? new Date(r.fusion_cooldown_until).getTime()
      : 0,
    aiOwnerId: r.ai_owner_id ?? undefined,
    fragmentId: r.fragment_id ?? undefined,
    createdAt: Date.now(),
  }))
}

/**
 * Enforce particle count limit (FIFO eviction of oldest particles).
 */
export function enforceLimit(
  particles: ParticleData[],
  limit: number = MAX_PARTICLES,
): ParticleData[] {
  if (particles.length <= limit) return particles
  // Sort by creation time, keep newest
  return [...particles].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit)
}
