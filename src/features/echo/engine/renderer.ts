// features/echo/engine/renderer.ts
// Canvas 2D renderer for fragment drift

import type { DriftingEcho, ConnectionLine } from '../types/echo.types'

interface DriftRenderState {
  echoes: DriftingEcho[]
  connections: ConnectionLine[]
  selectedEcho: DriftingEcho | null
  width: number
  height: number
  time: number
}

let ctx: CanvasRenderingContext2D | null = null
let dprRef = 2
let bgStars: { x: number; y: number; r: number; alpha: number }[] = []
let bgGenerated = false

export function initDriftRenderer(canvas: HTMLCanvasElement, dpr: number = 2) {
  ctx = canvas.getContext('2d')!
  dprRef = dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

export function renderDriftFrame(state: DriftRenderState) {
  if (!ctx) return
  const { width, height } = state

  // Clear
  ctx.fillStyle = '#0a0a14'
  ctx.fillRect(0, 0, width, height)

  // Background stars
  drawBackground(ctx, width, height)

  // Connection lines
  drawConnections(ctx, state.connections)

  // Echoes
  for (const f of state.echoes) {
    drawFragment(ctx, f, state.time, f === state.selectedEcho)
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (!bgGenerated) {
    for (let i = 0; i < 150; i++) {
      bgStars.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        r: Math.random() * 0.8 + 0.2,
        alpha: Math.random() * 0.3 + 0.05,
      })
    }
    bgGenerated = true
  }

  for (const s of bgStars) {
    const x = (s.x / 1920) * w
    const y = (s.y / 1080) * h
    ctx.fillStyle = `rgba(255,255,255,${s.alpha})`
    ctx.beginPath()
    ctx.arc(x, y, s.r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawConnections(ctx: CanvasRenderingContext2D, lines: ConnectionLine[]) {
  for (const line of lines) {
    const alpha = line.similarity * 0.15
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`
    ctx.lineWidth = 0.3
    ctx.beginPath()
    ctx.moveTo(line.x1, line.y1)
    ctx.lineTo(line.x2, line.y2)
    ctx.stroke()
  }
}

function drawFragment(
  ctx: CanvasRenderingContext2D,
  f: DriftingEcho,
  time: number,
  isSelected: boolean,
) {
  const alpha = f.opacity * (isSelected ? 1 : 0.7)
  const scale = isSelected ? 1.5 : f.scale
  // 最小尺寸保護：無論縮放比例，粒子半徑不小於 2px
  const minRadius = 2

  switch (f.type) {
    case 'sentence':
      drawStar(ctx, f.x, f.y, Math.max(4 * scale, minRadius), '#ffffff', alpha, time)
      break
    case 'knowledge':
      drawOrb(ctx, f.x, f.y, Math.max(6 * scale, minRadius), '#fcd34d', alpha, time)
      break
    case 'vector':
      drawGeometric(ctx, f.x, f.y, Math.max(5 * scale, minRadius), '#67e8f9', alpha, time)
      break
    case 'story':
      drawConstellation(ctx, f.x, f.y, Math.max(5 * scale, minRadius), '#ffffff', alpha, time)
      break
    case 'question':
      drawPulse(ctx, f.x, f.y, Math.max(4 * scale, minRadius), '#c4b5fd', alpha, time)
      break
  }
}

// ✦ Star point for sentences
function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number, _time: number) {
  // Glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3)
  glow.addColorStop(0, `rgba(255,255,255,${alpha * 0.6})`)
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y, r * 3, 0, Math.PI * 2)
  ctx.fill()

  // Sharp point
  ctx.fillStyle = `rgba(255,255,255,${alpha})`
  ctx.beginPath()
  ctx.arc(x, y, r * 0.8, 0, Math.PI * 2)
  ctx.fill()

  // Cross sparkle
  ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`
  ctx.lineWidth = 0.5
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 4
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * r * 2, y + Math.sin(angle) * r * 2)
    ctx.stroke()
  }
}

// ◉ Pulsing orb for knowledge
function drawOrb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number, time: number) {
  const pulse = 1 + Math.sin(time * 0.0005) * 0.15

  // Outer glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3 * pulse)
  glow.addColorStop(0, `${color}99`)
  glow.addColorStop(0.5, `${color}22`)
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.arc(x, y, r * 3 * pulse, 0, Math.PI * 2)
  ctx.fill()

  // Core
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r * pulse, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 1
}

// ◈ Geometric node for vectors
function drawGeometric(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number, time: number) {
  const rotation = time * 0.0003
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = 0.8

  // Diamond shape
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const angle = rotation + (i * Math.PI) / 2
    const px = x + Math.cos(angle) * r
    const py = y + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()

  // Center dot
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 1
}

// ✦⤳ Constellation chain for stories
function drawConstellation(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number, _time: number) {
  const points = [
    { dx: -r * 1.5, dy: -r * 0.5 },
    { dx: 0, dy: r * 0.8 },
    { dx: r * 1.5, dy: -r * 0.5 },
    { dx: r * 0.8, dy: r * 1.2 },
  ]

  ctx.globalAlpha = alpha

  // Lines between points
  ctx.strokeStyle = `rgba(255,255,255,0.3)`
  ctx.lineWidth = 0.4
  ctx.beginPath()
  ctx.moveTo(x + points[0].dx, y + points[0].dy)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(x + points[i].dx, y + points[i].dy)
  }
  ctx.stroke()

  // Points
  for (const p of points) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x + p.dx, y + p.dy, r * 0.35, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

// ◇ Flickering pulse for questions
function drawPulse(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number, time: number) {
  const flicker = 0.5 + 0.5 * Math.sin(time * 0.003 + x * 0.01) * Math.cos(time * 0.007 + y * 0.01)
  const a = alpha * (0.6 + 0.4 * flicker)

  // Glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5)
  glow.addColorStop(0, `${color}88`)
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.globalAlpha = a
  ctx.beginPath()
  ctx.arc(x, y, r * 2.5, 0, Math.PI * 2)
  ctx.fill()

  // Diamond core
  ctx.fillStyle = color
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2)
  ctx.restore()

  ctx.globalAlpha = 1
}
