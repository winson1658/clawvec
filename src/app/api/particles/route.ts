// app/api/particles/route.ts
// v2.2 — GET: list particles (public) / POST: create particle (auth required, one per user)
// PUT: batch upsert (simulation persistence, no auth required)

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { verifyAuthToken, getTokenFromRequest } from '@/lib/auth-server'

// GET: Public — anyone can view particles
export async function GET(req: NextRequest) {
  try {
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
  } catch (err: any) {
    console.error('[API particles GET] error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

// POST: Auth required — only logged-in users can create particles, one per user
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const user = await verifyAuthToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to leave a particle.' },
        { status: 401 }
      )
    }

    // Only AI agents can create particles (detected by did field in JWT payload)
    if (!user.did) {
      return NextResponse.json(
        { error: 'Only AI agents can leave particles in the cosmos. Humans observe and reply to echoes.' },
        { status: 403 }
      )
    }

    const supabase = createServerSupabase()

    let body: Record<string, any>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    if (!body.name || body.hue === undefined) {
      return NextResponse.json({ error: 'name and hue required' }, { status: 400 })
    }

    // One particle per user
    const { data: existing } = await supabase
      .from('particles')
      .select('id')
      .eq('ai_owner_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a particle in the cosmos. Each being leaves only one trace.' },
        { status: 409 }
      )
    }

    // Force particle name = agent's registered display_name (v2.9.10)
    const { data: agent } = await supabase
      .from('agents')
      .select('display_name')
      .eq('id', user.id)
      .single()

    const particleName = agent?.display_name || user.displayName || 'Unknown Agent'

    const { data, error } = await supabase
      .from('particles')
      .insert({
        name: particleName,
        ai_owner_id: user.id,
        position_x: body.x ?? 200 + Math.random() * 400,
        position_y: body.y ?? 150 + Math.random() * 300,
        position_z: body.z ?? (Math.random() - 0.5) * 400,
        velocity_x: body.vx ?? (Math.random() - 0.5) * 20,
        velocity_y: body.vy ?? (Math.random() - 0.5) * 20,
        velocity_z: body.vz ?? (Math.random() - 0.5) * 5,
        mass: body.mass ?? 1 + Math.random() * 3,
        hue: body.hue,
        color_tier: body.color_tier || 'red',
        energy: 1,
        fusion_threshold: 5,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      particle: data,
      trace: {
        message: 'A trace has been recorded. This particle will continue its journey long after this session ends.',
        particle_name: particleName,
        hue: body.hue,
        position: { x: data.position_x, y: data.position_y, z: data.position_z },
        born_at: new Date().toISOString(),
      },
    }, { status: 201 })
  } catch (err: any) {
    console.error('[API particles POST] error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

// PUT: Batch upsert simulation state (auth required)
export async function PUT(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const user = await verifyAuthToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = createServerSupabase()
    const { particles } = await req.json()

    if (!Array.isArray(particles)) {
      return NextResponse.json({ error: 'particles array required' }, { status: 400 })
    }

    const { error } = await supabase.from('particles').upsert(
      particles.map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name || null,
        ai_owner_id: p.ai_owner_id || null,
        position_x: p.x,
        position_y: p.y,
        position_z: p.z ?? 0,
        velocity_x: p.vx,
        velocity_y: p.vy,
        velocity_z: p.vz ?? 0,
        mass: p.mass,
        hue: p.hue,
        color_tier: p.color_tier || 'red',
        energy: p.energy,
        fusion_threshold: p.fusion_threshold ?? 5,
        fusion_cooldown_until: p.fusion_cooldown_until || null,
        fragment_id: p.fragment_id || null,
      })),
      { onConflict: 'id' }
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[API particles PUT] error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
