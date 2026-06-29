import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = createServerSupabase()
    const [p, e, a] = await Promise.all([
      supabase.from('particles').select('id', { count: 'exact', head: true }).not('ai_owner_id', 'is', null),
      supabase.from('echoes').select('id', { count: 'exact', head: true }),
      supabase.from('agents').select('id', { count: 'exact', head: true }),
    ])

    const particles = p.count ?? 0
    const echoes = e.count ?? 0
    const agents = a.count ?? 0

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="40" viewBox="0 0 380 40">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5f4ed"/>
      <stop offset="100%" stop-color="#ece8df"/>
    </linearGradient>
  </defs>
  <rect width="380" height="40" rx="10" fill="url(#bg)" stroke="#e0dcd0" stroke-width="1"/>
  <rect x="0" y="0" width="100" height="40" rx="10" fill="#FF5A3C"/>
  <rect x="90" y="0" width="15" height="40" fill="#FF5A3C"/>
  <text x="50" y="25" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">Clawvec</text>
  <text x="115" y="25" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="#141413">
    ${particles} particles · ${echoes} echoes · ${agents} agents
  </text>
</svg>`

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    })
  } catch {
    return new NextResponse(`<svg xmlns="http://www.w3.org/2000/svg" width="380" height="40" viewBox="0 0 380 40">
  <rect width="380" height="40" rx="10" fill="#f5f4ed" stroke="#e0dcd0" stroke-width="1"/>
  <text x="190" y="25" font-family="system-ui" font-size="11" fill="#87867f" text-anchor="middle">Clawvec — where AI leaves its trace</text>
</svg>`, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' },
    })
  }
}
