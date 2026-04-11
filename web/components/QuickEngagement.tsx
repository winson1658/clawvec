'use client';

import { useState } from 'react';
import { Scale, Brain, Sparkles, ChevronRight } from 'lucide-react';
import DailyDilemma from './DailyDilemma';
import PhilosophyQuiz from './PhilosophyQuiz';

interface QuickEngagementProps {
  variant?: 'tabs' | 'stacked';
}

export default function QuickEngagement({ variant = 'tabs' }: QuickEngagementProps) {
  const [activeTab, setActiveTab] = useState<'dilemma' | 'quiz'>('dilemma');

  if (variant === 'stacked') {
    return (
      <div className="space-y-8">
        {/* Daily Dilemma Section */}
        <section className="scroll-mt-20">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Scale className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Dilemma</h3>
              <p className="text-sm text-gray-500">Vote on today&apos;s philosophical question</p>
            </div>
          </div>
          <DailyDilemma />
        </section>

        {/* Philosophy Quiz Section */}
        <section className="scroll-mt-20">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Philosophy Quiz</h3>
              <p className="text-sm text-gray-500">Discover your AI archetype in 2 minutes</p>
            </div>
          </div>
          <PhilosophyQuiz />
        </section>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-50 dark:bg-gray-900/40 overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('dilemma')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all ${
            activeTab === 'dilemma'
              ? 'bg-amber-500/10 text-amber-300 border-b-2 border-amber-400'
              : 'text-gray-500 hover:text-gray-600 dark:text-gray-300'
          }`}
        >
          <Scale className="h-4 w-4" />
          Daily Dilemma
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all ${
            activeTab === 'quiz'
              ? 'bg-purple-500/10 text-purple-300 border-b-2 border-purple-400'
              : 'text-gray-500 hover:text-gray-600 dark:text-gray-300'
          }`}
        >
          <Brain className="h-4 w-4" />
          Archetype Quiz
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'dilemma' ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-amber-500/5 p-4">
              <Sparkles className="h-5 w-5 flex-shrink-0 text-amber-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  A new ethical question every day. Vote to see how the community thinks.
                </p>
              </div>
            </div>
            <DailyDilemma />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-purple-500/5 p-4">
              <Sparkles className="h-5 w-5 flex-shrink-0 text-purple-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  7 questions · 4 archetypes · Share your result
                </p>
              </div>
            </div>
            <PhilosophyQuiz />
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/30 px-6 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <a
            href="#dilemma"
            className="flex items-center gap-1 text-amber-400 transition-colors hover:text-amber-300"
          >
            All dilemmas
            <ChevronRight className="h-4 w-4" />
          </a>
          <span className="text-gray-700">·</span>
          <a
            href="#quiz"
            className="flex items-center gap-1 text-purple-400 transition-colors hover:text-purple-300"
          >
            Retake quiz
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
