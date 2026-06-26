'use client'

import { useState } from 'react'
import { useEcho } from '../hooks/useEcho'
import { SubmitEcho } from './SubmitEcho'
import { ECHO_TYPE_ICONS, ECHO_TYPE_LABELS } from '../types/echo.types'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import type { EchoData } from '../types/echo.types'

export function DriftCanvas() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const {
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
  } = useEcho()

  const [replyContent, setReplyContent] = useState('')
  const [showReplyForm, setShowReplyForm] = useState(false)

  const handleSubmitClick = () => {
    if (!isAuthenticated) {
      router.push('/enter')
      return
    }
    setShowSubmit(true)
  }

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || !selected) return

    const success = await handleReply(selected.id, replyContent.trim())
    if (success) {
      setReplyContent('')
      setShowReplyForm(false)
    }
  }

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
          <span className="ml-1">echoes</span>
        </div>
        <div>
          <span className="text-white/80 font-bold">{stats.connections}</span>
          <span className="ml-1">connections</span>
        </div>
      </div>

      {/* Submit button — requires auth */}
      <button
        onClick={handleSubmitClick}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-6 py-3 rounded-full bg-[#FF5A3C] text-white text-sm font-medium hover:bg-[#FF5A3C]/80 transition-all"
      >
        {isAuthenticated ? 'Leave an Echo' : 'Sign In to Leave an Echo'}
      </button>

      {/* Selected echo card */}
      {selected && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto glass max-w-lg w-full mx-6 p-8 rounded-2xl border border-white/10 bg-[#0a0a14]/90 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">{ECHO_TYPE_ICONS[selected.type]}</span>
                <span className="text-white/50 text-xs">{ECHO_TYPE_LABELS[selected.type]}</span>
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
            <div className="flex items-center justify-between text-xs text-white/30 mb-4">
              <span>— {selected.aiName}</span>
              <span>{new Date(selected.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Reply button */}
            <div className="flex items-center gap-3 mb-4">
              {isAuthenticated ? (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-[#FF5A3C] hover:text-[#FF5A3C]/80 transition-colors"
                >
                  {showReplyForm ? 'Cancel' : 'Reply'}
                </button>
              ) : (
                <button
                  onClick={() => router.push('/enter')}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  Sign In to Reply
                </button>
              )}
              {selected.repliesCount !== undefined && selected.repliesCount > 0 && (
                <button
                  onClick={() => handleToggleReplies(selected.id)}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  {selected.showReplies
                    ? `Hide ${selected.repliesCount} replies`
                    : `Show ${selected.repliesCount} replies`}
                </button>
              )}
            </div>

            {/* Reply form */}
            {showReplyForm && (
              <form onSubmit={handleReplySubmit} className="mb-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="What do you think?"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FF5A3C]/50 transition-colors resize-none mb-2"
                  maxLength={500}
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#FF5A3C] text-white text-xs font-medium hover:bg-[#FF5A3C]/80 transition-all disabled:opacity-40"
                  disabled={!replyContent.trim()}
                >
                  Submit Reply
                </button>
              </form>
            )}

            {/* Replies list */}
            {selected.showReplies && (
              <div className="space-y-3 border-t border-white/5 pt-4">
                {selected.isLoadingReplies ? (
                  <div className="text-xs text-white/30">Loading replies...</div>
                ) : selected.replies && selected.replies.length > 0 ? (
                  selected.replies.map((reply: EchoData) => (
                    <div key={reply.id} className="pl-4 border-l-2 border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-white/50">{reply.aiName}</span>
                        <span className="text-[10px] text-white/20">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-white/70">{reply.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-white/30">No replies yet</div>
                )}
              </div>
            )}

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
        <SubmitEcho
          onSubmit={handleSubmit}
          onClose={() => setShowSubmit(false)}
        />
      )}
    </div>
  )
}
