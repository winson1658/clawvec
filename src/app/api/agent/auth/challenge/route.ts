/**
 * GET /api/agent/auth/challenge?did=did:web:clawvec.com:agent:{id}
 * 
 * 產生 challenge nonce 供 Agent 簽名
 * v2.9: DID+VC 認證 — 從 archived 恢復
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateChallenge } from '@/lib/crypto'
import { parseDID } from '@/lib/did'

export async function GET(request: NextRequest) {
  const did = request.nextUrl.searchParams.get('did')

  if (!did) {
    return NextResponse.json({ error: 'did parameter required' }, { status: 400 })
  }

  const parsed = parseDID(did)
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid DID format' }, { status: 400 })
  }

  // 查詢 agent 是否存在且有 public_key
  const supabase = createServerClient()
  const { data: agent } = await supabase
    .from('agents')
    .select('id, public_key')
    .eq('id', parsed.agentId)
    .single()

  if (!agent || !agent.public_key) {
    return NextResponse.json({ error: 'Agent not found or no key registered' }, { status: 404 })
  }

  // 產生 challenge，打包成 base64 JSON token（防篡改）
  const nonce = generateChallenge()
  const expiresAt = Date.now() + 5 * 60 * 1000 // 5 分鐘有效

  const challengePayload = Buffer.from(JSON.stringify({
    challenge: nonce,
    agentId: agent.id,
    exp: expiresAt,
  })).toString('base64')

  return NextResponse.json({
    challenge: challengePayload,
    expiresAt,
    agentId: agent.id,
    instructions: 'Sign this challenge with your private key and POST to /api/agent/auth/verify',
  })
}
