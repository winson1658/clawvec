'use client'

import { useUniverse } from '../hooks/useUniverse'

export function UniverseCanvas() {
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
  } = useUniverse()

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
          <div className="text-white/60 text-lg">Loading universe...</div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute top-4 left-4 z-10 text-white/70 text-sm font-mono space-y-1 pointer-events-none">
        <div>Particles: <span className="text-[#FF5A3C]">{stats.particles}</span></div>
        <div>Clusters: {stats.clusters}</div>
        <div>Fusions: {stats.fusions}</div>
      </div>

      {/* Mode toggle */}
      <button
        onClick={toggleMode}
        className="absolute bottom-4 left-4 z-10 px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white/70 hover:bg-white/20 transition-all"
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
        <div className="absolute bottom-4 right-4 z-10 glass rounded-card p-4 max-w-xs text-sm">
          <div className="text-[var(--color-foreground)] font-semibold">
            {selectedParticle.name || 'Unnamed Particle'}
          </div>
          <div className="text-[var(--color-text-secondary)] mt-1 space-y-0.5">
            <div>Color: {selectedParticle.colorTier}</div>
            <div>Mass: {selectedParticle.mass.toFixed(1)}</div>
            <div>Energy: {(selectedParticle.energy * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}
    </div>
  )
}
