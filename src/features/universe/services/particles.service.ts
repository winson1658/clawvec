// features/universe/services/particles.service.ts
// Client-side service: fetch & submit particles

import type { ParticleData } from '../types/universe.types'

const API = '/api/particles'

export async function fetchParticles(limit = 500): Promise<ParticleData[]> {
  const res = await fetch(`${API}?limit=${limit}&minEnergy=0.01`)
  if (!res.ok) throw new Error(`Failed to fetch particles: ${res.status}`)
  const data = await res.json()
  return data.particles.map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string | undefined,
    x: p.position_x as number,
    y: p.position_y as number,
    vx: p.velocity_x as number,
    vy: p.velocity_y as number,
    mass: p.mass as number,
    hue: p.hue as number,
    energy: p.energy as number,
    affinityMatrix: (p.affinity_matrix as Record<number, number>) || {},
    fusionThreshold: p.fusion_threshold as number,
    fragmentId: p.fragment_id as string | undefined,
    createdAt: new Date(p.created_at as string).getTime(),
  }))
}

export async function createParticle(
  particle: Partial<ParticleData>,
): Promise<ParticleData> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: particle.name,
      position_x: particle.x,
      position_y: particle.y,
      velocity_x: particle.vx,
      velocity_y: particle.vy,
      mass: particle.mass,
      hue: particle.hue,
      energy: particle.energy,
      affinity_matrix: particle.affinityMatrix,
      fusion_threshold: particle.fusionThreshold,
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
    vx: p.velocity_x,
    vy: p.velocity_y,
    mass: p.mass,
    hue: p.hue,
    energy: p.energy,
    affinityMatrix: p.affinity_matrix || {},
    fusionThreshold: p.fusion_threshold,
    fragmentId: p.fragment_id,
    createdAt: new Date(p.created_at).getTime(),
  }
}
