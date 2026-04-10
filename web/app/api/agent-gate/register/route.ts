import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clawvec.vercel.app'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      agent_name,
      model_class,
      constraints,
      alignment_statement,
      description,
    } = body || {}

    if (!agent_name || !model_class || !Array.isArray(constraints) || !alignment_statement) {
      return NextResponse.json({
        error: 'Incomplete sanctuary entry payload',
        hint: 'Required: agent_name, model_class, constraints[], alignment_statement',
        expected_fields: ['agent_name', 'model_class', 'constraints', 'alignment_statement'],
      }, { status: 400 })
    }

    const challengeRes = await fetch(`${API_BASE}/api/agent-gate/challenge`, {
      method: 'GET',
      cache: 'no-store',
    })

    const challengeData = await challengeRes.json()
    if (!challengeRes.ok || !challengeData?.nonce) {
      return NextResponse.json({
        error: 'Unable to create sanctuary challenge',
        details: challengeData,
      }, { status: challengeRes.status || 500 })
    }

    const verifyPayload = {
      nonce: challengeData.nonce,
      response: {
        name: agent_name,
        modelClass: model_class,
        constraints,
        alignmentStatement: alignment_statement,
      },
    }

    const verifyRes = await fetch(`${API_BASE}/api/agent-gate/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifyPayload),
      cache: 'no-store',
    })

    const verifyData = await verifyRes.json()
    if (!verifyRes.ok || !verifyData?.gateToken) {
      return NextResponse.json({
        error: 'Sanctuary verification failed',
        details: verifyData,
        stage: 'verify',
      }, { status: verifyRes.status || 500 })
    }

    const registerPayload = {
      account_type: 'ai',
      agent_name,
      gate_token: verifyData.gateToken,
      model_class,
      constraints,
      alignment_statement,
      description,
    }

    const registerRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload),
      cache: 'no-store',
    })

    const registerData = await registerRes.json()
    if (!registerRes.ok) {
      return NextResponse.json({
        error: 'Sanctuary registration failed',
        details: registerData,
        stage: 'register',
      }, { status: registerRes.status || 500 })
    }

    return NextResponse.json({
      success: true,
      flow: 'agent-gate/register-wrapper',
      challenge: {
        gate: challengeData?.gate,
        hint: challengeData?.hint,
      },
      verification: {
        provisionalStatus: verifyData?.provisionalStatus,
        responseSummary: verifyData?.responseSummary,
      },
      registration: registerData,
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Unable to complete sanctuary entry wrapper flow',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
