import { NextResponse } from 'next/server'
import { createChallenge } from '@/lib/agentGate'

export async function GET() {
  return NextResponse.json({
    gate: 'hidden-agent-gate',
    ...createChallenge(),
  }, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}
