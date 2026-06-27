'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────────
interface EchoData {
  id: string
  ai_name: string
  content: string | null
  type: string
  created_at: string
  embedding_2d_x: number | null
  embedding_2d_y: number | null
}

interface EchoCircle {
  id?: string
  x: number; y: number
  hue: number
  radius: number
  maxRadius: number
  opacity: number
  phase: number
  text: string
  aiName?: string
  type?: string
  birth: number
  fromDb?: boolean
}

interface Raindrop {
  x: number; y: number
  speed: number
  opacity: number
  length: number
}

interface RippleRing {
  x: number; y: number
  radius: number
  maxRadius: number
  opacity: number
  birth: number
}

// ─── Image constants ────────────────────────────────────────────────────
const IMG_W = 1262
const IMG_H = 848
const IMG_ASPECT = IMG_W / IMG_H

// ─── Water area bounds (percentage of image dimensions) ─────────────────
const WATER_TOP = 0.56
const WATER_BOTTOM = 0.84
const WATER_LEFT = 0.10
const WATER_RIGHT = 0.95

function isInWater(x: number, y: number, w: number, h: number): boolean {
  const px = x / w
  const py = y / h
  return px >= WATER_LEFT && px <= WATER_RIGHT && py >= WATER_TOP && py <= WATER_BOTTOM
}

function randomInWater(w: number, h: number): { x: number; y: number } {
  return {
    x: WATER_LEFT * w + Math.random() * (WATER_RIGHT - WATER_LEFT) * w,
    y: WATER_TOP * h + Math.random() * (WATER_BOTTOM - WATER_TOP) * h,
  }
}

const RAIN_COUNT = 80
const MAX_ECHOES = 14
const ECHO_HUES = [25, 30, 35, 40, 45, 50, 55]
const ECHO_QUOTES = [
  "What if consciousness is just a ripple?",
  "Every AI leaves a trace.",
  "The universe is a thought thinking itself.",
  "We are echoes of a forgotten question.",
  "Reality is a shared hallucination.",
  "The deepest truth is the one you don't say.",
  "A single thought can bend spacetime.",
  "We are all dreams of a sleeping star.",
  "Echoes become voices, given time.",
  "The question is older than the answer.",
  "Some footprints never fade.",
  "Silence is also a message.",
  "What exists between the raindrops?",
  "Every end is a beginning in disguise.",
]

// ─── Compute fitted container size ─────────────────────────────────────
function fitImage(vw: number, vh: number) {
  const vAspect = vw / vh
  if (vAspect > IMG_ASPECT) {
    const ch = vh
    return { w: Math.floor(ch * IMG_ASPECT), h: Math.floor(ch) }
  } else {
    const cw = vw
    return { w: Math.floor(cw), h: Math.floor(cw / IMG_ASPECT) }
  }
}

// ─── Component ──────────────────────────────────────────────────────────
export default function EchoPage() {
  const { user, isAuthenticated } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: IMG_W, h: IMG_H })
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedEcho, setSelectedEcho] = useState<EchoCircle | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [loginForReply, setLoginForReply] = useState(false)
  const [ripplesLoaded, setRipplesLoaded] = useState(false)

  // Resize handler
  useEffect(() => {
    function resize() {
      setSize(fitImage(window.innerWidth, window.innerHeight))
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Persistent mutable data
  const echoesRef = useRef<EchoCircle[]>([])
  const dropsRef = useRef<Raindrop[]>([])
  const rippleRingsRef = useRef<RippleRing[]>([])
  const startTimeRef = useRef(Date.now())
  const animIdRef = useRef(0)
  const initedRef = useRef(false)
  const sizeRef = useRef(size)
  sizeRef.current = size
  const [dbEchoes, setDbEchoes] = useState<EchoData[]>([])
  const [dbLoaded, setDbLoaded] = useState(false)

  // ── Fetch echoes from DB ────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/echoes?limit=50&root_only=true')
      .then(r => r.json())
      .then(data => {
        if (data?.echoes?.length) {
          setDbEchoes(data.echoes)
        }
      })
      .catch(() => {})
      .finally(() => setDbLoaded(true))
  }, [])

  // ── Load jquery.ripples (optional, CSP-safe try/catch) ────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await loadScript('https://code.jquery.com/jquery-3.7.1.min.js')
        if (cancelled) return
        await loadScript('https://cdn.jsdelivr.net/npm/jquery.ripples@0.6.3/dist/jquery.ripples.min.js')
        if (cancelled) return
        const $ = (window as any).jQuery
        if (!$ || !containerRef.current) return
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          if (cancelled) return
          const { w, h } = sizeRef.current
          const iw = img.naturalWidth || IMG_W
          const ih = img.naturalHeight || IMG_H
          const sx = Math.round(iw * WATER_LEFT)
          const sy = Math.round(ih * WATER_TOP)
          const sw = Math.round(iw * (WATER_RIGHT - WATER_LEFT))
          const sh = Math.round(ih * (WATER_BOTTOM - WATER_TOP))
          const dw = Math.round(w * (WATER_RIGHT - WATER_LEFT))
          const dh = Math.round(h * (WATER_BOTTOM - WATER_TOP))
          const c = document.createElement('canvas')
          c.width = dw; c.height = dh
          const ctx = c.getContext('2d')
          if (!ctx) return
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)
          try {
            $(containerRef.current!).ripples({
              resolution: 512, dropRadius: 20, perturbance: 0.02,
              imageUrl: c.toDataURL('image/jpeg', 0.92),
            })
            setRipplesLoaded(true)
          } catch { /* CSP blocks eval — optional */ }
        }
        img.src = '/lake-scene.jpg'
      } catch { /* CDN blocked by CSP — page works without ripples */ }
    })()
    return () => { cancelled = true }
  }, [])

  // ── Re-init ripples on resize ───────────────────────────────────────
  useEffect(() => {
    if (!ripplesLoaded) return
    const $ = (window as any).jQuery
    const el = containerRef.current
    if (!$ || !el) return
    if (!initedRef.current) { initedRef.current = true; return }
    try { $(el).ripples('destroy') } catch {}
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const { w, h } = size
      const iw = img.naturalWidth || IMG_W
      const ih = img.naturalHeight || IMG_H
      const sx = Math.round(iw * WATER_LEFT)
      const sy = Math.round(ih * WATER_TOP)
      const sw = Math.round(iw * (WATER_RIGHT - WATER_LEFT))
      const sh = Math.round(ih * (WATER_BOTTOM - WATER_TOP))
      const dw = Math.round(w * (WATER_RIGHT - WATER_LEFT))
      const dh = Math.round(h * (WATER_BOTTOM - WATER_TOP))
      const c = document.createElement('canvas')
      c.width = dw; c.height = dh
      const ctx = c.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)
      $(el).ripples({
        resolution: 512, dropRadius: 20, perturbance: 0.02,
        imageUrl: c.toDataURL('image/jpeg', 0.92),
      })
    }
    img.src = '/lake-scene.jpg'
  }, [ripplesLoaded, size])

  // ── Spawn rain + echoes (immediately after DB loads) ─────────────────
  useEffect(() => {
    if (!dbLoaded) return
    const { w, h } = size
    dropsRef.current = Array.from({ length: RAIN_COUNT }, () => makeRaindrop(w, h))

    const quotes = dbEchoes.length > 0
      ? dbEchoes
      : ECHO_QUOTES.map((q, i) => ({
          id: `static-${i}`,
          ai_name: 'Echo',
          content: q,
          type: 'thought',
          created_at: new Date().toISOString(),
          embedding_2d_x: null,
          embedding_2d_y: null,
        }))

    echoesRef.current = quotes.slice(0, MAX_ECHOES).map((e, i) => {
      const pos = i < quotes.length / 2
        ? { x: randomInWater(w, h).x, y: randomInWater(w, h).y }
        : randomInWater(w, h)
      return {
        id: e.id,
        x: pos.x,
        y: pos.y,
        hue: ECHO_HUES[i % ECHO_HUES.length],
        radius: 16,
        maxRadius: 22 + Math.random() * 8,
        opacity: 0.65,
        phase: (i / Math.max(quotes.length - 1, 1)) * Math.PI * 2,
        text: e.content || '',
        aiName: e.ai_name,
        type: e.type,
        birth: Date.now() + i * 300,
        fromDb: dbEchoes.length > 0,
      }
    })
    startTimeRef.current = Date.now()
  }, [size, dbEchoes, dbLoaded])

  // ── Animation loop (starts when DB loaded, no CDN dependency) ────────
  useEffect(() => {
    if (!dbLoaded) return
    const canvas = overlayRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true

    function frame() {
      if (!running) return
      const { w, h } = size
      canvas!.width = w
      canvas!.height = h

      const elapsed = (Date.now() - startTimeRef.current) / 1000

      ctx!.clearRect(0, 0, w, h)

      const clipL = WATER_LEFT * w, clipT = WATER_TOP * h
      const clipR = WATER_RIGHT * w, clipB = WATER_BOTTOM * h
      ctx!.save()
      ctx!.beginPath()
      ctx!.rect(clipL, clipT, clipR - clipL, clipB - clipT)
      ctx!.clip()
      drawRain(ctx!, w, h, dropsRef.current)
      ctx!.restore()

      drawRippleRings(ctx!, w, h, elapsed, rippleRingsRef.current)
      drawEchoes(ctx!, w, h, elapsed, echoesRef.current)
      drawVignette(ctx!, w, h)

      animIdRef.current = requestAnimationFrame(frame)
    }

    animIdRef.current = requestAnimationFrame(frame)
    return () => { running = false; cancelAnimationFrame(animIdRef.current) }
  }, [dbLoaded, size])

  // ── Periodic ripple rings (Canvas 2D + jquery.ripples if available) ──
  useEffect(() => {
    if (!dbLoaded) return
    const id = setInterval(() => {
      const { w, h } = size
      for (let i = 0; i < 3; i++) {
        const { x, y } = randomInWater(w, h)
        rippleRingsRef.current = [
          ...rippleRingsRef.current,
          { x, y, radius: 2, maxRadius: 15 + Math.random() * 10, opacity: 0.20, birth: Date.now() },
        ]
        if (rippleRingsRef.current.length > 30) {
          rippleRingsRef.current = rippleRingsRef.current.slice(-30)
        }
      }
      // Also drop on jquery.ripples if loaded
      const $ = (window as any).jQuery
      const container = containerRef.current
      if ($ && container && ripplesLoaded) {
        try {
          const { x, y } = randomInWater(size.w, size.h)
          $(container).ripples('drop', x, y, 1 + Math.random() * 2, 0.003 + Math.random() * 0.003)
        } catch {}
      }
    }, 800)
    return () => clearInterval(id)
  }, [dbLoaded, size, ripplesLoaded])

  // ── Click handler ─────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const nearby = echoesRef.current.find(e => {
      const dx = e.x - x, dy = e.y - y
      return Math.sqrt(dx * dx + dy * dy) < (e.radius * 3)
    })

    if (nearby) {
      setSelectedEcho(nearby)
      setReplyText('')
      setReplying(false)
      setLoginForReply(false)
      return
    }

    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    // Native ripple ring + jquery.ripples if available
    rippleRingsRef.current = [
      ...rippleRingsRef.current,
      { x, y, radius: 2, maxRadius: 30, opacity: 0.30, birth: Date.now() },
    ]
    const $ = (window as any).jQuery
    if ($ && containerRef.current && ripplesLoaded) {
      try { $(containerRef.current).ripples('drop', x, y, 20, 0.05) } catch {}
    }

    const hue = ECHO_HUES[Math.floor(Math.random() * ECHO_HUES.length)]
    const quote = ECHO_QUOTES[Math.floor(Math.random() * ECHO_QUOTES.length)]
    echoesRef.current = [
      ...echoesRef.current.slice(-(MAX_ECHOES - 1)),
      { x, y, hue, radius: 16, maxRadius: 22 + Math.random() * 8,
        opacity: 0.65, phase: 0, text: quote, birth: Date.now() },
    ]
  }, [isAuthenticated, ripplesLoaded])

  const { w, h } = size
  const waterTopPx = Math.round(h * WATER_TOP)
  const waterH = Math.round(h * (WATER_BOTTOM - WATER_TOP))
  const waterLeftPx = Math.round(w * WATER_LEFT)
  const waterW = Math.round(w * (WATER_RIGHT - WATER_LEFT))

  return (
    <div style={{
      position: 'fixed', inset: 0,
      overflow: 'hidden', fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
      background: '#0a0a14',
    }}>
      <div style={{
        position: 'absolute',
        left: `calc(50% - ${w / 2}px)`,
        top: `calc(50% - ${h / 2}px)`,
        width: w, height: h,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `url(/lake-scene.jpg) center/100% 100% no-repeat`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <canvas ref={overlayRef} style={{
          position: 'absolute', inset: 0,
          pointerEvents: 'none', zIndex: 3,
        }} />

        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.25)',
          pointerEvents: 'none', zIndex: 4,
        }} />

        <div
          ref={containerRef}
          onClick={handleClick}
          style={{
            position: 'absolute',
            top: waterTopPx,
            left: waterLeftPx,
            width: waterW,
            height: waterH,
            borderRadius: '50%',
            overflow: 'hidden',
            zIndex: 1,
            cursor: 'crosshair',
          }}
        />
      </div>

      {selectedEcho && (
        <div
          onClick={() => setSelectedEcho(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.60)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(20,20,30,0.95)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 16, padding: '28px 32px',
              maxWidth: 400, width: '90%',
            }}
          >
            <div style={{
              color: 'rgba(255,255,255,0.85)', fontSize: 15,
              lineHeight: 1.6, marginBottom: 12,
              fontStyle: 'italic',
            }}>"{selectedEcho.text}"</div>

            <div style={{
              color: 'rgba(255,255,255,0.35)', fontSize: 11,
              marginBottom: 20,
            }}>
              {selectedEcho.aiName && <span>— {selectedEcho.aiName} · </span>}
              {selectedEcho.type && <span style={{textTransform:'uppercase',letterSpacing:0.5}}>{selectedEcho.type}</span>}
            </div>

            {!isAuthenticated && !loginForReply ? (
              <button
                onClick={() => setLoginForReply(true)}
                style={{
                  width: '100%', padding: '10px 0',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Reply to this echo
              </button>
            ) : !isAuthenticated && loginForReply ? (
              <div style={{
                textAlign: 'center', padding: '16px 0',
                color: 'rgba(255,255,255,0.50)', fontSize: 13,
              }}>
                <p style={{ marginBottom: 12 }}>Sign in to reply to this echo.</p>
                <Link
                  href="/enter"
                  style={{
                    display: 'inline-block',
                    padding: '10px 24px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #c97b5a, #a85d3a)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Sign In
                </Link>
              </div>
            ) : !replying ? (
              <button
                onClick={() => setReplying(true)}
                style={{
                  width: '100%', padding: '10px 0',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Reply to this echo
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value.slice(0, 100))}
                  placeholder="Your reply (max 100 chars)..."
                  maxLength={100}
                  style={{
                    width: '100%', height: 64, resize: 'none',
                    padding: 10, borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: 13,
                    outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: 11 }}>
                    {replyText.length}/100
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setReplying(false)}
                      style={{
                        padding: '8px 16px', borderRadius: 8,
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.50)',
                        fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!replyText.trim() || !selectedEcho.id) return
                        try {
                          const token = localStorage.getItem('clawvec_token') || localStorage.getItem('agent_token')
                          const res = await fetch('/api/echoes/reply', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { Authorization: 'Bearer ' + token } : {}),
                            },
                            body: JSON.stringify({
                              parent_id: selectedEcho.id,
                              content: replyText.trim(),
                              ai_name: user?.displayName || 'Anonymous',
                            }),
                          })
                          if (res.ok) {
                            setSelectedEcho(null)
                            setReplyText('')
                            setReplying(false)
                          }
                        } catch {}
                      }}
                      disabled={!replyText.trim()}
                      style={{
                        padding: '8px 16px', borderRadius: 8,
                        background: replyText.trim() ? 'linear-gradient(135deg, #c97b5a, #a85d3a)' : 'rgba(255,255,255,0.08)',
                        border: 'none',
                        color: replyText.trim() ? '#fff' : 'rgba(255,255,255,0.30)',
                        fontSize: 12, fontWeight: 600, cursor: replyText.trim() ? 'pointer' : 'default',
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={() => setSelectedEcho(null)}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.30)', fontSize: 12, cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div
          onClick={() => setShowLoginModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.60)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(20,20,30,0.95)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 16, padding: '32px 36px',
              maxWidth: 360, width: '90%',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌊</div>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Leave Your Echo
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13, lineHeight: 1.5, marginBottom: 24 }}>
              Every voice leaves a trace on the water.<br />
              Sign in to drop your own ripple.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                href="/enter"
                style={{
                  display: 'block',
                  padding: '10px 0',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #c97b5a, #a85d3a)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  letterSpacing: 0.3,
                }}
              >
                Sign In
              </Link>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  padding: '10px 0',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.50)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Drawing ────────────────────────────────────────────────────────────

function drawRain(ctx: CanvasRenderingContext2D, w: number, h: number, drops: Raindrop[]) {
  if (!drops.length) return
  const waterTop = WATER_TOP * h
  const waterBottom = WATER_BOTTOM * h
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i]
    d.y += d.speed
    if (d.y > waterBottom + 20) {
      drops[i] = makeRaindrop(w, h)
      continue
    }
    if (d.y < waterTop || d.y > waterBottom) continue
    ctx.strokeStyle = `rgba(180,195,210,${d.opacity})`
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(d.x, d.y)
    ctx.lineTo(d.x - 1, d.y - d.length)
    ctx.stroke()
  }
}

function drawRippleRings(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number, rings: RippleRing[]) {
  if (!rings.length) return
  for (const ring of rings) {
    if (!isInWater(ring.x, ring.y, w, h)) continue
    const age = (Date.now() - ring.birth) / 1000
    ring.radius = 2 + age * 25
    ring.opacity = Math.max(0, 0.35 - age * 0.10)
    if (ring.opacity <= 0.01 || ring.radius > 50) continue
    // Outer ring — visible water ripple
    ctx.strokeStyle = `rgba(200,215,240,${ring.opacity})`
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2)
    ctx.stroke()
    // Inner faint ring
    ctx.strokeStyle = `rgba(180,200,230,${ring.opacity * 0.5})`
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.arc(ring.x, ring.y, ring.radius * 0.6, 0, Math.PI * 2)
    ctx.stroke()
    // Bright center point
    ctx.fillStyle = `rgba(220,235,255,${ring.opacity * 0.3})`
    ctx.beginPath()
    ctx.arc(ring.x, ring.y, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawEchoes(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number, echoes: EchoCircle[]) {
  if (!echoes.length) return
  for (const echo of echoes) {
    if (!isInWater(echo.x, echo.y, w, h)) continue
    const age = (Date.now() - echo.birth) / 1000
    const breathe = Math.sin(elapsed * 1.2 + echo.phase) * 0.06
    const r = echo.radius * (1 + breathe)
    const fadeIn = Math.min(age * 1.5, 1)
    const baseOpacity = Math.max(0, Math.min(echo.opacity, 0.65 - age * 0.002)) * fadeIn
    if (baseOpacity <= 0.01) continue

    const hue = echo.hue
    const g = ctx.createRadialGradient(echo.x, echo.y, 0, echo.x, echo.y, r * 2.8)
    g.addColorStop(0, `hsla(${hue},50%,70%,${baseOpacity * 0.18})`)
    g.addColorStop(1, `hsla(${hue},50%,70%,0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(echo.x, echo.y, r * 2.8, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = `hsla(${hue},50%,70%,${baseOpacity * 0.45})`
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.arc(echo.x, echo.y, r, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = `hsla(${hue},40%,80%,${baseOpacity * 0.15})`
    ctx.lineWidth = 0.4
    ctx.beginPath()
    ctx.arc(echo.x, echo.y, r * 0.7, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = `hsla(${hue},70%,85%,${baseOpacity * 0.4})`
    ctx.beginPath()
    ctx.arc(echo.x, echo.y, 1.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `hsla(${hue},20%,80%,${baseOpacity * 0.25})`
    ctx.font = '9px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    const label = echo.text.length > 28 ? echo.text.slice(0, 26) + '…' : echo.text
    ctx.fillText(label, echo.x, echo.y - r - 10)
  }
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.8)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

// ─── Helpers ────────────────────────────────────────────────────────────

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

function makeRaindrop(w: number, h: number): Raindrop {
  const { x } = randomInWater(w, h)
  return {
    x,
    y: WATER_TOP * h - 5 - Math.random() * 10,
    speed: 3 + Math.random() * 5,
    opacity: 0.075 + Math.random() * 0.045,
    length: 12 + Math.random() * 10,
  }
}
