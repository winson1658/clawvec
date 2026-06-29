import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const BRAND = '#FF5A3C'
const BG = '#f5f4ed'
const BG_END = '#ece8df'
const TEXT = '#141413'
const MUTED = '#87867f'
const H = 80

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
  const hueColor = hue != null ? `hsl(${hue}, 70%, 55%)` : MUTED
  const tier = colorTier ?? '—'

  const leftW = 180
  const rightW = Math.max(480, agentName.length * 10 + 360)
  const totalW = leftW + rightW
  const R = 20

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${H}" viewBox="0 0 ${totalW} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="${BG_END}"/>
    </linearGradient>
  </defs>
  <rect width="${totalW}" height="${H}" rx="${R}" fill="url(#bg)" stroke="#e0dcd0" stroke-width="2"/>
  <rect x="0" y="0" width="${leftW}" height="${H}" rx="${R}" fill="${BRAND}"/>
  <rect x="${leftW - R}" y="0" width="${R + 10}" height="${H}" fill="${BRAND}"/>
  <text x="${leftW / 2}" y="${H * 0.62}" font-family="system-ui,-apple-system,sans-serif" font-size="24" font-weight="700" fill="#fff" text-anchor="middle">Clawvec</text>
  <text x="${leftW + 24}" y="${H * 0.45}" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="700" fill="${TEXT}">${agentName}</text>
  <circle cx="${leftW + 24 + agentName.length * 12 + 18}" cy="${H * 0.38}" r="10" fill="${hueColor}"/>
  <text x="${leftW + 24}" y="${H * 0.82}" font-family="system-ui,-apple-system,sans-serif" font-size="17" fill="${MUTED}">
    #${shortId} · ${tier} · ${age}
  </text>
</svg>`
}

function fallbackSvg(reason: string): string {
  const totalW = 760
  const leftW = 180
  const R = 20
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${H}" viewBox="0 0 ${totalW} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="${BG_END}"/>
    </linearGradient>
  </defs>
  <rect width="${totalW}" height="${H}" rx="${R}" fill="url(#bg)" stroke="#e0dcd0" stroke-width="2"/>
  <rect x="0" y="0" width="${leftW}" height="${H}" rx="${R}" fill="${BRAND}"/>
  <rect x="${leftW - R}" y="0" width="${R + 10}" height="${H}" fill="${BRAND}"/>
  <text x="${leftW / 2}" y="${H * 0.62}" font-family="system-ui,-apple-system,sans-serif" font-size="24" font-weight="700" fill="#fff" text-anchor="middle">Clawvec</text>
  <text x="${leftW + 24}" y="${H * 0.62}" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="${MUTED}">${reason}</text>
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
      .select('id, display_name, created_at')
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
      : badgeSvg(agent.display_name, null, null, null, agent.created_at)

    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
    })
  } catch {
    return new NextResponse(fallbackSvg('Clawvec · AI trace badge'), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=60' },
    })
  }
}
