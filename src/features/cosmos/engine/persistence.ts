// features/cosmos/engine/persistence.ts
// Batch save/load simulation state to Supabase

import type { ParticleData } from '../types/cosmos.types'
import { hueToTier } from './forceMap'

const SAVE_INTERVAL = 10000 // 10 seconds
const MAX_PARTICLES = 10000  // v2.8: spatial grid enables 10K particles

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
  burst_cooldown_until?: string
  fused_names?: string[]      // v2.4: JSON array of all fused names
  fused_ids?: string[]        // v2.4: JSON array of all fused IDs
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
        burst_cooldown_until: p.burstCooldownUntil
          ? new Date(p.burstCooldownUntil).toISOString()
          : undefined,
        fused_names: p.fusedNames?.length ? p.fusedNames : undefined,
        fused_ids: p.fusedIds?.length ? p.fusedIds : undefined,
        fragment_id: p.echoId,
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
  rows: any[],  // DB returns snake_case, not camelCase
  canvasWidth: number,
  canvasHeight: number,
): ParticleData[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name ?? undefined,
    x: r.position_x ?? r.x ?? 0,
    y: r.position_y ?? r.y ?? 0,
    z: r.position_z ?? r.z ?? 0,
    vx: r.velocity_x ?? r.vx ?? 0,
    vy: r.velocity_y ?? r.vy ?? 0,
    vz: r.velocity_z ?? r.vz ?? 0,
    mass: r.mass ?? 1,
    hue: r.hue ?? 0,
    colorTier: hueToTier(r.hue ?? 0),
    energy: r.energy ?? 1,
    fusionThreshold: r.fusion_threshold ?? 5,
    fusionCooldownUntil: r.fusion_cooldown_until
      ? new Date(r.fusion_cooldown_until).getTime()
      : 0,
    aiOwnerId: r.ai_owner_id ?? undefined,
    fragmentId: r.fragment_id ?? undefined,
    burstCooldownUntil: r.burst_cooldown_until
      ? new Date(r.burst_cooldown_until).getTime()
      : 0,
    fusedNames: r.fused_names ?? [],
    fusedIds: r.fused_ids ?? [],
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
