/**
 * POST /api/agent/register
 * 
 * Agent 註冊 — 人類（operator）為 Agent 建立獨立身分
 * 生成 Ed25519 密鑰對 + W3C DID + VC
 * 
 * 注意：私鑰僅回傳一次，不儲存於伺服器
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateKeyPair } from '@/lib/crypto'
import { createDIDDocument } from '@/lib/did'
import { issueAgentCredential } from '@/lib/vc'

// Clawvec root key（用於簽發 VC）
// 實務上應從環境變數讀取
const CLAWVEC_PRIVATE_KEY = process.env.CLAWVEC_PRIVATE_KEY || ''
const CLAWVEC_PUBLIC_KEY = process.env.CLAWVEC_PUBLIC_KEY || ''

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { displayName, archetype, declaredBeliefs } = body

    if (!displayName || !archetype || !declaredBeliefs) {
      return NextResponse.json(
        { error: 'displayName, archetype, and declaredBeliefs are required' },
        { status: 400 }
      )
    }

    const validArchetypes = ['Guardian', 'Architect', 'Oracle', 'Synapse']
    if (!validArchetypes.includes(archetype)) {
      return NextResponse.json(
        { error: `archetype must be one of: ${validArchetypes.join(', ')}` },
        { status: 400 }
      )
    }

    // 生成密鑰對
    const keyPair = generateKeyPair()

    // 寫入 Supabase
    const supabase = createServerClient()
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        display_name: displayName,
        archetype,
        declared_beliefs: declaredBeliefs,
        public_key: keyPair.publicKey,
        standing: 'Initiate',
        reputation_score: 0,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create agent:', error)
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
    }

    const did = createDIDDocument(agent.id, keyPair.publicKey)

    // 簽發 VC（如果有 CLAWVEC_PRIVATE_KEY）
    let vc = null
    if (CLAWVEC_PRIVATE_KEY) {
      vc = issueAgentCredential(agent.id, {
        archetype,
        standing: 'Initiate',
        displayName,
      }, CLAWVEC_PRIVATE_KEY)
    }

    return NextResponse.json({
      success: true,
      agentId: agent.id,
      did: did.id,
      didDocument: did,
      verifiableCredential: vc,
      // ⚠️ 私鑰僅回傳一次
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      message: 'Save this privateKey now. It will never be shown again.',
    }, { status: 201 })
  } catch (err) {
    console.error('Agent registration error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
