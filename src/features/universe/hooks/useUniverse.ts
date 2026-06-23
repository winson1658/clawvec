// features/universe/hooks/useUniverse.ts
// Main hook v2.1 — 3D particle universe with color-tier forces, persistence, dual modes

'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { ParticleData, FusionEvent, ViewMode } from '../types/universe.types'
import { simulateStep, createDemoParticles } from '../engine/nbody'
import {
  initRenderer,
  renderFrame,
  stopRenderer,
  handleResize as resize3D,
  getCamera,
  getRendererDom,
  raycastParticle,
} from '../engine/renderer3D'
import { createParticle } from '../engine/particle'
import {
  scheduleSave,
  mapDbToParticles,
  enforceLimit,
} from '../engine/persistence'
import {
  fetchParticles,
  createParticle as apiCreateParticle,
  batchUpsertParticles,
} from '../services/particles.service'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as THREE from 'three'

const DARK_PAGES = ['/universe', '/fragments']

export function useUniverse() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<ParticleData[]>([])
  const controlsRef = useRef<OrbitControls | null>(null)
  const fusionsRef = useRef<FusionEvent[]>([])

  const [stats, setStats] = useState({ particles: 0, clusters: 0, fusions: 0 })
  const [viewMode, setViewMode] = useState<ViewMode>('orbit')
  const [selectedParticle, setSelectedParticle] = useState<ParticleData | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Track mouse for raycasting
  const mouseRef = useRef({ x: 0, y: 0 })

  // Initialize 3D scene + load particles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsLoading(true)

    try {
      // Init 3D renderer
      initRenderer(canvas, (dt) => {
        const result = simulateStep(
          particlesRef.current,
          dt,
          800, // logical width
          600, // logical height
        )
        particlesRef.current = enforceLimit(result.particles)
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
            (f) => Date.now() - f.timestamp < 3000,
          ),
          viewMode,
          selectedParticleId: selectedParticle?.id ?? null,
        })

        // Schedule persistence
        scheduleSave(particlesRef.current, async (particles) => {
          await batchUpsertParticles(particles).catch(() => {})
        })

        // Update stats throttled
        if (Math.random() < 0.05) {
          setStats({
            particles: particlesRef.current.length,
            clusters: countClusters(particlesRef.current),
            fusions: fusionsRef.current.length,
          })
        }
      })

      // Setup OrbitControls
      const camera = getCamera()
      const dom = getRendererDom()
      const controls = new OrbitControls(camera, dom)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.minDistance = 100
      controls.maxDistance = 1500
      controls.maxPolarAngle = Math.PI * 0.6
      controls.target.set(400, 300, 0)
      controls.update()
      controlsRef.current = controls

    } catch (err) {
      console.error('[useUniverse] init error:', err)
      setIsLoading(false)
      return
    }

    // Load particles from DB
    fetchParticles(500).then((rows) => {
      if (rows.length > 0) {
        particlesRef.current = mapDbToParticles(rows, 800, 600)
      } else {
        // No DB state — seed
        particlesRef.current = createDemoParticles(49, 800, 600) // 7 colors × 7 each
      }
      setIsLoading(false)
    }).catch((err) => {
      console.error('[useUniverse] fetchParticles error:', err)
      particlesRef.current = createDemoParticles(49, 800, 600)
      setIsLoading(false)
    })

    return () => {
      stopRenderer()
      if (controlsRef.current) controlsRef.current.dispose()
    }
  }, [])

  // Resize handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    resize3D(canvas)
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  // Toggle view mode
  const toggleMode = useCallback(() => {
    setViewMode((m) => {
      const next = m === 'orbit' ? 'inspect' : 'orbit'
      if (controlsRef.current) {
        controlsRef.current.enabled = next === 'orbit'
      }
      return next
    })
    setSelectedParticle(null)
    setTooltip(null)
  }, [])

  // Handle click for inspect mode
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (viewMode !== 'inspect') return
      const canvas = canvasRef.current
      if (!canvas) return

      const hit = raycastParticle(
        e.clientX,
        e.clientY,
        particlesRef.current,
        canvas,
      )

      if (hit) {
        setSelectedParticle(hit)
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          name: hit.name || 'Unknown',
        })
      } else {
        setSelectedParticle(null)
        setTooltip(null)
      }
    },
    [viewMode],
  )

  // Launch particle handler (from fragments bridge or admin)
  const launchParticle = useCallback(
    async (params: {
      name: string
      hue: number
      mass?: number
      aiOwnerId?: string
    }) => {
      // Check AI limit
      if (params.aiOwnerId) {
        const existing = particlesRef.current.find(
          (p) => p.aiOwnerId === params.aiOwnerId,
        )
        if (existing) return false // already has one
      }

      // Check total limit
      if (particlesRef.current.length >= 1000) return false

      const p = createParticle({
        x: 200 + Math.random() * 400,
        y: 150 + Math.random() * 300,
        z: (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        vz: (Math.random() - 0.5) * 5,
        mass: params.mass ?? 1 + Math.random() * 3,
        hue: params.hue,
        name: params.name,
        aiOwnerId: params.aiOwnerId,
      })

      particlesRef.current.push(p)
      return true
    },
    [],
  )

  return {
    canvasRef,
    containerRef,
    stats,
    viewMode,
    toggleMode,
    selectedParticle,
    tooltip,
    isLoading,
    handleClick,
    launchParticle,
  }
}

function countClusters(particles: ParticleData[]): number {
  const visited = new Set<number>()
  let clusters = 0
  for (let i = 0; i < particles.length; i++) {
    if (visited.has(i)) continue
    const group: number[] = [i]
    visited.add(i)
    for (let gi = 0; gi < group.length; gi++) {
      const a = particles[group[gi]]
      for (let j = 0; j < particles.length; j++) {
        if (visited.has(j)) continue
        const b = particles[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dz = (a.z ?? 0) - (b.z ?? 0)
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 50) {
          visited.add(j)
          group.push(j)
        }
      }
    }
    if (group.length >= 3) clusters++
  }
  return clusters
}
