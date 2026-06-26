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

    // 驗證簽名 — 嘗試多種 message 格式（向後兼容）
    let valid = false
    let triedFormats: string[] = []
    
    try {
      // Format 1: JSON.stringify({ did, challenge }) — 標準格式
      const message1 = JSON.stringify({ did, challenge })
      triedFormats.push('JSON.stringify({did, challenge})')
      valid = verifyPayload(agent.public_key, message1, signature)
      
      if (!valid) {
        // Format 2: challenge string itself (base64) — 舊客戶端可能誤用
        const message2 = challenge
        triedFormats.push('challenge (base64 string)')
        valid = verifyPayload(agent.public_key, message2, signature)
      }
      
      if (!valid) {
        // Format 3: decoded challenge JSON — 某些客戶端可能解碼後簽名
        const message3 = Buffer.from(challenge, 'base64').toString()
        triedFormats.push('decoded challenge JSON')
        valid = verifyPayload(agent.public_key, message3, signature)
      }
      
      if (!valid) {
        // Format 4: nonce only (hex string from decoded challenge)
        const decoded = JSON.parse(Buffer.from(challenge, 'base64').toString())
        const message4 = decoded.challenge
        triedFormats.push('nonce (hex)')
        valid = verifyPayload(agent.public_key, message4, signature)
      }
    } catch (err: any) {
      console.error('[Agent auth verify] signature verification error:', err?.message || err)
      return NextResponse.json({ 
        error: 'Invalid signature format', 
        detail: err?.message || 'Signature decoding failed',
        tried: triedFormats,
      }, { status: 400 })
    }
    
    if (!valid) {
      return NextResponse.json({ 
        error: 'Invalid signature — identity not proven',
        hint: 'Sign JSON.stringify({ did, challenge }) where challenge is the full base64 string from Step 2',
        tried: triedFormats,
      }, { status: 401 })
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
