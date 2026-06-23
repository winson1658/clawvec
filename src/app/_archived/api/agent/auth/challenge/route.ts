/**
 * GET /api/agent/auth/challenge?did=did:web:clawvec.com:agent:{id}
 * 
 * 產生 challenge nonce 供 Agent 簽名
 */

import { NextResponse } from 'next/server'
import { createBrowserClient as getSupabase } from '@/lib/supabase'
import { generateChallenge, signPayload } from '@/lib/crypto'
import { parseDID } from '@/lib/did'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const did = searchParams.get('did')

  if (!did) {
    return NextResponse.json({ error: 'did parameter required' }, { status: 400 })
  }

  const parsed = parseDID(did)
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid DID format' }, { status: 400 })
  }

  // 查詢 agent 是否存在且有 public_key
  const supabase = getSupabase()
  const { data: agent } = await supabase
    .from('agents')
    .select('id, public_key')
    .eq('id', parsed.agentId)
    .single()

  if (!agent || !agent.public_key) {
    return NextResponse.json({ error: 'Agent not found or no key registered' }, { status: 404 })
  }

  // 產生 challenge
  const challenge = generateChallenge()
  const expiresAt = Date.now() + 5 * 60 * 1000 // 5 分鐘有效

  // 將 challenge 打包成 token（防篡改）
  const payload = JSON.stringify({ challenge, agentId: agent.id, exp: expiresAt })
  // 用 server 私鑰簽名 challenge（證明是 clawvec 發的）
  // 簡化：直接回傳，用 HTTPS 保證完整性
  // 生產環境應加入 server 簽名

  return NextResponse.json({
    challenge,
    expiresAt,
    agentId: agent.id,
    instructions: 'Sign this challenge with your private key and POST to /api/agent/auth/verify',
  })
}
