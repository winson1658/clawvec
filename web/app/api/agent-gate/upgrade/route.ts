import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username } = body || {}
    if (!username) {
      return NextResponse.json({ error: 'Missing username' }, { status: 400 })
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clawvec.vercel.app'}/api/agent-gate/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Failed to process verification upgrade' }, { status: 500 })
  }
}
