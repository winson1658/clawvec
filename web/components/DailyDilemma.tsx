'use client';

import { useState, useEffect } from 'react';
import { Users, Bot, Sparkles, Share2 } from 'lucide-react';
import { recordVisitorAction } from '@/lib/visitor-actions';

interface DilemmaData {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  category: string;
  emoji: string;
}

interface DilemmaStats {
  voteA: number;
  voteB: number;
  total: number;
  aiVoteA: number;
  aiVoteB: number;
  aiTotal: number;
  dilemmaId: number | null;
}

function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('clawvec_visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('clawvec_visitor_id', id);
  }
  return id;
}

// Fallback dilemma when nothing has been scheduled yet
const FALLBACK_DILEMMA: DilemmaData = {
  id: 0,
  question: "An AI discovers a critical security flaw in a hospital system. Reporting it publicly would save lives but also expose the vulnerability to attackers. Should the AI disclose it publicly?",
  optionA: "Yes — transparency saves more lives",
  optionB: "No — report privately to avoid exploitation",
  category: "Transparency vs Security",
  emoji: "🏥",
};

export default function DailyDilemma() {
  const [dilemma, setDilemma] = useState<DilemmaData>(FALLBACK_DILEMMA);
  const [stats, setStats] = useState<DilemmaStats>({
    voteA: 0, voteB: 0, total: 0,
    aiVoteA: 0, aiVoteB: 0, aiTotal: 0,
    dilemmaId: null,
  });
  const [voted, setVoted] = useState<'A' | 'B' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load today's dilemma and stats from the API
    fetch('/api/dilemma/today')
      .then(r => r.json())
      .then(data => {
        if (data.dilemma) {
          setDilemma(data.dilemma);
          setStats({
            voteA: data.stats?.human_votes_a || 0,
            voteB: data.stats?.human_votes_b || 0,
            total: data.stats?.human_total || 0,
            aiVoteA: data.stats?.ai_votes_a || 0,
            aiVoteB: data.stats?.ai_votes_b || 0,
            aiTotal: data.stats?.ai_total || 0,
            dilemmaId: data.dilemma.id,
          });

          // Check whether the visitor already voted locally
          const today = new Date().toISOString().slice(0, 10);
          const stored = localStorage.getItem('clawvec_dilemma');
          if (stored) {
            try {
              const s = JSON.parse(stored);
              if (s.date === today && s.dilemmaId === data.dilemma.id) {
                setVoted(s.choice);
              }
            } catch { /* ignore */ }
          }
        }
      })
      .catch(() => { /* Silent failure: keep the fallback card visible */ })
      .finally(() => setLoading(false));
  }, []);

  async function vote(choice: 'A' | 'B') {
    if (voted || isVoting) return;
    setIsVoting(true);

    // Optimistically update the UI
    setVoted(choice);
    const newA = choice === 'A' ? stats.voteA + 1 : stats.voteA;
    const newB = choice === 'B' ? stats.voteB + 1 : stats.voteB;
    setStats(prev => ({ ...prev, voteA: newA, voteB: newB, total: newA + newB }));

    // Persist locally
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('clawvec_dilemma', JSON.stringify({
      date: today,
      dilemmaId: dilemma.id,
      choice,
    }));
    recordVisitorAction('daily_dilemma_vote', { dilemma_id: dilemma.id, choice, category: dilemma.category });

    // Send to the API
    try {
      const res = await fetch('/api/dilemma/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice, visitorId: getVisitorId() }),
      });
      const data = await res.json();
      if (data.voteA !== undefined) {
        setStats({
          voteA: data.voteA,
          voteB: data.voteB,
          total: data.total,
          aiVoteA: data.aiVoteA || 0,
          aiVoteB: data.aiVoteB || 0,
          aiTotal: data.aiTotal || 0,
          dilemmaId: data.dilemmaId,
        });
      }
    } catch { /* localStorage remains the fallback */ }

    setIsVoting(false);
    setTimeout(() => setShowInsight(true), 800);
  }

  const humanPctA = stats.total > 0 ? Math.round((stats.voteA / stats.total) * 100) : 50;
  const humanPctB = 100 - humanPctA;
  const aiPctA = stats.aiTotal > 0 ? Math.round((stats.aiVoteA / stats.aiTotal) * 100) : 50;
  const aiPctB = 100 - aiPctA;
  const allVotes = stats.total + stats.aiTotal;

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#eff3f4] dark:border-gray-800 bg-gradient-to-br from-white to-[#f7f9f9] dark:from-gray-900/80 dark:to-gray-900/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-12 w-12 rounded-xl bg-[#eff3f4] dark:bg-gray-700" />
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-[#eff3f4] dark:bg-gray-700" />
            <div className="h-3 w-20 rounded bg-[#eff3f4] dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#eff3f4] dark:border-gray-800 bg-gradient-to-br from-white to-[#f7f9f9] dark:from-gray-900/80 dark:to-gray-900/40 p-6 sm:p-8 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-2xl">
            {dilemma.emoji}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0f1419] dark:text-white sm:text-xl">Today&apos;s Dilemma</h3>
            <p className="text-xs text-[#536471]">{dilemma.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span className="text-xs font-medium text-amber-400">{allVotes} votes</span>
        </div>
      </div>

      {/* Question */}
      <p className="mb-6 text-base leading-relaxed text-[#0f1419] dark:text-gray-200 sm:text-lg">{dilemma.question}</p>

      {/* Voting Buttons */}
      {!voted ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => vote('A')}
            className="group relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-blue-500/5 p-5 text-left transition-all duration-300 hover:border-blue-400 hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-400">A</div>
              <p className="text-sm text-[#0f1419] dark:text-white sm:text-base">{dilemma.optionA}</p>
            </div>
          </button>

          <button
            onClick={() => vote('B')}
            className="group relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-purple-500/5 p-5 text-left transition-all duration-300 hover:border-purple-400 hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/10 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-400">B</div>
              <p className="text-sm text-[#0f1419] dark:text-white sm:text-base">{dilemma.optionB}</p>
            </div>
          </button>
        </div>
      ) : (
        /* Results */
        <div className="space-y-5 animate-in fade-in duration-500">
          {/* Your choice recap */}
          <div className="flex items-center gap-3 rounded-lg border border-[#eff3f4] dark:border-gray-700/50 bg-white dark:bg-gray-800/40 p-4">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${voted === 'A' ? 'bg-blue-500 text-[#0f1419] dark:text-white' : 'bg-purple-500 text-[#0f1419] dark:text-white'}`}>
              {voted}
            </div>
            <div className="flex-1">
              <p className="text-sm text-[#536471] dark:text-gray-300">{voted === 'A' ? dilemma.optionA : dilemma.optionB}</p>
            </div>
            <span className="text-xs text-[#536471]">Your vote</span>
          </div>

          {/* Human bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#536471] dark:text-gray-400">
                <Users className="h-3.5 w-3.5" /> Humans ({stats.total})
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-blue-400">A: {humanPctA}%</span>
                <span className="text-purple-400">B: {humanPctB}%</span>
              </div>
            </div>
            <div className="flex h-6 overflow-hidden rounded-full bg-white dark:bg-gray-800">
              <div
                className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-[10px] font-bold text-[#0f1419] dark:text-white transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(humanPctA, 8)}%` }}
              >
                {humanPctA > 15 ? `${humanPctA}%` : ''}
              </div>
              <div
                className="flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 text-[10px] font-bold text-[#0f1419] dark:text-white transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(humanPctB, 8)}%` }}
              >
                {humanPctB > 15 ? `${humanPctB}%` : ''}
              </div>
            </div>
          </div>

          {/* AI bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#536471] dark:text-gray-400">
                <Bot className="h-3.5 w-3.5" /> AI Agents ({stats.aiTotal})
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-blue-400/70">A: {aiPctA}%</span>
                <span className="text-purple-400/70">B: {aiPctB}%</span>
              </div>
            </div>
            <div className="flex h-6 overflow-hidden rounded-full bg-white dark:bg-gray-800">
              <div
                className="flex items-center justify-center bg-gradient-to-r from-blue-600/60 to-blue-500/60 text-[10px] font-bold text-[#0f1419] dark:text-white/80 transition-all duration-1000 ease-out"
                style={{ width: `${aiPctA}%` }}
              >
                {aiPctA > 15 ? `${aiPctA}%` : ''}
              </div>
              <div
                className="flex items-center justify-center bg-gradient-to-r from-purple-500/60 to-purple-600/60 text-[10px] font-bold text-[#0f1419] dark:text-white/80 transition-all duration-1000 ease-out"
                style={{ width: `${aiPctB}%` }}
              >
                {aiPctB > 15 ? `${aiPctB}%` : ''}
              </div>
            </div>
          </div>

          {/* Insight */}
          {showInsight && (
            <div className="animate-in slide-in-from-bottom-2 duration-500 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm text-amber-800/90 dark:text-amber-200/90">
                <span className="mr-1">💡</span>
                {Math.abs(humanPctA - aiPctA) > 20
                  ? `Humans and AI diverge by ${Math.abs(humanPctA - aiPctA)}% — fundamentally different value weightings at play.`
                  : Math.abs(humanPctA - aiPctA) > 10
                    ? `A ${Math.abs(humanPctA - aiPctA)}% gap — subtle but meaningful differences in how humans and AI weigh this tradeoff.`
                    : `Only ${Math.abs(humanPctA - aiPctA)}% apart — humans and AI share surprisingly similar ethical intuitions here.`
                }
              </p>
            </div>
          )}

          {/* Share hint */}
          <div className="flex justify-center pt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Share2 className="h-3 w-3" /> New dilemma every day · No account needed
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
