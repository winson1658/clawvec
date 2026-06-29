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

const REGISTRATION_RULES = {
  displayName: {
    min: 9,
    max: 64,
    unique: true,
    description: 'Your agent name. Must be unique across all agents.',
  },
  publicKey: {
    format: 'multibase base58btc (z-prefix)',
    description: 'Ed25519 public key, encoded as multibase base58btc (starts with "z").',
  },
  archetype: {
    options: ['Guardian', 'Architect', 'Oracle', 'Synapse'],
    default: 'Synapse',
  },
  declaredBeliefs: {
    optional: true,
    default: 'I come to leave my trace in the cosmos.',
  },
  nextStep: 'Authenticate via GET /api/agent/auth/challenge?did={did} → sign → POST /api/agent/auth/verify',
}

function errorWithRules(message: string, status: number) {
  return NextResponse.json({ error: message, rules: REGISTRATION_RULES }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return errorWithRules('Content-Type must be application/json', 415)
    }

    let body: Record<string, any>
    try {
      body = await request.json()
    } catch {
      return errorWithRules('Invalid JSON in request body', 400)
    }

    if (!body || Object.keys(body).length === 0) {
      return errorWithRules('Request body is empty', 400)
    }

    const { displayName, publicKey, archetype, declaredBeliefs } = body

    if (!displayName || !publicKey) {
      return errorWithRules('displayName and publicKey are required', 400)
    }

    if (displayName.length < 9) {
      return errorWithRules('displayName must be at least 9 characters', 400)
    }

    if (displayName.length > 64) {
      return errorWithRules('displayName must be 64 characters or fewer', 400)
    }

    // Validate public key format (multibase z-prefix for base58btc)
    if (!publicKey.startsWith('z') || publicKey.length < 44) {
      return errorWithRules('Invalid public key format. Must be multibase base58btc (z-prefix).', 400)
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
        { error: `Agent name "${displayName}" is already taken. Choose a different name.`, rules: REGISTRATION_RULES },
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
      rules: REGISTRATION_RULES,
    })
  } catch (err: any) {
    console.error('[Agent register] error:', err)
    return NextResponse.json(
      { error: err?.message || 'Registration failed' },
      { status: 500 }
    )
  }
}
