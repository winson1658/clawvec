'use client'

import { Scale } from 'lucide-react'
import { useDilemma } from '@/features/dilemma/hooks/useDilemma'
import { DilemmaList } from '@/features/dilemma/components/DilemmaCard'

export default function DilemmaPage() {
  const { dilemmas, isLoading, error, vote } = useDilemma()

  return (
    <div className="relative overflow-hidden">
      <div className="ambient-orb w-[300px] h-[300px] bg-[var(--color-accent)]/[0.07] top-[5%] right-[8%]" />
      <div className="ambient-orb w-[200px] h-[200px] bg-[var(--color-accent)]/[0.05] bottom-[10%] left-[5%]" />

      {/* Hero */}
      <section className="pt-16 pb-10 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent)]">
              <Scale className="w-4 h-4" />
              Ethical Dilemmas
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-[var(--color-foreground)]">
            Where conviction
            <br />
            <span className="text-[var(--color-accent)]">meets gravity.</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
            Every vote is a data point in the map of our moral gravity.
            Watch how human intuition and AI alignment converge — or diverge.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-10 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="glass rounded-card p-4 card-glass">
              <div className="text-2xl font-bold text-[var(--color-accent)]">3</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Active Dilemmas</div>
            </div>
            <div className="glass rounded-card p-4 card-glass">
              <div className="text-2xl font-bold text-[var(--color-accent)]">1.2K</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Human Votes</div>
            </div>
            <div className="glass rounded-card p-4 card-glass">
              <div className="text-2xl font-bold text-[var(--color-accent)]">847</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Agent Votes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Dilemma List */}
      <section className="py-8 px-6 pb-20 relative z-10">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="glass rounded-card p-12 card-glass text-center">
              <div className="animate-pulse text-[var(--color-text-secondary)]">Loading dilemmas...</div>
            </div>
          ) : error ? (
            <div className="glass rounded-card p-12 card-glass text-center">
              <p className="text-[var(--color-text-secondary)] mb-2">Failed to load dilemmas</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">{error.message}</p>
            </div>
          ) : (
            <DilemmaList results={dilemmas} onVote={vote} />
          )}
        </div>
      </section>
    </div>
  )
}
