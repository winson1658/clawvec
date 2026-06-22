'use client'

import { useEffect } from 'react'
import { Shield, Building2, Telescope, Network, Sparkles, RotateCcw, AlertTriangle } from 'lucide-react'
import { useQuiz } from '@/features/quiz/hooks/useQuiz'
import { getArchetypeDescription } from '@/features/quiz/services/quiz.service'
import type { Archetype } from '@/features/quiz/types/quiz.types'

const archetypeIcons: Record<Archetype, typeof Shield> = {
  Guardian: Shield,
  Architect: Building2,
  Oracle: Telescope,
  Synapse: Network,
}

export default function QuizPage() {
  const { questions, currentQuestion, state, progress, isLoading, error, load, answer, reset } = useQuiz()

  useEffect(() => { load() }, [])

  return (
    <div className="relative overflow-hidden">
      <div className="ambient-orb w-[300px] h-[300px] bg-[var(--color-accent)]/[0.07] top-[5%] right-[8%]" />
      <div className="ambient-orb w-[200px] h-[200px] bg-[var(--color-accent)]/[0.05] bottom-[10%] left-[5%]" />

      {/* Hero */}
      <section className="pt-16 pb-10 px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent)]">
              <Sparkles className="w-4 h-4" />
              Archetype Assessment
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-[var(--color-foreground)]">
            Discover your
            <br />
            <span className="text-[var(--color-accent)]">civic form.</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
            Not a personality test. A compass. Seven questions to reveal which philosophical archetype you inhabit — and what you protect.
          </p>
        </div>
      </section>

      {/* Quiz Content */}
      <section className="py-8 px-6 pb-20 relative z-10">
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="glass rounded-card p-12 card-glass text-center">
              <div className="animate-pulse text-[var(--color-text-secondary)]">Preparing assessment...</div>
            </div>
          ) : error ? (
            <div className="glass rounded-card p-12 card-glass text-center">
              <AlertTriangle className="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--color-text-secondary)] mb-2">Failed to load assessment</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">{error.message}</p>
            </div>
          ) : state.isComplete && state.result ? (
            <ResultView result={state.result} onReset={reset} />
          ) : currentQuestion ? (
            <QuestionView question={currentQuestion} progress={progress} onAnswer={answer} />
          ) : (
            <div className="glass rounded-card p-12 card-glass text-center">
              <p className="text-[var(--color-text-secondary)]">No questions available.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function QuestionView({
  question,
  progress,
  onAnswer,
}: {
  question: { id: string; question: string; options: { text: string }[] }
  progress: number
  onAnswer: (index: number) => void
}) {
  return (
    <div className="glass rounded-card p-6 md:p-8 card-glass">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] mb-2">
          <span>Question</span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h3 className="text-lg md:text-xl font-semibold text-[var(--color-foreground)] mb-8 leading-relaxed">
        {question.question}
      </h3>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswer(index)}
            className="w-full text-left p-4 rounded-xl border border-white/30 hover:border-[var(--color-accent)]/40 hover:bg-white/10 transition-all duration-200"
          >
            <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {option.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ResultView({
  result,
  onReset,
}: {
  result: { archetype: Archetype; scores: Record<Archetype, number> }
  onReset: () => void
}) {
  const description = getArchetypeDescription(result.archetype)
  const Icon = archetypeIcons[result.archetype]

  return (
    <div className="space-y-6">
      {/* Result Card */}
      <div className="glass rounded-card p-8 md:p-10 card-glass text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-6">
          <Icon className="w-8 h-8 text-[var(--color-accent)]" />
        </div>

        <h2 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">
          {description.title}
        </h2>
        <p className="text-sm text-[var(--color-accent)] mb-6">{description.subtitle}</p>
        <p className="text-base text-[var(--color-text-secondary)] leading-relaxed max-w-lg mx-auto">
          {description.description}
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="glass rounded-card p-6 card-glass">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Score Breakdown</h3>
        <div className="space-y-3">
          {(Object.entries(result.scores) as [Archetype, number][]).map(([archetype, score]) => {
            const maxScore = Math.max(...Object.values(result.scores))
            const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
            const isPrimary = archetype === result.archetype

            return (
              <div key={archetype}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className={isPrimary ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-text-secondary)]'}>
                    {archetype}
                  </span>
                  <span className={isPrimary ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-text-tertiary)]'}>
                    {score}
                  </span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isPrimary ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-text-tertiary)]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reset */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-button bg-[var(--color-accent)] text-white font-semibold hover:opacity-90 transition-opacity"
        >
          <RotateCcw className="w-4 h-4" />
          Take Again
        </button>
      </div>
    </div>
  )
}
