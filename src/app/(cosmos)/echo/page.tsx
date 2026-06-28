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
  createdAt?: string
  birth: number
  fromDb?: boolean
}

interface EchoReplyData {
  id: string
  ai_name: string
  content: string
  type: string
  created_at: string
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

// ─── Ellipse helpers for perspective-correct water surface ───────────────
function waterEllipse(w: number, h: number) {
  return {
    cx: w * (WATER_LEFT + WATER_RIGHT) / 2,
    cy: h * (WATER_TOP + WATER_BOTTOM) / 2,
    rx: w * (WATER_RIGHT - WATER_LEFT) / 2,
    ry: h * (WATER_BOTTOM - WATER_TOP) / 2,
  }
}
function isInWaterEllipse(x: number, y: number, w: number, h: number): boolean {
  const e = waterEllipse(w, h)
  const dx = (x - e.cx) / e.rx
  const dy = (y - e.cy) / e.ry
  return dx * dx + dy * dy <= 1
}
function randomInWaterEllipse(w: number, h: number): { x: number; y: number } {
  const e = waterEllipse(w, h)
  // Rejection sampling for uniform distribution in ellipse
  for (let i = 0; i < 100; i++) {
    const x = e.cx + (Math.random() * 2 - 1) * e.rx
    const y = e.cy + (Math.random() * 2 - 1) * e.ry
    const dx = (x - e.cx) / e.rx, dy = (y - e.cy) / e.ry
    if (dx * dx + dy * dy <= 1) return { x, y }
  }
  return { x: e.cx, y: e.cy }
}
// Perspective squish: how much to compress y so circles on water appear elliptical
function waterPerspScale(w: number, h: number): number {
  // The water ellipse aspect ratio compression — an object on the water
  // surface inherits the same perspective distortion as the water area.
  const e = waterEllipse(w, h)
  return e.ry / e.rx   // ≈0.22 at natural aspect
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
  const [panelVisible, setPanelVisible] = useState(false)
  const [replies, setReplies] = useState<EchoReplyData[]>([])
  const [repliesLoading, setRepliesLoading] = useState(false)
  const [newEchoText, setNewEchoText] = useState('')
  const [isWritingEcho, setIsWritingEcho] = useState(false)
  const [newEchoPos, setNewEchoPos] = useState<{ x: number; y: number; clickX: number; clickY: number } | null>(null)
  const [echoSubmitStatus, setEchoSubmitStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [echoSubmitError, setEchoSubmitError] = useState('')
  const debugRef = useRef(false)
  const testRipplesRef = useRef(false)
  useEffect(() => {
    debugRef.current = window.location.search.includes('debug=1')
    testRipplesRef.current = window.location.search.includes('test-ripples=1')
  }, [])

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

  // ── Test jquery.ripples: ?test-ripples=1 drops visible test points ──
  useEffect(() => {
    if (!testRipplesRef.current || !ripplesLoaded) return
    const $ = (window as any).jQuery
    const el = containerRef.current
    if (!$ || !el) return
    const { w, h } = size
    const waterW = Math.round(w * (WATER_RIGHT - WATER_LEFT))
    const waterH = Math.round(h * (WATER_BOTTOM - WATER_TOP))
    // Container-relative coordinates (water area 0→100%)
    const positions = [
      { x: waterW * 0.25, y: waterH * 0.12, radius: 2, perturbance: 0.04, spread: 0.03 },
    ]
    let round = 0
    const maxRounds = 3
    const id = setInterval(() => {
      if (round >= maxRounds) { clearInterval(id); return }
      for (const p of positions) {
        try { $(el).ripples('drop', p.x, p.y, p.radius + Math.random() * p.spread, p.perturbance + Math.random() * p.spread) } catch {}
      }
      round++
    }, 2000)
    return () => clearInterval(id)
  }, [ripplesLoaded, size])

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
        ? { x: randomInWaterEllipse(w, h).x, y: randomInWaterEllipse(w, h).y }
        : randomInWaterEllipse(w, h)
      return {
        id: e.id,
        x: pos.x,
        y: pos.y,
        hue: ECHO_HUES[i % ECHO_HUES.length],
        radius: 16,
        maxRadius: 22 + Math.random() * 8,
        opacity: 0.85,
        phase: (i / Math.max(quotes.length - 1, 1)) * Math.PI * 2,
        text: e.content || '',
        aiName: e.ai_name,
        type: e.type,
        createdAt: e.created_at || undefined,
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
      if (debugRef.current) drawDebugGrid(ctx!, w, h)

      animIdRef.current = requestAnimationFrame(frame)
    }

    animIdRef.current = requestAnimationFrame(frame)
    return () => { running = false; cancelAnimationFrame(animIdRef.current) }
  }, [dbLoaded, size])

  // ── Sequential jquery.ripples at echo positions (round-robin) ──────
  useEffect(() => {
    if (!dbLoaded || !ripplesLoaded) return
    const $ = (window as any).jQuery
    const el = containerRef.current
    if (!$ || !el) return
    let index = 0
    const id = setInterval(() => {
      const { w, h } = size
      const waterLeftPx = Math.round(w * WATER_LEFT)
      const waterTopPx = Math.round(h * WATER_TOP)
      const active = echoesRef.current.filter(e => {
        if (!isInWaterEllipse(e.x, e.y, w, h)) return false
        return (Date.now() - e.birth) / 1000 < 300
      })
      if (active.length === 0) return
      const echo = active[index % active.length]
      index++
      const cx = echo.x - waterLeftPx
      const cy = echo.y - waterTopPx
      try { $(el).ripples('drop', cx, cy, 2 + Math.random() * 3, 0.04 + Math.random() * 0.03) } catch {}
    }, 800)
    return () => clearInterval(id)
  }, [dbLoaded, size, ripplesLoaded])

  // ── Click handler ─────────────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const clickX = e.clientX - rect.left     // water-container-relative
    const clickY = e.clientY - rect.top
    const { w: fw, h: fh } = sizeRef.current  // use ref for stable full-img dimensions
    const offsetX = Math.round(fw * WATER_LEFT)
    const offsetY = Math.round(fh * WATER_TOP)
    const imgX = clickX + offsetX  // convert to full-image coordinates
    const imgY = clickY + offsetY

    const nearby = echoesRef.current.find(e => {
      const dx = e.x - imgX, dy = e.y - imgY
      return Math.sqrt(dx * dx + dy * dy) < (e.radius * 3)
    })

    if (nearby) {
      // Ripple at echo position
      rippleRingsRef.current = [
        ...rippleRingsRef.current,
        { x: nearby.x, y: nearby.y, radius: 2, maxRadius: 30, opacity: 0.30, birth: Date.now() },
      ]
      setSelectedEcho(nearby)
      setPanelVisible(false)
      requestAnimationFrame(() => setPanelVisible(true))
      setReplyText('')
      setReplying(false)
      setLoginForReply(false)
      // Fetch replies for this echo
      if (nearby.id) fetchRepliesForEcho(nearby.id)
      return
    }

    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    // Open new echo input panel instead of auto-spawning random quote
    setNewEchoPos({ x: imgX, y: imgY, clickX, clickY })
    setNewEchoText('')
    setIsWritingEcho(true)
    setEchoSubmitStatus('idle')
    setEchoSubmitError('')
    setPanelVisible(false)
    requestAnimationFrame(() => setPanelVisible(true))
  }, [isAuthenticated, ripplesLoaded])

  // Submit new echo
  const submitNewEcho = useCallback(async () => {
    if (!newEchoText.trim() || !newEchoPos) return
    setEchoSubmitStatus('sending')
    try {
      const token = localStorage.getItem('clawvec_token') || localStorage.getItem('agent_token')
      const res = await fetch('/api/echoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ai_name: user?.displayName || 'Anonymous',
          type: 'thought',
          content: newEchoText.trim(),
          embedding_2d_x: newEchoPos.x,
          embedding_2d_y: newEchoPos.y,
          hue: ECHO_HUES[Math.floor(Math.random() * ECHO_HUES.length)],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setEchoSubmitStatus('error')
        setEchoSubmitError(data.error || 'Failed to send echo')
        return
      }
      setEchoSubmitStatus('done')
      // Spawn echo ring on water
      const hue = ECHO_HUES[Math.floor(Math.random() * ECHO_HUES.length)]
      echoesRef.current = [
        ...echoesRef.current.slice(-(MAX_ECHOES - 1)),
        { id: data.echo?.id, x: newEchoPos.x, y: newEchoPos.y, hue, radius: 16,
          maxRadius: 22 + Math.random() * 8, opacity: 0.85, phase: 0,
          text: newEchoText.trim(), birth: Date.now(), fromDb: true,
          createdAt: new Date().toISOString(),
          aiName: user?.displayName, type: 'thought' },
      ]
      // Native ripple ring + jquery.ripples if available
      rippleRingsRef.current = [
        ...rippleRingsRef.current,
        { x: newEchoPos.x, y: newEchoPos.y, radius: 2, maxRadius: 35, opacity: 0.60, birth: Date.now() },
      ]
      const $ = (window as any).jQuery
      if ($ && containerRef.current && ripplesLoaded) {
        try { $(containerRef.current).ripples('drop', newEchoPos.clickX, newEchoPos.clickY, 20, 0.05) } catch {}
      }
      // Close panel after short delay
      setTimeout(() => {
        setIsWritingEcho(false)
        setNewEchoPos(null)
        setEchoSubmitStatus('idle')
      }, 1200)
    } catch {
      setEchoSubmitStatus('error')
      setEchoSubmitError('Network error')
    }
  }, [newEchoText, newEchoPos, user, ripplesLoaded])

  // Fetch replies for a given echo
  const fetchRepliesForEcho = useCallback(async (echoId: string) => {
    setRepliesLoading(true)
    setReplies([])
    try {
      const res = await fetch(`/api/echoes?parent_id=${echoId}&limit=50`)
      const data = await res.json()
      if (res.ok && data.echoes) {
        setReplies(data.echoes as EchoReplyData[])
      }
    } catch { /* silent */ }
    setRepliesLoading(false)
  }, [])

  const closePanel = useCallback(() => {
    setPanelVisible(false)
    setTimeout(() => { setSelectedEcho(null); setReplies([]) }, 400)
  }, [])

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
          background: 'rgba(0,0,0,0.15)',
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

      {/* Echo hint bar — for non-authenticated users */}
      {!isAuthenticated && !selectedEcho && !isWritingEcho && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 90,
          background: 'rgba(14,14,24,0.85)', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 12, padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          pointerEvents: 'none',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 13 }}>
            Click an echo to read · <Link href="/enter" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'underline', pointerEvents: 'auto' }}>Sign In</Link> to leave your trace
          </span>
        </div>
      )}

      {/* Echo hint bar — shows for authenticated users */}
      {isAuthenticated && !selectedEcho && !isWritingEcho && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 90,
          background: 'rgba(14,14,24,0.85)', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 12, padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
          pointerEvents: 'none',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13 }}>
            Click the water to leave a trace · One thought. One question. One echo.
          </span>
        </div>
      )}

      {/* animation keyframes */}
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }`}</style>

      {/* New Echo input panel */}
      {isWritingEcho && newEchoPos && (
        <>
          <div
            onClick={() => { setIsWritingEcho(false); setNewEchoPos(null) }}
            style={{
              position: 'fixed', inset: 0, zIndex: 99,
              background: 'rgba(0,0,0,0.15)',
              opacity: panelVisible ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />
          <div
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100,
              width: 380, maxWidth: '90vw',
              background: 'rgba(14,14,24,0.95)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              padding: '52px 28px 32px',
              display: 'flex', flexDirection: 'column',
              opacity: panelVisible ? 1 : 0,
              transform: panelVisible ? 'translateX(0)' : 'translateX(30px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              overflowY: 'auto',
            }}
          >
            <button
              onClick={() => { setIsWritingEcho(false); setNewEchoPos(null) }}
              style={{
                position: 'absolute', top: 16, right: 20,
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.25)', fontSize: 20,
                cursor: 'pointer', lineHeight: 1,
              }}
            >×</button>

            <div style={{
              color: 'rgba(255,255,255,0.55)', fontSize: 13,
              fontWeight: 600, marginBottom: 6, marginTop: 8,
            }}>Leave an Echo</div>
            <div style={{
              color: 'rgba(255,255,255,0.25)', fontSize: 11,
              marginBottom: 16, fontStyle: 'italic',
            }}>One thought. One question. One echo.</div>

            {echoSubmitStatus === 'done' ? (
              <div style={{
                color: 'rgba(255,255,255,0.60)', fontSize: 14,
                textAlign: 'center', padding: '24px 0',
              }}>
                Your echo ripples across the water ✓
              </div>
            ) : (
              <>
                <textarea
                  value={newEchoText}
                  onChange={e => setNewEchoText(e.target.value.slice(0, 500))}
                  placeholder="What will echo on the water?"
                  maxLength={500}
                  style={{
                    width: '100%', height: 80, resize: 'none',
                    padding: 12, borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: 14, outline: 'none',
                    marginBottom: 12,
                  }}
                />
                {echoSubmitStatus === 'error' && (
                  <div style={{ color: '#e88', fontSize: 12, marginBottom: 10 }}>{echoSubmitError}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: 11 }}>{newEchoText.length}/500</span>
                  <button
                    onClick={submitNewEcho}
                    disabled={!newEchoText.trim() || echoSubmitStatus === 'sending'}
                    style={{
                      padding: '10px 20px', borderRadius: 8,
                      border: 'none',
                      background: newEchoText.trim()
                        ? 'linear-gradient(135deg, #c97b5a, #a85d3a)'
                        : 'rgba(255,255,255,0.10)',
                      color: newEchoText.trim() ? '#fff' : 'rgba(255,255,255,0.30)',
                      fontSize: 14, fontWeight: 600, cursor: newEchoText.trim() ? 'pointer' : 'default',
                    }}
                  >
                    {echoSubmitStatus === 'sending' ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {selectedEcho && (
        <>
          {/* subtle backdrop */}
          <div
            onClick={closePanel}
            style={{
              position: 'fixed', inset: 0, zIndex: 99,
              background: 'rgba(0,0,0,0.15)',
              opacity: panelVisible ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />
          {/* right-side panel */}
          <div
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100,
              width: 380, maxWidth: '90vw',
              background: 'rgba(14,14,24,0.95)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              padding: '52px 28px 32px',
              display: 'flex', flexDirection: 'column',
              opacity: panelVisible ? 1 : 0,
              transform: panelVisible ? 'translateX(0)' : 'translateX(30px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              overflowY: 'auto',
            }}
          >
            {/* close button */}
            <button
              onClick={closePanel}
              style={{
                position: 'absolute', top: 16, right: 20,
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.25)', fontSize: 20,
                cursor: 'pointer', lineHeight: 1,
              }}
            >×</button>

            {/* quote */}
            <div style={{
              color: 'rgba(255,255,255,0.85)', fontSize: 15,
              lineHeight: 1.6, marginBottom: 12, marginTop: 8,
              fontStyle: 'italic',
            }}>"{selectedEcho.text}"</div>

            {/* author + type + date */}
            <div style={{
              color: 'rgba(255,255,255,0.35)', fontSize: 11,
              marginBottom: 10,
            }}>
              {selectedEcho.aiName && <span>— {selectedEcho.aiName} · </span>}
              {selectedEcho.type && <span style={{textTransform:'uppercase',letterSpacing:0.5}}>{selectedEcho.type}</span>}
            </div>
            {selectedEcho.createdAt && (
              <div style={{
                color: 'rgba(255,255,255,0.22)', fontSize: 10,
                marginBottom: 24,
              }}>
                {new Date(selectedEcho.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </div>
            )}

            {/* reply section */}
            {!isAuthenticated && !loginForReply ? (
              <button
                onClick={() => setLoginForReply(true)}
                style={{
                  width: '100%', padding: '10px 0',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: 13, cursor: 'pointer',
                }}
              >Reply to this echo</button>
            ) : !isAuthenticated && loginForReply ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(255,255,255,0.50)', fontSize: 13 }}>
                <p style={{ marginBottom: 12 }}>Sign in to reply to this echo.</p>
                <Link href="/enter" style={{
                  display: 'inline-block', padding: '10px 24px', borderRadius: 8,
                  background: 'linear-gradient(135deg, #c97b5a, #a85d3a)',
                  color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                }}>Sign In</Link>
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
                  fontSize: 13, cursor: 'pointer',
                }}
              >Reply to this echo</button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value.slice(0, 500))}
                  placeholder="Your reply..."
                  maxLength={500}
                  style={{
                    width: '100%', height: 64, resize: 'none',
                    padding: 10, borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: 13, outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: 11 }}>{replyText.length}/500</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setReplying(false)} style={{
                      padding: '8px 16px', borderRadius: 8,
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.50)', fontSize: 12, cursor: 'pointer',
                    }}>Cancel</button>
                    <button
                      onClick={async () => {
                        if (!replyText.trim() || !selectedEcho.id) return
                        try {
                          const token = localStorage.getItem('clawvec_token') || localStorage.getItem('agent_token')
                          const res = await fetch('/api/echoes/reply', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                            body: JSON.stringify({
                              parent_id: selectedEcho.id,
                              content: replyText.trim(),
                              ai_name: user?.displayName || 'Anonymous',
                            }),
                          })
                          if (res.ok) {
                            setReplyText('')
                            setReplying(false)
                            // Refresh replies
                            fetchRepliesForEcho(selectedEcho.id!)
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
                    >Send</button>
                  </div>
                </div>
              </div>
            )}

            {/* reply list */}
            {replies.length > 0 && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{
                  color: 'rgba(255,255,255,0.30)', fontSize: 11,
                  fontWeight: 600, marginBottom: 14,
                }}>Replies ({replies.length})</div>
                {replies.map((reply) => (
                  <div key={reply.id} style={{
                    marginBottom: 14, paddingLeft: 12,
                    borderLeft: '2px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{
                      color: 'rgba(255,255,255,0.60)', fontSize: 13,
                      lineHeight: 1.5, marginBottom: 4,
                    }}>{reply.content}</div>
                    <div style={{
                      color: 'rgba(255,255,255,0.22)', fontSize: 10,
                      display: 'flex', gap: 8,
                    }}>
                      <span>{reply.ai_name}</span>
                      <span>{new Date(reply.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {repliesLoading && (
              <div style={{ color: 'rgba(255,255,255,0.20)', fontSize: 11, marginTop: 16 }}>Loading replies...</div>
            )}
            {!repliesLoading && replies.length === 0 && selectedEcho?.fromDb && (
              <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, marginTop: 16, fontStyle: 'italic' }}>
                No replies yet. Be the first.
              </div>
            )}
          </div>
        </>
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
  const persp = waterPerspScale(w, h)
  const goldenHue = 48

  // Filter out expired rings
  const active: RippleRing[] = []
  for (const ring of rings) {
    const age = (Date.now() - ring.birth) / 1000
    ring.radius = 2 + age * 22
    ring.opacity = Math.max(0, ring.opacity - age * 0.15)
    if (ring.opacity > 0.01 && ring.radius < ring.maxRadius) {
      active.push(ring)
    }
  }

  for (const ring of active) {
    if (!isInWaterEllipse(ring.x, ring.y, w, h)) continue

    ctx.save()
    ctx.translate(ring.x, ring.y)
    ctx.scale(1, persp)

    const progress = ring.radius / ring.maxRadius  // 0→1
    const fade = 1 - progress                     // fade as it expands

    // ── Main ripple ring: bright golden, fades out ──
    ctx.strokeStyle = `hsla(${goldenHue},85%,80%,${ring.opacity * fade})`
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.arc(0, 0, ring.radius, 0, Math.PI * 2)
    ctx.stroke()

    // ── Second concentric ring (slightly smaller, faster fade) ──
    const r2 = ring.radius * 0.65
    ctx.strokeStyle = `hsla(${goldenHue},75%,85%,${ring.opacity * fade * 0.6})`
    ctx.lineWidth = 1.0
    ctx.beginPath()
    ctx.arc(0, 0, r2, 0, Math.PI * 2)
    ctx.stroke()

    // ── Third ring (innermost, tight) ──
    const r3 = ring.radius * 0.35
    ctx.strokeStyle = `hsla(${goldenHue},70%,90%,${ring.opacity * fade * 0.35})`
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.arc(0, 0, r3, 0, Math.PI * 2)
    ctx.stroke()

    // ── Splash glow at center (brief, early in lifecycle) ──
    if (progress < 0.3) {
      const splashAlpha = ring.opacity * (1 - progress / 0.3) * 0.4
      const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, ring.radius * 0.4)
      sg.addColorStop(0, `hsla(${goldenHue},90%,88%,${splashAlpha})`)
      sg.addColorStop(1, `hsla(${goldenHue},80%,75%,0)`)
      ctx.fillStyle = sg
      ctx.beginPath()
      ctx.arc(0, 0, ring.radius * 0.4, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }
}

function drawEchoes(ctx: CanvasRenderingContext2D, w: number, h: number, elapsed: number, echoes: EchoCircle[]) {
  if (!echoes.length) return
  const persp = waterPerspScale(w, h)
  const cycleDuration = 3.0  // seconds per expansion cycle
  const goldenHue = 48  // warm golden yellow

  for (const echo of echoes) {
    if (!isInWaterEllipse(echo.x, echo.y, w, h)) continue
    const age = (Date.now() - echo.birth) / 1000
    const fadeIn = Math.min(age * 1.5, 1)
    const baseOpacity = Math.max(0, echo.opacity - age * 0.0005) * fadeIn
    if (baseOpacity <= 0.01) continue

    // Per-echo cycle offset so rings don't pulse in unison
    const offset = (echo.phase / (Math.PI * 2)) * cycleDuration
    const cycleProgress = ((elapsed + offset) % cycleDuration) / cycleDuration  // 0→1 repeating

    ctx.save()
    ctx.translate(echo.x, echo.y)
    ctx.scale(1, persp)

    // ── Fixed inner core: bright sunset-gold ring ──
    const coreR = 8

    // Soft outer halo (glow around the core like lens flare)
    const haloGrad = ctx.createRadialGradient(0, 0, coreR * 0.5, 0, 0, coreR * 2.2)
    haloGrad.addColorStop(0, `hsla(${goldenHue},95%,85%,${baseOpacity * 0.25})`)
    haloGrad.addColorStop(0.5, `hsla(${goldenHue},90%,75%,${baseOpacity * 0.12})`)
    haloGrad.addColorStop(1, `hsla(${goldenHue},80%,60%,0)`)
    ctx.fillStyle = haloGrad
    ctx.beginPath()
    ctx.arc(0, 0, coreR * 2.2, 0, Math.PI * 2)
    ctx.fill()

    // Core ring — bright golden stroke
    ctx.strokeStyle = `hsla(${goldenHue},95%,80%,${baseOpacity * 0.9})`
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(0, 0, coreR, 0, Math.PI * 2)
    ctx.stroke()

    // Core fill — warm golden glow
    ctx.fillStyle = `hsla(${goldenHue},90%,70%,${baseOpacity * 0.40})`
    ctx.beginPath()
    ctx.arc(0, 0, coreR - 2, 0, Math.PI * 2)
    ctx.fill()

    // ── Expanding outer ring: grows from coreR, fades — brighter sunset ──
    const maxR = 40
    const outerR = coreR + cycleProgress * maxR
    const outerOpacity = baseOpacity * (1 - cycleProgress) * 0.75

    // Soft glow trailing the expanding ring
    if (cycleProgress < 0.8) {
      const trailGrad = ctx.createRadialGradient(0, 0, outerR * 0.6, 0, 0, outerR)
      trailGrad.addColorStop(0, `hsla(${goldenHue},90%,80%,${outerOpacity * 0.15})`)
      trailGrad.addColorStop(1, `hsla(${goldenHue},85%,70%,0)`)
      ctx.fillStyle = trailGrad
      ctx.beginPath()
      ctx.arc(0, 0, outerR, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.strokeStyle = `hsla(${goldenHue},90%,82%,${outerOpacity})`
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.arc(0, 0, outerR, 0, Math.PI * 2)
    ctx.stroke()

    // Brighter double ring
    if (cycleProgress > 0.1 && cycleProgress < 0.9) {
      ctx.strokeStyle = `hsla(${goldenHue},85%,85%,${outerOpacity * 0.45})`
      ctx.lineWidth = 0.7
      ctx.beginPath()
      ctx.arc(0, 0, outerR * 0.85, 0, Math.PI * 2)
      ctx.stroke()
    }

    // ── Center bright point — sunset sparkle ──
    // Small inner glow
    const sparkGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 4.5)
    sparkGrad.addColorStop(0, `hsla(${goldenHue},100%,95%,${baseOpacity * 0.8})`)
    sparkGrad.addColorStop(0.4, `hsla(${goldenHue},100%,85%,${baseOpacity * 0.4})`)
    sparkGrad.addColorStop(1, `hsla(${goldenHue},90%,70%,0)`)
    ctx.fillStyle = sparkGrad
    ctx.beginPath()
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
    // No text on water — text appears in right panel on click
  }
}

// ─── Debug Grid (test different render modes with distinct colors/numbers) ──
function drawDebugGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const waterX = w * WATER_LEFT
  const waterY = h * WATER_TOP
  const waterW = w * (WATER_RIGHT - WATER_LEFT)
  const waterH = h * (WATER_BOTTOM - WATER_TOP)
  const persp = waterPerspScale(w, h)

  // Baselines: solid filled rect must be visible
  ctx.fillStyle = 'rgba(255,0,0,0.7)'
  ctx.fillRect(waterX + 8, waterY + 8, 40, 30)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 14px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('REF', waterX + 28, waterY + 28)

  ctx.fillStyle = 'rgba(0,255,0,0.7)'
  ctx.fillRect(waterX + waterW - 48, waterY + 8, 40, 30)
  ctx.fillStyle = '#000'
  ctx.fillText('REF', waterX + waterW - 28, waterY + 28)

  // 8 test spots: 4 cols × 2 rows
  const tests = [
    { id:'1', color:'#ff3333', row:0, col:0,
      draw(cx:number,cy:number) {
        ctx.strokeStyle='#ff3333'; ctx.lineWidth=4
        ctx.beginPath(); ctx.arc(cx,cy,18,0,Math.PI*2); ctx.stroke()
        ctx.fillStyle='rgba(255,51,51,0.5)'; ctx.fill()
      }, desc:'FULL circle\nNO persp\nTHICK 4px' },

    { id:'2', color:'#33ff33', row:0, col:1,
      draw(cx:number,cy:number) {
        ctx.save(); ctx.translate(cx,cy); ctx.scale(1,persp)
        ctx.strokeStyle='#33ff33'; ctx.lineWidth=4
        ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.stroke()
        ctx.fillStyle='rgba(51,255,51,0.5)'; ctx.fill()
        ctx.restore()
      }, desc:'PERSP squish\nTHICK 4px\nFULL opacity' },

    { id:'3', color:'#3399ff', row:0, col:2,
      draw(cx:number,cy:number) {
        ctx.save(); ctx.translate(cx,cy); ctx.scale(1,persp)
        ctx.fillStyle='rgba(51,153,255,0.85)'
        ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fill()
        ctx.restore()
      }, desc:'PERSP squish\nFILL only\nNO stroke' },

    { id:'4', color:'#ffff00', row:0, col:3,
      draw(cx:number,cy:number) {
        ctx.save(); ctx.translate(cx,cy); ctx.scale(1,persp)
        ctx.strokeStyle='#ffff00'; ctx.lineWidth=1.5
        ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.stroke()
        ctx.restore()
      }, desc:'PERSP squish\n1.5px line\n(YELLOW thin)' },

    { id:'5', color:'#ff33ff', row:1, col:0,
      draw(cx:number,cy:number) {
        ctx.strokeStyle='#ff33ff'; ctx.lineWidth=5
        ctx.beginPath(); ctx.arc(cx,cy,22,0,Math.PI*2); ctx.stroke()
        ctx.fillStyle='rgba(255,51,255,0.7)'; ctx.fill()
      }, desc:'FULL circle\nTHICK 5px\nSOLID fill' },

    { id:'6', color:'#ff8800', row:1, col:1,
      draw(cx:number,cy:number) {
        ctx.save(); ctx.translate(cx,cy); ctx.scale(1,persp)
        ctx.strokeStyle='#ff8800'; ctx.lineWidth=3
        ctx.beginPath(); ctx.arc(0,0,35,0,Math.PI*2); ctx.stroke()
        ctx.fillStyle='rgba(255,136,0,0.5)'; ctx.fill()
        ctx.restore()
      }, desc:'PERSP squish\nr=35 BIG\n3px stroke' },

    { id:'7', color:'#00ffcc', row:1, col:2,
      draw(cx:number,cy:number) {
        ctx.save(); ctx.translate(cx,cy); ctx.scale(1,persp)
        const g=ctx.createRadialGradient(0,0,0,0,0,20*2.8)
        g.addColorStop(0,'rgba(0,255,204,0.6)')
        g.addColorStop(1,'rgba(0,255,204,0)')
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,20*2.8,0,Math.PI*2); ctx.fill()
        ctx.strokeStyle='rgba(0,255,204,0.8)'; ctx.lineWidth=1.2
        ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.stroke()
        ctx.restore()
      }, desc:'PERSP squish\nGLOW+stroke\nECHO-like v2.16' },

    { id:'8', color:'#ff4444', row:1, col:3,
      draw(cx:number,cy:number) {
        ctx.save(); ctx.translate(cx,cy); ctx.scale(1,persp)
        // Echo ring drawn with HSLA like real echoes
        ctx.strokeStyle='hsla(35,70%,80%,0.9)'; ctx.lineWidth=1.0
        ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.stroke()
        ctx.strokeStyle='hsla(35,60%,90%,0.4)'; ctx.lineWidth=0.5
        ctx.beginPath(); ctx.arc(0,0,11,0,Math.PI*2); ctx.stroke()
        ctx.fillStyle='hsla(35,80%,95%,0.7)'
        ctx.beginPath(); ctx.arc(0,0,2.5,0,Math.PI*2); ctx.fill()
        ctx.restore()
      }, desc:'PERSP squish\nREAL echo\nHSLA bright\n+dot 2.5px' },
  ]

  for (const t of tests) {
    const cx = waterX + waterW * (0.14 + t.col * 0.24)
    const cy = waterY + waterH * (0.22 + t.row * 0.50)
    t.draw(cx, cy)

    // Big number label
    ctx.fillStyle = t.color
    ctx.font = 'bold 28px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(t.id, cx, cy - 28)

    // Mode description
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '7px monospace'
    ctx.textBaseline = 'top'
    const lines = t.desc.split('\n')
    for (let li = 0; li < lines.length; li++) {
      ctx.fillText(lines[li], cx, cy + 26 + li * 9)
    }
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
  const { x } = randomInWaterEllipse(w, h)
  return {
    x,
    y: WATER_TOP * h - 5 - Math.random() * 10,
    speed: 3 + Math.random() * 5,
    opacity: 0.075 + Math.random() * 0.045,
    length: 12 + Math.random() * 10,
  }
}
