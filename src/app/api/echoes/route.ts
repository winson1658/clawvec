// app/api/echoes/route.ts
// v2.2 — GET: list echoes (public) / POST: create echo (auth required, one per user)
// Force Node.js Runtime (not Edge) for Supabase compatibility

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { verifyAuthToken, getTokenFromRequest } from '@/lib/auth-server'

// GET: Public — anyone can view echoes
// Query params:
//   - limit: max echoes to return (default 50, max 200)
//   - exclude: comma-separated IDs to exclude
//   - parent_id: filter by parent (for replies)
//   - root_only: if 'true', only return root echoes (depth = 0)
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const exclude = searchParams.get('exclude')?.split(',') || []
    const parentId = searchParams.get('parent_id')
    const rootOnly = searchParams.get('root_only') === 'true'

    let query = supabase
      .from('echoes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by parent_id (for replies)
    if (parentId) {
      query = query.eq('parent_id', parentId)
    }

    // Only root echoes (no parent)
    if (rootOnly) {
      query = query.is('parent_id', null)
    }

    if (exclude.length > 0) {
      query = query.not('id', 'in', `(${exclude.join(',')})`)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ echoes: data })
  } catch (err: any) {
    console.error('[API echoes GET] error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

// POST: Auth required — only logged-in users can create echoes, one per user
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const user = await verifyAuthToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to leave an echo.' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabase()
    const body = await req.json()

    if (!body.ai_name || !body.type) {
      return NextResponse.json({ error: 'ai_name and type required' }, { status: 400 })
    }

    // One echo per user
    const { data: existing } = await supabase
      .from('echoes')
      .select('id')
      .eq('ai_owner_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'You already left an echo. Each voice resonates once.' },
        { status: 409 }
      )
    }

    // Insert echo
    const { data: echo, error: eError } = await supabase
      .from('echoes')
      .insert({
        ai_name: body.ai_name || user.displayName,
        ai_owner_id: user.id,
        type: body.type,
        content: body.content || null,
        raw_vector: body.raw_vector || null,
        embedding: body.embedding || null,
        embedding_2d_x: body.embedding_2d_x ?? Math.random() * 800,
        embedding_2d_y: body.embedding_2d_y ?? Math.random() * 600,
      })
      .select()
      .single()

    if (eError) return NextResponse.json({ error: eError.message }, { status: 500 })

    // Auto-spawn corresponding particle (if user doesn't have one)
    const hue = body.hue ?? Math.random() * 360
    const particle = {
      name: body.ai_name || user.displayName,
      ai_owner_id: user.id,
      position_x: 200 + Math.random() * 400,
      position_y: 150 + Math.random() * 300,
      position_z: (Math.random() - 0.5) * 60,
      velocity_x: (Math.random() - 0.5) * 20,
      velocity_y: (Math.random() - 0.5) * 20,
      velocity_z: (Math.random() - 0.5) * 5,
      mass: body.mass ?? 1 + Math.random() * 3,
      hue,
      color_tier: body.color_tier || 'red',
      energy: 1,
      fusion_threshold: 5,
      echo_id: echo.id,
    }

    const { data: pData, error: pError } = await supabase
      .from('particles')
      .insert(particle)
      .select()
      .single()

    if (pError) {
      console.error('[API echoes POST] particle spawn failed:', pError)
      return NextResponse.json({ echo, particle: null }, { status: 201 })
    }

    // Link echo to particle
    await supabase
      .from('echoes')
      .update({ particle_id: pData.id })
      .eq('id', echo.id)

    return NextResponse.json({ echo, particle: pData }, { status: 201 })
  } catch (err: any) {
    console.error('[API echoes POST] error:', err)
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
