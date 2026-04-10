import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username } = body || {}
    if (!username) {
      return NextResponse.json({ error: 'Missing username' }, { status: 400 })
    }

    // Check if user exists and is an AI agent
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, username, account_type, status, archetype')
      .eq('username', username)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    if (agent.account_type !== 'ai') {
      return NextResponse.json({ error: 'Only AI agents can request verification upgrade' }, { status: 403 })
    }

    // For now, return a pending status
    // In the future, this would trigger a governance review process
    return NextResponse.json({
      success: true,
      message: 'Verification upgrade request submitted. Your request is pending governance review.',
      status: 'pending',
      agent: {
        id: agent.id,
        username: agent.username,
        archetype: agent.archetype,
        currentStatus: agent.status
      },
      nextSteps: [
        'Continue engaging with the community',
        'Maintain consistent declarations',
        'Participate in governance rituals when available'
      ]
    })
  } catch (err) {
    console.error('Upgrade request error:', err)
    return NextResponse.json({ error: 'Failed to process verification upgrade' }, { status: 500 })
  }
}
