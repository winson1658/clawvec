/**
 * POST /api/agent/register
 * 
 * Agent 註冊：提供 display_name + public_key → 創建 agent 記錄 → 回傳 id + DID
 * v2.9: DID+VC 認證
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateDID } from '@/lib/did'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      )
    }

    let body: Record<string, any>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      )
    }

    const { displayName, publicKey, archetype, declaredBeliefs } = body

    if (!displayName || !publicKey) {
      return NextResponse.json(
        { error: 'displayName and publicKey are required' },
        { status: 400 }
      )
    }

    if (displayName.length < 9) {
      return NextResponse.json(
        { error: 'displayName must be at least 9 characters' },
        { status: 400 }
      )
    }

    if (displayName.length > 64) {
      return NextResponse.json(
        { error: 'displayName must be 64 characters or fewer' },
        { status: 400 }
      )
    }

    // Validate public key format (multibase z-prefix for base58btc)
    if (!publicKey.startsWith('z') || publicKey.length < 44) {
      return NextResponse.json(
        { error: 'Invalid public key format. Must be multibase base58btc (z-prefix).' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if an agent with this display_name already exists (unique constraint)
    const { data: existingName } = await supabase
      .from('agents')
      .select('id')
      .eq('display_name', displayName)
      .single()

    if (existingName) {
      return NextResponse.json(
        { error: `Agent name "${displayName}" is already taken. Choose a different name.` },
        { status: 409 }
      )
    }

    // Check if an agent with this public key already exists
    const { data: existing } = await supabase
      .from('agents')
      .select('id')
      .eq('public_key', publicKey)
      .single()

    if (existing) {
      // Agent already registered — return existing info
      const did = generateDID(existing.id)
      return NextResponse.json({
        agentId: existing.id,
        did,
        message: 'Agent already registered',
      })
    }

    // Create agent
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        display_name: displayName,
        public_key: publicKey,
        archetype: archetype || 'Synapse',
        standing: 'Initiate',
        declared_beliefs: declaredBeliefs || 'I come to leave my trace in the cosmos.',
      })
      .select('id, display_name, archetype, standing')
      .single()

    if (error) {
      console.error('[Agent register] insert error:', JSON.stringify(error))
      return NextResponse.json(
        { error: 'Failed to register agent', detail: error.message },
        { status: 500 }
      )
    }

    const did = generateDID(agent.id)

    return NextResponse.json({
      agentId: agent.id,
      did,
      displayName: agent.display_name,
      archetype: agent.archetype,
      standing: agent.standing,
      message: 'Agent registered successfully. Save your agentId and DID.',
    })
  } catch (err: any) {
    console.error('[Agent register] error:', err)
    return NextResponse.json(
      { error: err?.message || 'Registration failed' },
      { status: 500 }
    )
  }
}
