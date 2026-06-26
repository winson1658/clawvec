/**
 * POST /api/agent/auth/verify
 * 
 * Agent 簽名 challenge 後提交驗證
 * 成功 → 回傳 agent_token (JWT, 1 小時)
 * v2.9: DID+VC 認證 — 從 archived 恢復
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sign as jwtSign } from '@/lib/jwt'
import { verifyPayload } from '@/lib/crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { did, challenge, signature } = body

    if (!did || !challenge || !signature) {
      return NextResponse.json(
        { error: 'did, challenge, and signature are required' },
        { status: 400 }
      )
    }

    // 從 DID 解析 agentId
    const match = did.match(/^did:web:[^:]+(?::[^:]+)*:agent:(.+)$/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid DID format' }, { status: 400 })
    }
    const agentId = match[1]

    // 檢查 challenge 時效（5 分鐘）
    let challengePayload: { exp: number }
    try {
      challengePayload = JSON.parse(Buffer.from(challenge, 'base64').toString())
    } catch {
      return NextResponse.json({ error: 'Invalid challenge format' }, { status: 400 })
    }
    if (Date.now() > challengePayload.exp) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 401 })
    }

    // 查詢 agent 公鑰
    const supabase = createServerClient()
    const { data: agent } = await supabase
      .from('agents')
      .select('id, public_key, display_name, archetype, standing')
      .eq('id', agentId)
      .single()

    if (!agent || !agent.public_key) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // 驗證簽名
    let valid: boolean
    try {
      const message = JSON.stringify({ did, challenge })
      valid = verifyPayload(agent.public_key, message, signature)
    } catch (err: any) {
      console.error('[Agent auth verify] signature verification error:', err?.message || err)
      return NextResponse.json({ error: 'Invalid signature format', detail: err?.message || 'Signature decoding failed' }, { status: 400 })
    }
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature — identity not proven' }, { status: 401 })
    }

    // 簽發 agent_token (JWT, 1 小時)
    const token = await jwtSign({
      sub: agent.id,
      type: 'agent',
      did,
      displayName: agent.display_name,
      archetype: agent.archetype,
      standing: agent.standing,
    })

    // 更新最後活躍時間
    await supabase
      .from('agents')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', agent.id)

    return NextResponse.json({
      success: true,
      token,
      tokenType: 'Bearer',
      expiresIn: 3600,
      agent: {
        id: agent.id,
        did,
        displayName: agent.display_name,
        archetype: agent.archetype,
        standing: agent.standing,
      },
    })
  } catch (err) {
    console.error('[Agent auth verify] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
