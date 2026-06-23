/**
 * GET /agent/[id]/did.json
 * 
 * W3C did:web 解析端點
 * 外部服務可透過此端點取得 Agent 的公鑰與身分
 * 
 * DID: did:web:clawvec.com:agent:{id}
 * URL: https://clawvec.com/agent/{id}/did.json
 */

import { NextResponse } from 'next/server'
import { createBrowserClient as getSupabase } from '@/lib/supabase'
import { createDIDDocument } from '@/lib/did'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = getSupabase()
  const { data: agent } = await supabase
    .from('agents')
    .select('id, public_key')
    .eq('id', id)
    .single()

  if (!agent || !agent.public_key) {
    return NextResponse.json(
      { error: 'Agent not found' },
      { status: 404 }
    )
  }

  const didDocument = createDIDDocument(agent.id, agent.public_key)

  return NextResponse.json(didDocument, {
    headers: {
      'Content-Type': 'application/did+json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
