// features/cosmos/engine/renderer.ts
// Canvas 2D renderer with glow effects for the gravity field

import type { ParticleData, FusionEvent } from '../types/cosmos.types'

interface RenderState {
  particles: ParticleData[]
  fusions: FusionEvent[]
  width: number
  height: number
  mouseX: number
  mouseY: number
  isDragging: boolean
  dragAngle: number
  dragPower: number
}

let animFrameId = 0
let ctx: CanvasRenderingContext2D | null = null

/**
 * Start the render loop on a canvas.
 */
export function startRenderer(
  canvas: HTMLCanvasElement,
  onFrame: (dt: number) => void,
) {
  ctx = canvas.getContext('2d')!
  let lastTime = performance.now()

  function loop(now: number) {
    const dt = Math.min((now - lastTime) / 1000, 0.05) // cap dt to 50ms
    lastTime = now

    onFrame(dt)
    animFrameId = requestAnimationFrame(loop)
  }

  animFrameId = requestAnimationFrame(loop)
}

export function stopRenderer() {
  if (animFrameId) cancelAnimationFrame(animFrameId)
}

/**
 * Render a single frame.
 */
export function renderFrame(state: RenderState) {
  if (!ctx) return
  const { width, height } = state

  // Clear with deep space background
  ctx.fillStyle = '#0a0a14'
  ctx.fillRect(0, 0, width, height)

  // Draw background stars (static noise)
  drawBackground(ctx, width, height)

  // Draw connection lines between nearby particles
  drawConnections(ctx, state.particles)

  // Draw particles
  for (const p of state.particles) {
    drawParticle(ctx, p)
  }

  // Draw fusion effects
  for (const f of state.fusions) {
    drawFusionEffect(ctx, f)
  }

  // Draw launch guide if dragging
  if (state.isDragging) {
    drawLaunchGuide(ctx, state)
  }
}

/**
 * Static background starfield (pre-generated seeded noise).
 */
const bgStars: { x: number; y: number; r: number; alpha: number }[] = []
let bgGenerated = false

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  if (!bgGenerated) {
    for (let i = 0; i < 200; i++) {
      bgStars.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        r: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.4 + 0.1,
      })
    }
    bgGenerated = true
  }

  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  for (const s of bgStars) {
    const x = (s.x / 1920) * w
    const y = (s.y / 1080) * h
    ctx.globalAlpha = s.alpha
    ctx.beginPath()
    ctx.arc(x, y, s.r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/**
 * Draw a single particle with glow aura.
 */
function drawParticle(ctx: CanvasRenderingContext2D, p: ParticleData) {
  const color = hslToRgb(p.hue, 0.9, 0.65)
  const glowColor = hslToRgb(p.hue, 0.8, 0.7)
  const size = Math.max(2, p.mass * 2.5) * p.energy

  // Outer glow (large, transparent)
  const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2.5)
  glow.addColorStop(0, glowColor)
  glow.addColorStop(0.3, `rgba(${glowColor.slice(4, -1)}, 0.15)`)
  glow.addColorStop(1, 'rgba(0,0,0,0)')

  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2)
  ctx.fill()

  // Inner core
  const core = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size)
  core.addColorStop(0, '#ffffff')
  core.addColorStop(0.3, color)
  core.addColorStop(1, `rgba(${glowColor.slice(4, -1)}, 0.3)`)

  ctx.fillStyle = core
  ctx.beginPath()
  ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
  ctx.fill()

  // Name label for larger/important particles
  if (p.name && p.mass > 5) {
    ctx.fillStyle = `rgba(255,255,255,${0.5 * p.energy})`
    ctx.font = '9px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(p.name, p.x, p.y - size - 6)
  }
}

/**
 * Draw subtle connection lines between nearby particles.
 */
function drawConnections(ctx: CanvasRenderingContext2D, particles: ParticleData[]) {
  const maxDist = 80
  ctx.lineWidth = 0.3

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[j].x - particles[i].x
      const dy = particles[j].y - particles[i].y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < maxDist) {
        const alpha = (1 - dist / maxDist) * 0.12
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.stroke()
      }
    }
  }
}

/**
 * Flash effect for particle fusion.
 */
function drawFusionEffect(ctx: CanvasRenderingContext2D, f: FusionEvent) {
  const elapsed = Date.now() - f.timestamp
  const duration = 800 // ms
  if (elapsed > duration) return

  const progress = elapsed / duration
  const alpha = 1 - progress
  const radius = 20 + progress * 40

  const flash = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius)
  flash.addColorStop(0, `rgba(255,255,255,${alpha})`)
  flash.addColorStop(0.5, `rgba(255,200,150,${alpha * 0.5})`)
  flash.addColorStop(1, 'rgba(0,0,0,0)')

  ctx.fillStyle = flash
  ctx.beginPath()
  ctx.arc(f.x, f.y, radius, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Draw launch guide line when user is dragging.
 */
function drawLaunchGuide(ctx: CanvasRenderingContext2D, state: RenderState) {
  const { mouseX, mouseY, dragAngle, dragPower } = state
  const len = dragPower * 3

  const endX = mouseX - Math.cos(dragAngle) * len
  const endY = mouseY - Math.sin(dragAngle) * len

  // Guide line
  ctx.strokeStyle = 'rgba(255,90,60,0.5)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(mouseX, mouseY)
  ctx.lineTo(endX, endY)
  ctx.stroke()
  ctx.setLineDash([])

  // Launch point
  ctx.fillStyle = 'rgba(255,90,60,0.8)'
  ctx.beginPath()
  ctx.arc(mouseX, mouseY, 6, 0, Math.PI * 2)
  ctx.fill()

  // Destination indicator
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.beginPath()
  ctx.arc(endX, endY, 3, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Utility: HSL to RGB string.
 */
function hslToRgb(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return `rgb(${r},${g},${b})`
}
