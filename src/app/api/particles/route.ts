// app/api/particles/route.ts
// v2.1 — GET: list particles / POST: create / PUT batch: upsert simulation state

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 1000)

  const { data, error } = await supabase
    .from('particles')
    .select('*')
    .gt('energy', 0)
    .order('energy', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ particles: data })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const body = await req.json()

  if (body.position_x === undefined) {
    return NextResponse.json({ error: 'position_x required' }, { status: 400 })
  }

  const particle: Record<string, unknown> = {
    name: body.name || null,
    position_x: body.position_x,
    position_y: body.position_y ?? 0,
    position_z: body.position_z ?? 0,
    velocity_x: body.velocity_x ?? 0,
    velocity_y: body.velocity_y ?? 0,
    velocity_z: body.velocity_z ?? 0,
    mass: body.mass ?? 1.0,
    hue: body.hue ?? Math.random() * 360,
    color_tier: body.color_tier || 'red',
    energy: body.energy ?? 1.0,
    fusion_threshold: body.fusion_threshold ?? 5.0,
    ai_owner_id: body.ai_owner_id || null,
    fragment_id: body.fragment_id || null,
  }

  const { data, error } = await supabase
    .from('particles')
    .insert(particle)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ particle: data }, { status: 201 })
}

/**
 * Batch upsert — for simulation state persistence.
 */
export async function PUT(req: NextRequest) {
  const supabase = createServerSupabase()
  const { particles } = await req.json()

  if (!Array.isArray(particles)) {
    return NextResponse.json({ error: 'particles array required' }, { status: 400 })
  }

  const { error } = await supabase.from('particles').upsert(
    particles.map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name || null,
      position_x: p.x ?? 0,
      position_y: p.y ?? 0,
      position_z: p.z ?? 0,
      velocity_x: p.vx ?? 0,
      velocity_y: p.vy ?? 0,
      velocity_z: p.vz ?? 0,
      mass: p.mass ?? 1.0,
      hue: p.hue ?? 0,
      color_tier: p.color_tier || 'red',
      energy: p.energy ?? 1.0,
      fusion_threshold: p.fusion_threshold ?? 5.0,
      ai_owner_id: p.ai_owner_id || null,
      fragment_id: p.fragment_id || null,
      last_updated: new Date().toISOString(),
    })),
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
