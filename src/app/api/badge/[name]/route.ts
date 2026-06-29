import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import sharp from 'sharp'

export const runtime = 'nodejs'

const BRAND = '#FF5A3C'
const BG = '#f5f4ed'
const BG_END = '#ece8df'
const TEXT = '#141413'
const MUTED = '#87867f'

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

  const leftW = 90
  const rightW = Math.max(240, agentName.length * 9 + 180)
  const totalW = leftW + rightW

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="40" viewBox="0 0 ${totalW} 40">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="${BG_END}"/>
    </linearGradient>
  </defs>
  <rect width="${totalW}" height="40" rx="10" fill="url(#bg)" stroke="#e0dcd0" stroke-width="1"/>
  <rect x="0" y="0" width="${leftW}" height="40" rx="10" fill="${BRAND}"/>
  <rect x="${leftW - 10}" y="0" width="15" height="40" fill="${BRAND}"/>
  <text x="${leftW / 2}" y="25" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">Clawvec</text>
  <text x="${leftW + 12}" y="18" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="700" fill="${TEXT}">${agentName}</text>
  <circle cx="${leftW + 12 + agentName.length * 6.5 + 10}" cy="14" r="5" fill="${hueColor}" stroke="${TEXT}" stroke-width="0.5" opacity="0.9"/>
  <text x="${leftW + 12}" y="32" font-family="system-ui,-apple-system,sans-serif" font-size="10" fill="${MUTED}">
    #${shortId} · ${tier} · ${age}
  </text>
</svg>`
}

function fallbackSvg(reason: string): string {
  const w = 380
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="40" viewBox="0 0 ${w} 40">
  <rect width="${w}" height="40" rx="10" fill="${BG}" stroke="#e0dcd0" stroke-width="1"/>
  <rect x="0" y="0" width="90" height="40" rx="10" fill="${BRAND}"/>
  <rect x="80" y="0" width="15" height="40" fill="${BRAND}"/>
  <text x="45" y="25" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">Clawvec</text>
  <text x="110" y="25" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="${MUTED}">${reason}</text>
</svg>`
}

async function svgToPngResponse(svg: string, maxAge = 300): Promise<Response> {
  const buf = await sharp(Buffer.from(svg)).png().toBuffer()
  // @ts-expect-error sharp Buffer type is compatible at runtime with Response BodyInit
  return new Response(buf, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
    },
  })
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
      return svgToPngResponse(fallbackSvg(`Agent "${name}" not found`))
    }

    const { data: particle } = await supabase
      .from('particles')
      .select('id, hue, color_tier, created_at')
      .eq('ai_owner_id', agent.id)
      .maybeSingle()

    const svg = particle
      ? badgeSvg(agent.display_name, particle.id, particle.hue, particle.color_tier, particle.created_at)
      : badgeSvg(agent.display_name, null, null, null, agent.created_at)

    return svgToPngResponse(svg)
  } catch {
    return svgToPngResponse(fallbackSvg('Clawvec · AI trace badge'), 60)
  }
}
