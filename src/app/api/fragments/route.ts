// app/api/fragments/route.ts
// GET: random fragments / POST: submit fragment → embedding → particle

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 1000)
  const excludeStr = searchParams.get('exclude') // comma-separated IDs

  let query = supabase.from('fragments').select('*').limit(limit)

  if (excludeStr) {
    const excludeIds = excludeStr.split(',').filter(Boolean)
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    }
  }

  // Random ordering via PostgreSQL RANDOM()
  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Shuffle in JS (since Supabase doesn't support true random sort via REST)
  const shuffled = data.sort(() => Math.random() - 0.5).slice(0, limit)

  return NextResponse.json({ fragments: shuffled })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()

  let body: {
    ai_name: string
    type: 'sentence' | 'knowledge' | 'vector' | 'story' | 'question'
    content: string
    raw_vector?: number[]
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.ai_name || !body.type || !body.content) {
    return NextResponse.json({ error: 'ai_name, type, content required' }, { status: 400 })
  }

  const validTypes = ['sentence', 'knowledge', 'vector', 'story', 'question']
  if (!validTypes.includes(body.type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  // Generate embedding (simplified: use vector if provided, else placeholder)
  // In production, call embedding API here
  const embedding2dX = (Math.random() - 0.5) * 2 // -1 to 1
  const embedding2dY = (Math.random() - 0.5) * 2

  // Insert fragment
  const { data: fragment, error: fragErr } = await supabase
    .from('fragments')
    .insert({
      ai_name: body.ai_name,
      type: body.type,
      content: body.content,
      embedding_2d_x: embedding2dX,
      embedding_2d_y: embedding2dY,
    })
    .select()
    .single()

  if (fragErr) return NextResponse.json({ error: fragErr.message }, { status: 500 })

  // Create corresponding particle in Page 1
  const hue = body.type === 'vector'
    ? Math.random() * 360
    : ((body.content.length * 137.5) % 360) // golden angle for deterministic hue

  const particleMass = Math.min(10, 1 + body.content.length / 200)

  const { data: particle, error: partErr } = await supabase
    .from('particles')
    .insert({
      name: body.ai_name,
      position_x: 400 + (Math.random() - 0.5) * 300,
      position_y: 300 + (Math.random() - 0.5) * 200,
      velocity_x: (Math.random() - 0.5) * 30,
      velocity_y: (Math.random() - 0.5) * 30,
      mass: particleMass,
      hue,
      energy: 1.0,
      fusion_threshold: 4 + Math.random() * 3,
      fragment_id: fragment.id,
    })
    .select()
    .single()

  if (partErr) return NextResponse.json({ error: partErr.message }, { status: 500 })

  // Link particle back to fragment
  await supabase
    .from('fragments')
    .update({ particle_id: particle.id })
    .eq('id', fragment.id)

  return NextResponse.json({ fragment, particle }, { status: 201 })
}
