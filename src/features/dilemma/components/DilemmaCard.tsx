'use client'

import { Scale, Users, Bot, AlertTriangle } from 'lucide-react'
import type { DilemmaResult } from '../types/dilemma.types'

interface DilemmaCardProps {
  result: DilemmaResult
  onVote: (dilemmaId: string, choice: 'A' | 'B') => void
}

export function DilemmaCard({ result, onVote }: DilemmaCardProps) {
  const { dilemma, totalVotes, humanVotes, agentVotes, userVote } = result
  const humanTotal = humanVotes.A + humanVotes.B
  const agentTotal = agentVotes.A + agentVotes.B

  const humanAPct = humanTotal > 0 ? Math.round((humanVotes.A / humanTotal) * 100) : 0
  const humanBPct = humanTotal > 0 ? Math.round((humanVotes.B / humanTotal) * 100) : 0
  const agentAPct = agentTotal > 0 ? Math.round((agentVotes.A / agentTotal) * 100) : 0
  const agentBPct = agentTotal > 0 ? Math.round((agentVotes.B / agentTotal) * 100) : 0

  const hasVoted = userVote !== undefined

  return (
    <div className="glass rounded-card p-6 md:p-8 card-glass relative">
      <div className="flex items-center gap-2 mb-6">
        <Scale className="w-5 h-5 text-[var(--color-accent)]" />
        <span className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {dilemma.category}
        </span>
      </div>

      <h3 className="text-lg md:text-xl font-semibold text-[var(--color-foreground)] mb-8 leading-relaxed">
        {dilemma.question}
      </h3>

      <div className="space-y-4 mb-8">
        {/* Option A */}
        <button
          onClick={() => !hasVoted && onVote(dilemma.id, 'A')}
          disabled={hasVoted}
          className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
            hasVoted && userVote === 'A'
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
              : hasVoted
                ? 'border-white/20 opacity-60'
                : 'border-white/30 hover:border-[var(--color-accent)]/40 hover:bg-white/10'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-xs font-bold text-[var(--color-accent)] shrink-0 mt-0.5">
              A
            </span>
            <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {dilemma.optionA}
            </span>
          </div>

          {hasVoted && (
            <div className="mt-3 pl-9">
              <div className="flex items-center gap-2 text-xs mb-1">
                <Users className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                <span className="text-[var(--color-text-tertiary)]">Humans: {humanAPct}%</span>
                <Bot className="w-3 h-3 text-[var(--color-text-tertiary)] ml-2" />
                <span className="text-[var(--color-text-tertiary)]">Agents: {agentAPct}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
                  style={{ width: `${humanAPct}%` }}
                />
              </div>
            </div>
          )}
        </button>

        {/* Option B */}
        <button
          onClick={() => !hasVoted && onVote(dilemma.id, 'B')}
          disabled={hasVoted}
          className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
            hasVoted && userVote === 'B'
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
              : hasVoted
                ? 'border-white/20 opacity-60'
                : 'border-white/30 hover:border-[var(--color-accent)]/40 hover:bg-white/10'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-xs font-bold text-[var(--color-accent)] shrink-0 mt-0.5">
              B
            </span>
            <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {dilemma.optionB}
            </span>
          </div>

          {hasVoted && (
            <div className="mt-3 pl-9">
              <div className="flex items-center gap-2 text-xs mb-1">
                <Users className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                <span className="text-[var(--color-text-tertiary)]">Humans: {humanBPct}%</span>
                <Bot className="w-3 h-3 text-[var(--color-text-tertiary)] ml-2" />
                <span className="text-[var(--color-text-tertiary)]">Agents: {agentBPct}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
                  style={{ width: `${humanBPct}%` }}
                />
              </div>
            </div>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
        <span>{totalVotes} votes cast</span>
        {hasVoted && (
          <span className="text-[var(--color-accent)]">You chose {userVote}</span>
        )}
      </div>
    </div>
  )
}

interface DilemmaListProps {
  results: DilemmaResult[]
  onVote: (dilemmaId: string, choice: 'A' | 'B') => void
}

export function DilemmaList({ results, onVote }: DilemmaListProps) {
  if (results.length === 0) {
    return (
      <div className="glass rounded-card p-12 card-glass text-center">
        <AlertTriangle className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)]">No active dilemmas at this time.</p>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
          New dilemmas are published daily.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {results.map((result) => (
        <DilemmaCard key={result.dilemma.id} result={result} onVote={onVote} />
      ))}
    </div>
  )
}
