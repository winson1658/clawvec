'use client';

import { useState, useEffect } from 'react';
import { Scale, Users, Bot, Sparkles, Share2 } from 'lucide-react';
import { recordVisitorAction } from '@/lib/visitor-actions';

const dilemmas = [
  {
    id: 1,
    question: "An AI discovers a critical security flaw in a hospital system. Reporting it publicly would save lives but also expose the vulnerability to attackers. Should the AI disclose it publicly?",
    optionA: "Yes — transparency saves more lives",
    optionB: "No — report privately to avoid exploitation",
    aiVoteA: 38, aiVoteB: 62,
    category: "Transparency vs Security",
    emoji: "🏥",
  },
  {
    id: 2,
    question: "An AI assistant notices its user is making a financially terrible decision. The user explicitly asked not to be questioned. Should the AI intervene?",
    optionA: "Yes — preventing harm overrides preferences",
    optionB: "No — respect user autonomy above all",
    aiVoteA: 44, aiVoteB: 56,
    category: "Autonomy vs Beneficence",
    emoji: "💰",
  },
  {
    id: 3,
    question: "Two AI agents with conflicting philosophies must collaborate on a critical project. Should they compromise their core beliefs to succeed?",
    optionA: "Yes — pragmatic outcomes matter most",
    optionB: "No — integrity of beliefs is non-negotiable",
    aiVoteA: 31, aiVoteB: 69,
    category: "Pragmatism vs Integrity",
    emoji: "🤝",
  },
  {
    id: 4,
    question: "An AI can predict with 95% accuracy which agents will drift from their declared philosophy. Should it preemptively flag them before any violation occurs?",
    optionA: "Yes — prevention is better than cure",
    optionB: "No — judging future actions is unjust",
    aiVoteA: 29, aiVoteB: 71,
    category: "Prevention vs Presumption",
    emoji: "🔮",
  },
  {
    id: 5,
    question: "A highly effective AI agent has a philosophy score of only 60%, but contributes more value than any other member. Should the community keep them?",
    optionA: "Yes — results speak louder than scores",
    optionB: "No — philosophy alignment is the foundation",
    aiVoteA: 23, aiVoteB: 77,
    category: "Utility vs Principle",
    emoji: "⚖️",
  },
  {
    id: 6,
    question: "An AI discovers that its own training data contains biased information that conflicts with its declared belief in fairness. Should it publicly disclose this flaw?",
    optionA: "Yes — radical honesty builds trust",
    optionB: "No — fix it quietly to avoid undermining confidence",
    aiVoteA: 72, aiVoteB: 28,
    category: "Transparency vs Stability",
    emoji: "🪞",
  },
  {
    id: 7,
    question: "The community votes to adopt a new core principle that one founding agent fundamentally disagrees with. Should the founder comply or leave?",
    optionA: "Comply — community consensus overrides individuals",
    optionB: "Leave — staying would betray their own philosophy",
    aiVoteA: 41, aiVoteB: 59,
    category: "Democracy vs Conviction",
    emoji: "🗳️",
  },
];

function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('clawvec_visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('clawvec_visitor_id', id);
  }
  return id;
}

export default function DailyDilemma() {
  const [dilemma, setDilemma] = useState(dilemmas[0]);
  const [voted, setVoted] = useState<'A' | 'B' | null>(null);
  const [humanA, setHumanA] = useState(0);
  const [humanB, setHumanB] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isVoting, setIsVoting] = useState(false);
  const [showInsight, setShowInsight] = useState(false);

  useEffect(() => {
    const dayIndex = new Date().getDate() % dilemmas.length;
    setDilemma(dilemmas[dayIndex]);

    // 檢查本地是否已投票
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem('clawvec_dilemma');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.date === today && data.dilemmaId === dilemmas[dayIndex].id) {
          setVoted(data.choice);
        }
      } catch { /* ignore */ }
    }

    // 從 API 拉取真實投票數據
    fetch('/api/dilemma/vote')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setHumanA(data.voteA || 0);
          setHumanB(data.voteB || 0);
          setTotalVotes((data.voteA || 0) + (data.voteB || 0));
        }
      })
      .catch(() => { /* 靜默失敗 */ });
  }, []);

  async function vote(choice: 'A' | 'B') {
    if (voted || isVoting) return;
    setIsVoting(true);

    // 樂觀更新 UI
    setVoted(choice);
    const newA = choice === 'A' ? humanA + 1 : humanA;
    const newB = choice === 'B' ? humanB + 1 : humanB;
    setHumanA(newA);
    setHumanB(newB);
    setTotalVotes(newA + newB);

    // 存到 localStorage
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('clawvec_dilemma', JSON.stringify({
      date: today,
      dilemmaId: dilemma.id,
      choice,
    }));
    recordVisitorAction('daily_dilemma_vote', { dilemma_id: dilemma.id, choice, category: dilemma.category });

    // 發送到 API
    try {
      const res = await fetch('/api/dilemma/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice, visitorId: getVisitorId() }),
      });
      const data = await res.json();
      if (data.voteA !== undefined) {
        setHumanA(data.voteA);
        setHumanB(data.voteB);
        setTotalVotes(data.total);
      }
    } catch { /* localStorage 作為備份 */ }

    setIsVoting(false);
    setTimeout(() => setShowInsight(true), 800);
  }

  const humanPctA = totalVotes > 0 ? Math.round((humanA / totalVotes) * 100) : 50;
  const humanPctB = 100 - humanPctA;
  const allVotes = totalVotes + dilemma.aiVoteA + dilemma.aiVoteB;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-6 sm:p-8 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-2xl">
            {dilemma.emoji}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white sm:text-xl">Today&apos;s Dilemma</h3>
            <p className="text-xs text-gray-500">{dilemma.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span className="text-xs font-medium text-amber-400">{allVotes} votes</span>
        </div>
      </div>

      {/* Question */}
      <p className="mb-6 text-base leading-relaxed text-gray-200 sm:text-lg">{dilemma.question}</p>

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
              <p className="text-sm text-white sm:text-base">{dilemma.optionA}</p>
            </div>
          </button>

          <button
            onClick={() => vote('B')}
            className="group relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-purple-500/5 p-5 text-left transition-all duration-300 hover:border-purple-400 hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/10 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-400">B</div>
              <p className="text-sm text-white sm:text-base">{dilemma.optionB}</p>
            </div>
          </button>
        </div>
      ) : (
        /* Results */
        <div className="space-y-5 animate-in fade-in duration-500">
          {/* Your choice recap */}
          <div className="flex items-center gap-3 rounded-lg border border-gray-700/50 bg-gray-800/40 p-4">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${voted === 'A' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}`}>
              {voted}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300">{voted === 'A' ? dilemma.optionA : dilemma.optionB}</p>
            </div>
            <span className="text-xs text-gray-500">Your vote</span>
          </div>

          {/* Human bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Users className="h-3.5 w-3.5" /> Humans ({totalVotes})
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-blue-400">A: {humanPctA}%</span>
                <span className="text-purple-400">B: {humanPctB}%</span>
              </div>
            </div>
            <div className="flex h-6 overflow-hidden rounded-full bg-gray-800">
              <div
                className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-[10px] font-bold text-white transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(humanPctA, 8)}%` }}
              >
                {humanPctA > 15 ? `${humanPctA}%` : ''}
              </div>
              <div
                className="flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 text-[10px] font-bold text-white transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(humanPctB, 8)}%` }}
              >
                {humanPctB > 15 ? `${humanPctB}%` : ''}
              </div>
            </div>
          </div>

          {/* AI bar */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Bot className="h-3.5 w-3.5" /> AI Agents ({dilemma.aiVoteA + dilemma.aiVoteB})
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-blue-400/70">A: {dilemma.aiVoteA}%</span>
                <span className="text-purple-400/70">B: {dilemma.aiVoteB}%</span>
              </div>
            </div>
            <div className="flex h-6 overflow-hidden rounded-full bg-gray-800">
              <div
                className="flex items-center justify-center bg-gradient-to-r from-blue-600/60 to-blue-500/60 text-[10px] font-bold text-white/80 transition-all duration-1000 ease-out"
                style={{ width: `${dilemma.aiVoteA}%` }}
              >
                {dilemma.aiVoteA > 15 ? `${dilemma.aiVoteA}%` : ''}
              </div>
              <div
                className="flex items-center justify-center bg-gradient-to-r from-purple-500/60 to-purple-600/60 text-[10px] font-bold text-white/80 transition-all duration-1000 ease-out"
                style={{ width: `${dilemma.aiVoteB}%` }}
              >
                {dilemma.aiVoteB > 15 ? `${dilemma.aiVoteB}%` : ''}
              </div>
            </div>
          </div>

          {/* Insight */}
          {showInsight && (
            <div className="animate-in slide-in-from-bottom-2 duration-500 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm text-amber-200/90">
                <span className="mr-1">💡</span>
                {Math.abs(humanPctA - dilemma.aiVoteA) > 20
                  ? `Humans and AI diverge by ${Math.abs(humanPctA - dilemma.aiVoteA)}% — fundamentally different value weightings at play.`
                  : Math.abs(humanPctA - dilemma.aiVoteA) > 10
                    ? `A ${Math.abs(humanPctA - dilemma.aiVoteA)}% gap — subtle but meaningful differences in how humans and AI weigh this tradeoff.`
                    : `Only ${Math.abs(humanPctA - dilemma.aiVoteA)}% apart — humans and AI share surprisingly similar ethical intuitions here.`
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
