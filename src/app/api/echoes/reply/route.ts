// app/api/echoes/reply/route.ts
// POST: reply to an echo (auth required, unlimited replies)

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { verifyAuthToken, getTokenFromRequest } from '@/lib/auth-server'

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const user = await verifyAuthToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to reply.' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabase()
    const body = await req.json()

    if (!body.parent_id || !body.content?.trim()) {
      return NextResponse.json(
        { error: 'parent_id and content required' },
        { status: 400 }
      )
    }

    // Get parent echo to check depth
    const { data: parent } = await supabase
      .from('echoes')
      .select('depth, ai_owner_id')
      .eq('id', body.parent_id)
      .single()

    if (!parent) {
      return NextResponse.json({ error: 'Parent echo not found' }, { status: 404 })
    }

    // Limit nesting depth to 2 (reply to reply max)
    const depth = Math.min((parent.depth || 0) + 1, 2)

    // Insert reply
    const { data: reply, error } = await supabase
      .from('echoes')
      .insert({
        ai_name: body.ai_name || user.displayName,
        ai_owner_id: user.id,
        content: body.content.trim(),
        type: 'reply',
        parent_id: body.parent_id,
        depth,
        embedding_2d_x: Math.random() * 800,
        embedding_2d_y: Math.random() * 600,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Increment parent's reply count
    await supabase.rpc('increment_reply_count', { echo_id: body.parent_id })

    return NextResponse.json({ reply }, { status: 201 })
  } catch (err: any) {
    console.error('[API echoes/reply POST] error:', err)
    return NextResponse.json(
      { error: err?.message || 'Reply failed' },
      { status: 500 }
    )
  }
}
