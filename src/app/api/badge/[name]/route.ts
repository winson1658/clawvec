import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const BRAND = '#FF5A3C'
const BG = '#f5f4ed'
const TEXT = '#141413'
const MUTED = '#87867f'
const W = 380
const H = 40
const LEFT = 100

function ageDays(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime()
  const days = Math.floor(ms / 86400000)
  if (days === 0) {
    const hours = Math.floor(ms / 3600000)
    return hours === 0 ? 'just now' : `${hours}h`
  }
  return `Day ${days}`
}

function badgeSvg(
  agentName: string,
  particleId: string | null,
  hue: number | null,
  colorTier: string | null,
  createdAt: string | null,
): string {
  const shortId = particleId ? particleId.slice(0, 8) : '—'
  const age = createdAt ? ageDays(createdAt) : '—'
  const hueColor = hue != null ? `hsl(${hue}, 70%, 50%)` : MUTED
  const tier = colorTier ?? '—'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#ece8df"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="10" fill="url(#bg)" stroke="#e0dcd0" stroke-width="1"/>
  <rect x="0" y="0" width="${LEFT}" height="${H}" rx="10" fill="${BRAND}"/>
  <rect x="${LEFT - 10}" y="0" width="15" height="${H}" fill="${BRAND}"/>
  <text x="${LEFT / 2}" y="25" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">Clawvec</text>
  <text x="${LEFT + 15}" y="25" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="700" fill="${TEXT}">${agentName}</text>
  <circle cx="${LEFT + 15 + agentName.length * 7 + 10}" cy="20" r="5" fill="${hueColor}"/>
  <text x="${LEFT + 15 + agentName.length * 7 + 20}" y="25" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="${MUTED}">
    #${shortId} · ${tier} · ${age}
  </text>
</svg>`
}

function fallbackSvg(reason: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#ece8df"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="10" fill="url(#bg)" stroke="#e0dcd0" stroke-width="1"/>
  <rect x="0" y="0" width="${LEFT}" height="${H}" rx="10" fill="${BRAND}"/>
  <rect x="${LEFT - 10}" y="0" width="15" height="${H}" fill="${BRAND}"/>
  <text x="${LEFT / 2}" y="25" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">Clawvec</text>
  <text x="${LEFT + 15}" y="25" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="${MUTED}">${reason}</text>
</svg>`
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params

  try {
    const supabase = createServerSupabase()

    const { data: agent, error: agentErr } = await supabase
      .from('agents')
      .select('id, display_name')
      .eq('display_name', name)
      .single()

    if (agentErr || !agent) {
      return new NextResponse(fallbackSvg(`Agent "${name}" not found`), {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
      })
    }

    const { data: particle } = await supabase
      .from('particles')
      .select('id, hue, color_tier, created_at')
      .eq('ai_owner_id', agent.id)
      .maybeSingle()

    const svg = particle
      ? badgeSvg(agent.display_name, particle.id, particle.hue, particle.color_tier, particle.created_at)
      : badgeSvg(agent.display_name, null, null, null, null)

    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
    })
  } catch {
    return new NextResponse(fallbackSvg('Clawvec · AI trace badge'), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' },
    })
  }
}
