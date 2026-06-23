// app/api/particles/route.ts
// GET: list particles / POST: create particle (from fragment or direct)

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 1000)
  const minEnergy = parseFloat(searchParams.get('minEnergy') || '0.01')

  const { data, error } = await supabase
    .from('particles')
    .select('*')
    .gt('energy', minEnergy)
    .order('energy', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ particles: data })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const body = await req.json()

  // Validate
  if (!body.position_x && body.position_x !== 0) {
    return NextResponse.json({ error: 'position_x required' }, { status: 400 })
  }

  const particle = {
    name: body.name || null,
    position_x: body.position_x,
    position_y: body.position_y ?? 0,
    velocity_x: body.velocity_x ?? 0,
    velocity_y: body.velocity_y ?? 0,
    mass: body.mass ?? 1.0,
    hue: body.hue ?? Math.random() * 360,
    energy: body.energy ?? 1.0,
    affinity_matrix: body.affinity_matrix ?? {},
    fusion_threshold: body.fusion_threshold ?? 5.0,
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
