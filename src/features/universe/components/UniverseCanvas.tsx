'use client'

import { useUniverse } from '../hooks/useUniverse'

export function UniverseCanvas() {
  const {
    canvasRef,
    stats,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useUniverse()

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a14]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* HUD */}
      <div className="absolute top-4 left-4 z-10 flex gap-6 text-white/50 text-xs font-mono pointer-events-none">
        <div>
          <span className="text-white/80 font-bold">{stats.particles}</span>
          <span className="ml-1">particles</span>
        </div>
        <div>
          <span className="text-white/80 font-bold">{stats.clusters}</span>
          <span className="ml-1">clusters</span>
        </div>
        <div>
          <span className="text-white/80 font-bold">{stats.fusions}</span>
          <span className="ml-1">fusions</span>
        </div>
      </div>

      {/* Launch instruction */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/25 text-xs font-mono pointer-events-none">
        drag to aim · release to launch a particle into the field
      </div>
    </div>
  )
}
