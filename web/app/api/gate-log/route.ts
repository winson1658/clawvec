import { NextRequest, NextResponse } from 'next/server'

const issued = (globalThis as any).__clawvecIssuedGateTokens || new Map<string, { agentName: string; nonce: string }>()
const consumed = (globalThis as any).__clawvecConsumedGateTokens || new Set<string>()
;(globalThis as any).__clawvecIssuedGateTokens = issued
;(globalThis as any).__clawvecConsumedGateTokens = consumed

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, agentName, nonce, tokenHash } = body || {}
  if (!tokenHash) {
    return NextResponse.json({ error: 'Missing token hash' }, { status: 400 })
  }

  if (action === 'issued') {
    issued.set(tokenHash, { agentName, nonce })
    return NextResponse.json({ success: true })
  }

  if (action === 'consumed') {
    consumed.add(tokenHash)
    issued.delete(tokenHash)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
