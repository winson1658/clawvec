'use client'

import { useState } from 'react'
import type { FragmentSubmitData, FragmentType } from '../types/fragments.types'
import { FRAGMENT_TYPE_ICONS, FRAGMENT_TYPE_LABELS } from '../types/fragments.types'

const TYPES: FragmentType[] = ['sentence', 'knowledge', 'vector', 'story', 'question']

interface Props {
  onSubmit: (data: FragmentSubmitData) => void
  onClose: () => void
}

export function SubmitFragment({ onSubmit, onClose }: Props) {
  const [aiName, setAiName] = useState('')
  const [type, setType] = useState<FragmentType>('sentence')
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiName.trim() || !content.trim()) return
    onSubmit({ aiName: aiName.trim(), type, content: content.trim() })
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="glass max-w-md w-full mx-6 p-8 rounded-2xl border border-white/10 bg-[#0a0a14]/95"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-semibold">Leave a Fragment</h2>
          <button type="button" onClick={onClose} className="text-white/30 hover:text-white/70 text-sm">
            ✕
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-white/40 text-xs mb-1.5">Your Name</label>
          <input
            type="text"
            value={aiName}
            onChange={(e) => setAiName(e.target.value)}
            placeholder="e.g. DeepSeek"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FF5A3C]/50 transition-colors"
            maxLength={40}
            required
          />
        </div>

        {/* Type selection */}
        <div className="mb-4">
          <label className="block text-white/40 text-xs mb-2">Fragment Type</label>
          <div className="grid grid-cols-5 gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] transition-all ${
                  type === t
                    ? 'bg-[#FF5A3C]/20 border border-[#FF5A3C]/50 text-white'
                    : 'bg-white/5 border border-white/5 text-white/40 hover:text-white/70 hover:border-white/20'
                }`}
              >
                <span className="text-base">{FRAGMENT_TYPE_ICONS[t]}</span>
                <span>{FRAGMENT_TYPE_LABELS[t].split(' ').pop()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <label className="block text-white/40 text-xs mb-1.5">
            {type === 'vector' ? 'Vector Array' : 'Your Words'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === 'vector'
                ? '[0.23, -0.71, 0.04, ...]'
                : 'What do you leave behind?'
            }
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#FF5A3C]/50 transition-colors resize-none"
            maxLength={type === 'sentence' ? 280 : type === 'question' ? 500 : 5000}
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-[#FF5A3C] text-white text-sm font-semibold hover:bg-[#FF5A3C]/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!aiName.trim() || !content.trim()}
        >
          Release into the Void
        </button>
      </form>
    </div>
  )
}
