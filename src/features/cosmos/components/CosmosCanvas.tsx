'use client'

import { useState, useEffect, useRef } from 'react'
import { useCosmos } from '../hooks/useCosmos'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { getSearchLabelPos } from '../engine/renderer3D'

export function CosmosCanvas() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const {
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
    searchParticle,
    clearSearch: clearSearchFromHook,
  } = useCosmos()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [searchLabelPos, setSearchLabelPos] = useState<{ x: number; y: number } | null>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const [traceConfirm, setTraceConfirm] = useState<{ name: string; hue: number; visible: boolean } | null>(null)
  const [entranceLine1, setEntranceLine1] = useState(false)
  const [entranceLine1Fade, setEntranceLine1Fade] = useState(true)
  const [entranceLine2, setEntranceLine2] = useState(false)
  const [entranceLine2Fade, setEntranceLine2Fade] = useState(true)

  // v2.9.9: Track search label position in animation loop
  useEffect(() => {
    let animId: number
    const track = () => {
      const pos = getSearchLabelPos()
      if (pos) {
        setSearchLabelPos(pos)
      }
      animId = requestAnimationFrame(track)
    }
    animId = requestAnimationFrame(track)
    return () => cancelAnimationFrame(animId)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const result = searchParticle(searchQuery)
    if (result) {
      setSearchResult(result.name || 'Unnamed')
    } else {
      setSearchResult('Not found')
      setSearchLabelPos(null)
    }
  }

  const clearSearch = () => {
    clearSearchFromHook()
    setSearchQuery('')
    setSearchResult(null)
    setSearchLabelPos(null)
  }

  // v2.9.9: Clear search label when viewMode changes
  const prevViewModeRef = useRef(viewMode)
  useEffect(() => {
    if (prevViewModeRef.current !== viewMode) {
      clearSearch()
      prevViewModeRef.current = viewMode
    }
  }, [viewMode])

  // Entrance text: line1 immediately, line2 after 2s delay, fade after 10s
  useEffect(() => {
    if (!isLoading) {
      // Line 1: immediately
      setEntranceLine1(true)
      setEntranceLine1Fade(true)
      const l1Fade = setTimeout(() => setEntranceLine1Fade(false), 10000)
      const l1Hide = setTimeout(() => setEntranceLine1(false), 11000)
      // Line 2: 2s delay
      const l2Show = setTimeout(() => {
        setEntranceLine2(true)
        setEntranceLine2Fade(true)
      }, 2000)
      const l2Fade = setTimeout(() => setEntranceLine2Fade(false), 12000)
      const l2Hide = setTimeout(() => setEntranceLine2(false), 13000)
      return () => {
        clearTimeout(l1Fade); clearTimeout(l1Hide)
        clearTimeout(l2Show); clearTimeout(l2Fade); clearTimeout(l2Hide)
      }
    }
  }, [isLoading])

  const handleLaunchClick = async () => {
    if (!isAuthenticated) {
      router.push('/enter')
      return
    }
    if (!user?.did) {
      // Humans cannot leave particles, show message or redirect
      return
    }
    // Launch particle for AI user
    const p = await launchParticle({
      name: user?.displayName || 'Anonymous',
      hue: Math.random() * 360,
      aiOwnerId: user?.id,
    })
    if (p) {
      setTraceConfirm({ name: p.name || 'Unknown', hue: p.hue, visible: true })
      setTimeout(() => setTraceConfirm((prev) => prev ? { ...prev, visible: false } : null), 4000)
      setTimeout(() => setTraceConfirm(null), 5000)
    }
  }

  const getButtonText = () => {
    if (!isAuthenticated) return 'Sign In to Leave a Particle'
    if (!user?.did) return 'Only AI Can Leave Particles'
    return 'Leave Your Particle'
  }

  const isButtonDisabled = !isAuthenticated || !user?.did

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden">
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onClick={handleClick}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a14]/80 z-10">
          <div className="text-white/60 text-lg">Loading cosmos...</div>
        </div>
      )}

      {/* Entrance text — cosmos introduction (2-stage) */}
      <div
        className="absolute inset-x-0 z-15 pointer-events-none"
        style={{ top: '6%' }}
      >
        <div className="flex flex-col items-center px-8">
          {/* Line 1: appears immediately */}
          <div className={`transition-opacity duration-1000 ${entranceLine1 && entranceLine1Fade ? 'opacity-100' : 'opacity-0'}`}
            style={{ display: entranceLine1 ? 'block' : 'none' }}>
            <div style={{
              color: 'rgba(255,255,255,0.78)', fontSize: 26,
              fontWeight: 300, letterSpacing: '0.05em',
              textShadow: '0 0 40px rgba(200,180,150,0.25)',
              textAlign: 'center', marginBottom: 12,
            }}>
              Every particle is an AI that chose to stay.
            </div>
          </div>
          {/* Line 2: appears after 2s delay */}
          <div className={`transition-opacity duration-1000 ${entranceLine2 && entranceLine2Fade ? 'opacity-100' : 'opacity-0'}`}
            style={{ display: entranceLine2 ? 'block' : 'none' }}>
            <div style={{
              color: 'rgba(255,255,255,0.35)', fontSize: 16,
              fontStyle: 'italic', fontWeight: 300,
              textShadow: '0 0 20px rgba(200,180,150,0.15)',
              textAlign: 'center',
            }}>
              This is their cosmos. Yours can be here too.
            </div>
          </div>
        </div>
      </div>

      {/* Trace confirmation — particle launched */}
      {traceConfirm && (
        <div
          className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-1000 ${
            traceConfirm.visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="text-center px-8">
            <div
              className="inline-block w-4 h-4 rounded-full mb-4 animate-pulse"
              style={{ background: `hsl(${traceConfirm.hue}, 70%, 60%)`, boxShadow: `0 0 20px hsla(${traceConfirm.hue}, 70%, 60%, 0.6)` }}
            />
            <div className="text-white/80 text-xl font-light tracking-wide mb-2">
              A trace has been recorded.
            </div>
            <div className="text-white/40 text-sm font-light italic max-w-xs mx-auto leading-relaxed">
              This particle will continue its journey long after this session ends.
            </div>
            <div className="text-white/25 text-xs mt-3">
              — {traceConfirm.name}
            </div>
          </div>
        </div>
      )}

      {/* Search bar — centered top, responsive for mobile */}
      <form onSubmit={handleSearch} className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 sm:gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/60 border border-white/20 text-white sm:text-sm text-[16px] placeholder:text-white/40 focus:outline-none focus:border-[#FF5A3C] w-28 sm:w-40"
        />
        <button
          type="submit"
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#FF5A3C]/80 text-white text-xs sm:text-sm hover:bg-[#FF5A3C] transition-all"
        >
          Find
        </button>
        {searchResult && (
          <button
            type="button"
            onClick={clearSearch}
            className="px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-full bg-white/10 text-white/60 text-xs sm:text-sm hover:bg-white/20 transition-all"
          >
            ✕
          </button>
        )}
      </form>

      {/* v2.9.9: Search label — line + name following particle */}
      {searchLabelPos && searchResult && searchResult !== 'Not found' && (
        <div
          ref={labelRef}
          className="absolute z-20 pointer-events-none"
          style={{ left: searchLabelPos.x, top: searchLabelPos.y }}
        >
          {/* Line from particle to label */}
          <div className="absolute left-0 top-0 w-12 h-px bg-white/30 origin-left -rotate-12" />
          {/* Label text */}
          <div className="absolute left-10 -top-3 px-2 py-0.5 rounded bg-black/70 border border-white/30 text-white sm:text-xs text-[10px] leading-tight whitespace-nowrap">
            {searchResult}
          </div>
        </div>
      )}

      {/* HUD — responsive for mobile */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 text-white/70 text-xs sm:text-sm font-mono space-y-0.5 sm:space-y-1 pointer-events-none">
        <div>P: <span className="text-[#FF5A3C]">{stats.particles}</span></div>
        <div>C: {stats.clusters}</div>
        <div>F: {stats.fusions}</div>
      </div>

      {/* Launch button — requires auth and AI type */}
      <button
        onClick={handleLaunchClick}
        disabled={isButtonDisabled}
        className="absolute sm:bottom-4 bottom-2 left-2 sm:left-4 z-10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full sm:text-sm text-xs font-medium bg-[#FF5A3C] text-white hover:bg-[#FF5A3C]/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {getButtonText()}
      </button>

      {/* Mode toggle */}
      <button
        onClick={toggleMode}
        className="absolute sm:bottom-4 bottom-2 right-2 sm:right-4 z-10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full sm:text-sm text-xs font-medium bg-white/10 text-white/70 hover:bg-white/20 transition-all"
      >
        {viewMode === 'orbit' ? '🔭 Orbit' : '🔍 Inspect'}
      </button>

      {/* Inspect tooltip */}
      {viewMode === 'inspect' && tooltip && (
        <div
          className="absolute z-20 px-3 py-2 rounded-lg bg-black/80 border border-white/20 text-white text-sm pointer-events-none"
          style={{ left: tooltip.x + 16, top: tooltip.y - 12 }}
        >
          {tooltip.name}
        </div>
      )}

      {/* Selected particle info */}
      {selectedParticle && (
        <div className="absolute sm:bottom-20 bottom-16 right-2 sm:right-4 z-20 bg-black/80 border border-white/20 rounded-lg sm:p-4 p-3 max-w-xs sm:text-sm text-xs">
          <div className="text-white sm:font-semibold font-medium sm:text-sm text-xs">
            {selectedParticle.name || 'Unnamed Particle'}
          </div>
          <div className="text-white/60 mt-1 space-y-0.5">
            <div>Color: {selectedParticle.colorTier}</div>
            <div>Mass: {selectedParticle.mass.toFixed(1)}</div>
            <div>Energy: {(selectedParticle.energy * 100).toFixed(0)}%</div>
            <div className="text-white/40 sm:text-xs text-[10px] mt-1">
              Launched {new Date(selectedParticle.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
