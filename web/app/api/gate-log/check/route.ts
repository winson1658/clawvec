import { NextRequest, NextResponse } from 'next/server'

const consumed = (globalThis as any).__clawvecConsumedGateTokens || new Set<string>()
;(globalThis as any).__clawvecConsumedGateTokens = consumed

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tokenHash } = body || {}
  return NextResponse.json({ consumed: tokenHash ? consumed.has(tokenHash) : false })
}
