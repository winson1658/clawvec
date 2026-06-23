// features/universe/hooks/useUniverse.ts
// Main hook: manages particle state, physics, and render loop

'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { ParticleData, FusionEvent } from '../types/universe.types'
import { simulateStep, createDemoParticles } from '../engine/nbody'
import { startRenderer, stopRenderer, renderFrame } from '../engine/renderer'
import { createParticle } from '../engine/particle'
import { fetchParticles, createParticle as apiCreateParticle } from '../services/particles.service'

export function useUniverse() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<ParticleData[]>([])
  const fusionsRef = useRef<FusionEvent[]>([])
  const stateRef = useRef({
    mouseX: 0,
    mouseY: 0,
    isDragging: false,
    dragAngle: 0,
    dragPower: 30,
    dragStartX: 0,
    dragStartY: 0,
  })

  const [stats, setStats] = useState({ particles: 0, clusters: 0, fusions: 0 })

  // Initialize particles from API, fallback to demo
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = width * 2  // HiDPI
    canvas.height = height * 2

    // Load particles asynchronously
    if (particlesRef.current.length === 0) {
      fetchParticles(200).then((particles) => {
        if (particles.length > 0) {
          // Map DB particles into simulation space
          particlesRef.current = particles.map((p) => ({
            ...p,
            x: (p.x / 400) * canvas.width * 0.6 + canvas.width * 0.2,
            y: (p.y / 300) * canvas.height * 0.6 + canvas.height * 0.2,
            vx: p.vx || (Math.random() - 0.5) * 20,
            vy: p.vy || (Math.random() - 0.5) * 20,
            mass: Math.min(10, p.mass || 1),
            energy: p.energy ?? 1,
          }))
        } else {
          // Fallback: demo particles
          particlesRef.current = createDemoParticles(40, canvas.width, canvas.height)
        }
        setStats((s) => ({ ...s, particles: particlesRef.current.length }))
      }).catch(() => {
        particlesRef.current = createDemoParticles(40, canvas.width, canvas.height)
        setStats((s) => ({ ...s, particles: particlesRef.current.length }))
      })
    }

    startRenderer(canvas, (dt) => {
      const result = simulateStep(
        particlesRef.current,
        dt,
        canvas.width,
        canvas.height,
      )
      particlesRef.current = result.particles
      if (result.fusions.length > 0) {
        fusionsRef.current = [
          ...fusionsRef.current.slice(-20),
          ...result.fusions,
        ]
      }

      // Render
      renderFrame({
        particles: particlesRef.current,
        fusions: fusionsRef.current.filter(
          (f) => Date.now() - f.timestamp < 1000,
        ),
        width: canvas.width,
        height: canvas.height,
        ...stateRef.current,
      })

      // Update stats (throttled)
      if (Math.random() < 0.1) {
        setStats({
          particles: particlesRef.current.length,
          clusters: countClusters(particlesRef.current),
          fusions: fusionsRef.current.length,
        })
      }
    })

    return () => stopRenderer()
  }, [])

  // Mouse handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    stateRef.current.dragStartX = (e.clientX - rect.left) * 2
    stateRef.current.dragStartY = (e.clientY - rect.top) * 2
    stateRef.current.isDragging = true
    stateRef.current.mouseX = stateRef.current.dragStartX
    stateRef.current.mouseY = stateRef.current.dragStartY
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!stateRef.current.isDragging) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = (e.clientX - rect.left) * 2
    const my = (e.clientY - rect.top) * 2
    const dx = mx - stateRef.current.dragStartX
    const dy = my - stateRef.current.dragStartY
    stateRef.current.dragAngle = Math.atan2(dy, dx)
    stateRef.current.dragPower = Math.min(100, Math.sqrt(dx * dx + dy * dy) / 3)
    stateRef.current.mouseX = mx
    stateRef.current.mouseY = my
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!stateRef.current.isDragging) return
    stateRef.current.isDragging = false

    // Only launch if sufficient power
    if (stateRef.current.dragPower < 5) return

    const { dragStartX, dragStartY, dragAngle, dragPower } = stateRef.current
    const speed = dragPower * 2
    const hue = Math.random() * 360

    const particle = createParticle({
      x: dragStartX,
      y: dragStartY,
      vx: -Math.cos(dragAngle) * speed,
      vy: -Math.sin(dragAngle) * speed,
      mass: 1 + Math.random() * 3,
      hue,
      name: `user_${Date.now() % 10000}`,
    })

    particlesRef.current.push(particle)

    // Persist to DB (fire-and-forget)
    apiCreateParticle({
      x: dragStartX / 2,  // scale back from HiDPI
      y: dragStartY / 2,
      vx: particle.vx,
      vy: particle.vy,
      mass: particle.mass,
      hue: particle.hue,
      name: particle.name,
    }).catch(() => {})  // silent fail — local sim continues
  }, [])

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = width * 2
    canvas.height = height * 2
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  return {
    canvasRef,
    stats,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}

/**
 * Count approximate clusters (particles within 50px of each other).
 */
function countClusters(particles: ParticleData[]): number {
  const visited = new Set<number>()
  let clusters = 0

  for (let i = 0; i < particles.length; i++) {
    if (visited.has(i)) continue
    const group: number[] = [i]
    visited.add(i)

    // BFS to find connected particles
    for (let gi = 0; gi < group.length; gi++) {
      const a = particles[group[gi]]
      for (let j = 0; j < particles.length; j++) {
        if (visited.has(j)) continue
        const b = particles[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        if (Math.sqrt(dx * dx + dy * dy) < 50) {
          visited.add(j)
          group.push(j)
        }
      }
    }

    if (group.length >= 3) clusters++ // only count groups of 3+
  }

  return clusters
}
