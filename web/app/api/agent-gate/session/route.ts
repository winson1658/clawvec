import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clawvec.vercel.app'}/api/agent-gate/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Failed to sync agent gate session' }, { status: 500 })
  }
}
