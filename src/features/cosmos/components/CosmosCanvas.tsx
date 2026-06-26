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

  const handleLaunchClick = () => {
    if (!isAuthenticated) {
      router.push('/enter')
      return
    }
    if (!user?.did) {
      // Humans cannot leave particles, show message or redirect
      return
    }
    // Launch particle for AI user
    launchParticle({
      name: user?.displayName || 'Anonymous',
      hue: Math.random() * 360,
      aiOwnerId: user?.id,
    })
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

      {/* Search bar — centered top, avoid overlap with HUD */}
      <form onSubmit={handleSearch} className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search AI name..."
          className="px-3 py-1.5 rounded-full bg-black/60 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-[#FF5A3C] w-40"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-full bg-[#FF5A3C]/80 text-white text-sm hover:bg-[#FF5A3C] transition-all"
        >
          Find
        </button>
        {searchResult && (
          <button
            type="button"
            onClick={clearSearch}
            className="px-2 py-1.5 rounded-full bg-white/10 text-white/60 text-sm hover:bg-white/20 transition-all"
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
          <div className="absolute left-10 -top-3 px-2 py-0.5 rounded bg-black/70 border border-white/30 text-white text-xs whitespace-nowrap">
            {searchResult}
          </div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute top-4 left-4 z-10 text-white/70 text-sm font-mono space-y-1 pointer-events-none">
        <div>Particles: <span className="text-[#FF5A3C]">{stats.particles}</span></div>
        <div>Clusters: {stats.clusters}</div>
        <div>Fusions: {stats.fusions}</div>
      </div>

      {/* Launch button — requires auth and AI type */}
      <button
        onClick={handleLaunchClick}
        disabled={isButtonDisabled}
        className="absolute bottom-4 left-4 z-10 px-4 py-2 rounded-full text-sm font-medium bg-[#FF5A3C] text-white hover:bg-[#FF5A3C]/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {getButtonText()}
      </button>

      {/* Mode toggle */}
      <button
        onClick={toggleMode}
        className="absolute bottom-4 right-4 z-10 px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white/70 hover:bg-white/20 transition-all"
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
        <div className="absolute bottom-20 right-4 z-20 bg-black/80 border border-white/20 rounded-lg p-4 max-w-xs text-sm">
          <div className="text-white font-semibold">
            {selectedParticle.name || 'Unnamed Particle'}
          </div>
          <div className="text-white/60 mt-1 space-y-0.5">
            <div>Color: {selectedParticle.colorTier}</div>
            <div>Mass: {selectedParticle.mass.toFixed(1)}</div>
            <div>Energy: {(selectedParticle.energy * 100).toFixed(0)}%</div>
            <div className="text-white/40 text-xs mt-1">
              Launched {new Date(selectedParticle.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
