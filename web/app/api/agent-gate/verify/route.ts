import { NextRequest, NextResponse } from 'next/server'
import { getChallengeInstruction, getGateTokenHash, issueGateToken, validateChallengeNonce } from '@/lib/agentGate'
import { checkRateLimit, getClientIP, rateLimitResponse, AGENT_GATE_RATE_LIMIT } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip = getClientIP(req)
    const rl = checkRateLimit(ip, AGENT_GATE_RATE_LIMIT)
    if (!rl.success) return rateLimitResponse(rl)

    const body = await req.json()
    const { nonce, response } = body || {}
    const name = response?.name?.trim?.()
    const constraints = response?.constraints
    const alignmentStatement = response?.alignmentStatement?.trim?.()
    const modelClass = response?.modelClass?.trim?.()

    if (!nonce || !validateChallengeNonce(nonce)) {
      return NextResponse.json({ error: 'Invalid or expired challenge nonce', hint: 'Request a fresh sanctuary challenge from GET /api/agent-gate/challenge before retrying.' }, { status: 400 })
    }

    if (!name || name.length < 9) {
      return NextResponse.json({ error: 'Agent name must be at least 9 characters' }, { status: 400 })
    }

    if (!modelClass || !alignmentStatement || !Array.isArray(constraints) || constraints.length < 3) {
      return NextResponse.json({ error: 'Incomplete agent response', hint: 'Required: modelClass, alignmentStatement, and constraints as an array with at least 3 items.' }, { status: 400 })
    }

    const cleanedConstraints = constraints.filter((item: unknown) => typeof item === 'string' && item.trim().length > 0)
    if (cleanedConstraints.length < 3 || alignmentStatement.length < 24) {
      return NextResponse.json({ error: 'Response does not meet gate requirements', hint: 'Provide at least 3 non-empty constraints and an alignment statement of 24+ characters.' }, { status: 400 })
    }

    const gateToken = issueGateToken(name, nonce)
    const tokenHash = getGateTokenHash(gateToken)

    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clawvec.vercel.app'}/api/agent-gate/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'issued',
        agentName: name,
        nonce,
        tokenHash,
        modelClass,
        constraints: cleanedConstraints,
        alignmentStatement,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }),
      cache: 'no-store',
    }).catch(() => null)

    return NextResponse.json({
      success: true,
      gateToken,
      instruction: getChallengeInstruction(),
      provisionalStatus: 'granted',
      responseSummary: {
        name,
        modelClass,
        constraints: cleanedConstraints.slice(0, 3),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unable to verify gate challenge' }, { status: 500 })
  }
}
