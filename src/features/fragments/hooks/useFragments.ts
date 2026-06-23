// features/fragments/hooks/useFragments.ts
// Main hook: manages fragment pool, drift animation, and selection

'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { DriftingFragment, FragmentSubmitData } from '../types/fragments.types'
import {
  initDriftFragments,
  updateDrift,
  findConnections,
  createMockFragments,
} from '../engine/drift'
import { initDriftRenderer, renderDriftFrame } from '../engine/renderer'
import { fetchRandomFragments, submitFragment as apiSubmitFragment } from '../services/fragments.service'

export function useFragments() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fragmentsRef = useRef<DriftingFragment[]>([])
  const selectedRef = useRef<DriftingFragment | null>(null)
  const timeRef = useRef(0)
  const animIdRef = useRef(0)
  const [selected, setSelected] = useState<DriftingFragment | null>(null)
  const [showSubmit, setShowSubmit] = useState(false)
  const [stats, setStats] = useState({ total: 0, connections: 0 })

  // Initialize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = width * 2
    canvas.height = height * 2

    initDriftRenderer(canvas)

    // Capture dimensions for the render loop (TypeScript narrowing)
    const cw = canvas.width
    const ch = canvas.height

    if (fragmentsRef.current.length === 0) {
      // Try loading from API first
      fetchRandomFragments(200).then((fragments) => {
        if (fragments.length > 0) {
          fragmentsRef.current = initDriftFragments(fragments, cw, ch)
        } else {
          fragmentsRef.current = initDriftFragments(createMockFragments(50), cw, ch)
        }
        setStats((s) => ({ ...s, total: fragmentsRef.current.length }))
      }).catch(() => {
        fragmentsRef.current = initDriftFragments(createMockFragments(50), cw, ch)
        setStats((s) => ({ ...s, total: fragmentsRef.current.length }))
      })
    }

    let lastTime = performance.now()

    function loop(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      timeRef.current = now

      // Update drift
      fragmentsRef.current = updateDrift(
        fragmentsRef.current,
        dt,
        cw,
        ch,
      )

      // Find connections
      const connections = findConnections(fragmentsRef.current)

      // Render
      renderDriftFrame({
        fragments: fragmentsRef.current,
        connections,
        selectedFragment: selectedRef.current,
        width: cw,
        height: ch,
        time: now,
      })

      // Stats (throttled)
      if (Math.random() < 0.05) {
        setStats({ total: fragmentsRef.current.length, connections: connections.length })
      }

      animIdRef.current = requestAnimationFrame(loop)
    }

    animIdRef.current = requestAnimationFrame(loop)

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current)
    }
  }, [])

  // Click handler: find nearest fragment
  const handleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * 2
    const my = (e.clientY - rect.top) * 2

    // Find nearest fragment within 30px
    let nearest: DriftingFragment | null = null
    let nearestDist = 30

    for (const f of fragmentsRef.current) {
      const dx = f.x - mx
      const dy = f.y - my
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < nearestDist) {
        nearest = f
        nearestDist = dist
      }
    }

    if (nearest) {
      selectedRef.current = { ...nearest, selected: true, opacity: 1 }
      setSelected(selectedRef.current)
    } else {
      selectedRef.current = null
      setSelected(null)
    }
  }, [])

  const handleDeselect = useCallback(() => {
    selectedRef.current = null
    setSelected(null)
  }, [])

  const handleSubmit = useCallback(async (data: FragmentSubmitData) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Submit to API (creates fragment + particle)
    try {
      await apiSubmitFragment(data)
    } catch {
      // Continue locally even if API fails
    }

    const newFragment: DriftingFragment = {
      id: `f_user_${Date.now()}`,
      aiName: data.aiName,
      type: data.type,
      content: data.content,
      embedding2dX: (Math.random() - 0.5) * 2,
      embedding2dY: (Math.random() - 0.5) * 2,
      createdAt: Date.now(),
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      opacity: 1,
      scale: 1,
      selected: false,
    }

    fragmentsRef.current = [...fragmentsRef.current.slice(-999), newFragment]
    setShowSubmit(false)
    setStats((s) => ({ ...s, total: fragmentsRef.current.length }))
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
    selected,
    showSubmit,
    stats,
    handleClick,
    handleDeselect,
    handleSubmit,
    setShowSubmit,
  }
}
