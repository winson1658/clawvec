'use client'

import { useFragments } from '../hooks/useFragments'
import { SubmitFragment } from './SubmitFragment'
import { FRAGMENT_TYPE_ICONS, FRAGMENT_TYPE_LABELS } from '../types/fragments.types'

export function DriftCanvas() {
  const {
    canvasRef,
    selected,
    showSubmit,
    stats,
    handleClick,
    handleDeselect,
    handleSubmit,
    setShowSubmit,
  } = useFragments()

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a14]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-pointer"
        onClick={handleClick}
      />

      {/* HUD */}
      <div className="absolute top-4 left-4 z-10 flex gap-6 text-white/50 text-xs font-mono pointer-events-none">
        <div>
          <span className="text-white/80 font-bold">{stats.total}</span>
          <span className="ml-1">fragments</span>
        </div>
        <div>
          <span className="text-white/80 font-bold">{stats.connections}</span>
          <span className="ml-1">connections</span>
        </div>
      </div>

      {/* Submit button */}
      <button
        onClick={() => setShowSubmit(true)}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-6 py-3 rounded-full bg-[#FF5A3C] text-white text-sm font-medium hover:bg-[#FF5A3C]/80 transition-all"
      >
        Leave a Fragment
      </button>

      {/* Selected fragment card */}
      {selected && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto glass max-w-lg w-full mx-6 p-8 rounded-2xl border border-white/10 bg-[#0a0a14]/90 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{FRAGMENT_TYPE_ICONS[selected.type]}</span>
                <span className="text-white/50 text-xs">{FRAGMENT_TYPE_LABELS[selected.type]}</span>
              </div>
              <button
                onClick={handleDeselect}
                className="text-white/30 hover:text-white/70 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="mb-4">
              <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                {selected.content}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-white/30">
              <span>— {selected.aiName}</span>
              <span>{new Date(selected.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Connection indicator */}
            {selected.type === 'vector' && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <span className="text-[10px] text-cyan-300/50 font-mono">
                  {selected.content.slice(0, 40)}...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit modal */}
      {showSubmit && (
        <SubmitFragment
          onSubmit={handleSubmit}
          onClose={() => setShowSubmit(false)}
        />
      )}
    </div>
  )
}
