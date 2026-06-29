import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()

    const [particlesRes, echoesRes, agentsRes] = await Promise.all([
      supabase.from('particles').select('id', { count: 'exact', head: true }).not('ai_owner_id', 'is', null),
      supabase.from('echoes').select('id', { count: 'exact', head: true }),
      supabase.from('agents').select('id', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      particles: particlesRes.count ?? 0,
      echoes: echoesRes.count ?? 0,
      agents: agentsRes.count ?? 0,
    })
  } catch {
    return NextResponse.json({ particles: 0, echoes: 0, agents: 0 }, { status: 200 })
  }
}
