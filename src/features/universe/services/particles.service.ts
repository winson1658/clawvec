// features/universe/services/particles.service.ts
// Client-side service: fetch & persist particles (v2.1)

import type { PersistParticle } from '../engine/persistence'

const API = '/api/particles'

/**
 * Fetch raw particle rows from DB.
 */
export async function fetchParticles(limit = 500): Promise<PersistParticle[]> {
  const res = await fetch(`${API}?limit=${limit}`)
  if (!res.ok) throw new Error(`Failed to fetch particles: ${res.status}`)
  const data = await res.json()
  return data.particles as PersistParticle[]
}

/**
 * Create a single particle.
 */
export async function createParticle(
  particle: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: particle.name,
      position_x: particle.x,
      position_y: particle.y,
      position_z: particle.z ?? 0,
      velocity_x: particle.vx,
      velocity_y: particle.vy,
      velocity_z: particle.vz ?? 0,
      mass: particle.mass,
      hue: particle.hue,
      color_tier: particle.colorTier,
      energy: particle.energy,
      fusion_threshold: particle.fusionThreshold,
      ai_owner_id: particle.aiOwnerId,
      fragment_id: particle.fragmentId,
    }),
  })
  if (!res.ok) throw new Error(`Failed to create particle: ${res.status}`)
  const data = await res.json()
  const p = data.particle
  return {
    id: p.id,
    name: p.name,
    x: p.position_x,
    y: p.position_y,
    z: p.position_z ?? 0,
    vx: p.velocity_x,
    vy: p.velocity_y,
    vz: p.velocity_z ?? 0,
    mass: p.mass,
    hue: p.hue,
    colorTier: p.color_tier || 'red',
    energy: p.energy,
    fusionThreshold: p.fusion_threshold,
    fusionCooldownUntil: 0,
    aiOwnerId: p.ai_owner_id,
    fragmentId: p.fragment_id,
    createdAt: new Date(p.created_at).getTime(),
  }
}

/**
 * Batch upsert particles (for persistence).
 */
export async function batchUpsertParticles(
  particles: PersistParticle[],
): Promise<void> {
  const res = await fetch(`${API}/batch`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ particles }),
  })
  if (!res.ok) throw new Error(`Batch upsert failed: ${res.status}`)
}
