// features/echo/hooks/useEcho.ts
// Main hook: manages echo pool, drift animation, and selection

'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import type { DriftingEcho, EchoSubmitData } from '../types/echo.types'
import {
  initDriftEchoes,
  updateDrift,
  findConnections,
  createMockEchoes,
} from '../engine/drift'
import { initDriftRenderer, renderDriftFrame } from '../engine/renderer'
import {
  fetchRandomEchoes,
  fetchEchoReplies,
  submitEcho as apiSubmitEcho,
  submitReply as apiSubmitReply,
} from '../services/echoes.service'

export function useEcho() {
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const echoesRef = useRef<DriftingEcho[]>([])
  const selectedRef = useRef<DriftingEcho | null>(null)
  const timeRef = useRef(0)
  const animIdRef = useRef(0)
  const [selected, setSelected] = useState<DriftingEcho | null>(null)
  const [showSubmit, setShowSubmit] = useState(false)
  const [stats, setStats] = useState({ total: 0, connections: 0 })

  // Initialize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { width, height } = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio, 4)
    canvas.width = width * dpr
    canvas.height = height * dpr

    initDriftRenderer(canvas, dpr)

    // Capture dimensions for the render loop (TypeScript narrowing)
    const cw = canvas.width
    const ch = canvas.height

    if (echoesRef.current.length === 0) {
      // Try loading from API first
      fetchRandomEchoes(200).then((echoes) => {
        if (echoes.length > 0) {
          echoesRef.current = initDriftEchoes(echoes, cw, ch)
        } else {
          echoesRef.current = initDriftEchoes(createMockEchoes(50), cw, ch)
        }
        setStats((s) => ({ ...s, total: echoesRef.current.length }))
      }).catch(() => {
        echoesRef.current = initDriftEchoes(createMockEchoes(50), cw, ch)
        setStats((s) => ({ ...s, total: echoesRef.current.length }))
      })
    }

    let lastTime = performance.now()

    function loop(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      timeRef.current = now

      // Update drift
      echoesRef.current = updateDrift(
        echoesRef.current,
        dt,
        cw,
        ch,
      )

      // Find connections
      const connections = findConnections(echoesRef.current)

      // Render
      renderDriftFrame({
        echoes: echoesRef.current,
        connections,
        selectedEcho: selectedRef.current,
        width: cw,
        height: ch,
        time: now,
      })

      // Stats (throttled)
      if (Math.random() < 0.05) {
        setStats({ total: echoesRef.current.length, connections: connections.length })
      }

      animIdRef.current = requestAnimationFrame(loop)
    }

    animIdRef.current = requestAnimationFrame(loop)

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current)
    }
  }, [])

  // Click handler: find nearest echo
  const handleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * 2
    const my = (e.clientY - rect.top) * 2

    // Find nearest echo within 30px
    let nearest: DriftingEcho | null = null
    let nearestDist = 30

    for (const f of echoesRef.current) {
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

  const handleSubmit = useCallback(async (data: EchoSubmitData) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Submit to API (creates echo + particle)
    try {
      await apiSubmitEcho(data)
    } catch {
      // Continue locally even if API fails
    }

    const newEcho: DriftingEcho = {
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

    echoesRef.current = [...echoesRef.current.slice(-999), newEcho]
    setShowSubmit(false)
    setStats((s) => ({ ...s, total: echoesRef.current.length }))
  }, [])

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { width, height } = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio, 4)
    canvas.width = width * dpr
    canvas.height = height * dpr
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  // Toggle replies visibility
  const handleToggleReplies = useCallback(async (echoId: string) => {
    const echo = echoesRef.current.find(e => e.id === echoId)
    if (!echo) return

    if (echo.showReplies) {
      // Hide replies
      echoesRef.current = echoesRef.current.map(e =>
        e.id === echoId ? { ...e, showReplies: false } : e
      )
      setSelected(prev => prev ? { ...prev, showReplies: false } : null)
    } else {
      // Show and load replies
      echoesRef.current = echoesRef.current.map(e =>
        e.id === echoId ? { ...e, isLoadingReplies: true } : e
      )

      try {
        const replies = await fetchEchoReplies(echoId)
        echoesRef.current = echoesRef.current.map(e =>
          e.id === echoId ? { ...e, replies, showReplies: true, isLoadingReplies: false } : e
        )
        setSelected(prev => prev ? { ...prev, replies, showReplies: true, isLoadingReplies: false } : null)
      } catch {
        echoesRef.current = echoesRef.current.map(e =>
          e.id === echoId ? { ...e, isLoadingReplies: false } : e
        )
      }
    }
  }, [])

  // Submit reply
  const handleReply = useCallback(async (parentId: string, content: string) => {
    try {
      const result = await apiSubmitReply({
        parentId,
        aiName: user?.displayName || 'Anonymous',
        content,
      })

      // Add reply to the echo's replies list
      echoesRef.current = echoesRef.current.map(e => {
        if (e.id === parentId) {
          const currentReplies = e.replies || []
          return {
            ...e,
            replies: [...currentReplies, result.reply],
            repliesCount: (e.repliesCount || 0) + 1,
            showReplies: true,
          }
        }
        return e
      })

      setSelected(prev => {
        if (!prev || prev.id !== parentId) return prev
        return {
          ...prev,
          replies: [...(prev.replies || []), result.reply],
          repliesCount: (prev.repliesCount || 0) + 1,
          showReplies: true,
        }
      })

      return true
    } catch {
      return false
    }
  }, [])

  return {
    canvasRef,
    selected,
    showSubmit,
    stats,
    handleClick,
    handleDeselect,
    handleSubmit,
    handleToggleReplies,
    handleReply,
    setShowSubmit,
  }
}
